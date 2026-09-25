/**
 * JanSetu AI — Phase 6: Public Data Evidence Integration Layer
 * Core Type Definitions & Schemas
 *
 * Supported data provenance tiers:
 * - citizen_submission: Direct citizen reports (text / voice / IVR)
 * - public_dataset: Verified official open government data (Data.gov.in, Census, PMGSY, PFMS)
 * - synthetic_demo: Calibrated baseline demonstration data for prototype evaluation
 *
 * CRITICAL RULE: Synthetic demo data must NEVER be labeled as public_dataset.
 */

export type DataSourceOrigin = 
  | 'citizen_submission'
  | 'public_dataset'
  | 'synthetic_demo';

export type GeographyLevel = 
  | 'country'
  | 'state'
  | 'district'
  | 'locality';

export type EvidenceSourceType = 
  | 'citizen_reports'
  | 'demographic_data'
  | 'infrastructure_data'
  | 'investment_data';

export interface NormalizedGeography {
  country: 'India';
  state: string;           // E.g., "Karnataka"
  district?: string;       // E.g., "Udupi"
  locality?: string;       // E.g., "Karkala"
  locationKey: string;     // Canonical key: "Karkala | Udupi | Karnataka"
  geographyLevel: GeographyLevel;
  censusLgdCode?: string;  // Local Government Directory (LGD) identifier (compatible schema)
  normalizedIdentifier: string; // Internal normalized lowercase key: "karkala:udupi:karnataka"
}

export interface DataProvenance {
  origin: DataSourceOrigin;
  publisherName: string;         // E.g., "Office of Registrar General & Census Commissioner"
  sourceReference: string;       // Document title, Gazette notification, or API identifier
  sourceUrl?: string;            // Direct portal URL or API endpoint
  retrievalTimestamp: string;    // ISO timestamp of ingestion
  isSynthetic: boolean;          // Strictly true if synthetic_demo
  validationMethod: 'automated_api' | 'manual_curation' | 'citizen_verification';
}

export interface BaseEvidenceRecord<TData = Record<string, any>> {
  sourceId: string;
  sourceType: EvidenceSourceType;
  sourceName: string;
  sourceUrl?: string;
  sourceReference: string;
  sourceYear: number;                 // Calendar year or baseline survey year
  geographyLevel: GeographyLevel;
  state: string;
  district?: string;
  locality?: string;
  originalCensusCode?: string;        // Official Census 2011 MDDS or PLCN code
  censusLevel?: string;               // E.g. "STATE", "DISTRICT", "SUB-DISTRICT", "TOWN"
  originalCensusName?: string;        // E.g. "Karkal (TMC)", "Udupi", "KARNATAKA"
  data: TData;
  provenance: DataProvenance;
  dataSource: DataSourceOrigin;
  lastUpdated: string;
  isSynthetic?: boolean;
}

// -------------------------------------------------------------
// 1. Citizen Reports Evidence
// -------------------------------------------------------------
export interface CitizenReportsData {
  totalRequests: number;
  voiceSubmissions: number;
  textSubmissions: number;
  languagesRepresented: string[];
  aggregatedAffectedPopulation: number;
  highUrgencyCount: number;
  citedInfrastructureAssets: string[];
  topCategories: Array<{ category: string; count: number }>;
  primaryGrievanceSummary: string;
}

export interface CitizenReportEvidence extends BaseEvidenceRecord<CitizenReportsData> {
  sourceType: 'citizen_reports';
  dataSource: 'citizen_submission' | 'synthetic_demo';
}

// -------------------------------------------------------------
// 2. Demographic Evidence
// -------------------------------------------------------------
export interface DemographicData {
  totalPopulation: number;
  householdCount: number;
  sexRatioFemalesPer1000Males: number;
  overallLiteracyRatePercent: number;
  femaleLiteracyRatePercent: number;
  scheduledCastePopulationPercent: number;
  scheduledTribePopulationPercent: number;
  agriculturalWorkersPercent: number;
  vulnerableHouseholdsEstimate?: number; // Optional: Never fabricated when missing from official Census
  demographicSourceNote: string;
}

export interface DemographicEvidence extends BaseEvidenceRecord<DemographicData> {
  sourceType: 'demographic_data';
  dataSource: 'public_dataset' | 'synthetic_demo';
}

