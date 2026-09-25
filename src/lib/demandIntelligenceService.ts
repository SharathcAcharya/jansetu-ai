import { getFirestoreDb } from './firebaseAdmin';
import { DemandHotspot, HotspotsApiResponse } from '@/types';
import { scoreAndRankHotspots } from './priorityScoringService';
import { normalizeGeography } from './geographyNormalizer';

/**
 * Builds a standardized geographic location key favoring the most specific available location:
 * 1. locality + district + state
 * 2. district + state
 * 3. state
 */
function buildLocationGrouping(locality: string, district: string, state: string) {
  const cleanLoc = locality.trim();
  const cleanDist = district.trim();
  const cleanState = state.trim();

  if (cleanLoc) {
    const parts = [cleanLoc, cleanDist, cleanState].filter(Boolean);
    return {
      locationKey: parts.join(' | '),
      displayLocality: cleanLoc,
      displayDistrict: cleanDist,
      displayState: cleanState,
    };
  }

  if (cleanDist) {
    const parts = [cleanDist, cleanState].filter(Boolean);
    return {
      locationKey: parts.join(' | '),
      displayLocality: '',
      displayDistrict: cleanDist,
      displayState: cleanState,
    };
  }

  return {
    locationKey: cleanState,
    displayLocality: '',
    displayDistrict: '',
    displayState: cleanState,
  };
}

/**
 * Server-side Demand Intelligence Aggregation Service.
 * Reads citizen_requests from Firestore, enforces strict location rules,
 * groups by geographic location, aggregates affected population, urgency,
 * infrastructure gap indicators, and computes explainable priority scores.
 */
