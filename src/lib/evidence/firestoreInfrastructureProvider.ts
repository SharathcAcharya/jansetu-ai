/**
 * JanSetu AI — Phase 6B: Firestore Infrastructure Data Provider
 * Implements IInfrastructureDataProvider with hierarchical fallback resolution.
 */

import { normalizeGeography, computeGeographyDocId } from '../geographyNormalizer';
import type { InfrastructureEvidence } from '../../types/evidence';
import {
  type EvidenceLookupResult,
  type GeographicTarget,
  type IInfrastructureDataProvider,
  type LookupOptions,
} from './providers';
import { infrastructureRepository } from './infrastructureRepository';

export class FirestoreInfrastructureProvider implements IInfrastructureDataProvider {
  public readonly sourceType = 'infrastructure_data' as const;

  /**
   * Retrieves infrastructure evidence for a given geography with explicit hierarchical fallback.
   */
  public async getInfrastructureEvidence(
    target: GeographicTarget,
    options?: LookupOptions
  ): Promise<EvidenceLookupResult<InfrastructureEvidence>> {
    const allowFallback = options?.allowFallback !== false;
    const norm = normalizeGeography(target.state, target.district, target.locality);

    // 1. Attempt exact requested level lookup
    const exactDocId = computeGeographyDocId(norm.state, norm.district, norm.locality);
    const exactRecord = await infrastructureRepository.getById(exactDocId);

    if (exactRecord) {
      return {
        found: true,
        matchedLevel: norm.geographyLevel,
        isAggregatedFallback: false,
        record: exactRecord,
        locationKey: norm.locationKey,
        docId: exactDocId,
        reason: `Exact ${norm.geographyLevel} match found for "${norm.locationKey}".`,
      };
    }

    if (!allowFallback) {
      return {
        found: false,
        matchedLevel: 'none',
        isAggregatedFallback: false,
        record: null,
        locationKey: norm.locationKey,
        docId: exactDocId,
        reason: `Exact ${norm.geographyLevel} data unavailable and fallback is disabled.`,
      };
    }

    // 2. If locality was requested but unavailable, attempt District fallback
    if (norm.locality && norm.district) {
      const districtDocId = computeGeographyDocId(norm.state, norm.district, undefined);
      const districtRecord = await infrastructureRepository.getById(districtDocId);

      if (districtRecord) {
        return {
          found: true,
          matchedLevel: 'district',
          isAggregatedFallback: true,
          record: districtRecord,
          locationKey: norm.locationKey,
          docId: districtDocId,
          reason: `District fallback: Exact locality data for "${norm.locality}" unavailable; returned aggregated data for district "${norm.district}".`,
        };
      }
    }

    // 3. If district was requested or locality+district fell through, attempt State fallback
    if (options?.maxFallbackLevel !== 'district') {
      const stateDocId = computeGeographyDocId(norm.state, undefined, undefined);
      const stateRecord = await infrastructureRepository.getById(stateDocId);

      if (stateRecord) {
        return {
          found: true,
          matchedLevel: 'state',
          isAggregatedFallback: true,
          record: stateRecord,
          locationKey: norm.locationKey,
          docId: stateDocId,
          reason: `State fallback: Local/district data unavailable; returned regional baseline data for state "${norm.state}".`,
        };
      }
    }

    // 4. No matching record at any level
    return {
      found: false,
      matchedLevel: 'none',
      isAggregatedFallback: false,
      record: null,
      locationKey: norm.locationKey,
      docId: exactDocId,
      reason: `No infrastructure evidence found for location "${norm.locationKey}" or its parent administrative regions.`,
    };
  }
}

// Export singleton instance
export const firestoreInfrastructureProvider = new FirestoreInfrastructureProvider();