// -------------------------------------------------------------
// 3. Infrastructure Evidence
// -------------------------------------------------------------
export interface InfrastructureAssetCondition {
  sector: 'Roads' | 'Water' | 'Healthcare' | 'Electricity' | 'Education' | 'Sanitation' | 'Agriculture';
  assetName: string;
  assetType: string;
  operationalStatus: 'OPERATIONAL' | 'DEGRADED' | 'DEFUNCT' | 'UNDER_CONSTRUCTION' | 'NOT_PRESENT';
  distanceToNearestAlternateKm?: number;
  lastInspectionDate?: string;
}

export interface InfrastructureData {
  sectorIndices: Record<string, number>; // 0 - 100 accessibility/gap index
  criticalDeficits: string[];
  surveyedAssets: InfrastructureAssetCondition[];
  pmgsyRoadConnectivityStatus?: 'CONNECTED' | 'PARTIALLY_CONNECTED' | 'UNCONNECTED';
  tapWaterCoveragePercent?: number;       // Jal Jeevan Mission indicator
  nearestPrimaryHealthCenterKm?: number;
}

export interface InfrastructureEvidence extends BaseEvidenceRecord<InfrastructureData> {
  sourceType: 'infrastructure_data';
  dataSource: 'public_dataset' | 'synthetic_demo';
}

// -------------------------------------------------------------
// 4. Public Investment Evidence
// -------------------------------------------------------------
export interface SchemeInvestment {
  schemeName: string;                    // E.g., "PMKSY", "MGNREGS", "PM-AWAS"
  department: string;
  financialYear: string;                 // E.g., "2024-2025"
  sanctionedBudgetInrLakhs: number;
  expenditureInrLakhs: number;
  utilizationRatePercent: number;
  status: 'PROPOSED' | 'APPROVED' | 'IN_EXECUTION' | 'STALLED' | 'COMPLETED';
}

export interface InvestmentData {
  totalSanctionedInrLakhs: number;
  totalExpenditureInrLakhs: number;
  overallUtilizationPercent: number;
  activeSchemes: SchemeInvestment[];
  lastAuditDate?: string;
  primaryFundingSource: 'CENTRAL_SCHEME' | 'STATE_SCHEME' | 'DISTRICT_MINERAL_FUND' | 'NABARD';
}

export interface InvestmentEvidence extends BaseEvidenceRecord<InvestmentData> {
  sourceType: 'investment_data';
  dataSource: 'public_dataset' | 'synthetic_demo';
}

// -------------------------------------------------------------
// Unified Evidence Bundle
// -------------------------------------------------------------
export interface EvidenceCompletenessRating {
  score: number;                         // 0 - 100%
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  hasCitizenEvidence: boolean;
  hasDemographicEvidence: boolean;
  hasInfrastructureEvidence: boolean;
  hasInvestmentEvidence: boolean;
  missingDimensions: Array<'demographics' | 'infrastructure' | 'investment'>;
}

export interface EvidenceProvenanceSummary {
  totalRecords: number;
  citizenSubmissionCount: number;
  publicDatasetCount: number;
  syntheticDemoCount: number;
  containsSyntheticData: boolean;
  dataFreshnessRating: 'CURRENT' | 'MODERATE' | 'STALE';
}

export interface EvidenceConflict {
  dimension: 'demographics' | 'infrastructure' | 'investment';
  citizenStatement: string;
  publicRecord: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
}

export interface EvidenceFallbackMetadata {
  demographicsMatchedLevel?: GeographyLevel | 'none';
  demographicsIsFallback?: boolean;
  infrastructureMatchedLevel?: GeographyLevel | 'none';
  infrastructureIsFallback?: boolean;
  investmentMatchedLevel?: GeographyLevel | 'none';
  investmentIsFallback?: boolean;
}

export interface EvidenceBundle {
  bundleId: string;                      // E.g., "EB-KAR-UDU-KARKALA"
  location: NormalizedGeography;
  synthesizedAt: string;                 // ISO 8601
  bundleVersion: string;                 // E.g., "2026.09-v1"
  sourceDataVersion: string;             // Deterministic hash/version of underlying inputs
  completeness: EvidenceCompletenessRating;
  
  // The 4 Core Evidence Blocks
  citizenEvidence: CitizenReportEvidence;
  demographicEvidence?: DemographicEvidence;
  infrastructureEvidence?: InfrastructureEvidence;
  investmentEvidence?: InvestmentEvidence;

  // Provenance & Audit Metadata
  provenanceSummary: EvidenceProvenanceSummary;

  // Conflict Resolution & Fallback Metadata (Phase 6C)
  conflicts: EvidenceConflict[];
  fallbackMetadata: EvidenceFallbackMetadata;
}

