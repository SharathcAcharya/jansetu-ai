/**
 * JanSetu AI — Phase 6B: Evidence Providers & Repositories Test Suite
 * Validates data adapters, repositories, validation rules, alias lookups, and hierarchical fallback.
 */

import fs from 'fs';
import path from 'path';
import {
  computeGeographyDocId,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';
import {
  validateEvidenceRecord,
  assertValidEvidenceRecord,
} from '../src/lib/evidence/validation.ts';
import { demographicRepository } from '../src/lib/evidence/demographicRepository.ts';
import { infrastructureRepository } from '../src/lib/evidence/infrastructureRepository.ts';
import { investmentRepository } from '../src/lib/evidence/investmentRepository.ts';
import { firestoreDemographicProvider } from '../src/lib/evidence/firestoreDemographicProvider.ts';
import { firestoreInfrastructureProvider } from '../src/lib/evidence/firestoreInfrastructureProvider.ts';
import { firestoreInvestmentProvider } from '../src/lib/evidence/firestoreInvestmentProvider.ts';

// Ensure .env.local is populated into process.env if running directly
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n=== JanSetu AI — Phase 6B: Evidence Adapters & Repositories Test Suite ===\n');

  // =========================================================================
  // 1. Validation Rules & Data Safety
  // =========================================================================
  console.log('Test 1: Provenance & Synthetic Consistency Validation');
  {
    const validSynthetic = {
      sourceId: 'TEST-SYNTH-01',
      sourceType: 'demographic_data',
      sourceName: 'Test Demographic Source',
      sourceReference: 'Test Gazette 2024',
      sourceYear: 2024,
      geographyLevel: 'locality',
      state: 'Karnataka',
      district: 'Udupi',
      locality: 'Karkala',
      dataSource: 'synthetic_demo',
      isSynthetic: true,
      lastUpdated: new Date().toISOString(),
      provenance: {
        origin: 'synthetic_demo',
        publisherName: 'JanSetu Simulation',
        sourceReference: 'Simulated Benchmark 2024',
        retrievalTimestamp: new Date().toISOString(),
        isSynthetic: true,
        validationMethod: 'manual_curation',
      },
      data: { totalPopulation: 10000 },
    };

    const resValid = validateEvidenceRecord(validSynthetic);
    assert(resValid.isValid === true, 'Valid synthetic record passes validation');

    // Inconsistent: dataSource is synthetic_demo, but provenance claims public_dataset
    const inconsistent1 = {
      ...validSynthetic,
      provenance: {
        ...validSynthetic.provenance,
        origin: 'public_dataset',
      },
    };
    const resInconsistent1 = validateEvidenceRecord(inconsistent1);
    assert(resInconsistent1.isValid === false, 'Rejects mismatch between dataSource and provenance.origin');

    // Inconsistent: claims public_dataset but has isSynthetic = true
    const inconsistent2 = {
      ...validSynthetic,
      dataSource: 'public_dataset',
      isSynthetic: true,
      provenance: {
        ...validSynthetic.provenance,
        origin: 'public_dataset',
        isSynthetic: true,
      },
    };
    const resInconsistent2 = validateEvidenceRecord(inconsistent2);
    assert(resInconsistent2.isValid === false, 'Rejects public_dataset that sets isSynthetic = true');

    // Missing mandatory fields
    const missingState = { ...validSynthetic, state: '' };
    assert(validateEvidenceRecord(missingState).isValid === false, 'Rejects record with empty state');

    const invalidYear = { ...validSynthetic, sourceYear: 1850 };
    assert(validateEvidenceRecord(invalidYear).isValid === false, 'Rejects record with invalid historical year');
  }

  // =========================================================================
  // 2. Demographic Repository Read & Write Lifecycle
  // =========================================================================
  console.log('\nTest 2: Demographic Repository Operations');
  {
    const karkalaTarget = { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' };
    const doc = await demographicRepository.getByLocation(karkalaTarget);

    assert(doc !== null, 'Demographic record for Karkala retrieved successfully');
    assert(doc?.geographyLevel === 'locality', `Document level is "locality" (got ${doc?.geographyLevel})`);
    assert(doc?.dataSource === 'public_dataset' || doc?.dataSource === 'synthetic_demo', `Document has valid dataSource (got ${doc?.dataSource})`);
    assert(doc?.dataSource === 'public_dataset' ? doc?.isSynthetic === false : doc?.isSynthetic === true, 'isSynthetic matches dataSource provenance');
    assert(doc?.data?.totalPopulation === 25824 || doc?.data?.totalPopulation === 42500, `Population matches baseline: ${doc?.data?.totalPopulation}`);

    // Ephemeral record write & delete test
    const tempDocId = await demographicRepository.upsert({
      sourceId: 'TEMP-DEMO-TEST',
      sourceType: 'demographic_data',
      sourceName: 'Temporary Test Evidence',
      sourceReference: 'Unit Test Ephemeral',
      sourceYear: 2024,
      geographyLevel: 'locality',
      state: 'Karnataka',
      district: 'Udupi',
      locality: 'TemporaryTestLocality',
      dataSource: 'synthetic_demo',
      isSynthetic: true,
      lastUpdated: new Date().toISOString(),
      provenance: {
        origin: 'synthetic_demo',
        publisherName: 'JanSetu Test Suite',
        sourceReference: 'Ephemeral Test Run',
        retrievalTimestamp: new Date().toISOString(),
        isSynthetic: true,
        validationMethod: 'manual_curation',
      },
      data: { totalPopulation: 500, householdCount: 100 },
    });

    assert(typeof tempDocId === 'string' && tempDocId.length === 64, 'Upsert returns valid 64-char SHA-256 docId');
    assert(await demographicRepository.exists(tempDocId), 'Temporary document exists in Firestore');

    // Clean up
    await demographicRepository.delete(tempDocId);
    assert((await demographicRepository.exists(tempDocId)) === false, 'Temporary document successfully deleted');
  }

  // =========================================================================
  // 3. Infrastructure Repository Operations
  // =========================================================================
  console.log('\nTest 3: Infrastructure Repository Operations');
  {
    const karkalaTarget = { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' };
    const doc = await infrastructureRepository.getByLocation(karkalaTarget);

    assert(doc !== null, 'Infrastructure record for Karkala retrieved successfully');
    assert(doc?.geographyLevel === 'locality', `Geography level is "locality"`);
    assert(typeof doc?.data?.sectorIndices?.Agriculture === 'number', `Agriculture index is present: ${doc?.data?.sectorIndices?.Agriculture}`);
    assert(Array.isArray(doc?.data?.criticalDeficits) && doc.data.criticalDeficits.length > 0, 'Critical deficits array populated');
    assert(doc?.data?.criticalDeficits[0].includes('irrigation'), 'Identified irrigation deficit in Karkala');
    assert(Array.isArray(doc?.data?.surveyedAssets) && doc.data.surveyedAssets.length >= 2, 'Surveyed assets list present');
    assert(doc?.dataSource === 'synthetic_demo', 'Infrastructure dataSource is strictly "synthetic_demo"');
  }

  // =========================================================================
  // 4. Public Investment Repository Operations
  // =========================================================================
  console.log('\nTest 4: Public Investment Repository Operations');
  {
    const karkalaTarget = { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' };
    const doc = await investmentRepository.getByLocation(karkalaTarget);

    assert(doc !== null, 'Public Investment record for Karkala retrieved successfully');
    assert(doc?.geographyLevel === 'locality', `Geography level is "locality"`);
    assert(doc?.data?.totalSanctionedInrLakhs === 340, `Total sanctioned matches seeded data (got ${doc?.data?.totalSanctionedInrLakhs} Lakhs)`);
    assert(Array.isArray(doc?.data?.activeSchemes), 'activeSchemes is an array');

    const stalledScheme = doc?.data?.activeSchemes?.find((s) => s.status === 'STALLED');
    assert(stalledScheme !== undefined, `Found stalled scheme: "${stalledScheme?.schemeName}"`);
    assert(doc?.dataSource === 'synthetic_demo', 'Investment dataSource is strictly "synthetic_demo"');
  }

  // =========================================================================
  // 5. Canonical Alias Lookup (Bengaluru/Bangalore, Udupi/Udipi, Karkala/Karkal)
  // =========================================================================
  console.log('\nTest 5: Canonical Geographic Alias Lookup');
  {
    // Search using unnormalized/alias names: "Karkal", "Udipi", "Karnataka"
    const aliasTarget = { state: 'karnatak', district: 'Udipi District', locality: 'Karkal Taluk' };
    const docViaAlias = await demographicRepository.getByLocation(aliasTarget);

    assert(docViaAlias !== null, 'Retrieved record using aliases ("Karkal Taluk", "Udipi District", "karnatak")');
    assert(docViaAlias?.state === 'Karnataka', 'State canonicalized to "Karnataka"');
    assert(docViaAlias?.district === 'Udupi', 'District canonicalized to "Udupi"');
    assert(docViaAlias?.locality === 'Karkala', 'Locality canonicalized to "Karkala"');

    // Check Chennai via Madras alias
    const chennaiAlias = { state: 'Tamil Nadu', district: 'Madras' };
    const docChennai = await demographicRepository.getByLocation(chennaiAlias);
    assert(docChennai !== null, 'Retrieved Chennai district record using "Madras" alias');
    assert(docChennai?.district === 'Chennai', 'Canonical district is "Chennai"');
  }

  // =========================================================================
  // 6. Provider Hierarchical Lookup — Locality Exact Match
  // =========================================================================
  console.log('\nTest 6: Provider — Locality Exact Match');
  {
    const target = { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' };
    const result = await firestoreDemographicProvider.getDemographicEvidence(target);

    assert(result.found === true, 'Provider found evidence for exact locality');
    assert(result.matchedLevel === 'locality', `matchedLevel is strictly "locality" (got "${result.matchedLevel}")`);
    assert(result.isAggregatedFallback === false, 'isAggregatedFallback is false on exact match');
    assert(result.record !== null, 'Result contains non-null record');
    assert(result.locationKey === 'Karkala | Udupi | Karnataka', `locationKey is canonical: "${result.locationKey}"`);
  }

  // =========================================================================
  // 7. Provider Hierarchical Lookup — District Fallback
  // =========================================================================
  console.log('\nTest 7: Provider — District Fallback');
  {
    // Locality "Hebri" has no locality demographic record, but district "Udupi" does
    const target = { state: 'Karnataka', district: 'Udupi', locality: 'Hebri' };
    const result = await firestoreDemographicProvider.getDemographicEvidence(target);

    assert(result.found === true, 'Provider returned evidence on district fallback');
    assert(result.matchedLevel === 'district', `matchedLevel is strictly "district" (got "${result.matchedLevel}")`);
    assert(result.isAggregatedFallback === true, 'isAggregatedFallback is true');
    assert(result.record?.state === 'Karnataka' && result.record?.district === 'Udupi', 'Record is Udupi district data');
    assert(result.reason.includes('District fallback'), `Reason clarifies district fallback: "${result.reason}"`);
  }

  // =========================================================================
  // 8. Provider Hierarchical Lookup — State Fallback
  // =========================================================================
  console.log('\nTest 8: Provider — State Fallback');
  {
    // District "Kolar" in Karnataka has neither locality nor district record seeded, but Karnataka has a state baseline
    const target = { state: 'Karnataka', district: 'Kolar', locality: 'Bangarapet' };
    const result = await firestoreDemographicProvider.getDemographicEvidence(target);

    assert(result.found === true, 'Provider returned evidence on state fallback');
    assert(result.matchedLevel === 'state', `matchedLevel is strictly "state" (got "${result.matchedLevel}")`);
    assert(result.isAggregatedFallback === true, 'isAggregatedFallback is true');
    assert(result.record?.state === 'Karnataka', 'Returned Karnataka state demographic baseline');
    assert(result.reason.includes('State fallback'), `Reason clarifies state fallback: "${result.reason}"`);
  }

  // =========================================================================
  // 9. Provider Lookup — Fallback Disabled
  // =========================================================================
  console.log('\nTest 9: Provider — Fallback Disabled Option');
  {
    const target = { state: 'Karnataka', district: 'Udupi', locality: 'Hebri' };
    const result = await firestoreDemographicProvider.getDemographicEvidence(target, {
      allowFallback: false,
    });

    assert(result.found === false, 'Provider returns found: false when exact locality is missing and fallback is disabled');
    assert(result.matchedLevel === 'none', `matchedLevel is "none" (got "${result.matchedLevel}")`);
    assert(result.record === null, 'Record is null');
  }

  // =========================================================================
  // 10. Provider Lookup — No-Match Behavior
  // =========================================================================
  console.log('\nTest 10: Provider — No-Match Graceful Handling');
  {
    const nonexistent = { state: 'Atlantis', district: 'Oceanic', locality: 'Abyss' };
    const result = await firestoreDemographicProvider.getDemographicEvidence(nonexistent);

    assert(result.found === false, 'Returns found: false for unknown state');
    assert(result.matchedLevel === 'none', 'matchedLevel is "none"');
    assert(result.isAggregatedFallback === false, 'isAggregatedFallback is false');
    assert(result.record === null, 'Record is null');
    assert(result.reason.includes('No demographic evidence found'), 'Provides descriptive reason');
  }

  // =========================================================================
  // 11. Multi-Provider Infrastructure & Investment Fallback Verification
  // =========================================================================
  console.log('\nTest 11: Infrastructure & Investment Provider Matching');
  {
    // Exact locality
    const karkala = { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' };
    const infraResult = await firestoreInfrastructureProvider.getInfrastructureEvidence(karkala);
    assert(infraResult.found === true && infraResult.matchedLevel === 'locality', 'Infrastructure exact locality lookup succeeded');

    const invResult = await firestoreInvestmentProvider.getInvestmentEvidence(karkala);
    assert(invResult.found === true && invResult.matchedLevel === 'locality', 'Investment exact locality lookup succeeded');

    // District fallback
    const fallbackTarget = { state: 'Karnataka', district: 'Udupi', locality: 'Saligrama' };
    const infraFallback = await firestoreInfrastructureProvider.getInfrastructureEvidence(fallbackTarget);
    assert(infraFallback.found === true && infraFallback.matchedLevel === 'district' && infraFallback.isAggregatedFallback === true, 'Infrastructure district fallback verified');

    const invFallback = await firestoreInvestmentProvider.getInvestmentEvidence(fallbackTarget);
    assert(invFallback.found === true && invFallback.matchedLevel === 'district' && invFallback.isAggregatedFallback === true, 'Investment district fallback verified');
  }

  // =========================================================================
  // 12. Strict Data Provenance Audit
  // =========================================================================
  console.log('\nTest 12: Strict Provenance Audit across all Collections');
  {
    const karkalaTarget = { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' };
    const dRec = await demographicRepository.getByLocation(karkalaTarget);
    const iRec = await infrastructureRepository.getByLocation(karkalaTarget);
    const vRec = await investmentRepository.getByLocation(karkalaTarget);

    assert(dRec?.dataSource === 'public_dataset' || dRec?.dataSource === 'synthetic_demo', 'Demographic record has valid dataSource');
    assert(dRec?.dataSource === 'public_dataset' ? dRec?.provenance?.isSynthetic === false : dRec?.provenance?.isSynthetic === true, 'Demographic record provenance matches origin');

    assert(iRec?.dataSource === 'synthetic_demo', 'Infrastructure record dataSource is "synthetic_demo"');
    assert(iRec?.provenance?.isSynthetic === true, 'Infrastructure record provenance.isSynthetic is true');

    assert(vRec?.dataSource === 'synthetic_demo', 'Investment record dataSource is "synthetic_demo"');
    assert(vRec?.provenance?.isSynthetic === true, 'Investment record provenance.isSynthetic is true');

    assert(iRec?.dataSource !== 'public_dataset', 'Synthetic infrastructure data is NOT labeled as public_dataset');
    assert(vRec?.dataSource !== 'public_dataset', 'Synthetic investment data is NOT labeled as public_dataset');
  }

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
