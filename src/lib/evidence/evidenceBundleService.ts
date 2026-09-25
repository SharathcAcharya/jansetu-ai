/**
 * JanSetu AI — Phase 6C: Evidence Bundle Synthesizer Service
 * 
 * Combines:
 * 1. Citizen Evidence (from JanSetu Demand Intelligence layer)
 * 2. Demographic Evidence (from IDemographicDataProvider)
 * 3. Infrastructure Evidence (from IInfrastructureDataProvider)
 * 4. Public Investment Evidence (from IPublicInvestmentDataProvider)
 * 
 * Enforces:
 * - Hierarchical Fallback (Locality -> District -> State -> Country)
 * - Grounded Provenance (Strict separation of citizen_submission, public_dataset, and synthetic_demo)
 * - Deterministic Completeness Rating (40% Citizen, 20% Demographics, 20% Infrastructure, 20% Investment)
 * - Deterministic Freshness Evaluation (90-day infra, 30-day investment, 365-day demographics)
 * - Deterministic Versioning (bundleVersion & sourceDataVersion)
 * - Transparent Conflict Representation (Preserves both citizen statements and public records)
 * - Zero Hallucination / Zero Fabrication guarantee
 * - Complete isolation from Citizen Priority Scoring (Priority score is Demand Intelligence only)
 */

import { computeGeographyDocId, normalizeGeography } from '../geographyNormalizer';
import { getDemandHotspots, getHotspotEvidence } from '../demandIntelligenceService';
import { firestoreDemographicProvider } from './firestoreDemographicProvider';
import { firestoreInfrastructureProvider } from './firestoreInfrastructureProvider';
import { firestoreInvestmentProvider } from './firestoreInvestmentProvider';
import { evidenceBundleCache } from './evidenceBundleCache';
import type {
  CitizenReportEvidence,
  DemographicEvidence,
  EvidenceBundle,
  EvidenceCompletenessRating,
  EvidenceConflict,
  EvidenceFallbackMetadata,
  EvidenceProvenanceSummary,
  InfrastructureEvidence,
  InvestmentEvidence,
  NormalizedGeography,
} from '../../types/evidence';
import type {
  GeographicTarget,
  IDemographicDataProvider,
  IInfrastructureDataProvider,
  IPublicInvestmentDataProvider,
} from './providers';

export const CURRENT_BUNDLE_VERSION = '2026.09-v1';

export interface BundleSynthesizerOptions {
  skipCache?: boolean;
  allowFallback?: boolean;
  maxAgeMs?: number;
  demographicProvider?: IDemographicDataProvider;
  infrastructureProvider?: IInfrastructureDataProvider;
  investmentProvider?: IPublicInvestmentDataProvider;
}

/**
 * Evaluates deterministic data freshness across available public records.
 * Rules:
 * - Demographics target: 365 days
 * - Infrastructure target: 90 days
 * - Public investment target: 30 days
 */
export function evaluateFreshnessRating(
  demographics?: DemographicEvidence,
  infrastructure?: InfrastructureEvidence,
  investment?: InvestmentEvidence
): 'CURRENT' | 'MODERATE' | 'STALE' {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let hasStale = false;
  let hasModerate = false;
  let checkedCount = 0;

  if (demographics) {
    checkedCount++;
    const updated = new Date(demographics.lastUpdated).getTime();
    const ageDays = Number.isFinite(updated) ? (now - updated) / dayMs : 999;
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - demographics.sourceYear;

    if (ageDays > 365 * 3 || yearDiff > 3) {
      hasStale = true;
    } else if (ageDays > 365 || yearDiff > 1) {
      hasModerate = true;
    }
  }

  if (infrastructure) {
    checkedCount++;
    const updated = new Date(infrastructure.lastUpdated).getTime();
    const ageDays = Number.isFinite(updated) ? (now - updated) / dayMs : 999;

    if (ageDays > 180) {
      hasStale = true;
    } else if (ageDays > 90) {
      hasModerate = true;
    }
  }

  if (investment) {
    checkedCount++;
    const updated = new Date(investment.lastUpdated).getTime();
    const ageDays = Number.isFinite(updated) ? (now - updated) / dayMs : 999;

    if (ageDays > 90) {
      hasStale = true;
    } else if (ageDays > 30) {
      hasModerate = true;
    }
  }

  if (checkedCount === 0) {
    return 'CURRENT';
  }

  if (hasStale) return 'STALE';
  if (hasModerate) return 'MODERATE';
  return 'CURRENT';
}

