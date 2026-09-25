import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { getFirestoreDb } from './firebaseAdmin';
import { getHotspotEvidence, HotspotWithCitizenEvidence } from './demandIntelligenceService';
import { DevelopmentRecommendation } from '@/types';

const RECOMMENDATION_SYSTEM_INSTRUCTION = `You are an AI decision-support assistant for civic development planning in India.
Your task is NOT to make government decisions.
Your task is to analyze aggregated citizen-submitted evidence and generate a potential development intervention for policymaker review.

Rules:
1. Use only the supplied evidence.
2. Do not invent statistics.
3. Do not invent government schemes.
4. Do not claim that a project has been approved.
5. Do not claim that a department officially owns the problem unless that relationship is provided by the evidence or clearly expressed as a suggested responsible department.
6. Do not fabricate infrastructure conditions.
7. Do not fabricate budgets.
8. Do not fabricate population statistics.
9. Clearly distinguish citizen-reported information from AI inference.
10. If evidence is insufficient, say so.
11. Recommendations are advisory and require human validation.

You MUST return a pure, valid JSON object strictly matching this schema:
{
  "headline": "Concise, actionable project headline (e.g. 'Community Irrigation Augmentation & Agricultural Water Security')",
  "problemStatement": "Objective summary of the civic bottleneck grounded strictly in reported citizen evidence",
  "recommendedIntervention": "Concrete, practical civil, engineering, or municipal intervention to resolve the issue",
  "rationale": "Evidence-grounded justification explaining why this intervention addresses the citizen demands",
  "suggestedDepartment": "The suggested responsible department (use the supplied department or 'Departmental mapping requires administrative validation')",
  "implementationConsiderations": [
    "Key engineering, municipal, or administrative feasibility factor 1",
    "Key factor 2",
    "Key factor 3"
  ],
  "confidence": "high" | "medium" | "low",
  "limitations": [
    "Limitation or validation requirement 1 (e.g. Requires technical site survey by municipal engineers)",
    "Limitation 2 (e.g. Citizen reports may reflect seasonal demand fluctuations)"
  ]
}`;

/**
 * Computes a safe, deterministic 32-character hexadecimal Firestore document ID for a locationKey.
 */
export function getRecommendationCacheDocId(locationKey: string): string {
  return crypto.createHash('sha256').update(locationKey.trim().toLowerCase()).digest('hex');
}

/**
 * Computes a data version string based on current hotspot metrics.
 * If citizen demands or scores change, this version changes, triggering cache refresh.
 */
export function computeSourceDataVersion(evidence: HotspotWithCitizenEvidence): string {
  const { hotspot } = evidence;
  return `v1_reqs:${hotspot.totalRequests}_pop:${hotspot.affectedPopulation}_score:${hotspot.priorityScore}_urg:${hotspot.highUrgencyRequests}`;
}

/**
 * Generates an evidence-grounded Development Recommendation for a given locationKey.
 * Checks Firestore cache first. If cache is valid, returns cached recommendation.
 * Otherwise, invokes Gemini server-side and stores the result in Firestore cache.
 */