export async function getDemandHotspots(): Promise<HotspotsApiResponse> {
  const db = getFirestoreDb();
  const collectionRef = db.collection('citizen_requests');
  const snapshot = await collectionRef.get();

  let totalRequests = 0;
  let geographicallyMappedRequests = 0;
  let unmappedRequests = 0;

  // Intermediate map keyed by locationKey
  const hotspotMap = new Map<
    string,
    {
      locality: string;
      district: string;
      state: string;
      totalRequests: number;
      affectedPopulation: number;
      highUrgencyRequests: number;
      infrastructureRequests: number;
      categoryCounts: Record<string, number>;
      issues: string[];
      departments: string[];
      infrastructures: string[];
      voiceRequests: number;
      textRequests: number;
      languages: Set<string>;
      citizenSubmissionCount: number;
      syntheticDemoCount: number;
    }
  >();

  snapshot.forEach((doc) => {
    const data = doc.data();

    // Skip temporary initial setup documents that do not represent citizen complaints
    if (data.setup === 'initial' && !data.originalText && !data.complaint && !data.issue) {
      return;
    }

    totalRequests++;

    const locSource = (data.locationSource || data.location_source || '').trim();
    const locality = (data.locality || '').trim();
    const district = (data.district || '').trim();
    const state = (data.state || '').trim();

    // Strict Location Rule:
    // Only requests with location_source = "citizen_provided"
    // AND at least one usable geographic field (state OR district OR locality)
    // may contribute to geographic hotspot aggregation.
    const hasUsableLocation = Boolean(locality || district || state);
    const isCitizenProvided = locSource === 'citizen_provided';

    if (!isCitizenProvided || !hasUsableLocation) {
      unmappedRequests++;
      return;
    }

    geographicallyMappedRequests++;

    const category = (data.category || 'Other').trim();
    const urgency = (data.urgency || '').trim().toLowerCase();
    const isHighUrgency = urgency === 'high' || urgency === 'critical';

    // Infrastructure Gap Tracking: Check if request mentions affected infrastructure
    const rawInfra = (data.affectedInfrastructure || data.affected_infrastructure || '').trim();
    const hasInfrastructure = Boolean(
      rawInfra &&
      !['none', 'n/a', 'not specified', 'nil', 'null', 'unknown', 'not available'].includes(
        rawInfra.toLowerCase()
      )
    );

    let popEstimate = 0;
    if (typeof data.affectedPopulationEstimate === 'number') {
      popEstimate = data.affectedPopulationEstimate;
    } else if (typeof data.affected_population_estimate === 'number') {
      popEstimate = data.affected_population_estimate;
    }

    const normGeo = normalizeGeography(state, district, locality);
    const cleanLoc = normGeo.locality || locality;
    const cleanDist = normGeo.district || district;
    const cleanState = normGeo.state || state;

    // Check if an existing hotspot matches the same locality & state (allowing district enrichment)
    let targetKey: string | null = null;
    if (cleanLoc && cleanState) {
      for (const [existingKey, entry] of hotspotMap.entries()) {
        if (
          entry.state.toLowerCase() === cleanState.toLowerCase() &&
          entry.locality.toLowerCase() === cleanLoc.toLowerCase()
        ) {
          if (!entry.district || !cleanDist || entry.district.toLowerCase() === cleanDist.toLowerCase()) {
            targetKey = existingKey;
            if (!entry.district && cleanDist) {
              entry.district = cleanDist;
            }
            break;
          }
        }
      }
    }

    if (!targetKey) {
      const { locationKey, displayLocality, displayDistrict, displayState } = buildLocationGrouping(
        cleanLoc,
        cleanDist,
        cleanState
      );
      targetKey = locationKey;
      if (!hotspotMap.has(targetKey)) {
        hotspotMap.set(targetKey, {
          locality: displayLocality,
          district: displayDistrict,
          state: displayState,
          totalRequests: 0,
          affectedPopulation: 0,
          highUrgencyRequests: 0,
          infrastructureRequests: 0,
          categoryCounts: {},
          issues: [],
          departments: [],
          infrastructures: [],
          voiceRequests: 0,
          textRequests: 0,
          languages: new Set<string>(),
          citizenSubmissionCount: 0,
          syntheticDemoCount: 0,
        });
      }
    }

    const current = hotspotMap.get(targetKey)!;
    current.totalRequests += 1;
    current.affectedPopulation += popEstimate;
    if (isHighUrgency) {
      current.highUrgencyRequests += 1;
    }
    if (hasInfrastructure) {
      current.infrastructureRequests += 1;
      if (rawInfra) {
        current.infrastructures.push(rawInfra);
      }
    }
    current.categoryCounts[category] = (current.categoryCounts[category] || 0) + 1;

    // Track voice vs text source distribution
    const sType = (data.sourceType || 'text').trim().toLowerCase();
    if (sType === 'voice') {
      current.voiceRequests += 1;
    } else {
      current.textRequests += 1;
    }

    // Track languages represented
    const lang = (data.originalLanguage || data.language || 'English').trim();
    if (lang) {
      current.languages.add(lang);
    }

    // Track citizen submission vs synthetic demo
    const dSource = (data.dataSource || 'citizen_submission').trim().toLowerCase();
    if (dSource === 'synthetic_demo') {
      current.syntheticDemoCount += 1;
    } else {
      current.citizenSubmissionCount += 1;
    }

    // Track reported issues and departments for qualitative evidence package
    const issueText = (data.issue || data.summary || data.originalText || '').trim();
    if (issueText && !current.issues.includes(issueText)) {
      current.issues.push(issueText);
    }
    const dept = (data.governmentDepartment || data.government_department || '').trim();
    if (dept && !['none', 'n/a', 'not specified', 'unknown'].includes(dept.toLowerCase())) {
      current.departments.push(dept);
    }
  });

  // Convert map to base hotspot objects
  const rawHotspots = Array.from(hotspotMap.entries()).map(([locationKey, entry]) => {
    let topCategory = 'Other';
    let maxCount = -1;

    for (const [cat, count] of Object.entries(entry.categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    }

    return {
      locationKey,
      locality: entry.locality,
      district: entry.district,
      state: entry.state,
      totalRequests: entry.totalRequests,
      affectedPopulation: entry.affectedPopulation,
      highUrgencyRequests: entry.highUrgencyRequests,
      infrastructureRequests: entry.infrastructureRequests,
      categoryCounts: entry.categoryCounts,
      topCategory,
      locationSource: 'citizen_provided' as const,
      sourceDistribution: {
        voice: entry.voiceRequests,
        text: entry.textRequests,
      },
      languagesRepresented: Array.from(entry.languages),
      dataSources: {
        citizenSubmission: entry.citizenSubmissionCount,
        syntheticDemo: entry.syntheticDemoCount,
      },
    };
  });

  // Score and rank hotspots using deterministic explainable priority model
  // (Sorts descending by priorityScore, secondary sort by totalRequests DESC)
  const hotspots: DemandHotspot[] = scoreAndRankHotspots(rawHotspots);

  return {
    hotspots,
    totalRequests,
    geographicallyMappedRequests,
    unmappedRequests,
  };
}

export interface HotspotWithCitizenEvidence {
  hotspot: DemandHotspot;
  issues: string[];
  departments: string[];
  infrastructures: string[];
  topDepartment: string;
  evidenceConfidence: 'high' | 'medium' | 'low';
}

/**
 * Retrieves the full evidence package for a specific hotspot by its locationKey,
 * including citizen-reported issues, infrastructures, and most frequent department.
 */
export async function getHotspotEvidence(locationKey: string): Promise<HotspotWithCitizenEvidence | null> {
  if (!locationKey || typeof locationKey !== 'string' || !locationKey.trim()) {
    return null;
  }

  const cleanKey = locationKey.trim();
  const db = getFirestoreDb();
  const snapshot = await db.collection('citizen_requests').get();

  // Run full aggregation to get properly ranked and scored hotspots
  const { hotspots } = await getDemandHotspots();
  const cleanLower = cleanKey.toLowerCase();
  const matchedHotspot = hotspots.find((h) => {
    if (h.locationKey.toLowerCase() === cleanLower) return true;
    const hLoc = (h.locality || '').toLowerCase();
    const hDist = (h.district || '').toLowerCase();
    const hState = (h.state || '').toLowerCase();

    if (hLoc && hState && `${hLoc} | ${hState}` === cleanLower) return true;
    if (hDist && hState && `${hDist} | ${hState}` === cleanLower) return true;
    if (hLoc && cleanLower === hLoc) return true;
    return false;
  });

  if (!matchedHotspot) {
    return null;
  }

  // Gather qualitative evidence from citizen reports belonging to this hotspot
  const issues: string[] = [];
  const departments: string[] = [];
  const infrastructures: string[] = [];
  const deptCounts: Record<string, number> = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.setup === 'initial') return;

    const locSource = (data.locationSource || data.location_source || '').trim();
    if (locSource !== 'citizen_provided') return;

    const locality = (data.locality || '').trim();
    const district = (data.district || '').trim();
    const state = (data.state || '').trim();

    // Check if this document maps to matchedHotspot
    const stateMatches = state.toLowerCase() === matchedHotspot.state.toLowerCase();
    const localityMatches = locality.toLowerCase() === matchedHotspot.locality.toLowerCase();

    if (stateMatches && localityMatches) {
      const issue = (data.issue || data.summary || '').trim();
      if (issue && !issues.includes(issue)) {
        issues.push(issue);
      }

      const dept = (data.governmentDepartment || data.government_department || '').trim();
      if (dept && !['none', 'n/a', 'not specified', 'unknown'].includes(dept.toLowerCase())) {
        departments.push(dept);
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }

      const infra = (data.affectedInfrastructure || data.affected_infrastructure || '').trim();
      if (
        infra &&
        !['none', 'n/a', 'not specified', 'nil', 'null', 'unknown'].includes(infra.toLowerCase()) &&
        !infrastructures.includes(infra)
      ) {
        infrastructures.push(infra);
      }
    }
  });

  // Determine top department: most frequent or default fallback
  let topDepartment = 'Departmental mapping requires administrative validation';
  let maxDeptCount = 0;
  for (const [deptName, count] of Object.entries(deptCounts)) {
    if (count > maxDeptCount) {
      maxDeptCount = count;
      topDepartment = deptName;
    }
  }

  // Determine evidence-completeness confidence:
  // HIGH: multiple requests, location known, population info, urgency info, infrastructure info
  // LOW: <= 1 report OR missing both population and infrastructure
  // MEDIUM: several fields available but 1 or more missing
  const hasMultipleRequests = matchedHotspot.totalRequests >= 2;
  const hasKnownLocation = Boolean(matchedHotspot.locality && matchedHotspot.state);
  const hasPopulation = matchedHotspot.affectedPopulation > 0;
  const hasUrgency = matchedHotspot.highUrgencyRequests > 0;
  const hasInfrastructure = (matchedHotspot.infrastructureRequests ?? 0) > 0;

  let evidenceConfidence: 'high' | 'medium' | 'low';
  if (hasMultipleRequests && hasKnownLocation && hasPopulation && hasUrgency && hasInfrastructure) {
    evidenceConfidence = 'high';
  } else if (!hasMultipleRequests || (!hasPopulation && !hasInfrastructure)) {
    evidenceConfidence = 'low';
  } else {
    evidenceConfidence = 'medium';
  }

  return {
    hotspot: matchedHotspot,
    issues,
    departments,
    infrastructures,
    topDepartment,
    evidenceConfidence,
  };
}