/**
 * Computes deterministic evidence completeness rating based on fixed weights:
 * - Citizen Evidence = 40%
 * - Demographics = 20%
 * - Infrastructure = 20%
 * - Investment = 20%
 *
 * Level rules:
 * - score >= 80: 'HIGH'
 * - score >= 50: 'MEDIUM'
 * - score < 50: 'LOW'
 */
export function computeCompletenessRating(
  hasCitizen: boolean,
  hasDemographics: boolean,
  hasInfrastructure: boolean,
  hasInvestment: boolean
): EvidenceCompletenessRating {
  let score = 0;
  if (hasCitizen) score += 40;
  if (hasDemographics) score += 20;
  if (hasInfrastructure) score += 20;
  if (hasInvestment) score += 20;

  let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (score >= 80) {
    level = 'HIGH';
  } else if (score >= 50) {
    level = 'MEDIUM';
  }

  const missingDimensions: Array<'demographics' | 'infrastructure' | 'investment'> = [];
  if (!hasDemographics) missingDimensions.push('demographics');
  if (!hasInfrastructure) missingDimensions.push('infrastructure');
  if (!hasInvestment) missingDimensions.push('investment');

  return {
    score,
    level,
    hasCitizenEvidence: hasCitizen,
    hasDemographicEvidence: hasDemographics,
    hasInfrastructureEvidence: hasInfrastructure,
    hasInvestmentEvidence: hasInvestment,
    missingDimensions,
  };
}

/**
 * Computes deterministic source data version to detect updates in any source dimension.
 */
export function computeSourceDataVersion(
  citizen: CitizenReportEvidence,
  demographics?: DemographicEvidence,
  infrastructure?: InfrastructureEvidence,
  investment?: InvestmentEvidence
): string {
  const citizenPart = citizen.data.totalRequests > 0
    ? `c:${citizen.data.totalRequests}_${citizen.data.aggregatedAffectedPopulation}`
    : 'c:none';

  const demoPart = demographics
    ? `d:${demographics.sourceId}_${demographics.sourceYear}_${demographics.lastUpdated.slice(0, 10)}`
    : 'd:none';

  const infraPart = infrastructure
    ? `i:${infrastructure.sourceId}_${infrastructure.sourceYear}_${infrastructure.lastUpdated.slice(0, 10)}`
    : 'i:none';

  const investPart = investment
    ? `v:${investment.sourceId}_${investment.sourceYear}_${investment.lastUpdated.slice(0, 10)}`
    : 'v:none';

  return `${citizenPart}|${demoPart}|${infraPart}|${investPart}`;
}

/**
 * Detects observable contradictions between citizen assertions and official/public records.
 * Never silences or overwrites either record; transparently preserves both.
 */
