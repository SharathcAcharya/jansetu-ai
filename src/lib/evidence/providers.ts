/**
 * JanSetu AI — Phase 6B: Evidence Provider Interfaces
 * Defines abstraction contracts for retrieving multi-source evidence across geographic levels.
 *
 * Designed to seamlessly swap between Firestore storage (today) and verified
 * live government APIs (future) without altering caller contracts.
 */

import type {
  DemographicEvidence,
  EvidenceSourceType,
  GeographyLevel,
  InfrastructureEvidence,
  InvestmentEvidence,
} from '../../types/evidence';

export interface GeographicTarget {
  state: string;
  district?: string;
  locality?: string;
}

export interface LookupOptions {
  /**
   * If true, allows hierarchical fallback (e.g. Locality -> District -> State).
   * Default is true.
   */
  allowFallback?: boolean;

  /**
   * Restricts how far the fallback can climb up the administrative hierarchy.
   */
  maxFallbackLevel?: 'district' | 'state';
}

export interface EvidenceLookupResult<T> {
  found: boolean;
  matchedLevel: GeographyLevel | 'none';
  isAggregatedFallback: boolean;
  record: T | null;
  locationKey: string;
  docId: string;
  reason: string;
}

/**
 * Contract for demographic data providers (Census, SECC, NFHS, State Demographics).
 */
export interface IDemographicDataProvider {
  readonly sourceType: 'demographic_data';
  getDemographicEvidence(
    target: GeographicTarget,
    options?: LookupOptions
  ): Promise<EvidenceLookupResult<DemographicEvidence>>;
}

/**
 * Contract for infrastructure data providers (PMGSY, Jal Jeevan Mission, UDISE+, HMIS).
 */
export interface IInfrastructureDataProvider {
  readonly sourceType: 'infrastructure_data';
  getInfrastructureEvidence(
    target: GeographicTarget,
    options?: LookupOptions
  ): Promise<EvidenceLookupResult<InfrastructureEvidence>>;
}

/**
 * Contract for public investment & scheme expenditure data providers (PFMS, State Treasuries, DMF).
 */
export interface IPublicInvestmentDataProvider {
  readonly sourceType: 'investment_data';
  getInvestmentEvidence(
    target: GeographicTarget,
    options?: LookupOptions
  ): Promise<EvidenceLookupResult<InvestmentEvidence>>;
}