export async function generateDevelopmentRecommendation(
  locationKey: string,
  options?: { bypassCache?: boolean }
): Promise<DevelopmentRecommendation> {
  if (!locationKey || typeof locationKey !== 'string' || !locationKey.trim()) {
    throw new Error('locationKey is required and must be a non-empty string.');
  }

  const cleanKey = locationKey.trim();

  // 1. Retrieve the hotspot and citizen evidence package
  const evidenceData = await getHotspotEvidence(cleanKey);
  if (!evidenceData) {
    const error = new Error(`Demand hotspot not found for location: "${cleanKey}".`);
    (error as any).status = 404;
    throw error;
  }

  const { hotspot, issues, infrastructures, topDepartment, evidenceConfidence } = evidenceData;
  const sourceDataVersion = computeSourceDataVersion(evidenceData);
  const cacheDocId = getRecommendationCacheDocId(cleanKey);
  const db = getFirestoreDb();

  // 2. Check Firestore cache unless bypassCache is requested
  if (!options?.bypassCache) {
    try {
      const cacheRef = db.collection('ai_recommendations').doc(cacheDocId);
      const cacheSnap = await cacheRef.get();

      if (cacheSnap.exists) {
        const cachedData = cacheSnap.data();
        if (
          cachedData &&
          cachedData.sourceDataVersion === sourceDataVersion &&
          cachedData.recommendation
        ) {
          return {
            ...cachedData.recommendation,
            cached: true,
            generatedAt: cachedData.generatedAt || cachedData.recommendation.generatedAt,
            sourceDataVersion,
          };
        }
      }
    } catch (cacheErr) {
      console.warn('[Recommendation Cache Read Warning]:', cacheErr);
      // Non-fatal: proceed to generate fresh recommendation
    }
  }

  // 3. Ensure Gemini API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error(
      'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in .env.local.'
    );
    (error as any).status = 503;
    throw error;
  }

  // 4. Construct strictly structured evidence package
  const evidencePayload = {
    hotspotLocation: {
      locality: hotspot.locality || '',
      district: hotspot.district || '',
      state: hotspot.state || '',
    },
    evidence: {
      totalRequests: hotspot.totalRequests,
      affectedPopulation: hotspot.affectedPopulation,
      highUrgencyRequests: hotspot.highUrgencyRequests,
      infrastructureRequests: hotspot.infrastructureRequests ?? 0,
      topCategory: hotspot.topCategory,
      categoryDistribution: hotspot.categoryCounts,
      priorityScore: hotspot.priorityScore,
    },
    citizenReportedIssues: issues.slice(0, 10),
    citizenReportedInfrastructures: infrastructures.slice(0, 10),
    departmentGuidance: {
      mostFrequentlyReportedDepartment: topDepartment,
      departmentSource:
        topDepartment === 'Departmental mapping requires administrative validation'
          ? 'not_provided'
          : 'citizen_reported',
    },
    evidenceCompletenessRating: evidenceConfidence,
  };

  const userPrompt = `Analyze the following aggregated citizen development evidence for ${cleanKey} and generate a structured development intervention:\n\n${JSON.stringify(
    evidencePayload,
    null,
    2
  )}`;

  // 5. Invoke Gemini with retry for transient 503 / 429 spikes
  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
  ];
  let rawText = '';
  let lastError: any = null;
  const maxRetries = candidateModels.length;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentModel = candidateModels[attempt];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: RECOMMENDATION_SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });

      rawText = response.text || '';
      if (rawText) break;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE');

      console.warn(
        `[Gemini Recommendation Attempt ${attempt + 1}/${maxRetries} (${currentModel})]: ${err?.message || err}`
      );

      if (attempt < maxRetries - 1 && isTransient) {
        let backoffMs = 2000 * (attempt + 1);
        const matchSec = err?.message?.match(/retry in ([0-9.]+)s/i) || err?.message?.match(/retryDelay":\s*"(\d+)s/i);
        if (matchSec && matchSec[1]) {
          backoffMs = Math.min(35000, Math.ceil(parseFloat(matchSec[1]) * 1000) + 1000);
        }
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  if (!rawText) {
    const error = new Error(lastError?.message || 'Gemini API returned an empty recommendation response.');
    (error as any).status = 503;
    throw error;
  }

  // 6. Parse and validate JSON safely
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr: any) {
    const error = new Error(`Gemini returned invalid JSON: ${parseErr.message}`);
    (error as any).status = 500;
    (error as any).raw = cleaned;
    throw error;
  }

  // 7. Enforce schema integrity and ground truth attributes
  const headline = typeof parsed.headline === 'string' && parsed.headline.trim()
    ? parsed.headline.trim()
    : `${hotspot.topCategory} Intervention in ${hotspot.locality || hotspot.district || hotspot.state}`;

  const problemStatement = typeof parsed.problemStatement === 'string' && parsed.problemStatement.trim()
    ? parsed.problemStatement.trim()
    : `Citizen demand cluster in ${hotspot.locality || hotspot.state} with ${hotspot.totalRequests} reported issues in ${hotspot.topCategory}.`;

  const recommendedIntervention = typeof parsed.recommendedIntervention === 'string' && parsed.recommendedIntervention.trim()
    ? parsed.recommendedIntervention.trim()
    : `Implement targeted municipal intervention to upgrade civic assets and resolve ${hotspot.topCategory.toLowerCase()} bottlenecks.`;

  const rationale = typeof parsed.rationale === 'string' && parsed.rationale.trim()
    ? parsed.rationale.trim()
    : `Prioritized based on ${hotspot.totalRequests} verified citizen complaints and an explainable Priority Score of ${hotspot.priorityScore.toFixed(1)}/100.`;

  // Department rule: use existing department or fallback
  const suggestedDepartment = topDepartment !== 'Departmental mapping requires administrative validation'
    ? (typeof parsed.suggestedDepartment === 'string' && parsed.suggestedDepartment.trim()
        ? parsed.suggestedDepartment.trim()
        : topDepartment)
    : 'Departmental mapping requires administrative validation';

  const implementationConsiderations = Array.isArray(parsed.implementationConsiderations) && parsed.implementationConsiderations.length > 0
    ? parsed.implementationConsiderations.map((item: any) => String(item).trim()).filter(Boolean)
    : [
        'Perform preliminary site inspection and technical survey with municipal engineers.',
        'Review statutory jurisdiction and inter-agency coordination before resource sanction.',
        'Engage local community representatives to verify on-ground operational requirements.',
      ];

  // Confidence rule: evidence-completeness indicator
  let confidence: 'high' | 'medium' | 'low' = evidenceConfidence;
  if (['high', 'medium', 'low'].includes(String(parsed.confidence).toLowerCase())) {
    confidence = String(parsed.confidence).toLowerCase() as 'high' | 'medium' | 'low';
  }

  const limitations = Array.isArray(parsed.limitations) && parsed.limitations.length > 0
    ? parsed.limitations.map((item: any) => String(item).trim()).filter(Boolean)
    : [
        'Advisory prototype recommendation generated from citizen-submitted demand reports.',
        'Does not constitute official government sanction or budgetary commitment.',
        'Requires administrative verification and engineering feasibility validation.',
      ];

  const nowIso = new Date().toISOString();

  const finalRecommendation: DevelopmentRecommendation = {
    hotspotLocation: {
      locality: hotspot.locality || '',
      district: hotspot.district || '',
      state: hotspot.state || '',
    },
    headline,
    problemStatement,
    recommendedIntervention,
    rationale,
    evidence: {
      totalRequests: hotspot.totalRequests,
      affectedPopulation: hotspot.affectedPopulation,
      highUrgencyRequests: hotspot.highUrgencyRequests,
      infrastructureRequests: hotspot.infrastructureRequests ?? 0,
      topCategory: hotspot.topCategory,
      categoryDistribution: hotspot.categoryCounts,
      priorityScore: hotspot.priorityScore,
    },
    suggestedDepartment,
    implementationConsiderations,
    confidence,
    limitations,
    generatedBy: 'gemini',
    cached: false,
    generatedAt: nowIso,
    sourceDataVersion,
  };

  // 8. Save to Firestore cache
  try {
    await db.collection('ai_recommendations').doc(cacheDocId).set({
      locationKey: cleanKey,
      recommendation: finalRecommendation,
      generatedAt: nowIso,
      sourceDataVersion,
    });
  } catch (cacheWriteErr) {
    console.warn('[Recommendation Cache Write Warning]:', cacheWriteErr);
    // Non-fatal: still return the recommendation
  }

  return finalRecommendation;
}