export function detectEvidenceConflicts(
  citizen: CitizenReportEvidence,
  demographics?: DemographicEvidence,
  infrastructure?: InfrastructureEvidence,
  investment?: InvestmentEvidence
): EvidenceConflict[] {
  const conflicts: EvidenceConflict[] = [];

  // 1. Demographics Contradiction: Reported affected population exceeds total census population
  if (demographics && citizen.data.totalRequests > 0) {
    const totalPop = demographics.data.totalPopulation;
    const reportedAffected = citizen.data.aggregatedAffectedPopulation;
    if (totalPop > 0 && reportedAffected > totalPop) {
      conflicts.push({
        dimension: 'demographics',
        citizenStatement: `Citizens aggregate an estimated ${reportedAffected.toLocaleString()} affected individuals.`,
        publicRecord: `Demographic records indicate total baseline population of ${totalPop.toLocaleString()} (${demographics.geographyLevel} level).`,
        severity: 'HIGH',
        explanation: 'Reported affected population exceeds total demographic population recorded for this administrative area.',
      });
    }
  }

  // 2. Infrastructure Contradiction: Citizen reports defunct/failing asset that public record claims is OPERATIONAL
  if (infrastructure && citizen.data.totalRequests > 0) {
    const citedAssets = citizen.data.citedInfrastructureAssets.map((a) => a.toLowerCase());
    const grievanceSummary = citizen.data.primaryGrievanceSummary.toLowerCase();

    for (const asset of infrastructure.data.surveyedAssets) {
      const assetName = asset.assetName.toLowerCase();
      const assetType = asset.assetType.toLowerCase();

      const isMentioned =
        citedAssets.some((c) => c.includes(assetName) || assetName.includes(c)) ||
        grievanceSummary.includes(assetName) ||
        grievanceSummary.includes(assetType);

      if (isMentioned && asset.operationalStatus === 'OPERATIONAL') {
        // Check if citizen specifically complains of water/canal/irrigation/road failures
        const citizenComplainsOfFailure =
          grievanceSummary.includes('shortage') ||
          grievanceSummary.includes('defunct') ||
          grievanceSummary.includes('broken') ||
          grievanceSummary.includes('damage') ||
          grievanceSummary.includes('repair') ||
          grievanceSummary.includes('lack') ||
          citizen.data.highUrgencyCount > 0;

        if (citizenComplainsOfFailure) {
          conflicts.push({
            dimension: 'infrastructure',
            citizenStatement: `Citizens report critical service breakdown or severe deficit involving ${asset.assetName}.`,
            publicRecord: `Public infrastructure survey records asset "${asset.assetName}" (${asset.assetType}) status as OPERATIONAL.`,
            severity: 'HIGH',
            explanation: 'Discrepancy between field citizen grievance and official operational readiness classification.',
          });
        }
      }
    }
  }

  // 3. Investment Contradiction: Stalled or 100% utilized public expenditure alongside high urgency complaints
  if (investment && citizen.data.totalRequests > 0) {
    for (const scheme of investment.data.activeSchemes) {
      if (scheme.status === 'STALLED' && citizen.data.highUrgencyCount > 0) {
        conflicts.push({
          dimension: 'investment',
          citizenStatement: `Citizens submitted ${citizen.data.highUrgencyCount} high-urgency grievances for urgent intervention.`,
          publicRecord: `Public scheme "${scheme.schemeName}" sanctioned under ${scheme.department} is listed as STALLED.`,
          severity: 'MEDIUM',
          explanation: 'Targeted public scheme has stalled while active citizen urgency in the sector is elevated.',
        });
      }
    }
  }

  return conflicts;
}

/**
 * Builds a standardized empty citizen evidence record when no citizen requests exist.
 * Never fabricates grievances or numbers.
 */
