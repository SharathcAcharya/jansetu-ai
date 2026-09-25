/**
 * JanSetu AI — Phase 6B: Evidence Data Validation
 * Enforces provenance contracts, data safety rules, and strict synthetic quarantining.
 *
 * CRITICAL RULE:
 * If dataSource === "synthetic_demo", then:
 * - provenance.origin MUST equal "synthetic_demo"
 * - provenance.isSynthetic MUST equal true
 * - isSynthetic MUST equal true
 *
 * Reject inconsistent records. Likewise, do not allow a record to claim
 * "public_dataset" without valid provenance metadata.
 */

import type {
  BaseEvidenceRecord,
  DataSourceOrigin,
  EvidenceSourceType,
  GeographyLevel,
} from '../../types/evidence';

const VALID_SOURCE_TYPES: EvidenceSourceType[] = [
  'citizen_reports',
  'demographic_data',
  'infrastructure_data',
  'investment_data',
];

const VALID_DATA_SOURCES: DataSourceOrigin[] = [
  'citizen_submission',
  'public_dataset',
  'synthetic_demo',
];

const VALID_GEOGRAPHY_LEVELS: GeographyLevel[] = [
  'country',
  'state',
  'district',
  'locality',
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates any evidence record against Phase 6 provenance and integrity standards.
 */
export function validateEvidenceRecord(record: any): ValidationResult {
  const errors: string[] = [];

  if (!record || typeof record !== 'object') {
    return { isValid: false, errors: ['Record must be a non-null object.'] };
  }

  // 1. Mandatory Identity & Categorization Fields
  if (!record.sourceId || typeof record.sourceId !== 'string') {
    errors.push('sourceId is required and must be a non-empty string.');
  }

  if (!VALID_SOURCE_TYPES.includes(record.sourceType)) {
    errors.push(`Invalid sourceType "${record.sourceType}". Must be one of: ${VALID_SOURCE_TYPES.join(', ')}.`);
  }

  if (!VALID_DATA_SOURCES.includes(record.dataSource)) {
    errors.push(`Invalid dataSource "${record.dataSource}". Must be one of: ${VALID_DATA_SOURCES.join(', ')}.`);
  }

  if (!VALID_GEOGRAPHY_LEVELS.includes(record.geographyLevel)) {
    errors.push(`Invalid geographyLevel "${record.geographyLevel}". Must be one of: ${VALID_GEOGRAPHY_LEVELS.join(', ')}.`);
  }

  if (!record.state || typeof record.state !== 'string' || !record.state.trim()) {
    errors.push('state is required and must be a non-empty string.');
  }

  if (typeof record.sourceYear !== 'number' || record.sourceYear < 1990 || record.sourceYear > 2035) {
    errors.push(`Invalid sourceYear "${record.sourceYear}". Must be a valid 4-digit calendar year.`);
  }

  if (!record.sourceReference || typeof record.sourceReference !== 'string' || !record.sourceReference.trim()) {
    errors.push('sourceReference is required and must identify the official gazette, API, or benchmark dataset.');
  }

  // 2. Provenance Integrity
  if (!record.provenance || typeof record.provenance !== 'object') {
    errors.push('provenance metadata object is required.');
  } else {
    const prov = record.provenance;

    if (!VALID_DATA_SOURCES.includes(prov.origin)) {
      errors.push(`Invalid provenance.origin "${prov.origin}". Must match valid DataSourceOrigin.`);
    }

    if (!prov.publisherName || typeof prov.publisherName !== 'string' || !prov.publisherName.trim()) {
      errors.push('provenance.publisherName is required.');
    }

    if (!prov.sourceReference || typeof prov.sourceReference !== 'string') {
      errors.push('provenance.sourceReference is required.');
    }

    if (typeof prov.isSynthetic !== 'boolean') {
      errors.push('provenance.isSynthetic must be a boolean.');
    }

    if (!prov.retrievalTimestamp || isNaN(Date.parse(prov.retrievalTimestamp))) {
      errors.push('provenance.retrievalTimestamp must be a valid ISO 8601 date string.');
    }

    // 3. Strict Synthetic Demo Consistency Rules
    if (record.dataSource === 'synthetic_demo') {
      if (prov.origin !== 'synthetic_demo') {
        errors.push('When dataSource is "synthetic_demo", provenance.origin must also be "synthetic_demo".');
      }
      if (prov.isSynthetic !== true) {
        errors.push('When dataSource is "synthetic_demo", provenance.isSynthetic must be true.');
      }
      if (record.isSynthetic !== true && record.isSynthetic !== undefined) {
        errors.push('When dataSource is "synthetic_demo", isSynthetic must be true.');
      }
    }

    // 4. Strict Public Dataset Rules
    if (record.dataSource === 'public_dataset') {
      if (prov.origin !== 'public_dataset') {
        errors.push('When dataSource is "public_dataset", provenance.origin must also be "public_dataset".');
      }
      if (prov.isSynthetic === true || record.isSynthetic === true) {
        errors.push('Public dataset records cannot have isSynthetic set to true. Synthetic data must NEVER be labeled as public_dataset.');
      }
    }
  }

  // 5. Data payload must exist
  if (!record.data || typeof record.data !== 'object') {
    errors.push('data payload is required and must be an object.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Asserts that an evidence record is valid, throwing an explicit Error if validation fails.
 */
export function assertValidEvidenceRecord<T extends BaseEvidenceRecord>(record: T): void {
  const result = validateEvidenceRecord(record);
  if (!result.isValid) {
    throw new Error(`Evidence record validation failed:\n- ${result.errors.join('\n- ')}`);
  }
}