export function createEmptyCitizenEvidence(
  norm: NormalizedGeography,
  docId: string
): CitizenReportEvidence {
  return {
    sourceId: `CITIZEN-${docId.substring(0, 8)}`,
    sourceType: 'citizen_reports',
    sourceName: 'JanSetu Citizen Demand Aggregator',
    sourceReference: 'JanSetu Multi-channel Citizen Reports',
    sourceYear: new Date().getFullYear(),
    geographyLevel: norm.geographyLevel,
    state: norm.state,
    district: norm.district,
    locality: norm.locality,
    data: {
      totalRequests: 0,
      voiceSubmissions: 0,
      textSubmissions: 0,
      languagesRepresented: [],
      aggregatedAffectedPopulation: 0,
      highUrgencyCount: 0,
      citedInfrastructureAssets: [],
      topCategories: [],
      primaryGrievanceSummary: '',
    },
    provenance: {
      origin: 'citizen_submission',
      publisherName: 'JanSetu AI Citizen Reporting Pipeline',
      sourceReference: 'Live Multi-channel Submissions (Text, Voice, App)',
      retrievalTimestamp: new Date().toISOString(),
      isSynthetic: false,
      validationMethod: 'citizen_verification',
    },
    dataSource: 'citizen_submission',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Master Synthesizer: Builds the complete EvidenceBundle for a target geography.
 */
export async function getEvidenceBundle(
  targetInput: GeographicTarget | string,
  options?: BundleSynthesizerOptions
): Promise<EvidenceBundle> {
  // 1. Normalize the requested geography
  let target: GeographicTarget;
  if (typeof targetInput === 'string') {
    const parts = targetInput.split('|').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 3) {
      target = { locality: parts[0], district: parts[1], state: parts[2] };
    } else if (parts.length === 2) {
      target = { district: parts[0], state: parts[1] };
    } else if (parts.length === 1) {
      target = { state: parts[0] };
    } else {
      target = { state: targetInput };
    }
  } else {
    target = targetInput;
  }

  const norm = normalizeGeography(target.state, target.district, target.locality);
  const docId = computeGeographyDocId(norm.state, norm.district, norm.locality);

  // 2. Check Cache (if not explicitly bypassed)
  if (!options?.skipCache) {
    const cached = await evidenceBundleCache.getCachedBundle(docId, {
      maxAgeMs: options?.maxAgeMs,
    });
    if (cached) {
      return cached;
    }
  }

  // 3. Retrieve Citizen Evidence from existing demand intelligence layer
  const { hotspots } = await getDemandHotspots();
  
  // Find matching hotspot favoring exact locality + state or district + state
  const normLoc = (norm.locality || '').toLowerCase();
  const normDist = (norm.district || '').toLowerCase();
  const normState = norm.state.toLowerCase();

  const matchedHotspot = hotspots.find((h) => {
    const hState = (h.state || '').toLowerCase();
    if (hState !== normState) return false;

    const hLoc = (h.locality || '').toLowerCase();
    const hDist = (h.district || '').toLowerCase();

    if (normLoc && hLoc && normLoc === hLoc) return true;
    if (!normLoc && normDist && hDist && normDist === hDist) return true;
    if (!normLoc && !normDist) return true;
    return false;
  });

  let citizenEvidence: CitizenReportEvidence;

  if (matchedHotspot) {
    // Retrieve qualitative evidence for richer context
    const qualitative = await getHotspotEvidence(matchedHotspot.locationKey);

    const synthCount = matchedHotspot.dataSources?.syntheticDemo ?? 0;
    const citizenCount = matchedHotspot.dataSources?.citizenSubmission ?? 0;
    const isSynthetic = synthCount > 0 && citizenCount === 0;

    const voiceCount = matchedHotspot.sourceDistribution?.voice ?? 0;
    const textCount = matchedHotspot.sourceDistribution?.text ?? 0;
    const languages = matchedHotspot.languagesRepresented ?? [];

    citizenEvidence = {
      sourceId: `CITIZEN-${docId.substring(0, 8)}`,
      sourceType: 'citizen_reports',
      sourceName: 'JanSetu Citizen Demand Aggregator',
      sourceReference: 'JanSetu Multi-channel Citizen Reports',
      sourceYear: new Date().getFullYear(),
      geographyLevel: matchedHotspot.locality ? 'locality' : (matchedHotspot.district ? 'district' : 'state'),
      state: norm.state,
      district: norm.district || matchedHotspot.district,
      locality: norm.locality || matchedHotspot.locality,
      data: {
        totalRequests: matchedHotspot.totalRequests,
        voiceSubmissions: voiceCount,
        textSubmissions: textCount,
        languagesRepresented: languages,
        aggregatedAffectedPopulation: matchedHotspot.affectedPopulation,
        highUrgencyCount: matchedHotspot.highUrgencyRequests,
        citedInfrastructureAssets: qualitative?.infrastructures || [],
        topCategories: Object.entries(matchedHotspot.categoryCounts || {}).map(([category, count]) => ({
          category,
          count,
        })),
        primaryGrievanceSummary: qualitative?.issues && qualitative.issues.length > 0
          ? qualitative.issues.slice(0, 3).join('; ')
          : '',
      },
      provenance: {
        origin: isSynthetic ? 'synthetic_demo' : 'citizen_submission',
        publisherName: 'JanSetu AI Citizen Reporting Pipeline',
        sourceReference: 'Live Multi-channel Submissions (Text, Voice, App)',
        retrievalTimestamp: new Date().toISOString(),
        isSynthetic: isSynthetic,
        validationMethod: 'citizen_verification',
      },
      dataSource: isSynthetic ? 'synthetic_demo' : 'citizen_submission',
      lastUpdated: new Date().toISOString(),
    };
  } else {
    citizenEvidence = createEmptyCitizenEvidence(norm, docId);
  }

  // 4. Retrieve Public Evidence using Provider Abstractions (Phase 6B)
  const demographicProvider = options?.demographicProvider || firestoreDemographicProvider;
  const infrastructureProvider = options?.infrastructureProvider || firestoreInfrastructureProvider;
  const investmentProvider = options?.investmentProvider || firestoreInvestmentProvider;

  const [demoLookup, infraLookup, investLookup] = await Promise.all([
    demographicProvider.getDemographicEvidence(target, { allowFallback: options?.allowFallback ?? true }),
    infrastructureProvider.getInfrastructureEvidence(target, { allowFallback: options?.allowFallback ?? true }),
    investmentProvider.getInvestmentEvidence(target, { allowFallback: options?.allowFallback ?? true }),
  ]);

  const demographicEvidence = demoLookup.found && demoLookup.record ? demoLookup.record : undefined;
  const infrastructureEvidence = infraLookup.found && infraLookup.record ? infraLookup.record : undefined;
  const investmentEvidence = investLookup.found && investLookup.record ? investLookup.record : undefined;

  // 5. Build Fallback Metadata
  const fallbackMetadata: EvidenceFallbackMetadata = {
    demographicsMatchedLevel: demoLookup.matchedLevel,
    demographicsIsFallback: demoLookup.isAggregatedFallback,
    infrastructureMatchedLevel: infraLookup.matchedLevel,
    infrastructureIsFallback: infraLookup.isAggregatedFallback,
    investmentMatchedLevel: investLookup.matchedLevel,
    investmentIsFallback: investLookup.isAggregatedFallback,
  };

  // 6. Calculate Evidence Completeness Rating
  const hasCitizen = citizenEvidence.data.totalRequests > 0;
  const hasDemographics = Boolean(demographicEvidence);
  const hasInfrastructure = Boolean(infrastructureEvidence);
  const hasInvestment = Boolean(investmentEvidence);

  const completeness = computeCompletenessRating(
    hasCitizen,
    hasDemographics,
    hasInfrastructure,
    hasInvestment
  );

  // 7. Calculate Provenance Summary
  let totalRecords = 0;
  let citizenSubmissionCount = 0;
  let publicDatasetCount = 0;
  let syntheticDemoCount = 0;

  if (hasCitizen) {
    totalRecords += 1;
    if (citizenEvidence.dataSource === 'synthetic_demo') {
      syntheticDemoCount += citizenEvidence.data.totalRequests;
    } else {
      citizenSubmissionCount += citizenEvidence.data.totalRequests;
    }
  }

  const publicRecords = [demographicEvidence, infrastructureEvidence, investmentEvidence].filter(Boolean);
  for (const rec of publicRecords) {
    if (!rec) continue;
    totalRecords += 1;
    if (rec.dataSource === 'synthetic_demo') {
      syntheticDemoCount += 1;
    } else if (rec.dataSource === 'public_dataset') {
      publicDatasetCount += 1;
    }
  }

  const containsSyntheticData =
    (hasCitizen && citizenEvidence.dataSource === 'synthetic_demo') ||
    publicRecords.some((r) => r?.dataSource === 'synthetic_demo');

  const dataFreshnessRating = evaluateFreshnessRating(
    demographicEvidence,
    infrastructureEvidence,
    investmentEvidence
  );

  const provenanceSummary: EvidenceProvenanceSummary = {
    totalRecords,
    citizenSubmissionCount,
    publicDatasetCount,
    syntheticDemoCount,
    containsSyntheticData,
    dataFreshnessRating,
  };

  // 8. Detect Contradictions & Conflicts
  const conflicts = detectEvidenceConflicts(
    citizenEvidence,
    demographicEvidence,
    infrastructureEvidence,
    investmentEvidence
  );

  // 9. Compute Deterministic Source Data Version
  const sourceDataVersion = computeSourceDataVersion(
    citizenEvidence,
    demographicEvidence,
    infrastructureEvidence,
    investmentEvidence
  );

  // 10. Assemble Unified EvidenceBundle
  const bundleId = `EB-${docId.substring(0, 12).toUpperCase()}`;

  const bundle: EvidenceBundle = {
    bundleId,
    location: norm,
    synthesizedAt: new Date().toISOString(),
    bundleVersion: CURRENT_BUNDLE_VERSION,
    sourceDataVersion,
    completeness,
    citizenEvidence,
    demographicEvidence,
    infrastructureEvidence,
    investmentEvidence,
    provenanceSummary,
    conflicts,
    fallbackMetadata,
  };

  // 11. Write to Cache (unless skipCache is requested)
  if (!options?.skipCache) {
    await evidenceBundleCache.setCachedBundle(docId, bundle, sourceDataVersion);
  }

  return bundle;
}
