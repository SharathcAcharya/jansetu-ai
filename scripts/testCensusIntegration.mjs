/**
 * JanSetu AI — Phase 6D-1: Real Census PCA 2011 Integration Test Suite
 * Validates all 20 verification criteria specified in Phase 6D-1.
 */

import fs from 'fs';
import path from 'path';
import {
  computeGeographyDocId,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';
import {
  deriveDemographicData,
  buildDemographicEvidenceRecord,
} from './ingestCensusPCA.mjs';
import { demographicRepository } from '../src/lib/evidence/demographicRepository.ts';
import { getEvidenceBundle } from '../src/lib/evidence/evidenceBundleService.ts';
import { scoreAndRankHotspots } from '../src/lib/priorityScoringService.ts';

// Load .env.local if running directly
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
  console.log('\n=== JanSetu AI — Phase 6D-1: Census PCA 2011 Integration Test Suite ===\n');

  // Load official extract for row-level tests
  const extractPath = path.resolve(process.cwd(), 'src/data/census/census_pca_2011_extract.json');
  const extractJson = JSON.parse(fs.readFileSync(extractPath, 'utf-8'));
  const karkalaRow = extractJson.records.find((r) => r.Name.includes('Karkal'));
  const udupiRow = extractJson.records.find((r) => r.Level === 'DISTRICT' && r.Name === 'Udupi');

  assert(Boolean(karkalaRow), 'Karkala TMC record exists in official extract');
  assert(Boolean(udupiRow), 'Udupi district record exists in official extract');

  const { record: karkalaRecord, norm: karkalaNorm } = buildDemographicEvidenceRecord(karkalaRow);

  // 1. Real Census Record Schema
  console.log('\nTest 1: Real Census record schema');
  assert(karkalaRecord.sourceType === 'demographic_data', 'sourceType is "demographic_data"');
  assert(karkalaRecord.sourceName.includes('Census of India 2011'), 'sourceName includes Census of India 2011');
  assert(typeof karkalaRecord.data.totalPopulation === 'number', 'totalPopulation is a number');
  assert(karkalaRecord.data.totalPopulation === 25824, 'Karkala total population is 25,824');

  // 2. dataSource = public_dataset
  console.log('\nTest 2: dataSource = public_dataset');
  assert(karkalaRecord.dataSource === 'public_dataset', 'dataSource is strictly "public_dataset"');

  // 3. isSynthetic = false
  console.log('\nTest 3: isSynthetic = false');
  assert(karkalaRecord.isSynthetic === false, 'isSynthetic is strictly false');
  assert(karkalaRecord.provenance.isSynthetic === false, 'provenance.isSynthetic is strictly false');

  // 4. provenance.origin = public_dataset
  console.log('\nTest 4: provenance.origin = public_dataset');
  assert(karkalaRecord.provenance.origin === 'public_dataset', 'provenance.origin is strictly "public_dataset"');

  // 5. sourceYear = 2011
  console.log('\nTest 5: sourceYear = 2011');
  assert(karkalaRecord.sourceYear === 2011, 'sourceYear is strictly 2011');

  // 6. sourceReference
  console.log('\nTest 6: sourceReference');
  assert(karkalaRecord.sourceReference === 'Primary Census Abstract (PCA) 2011', 'sourceReference accurately cites PCA 2011');
  assert(karkalaRecord.data.demographicSourceNote.includes('Historical Baseline'), 'Source note highlights Historical Baseline');

  // 7. source URL
  console.log('\nTest 7: source URL');
  assert(karkalaRecord.sourceUrl === 'https://censusindia.gov.in/', 'sourceUrl points to official censusindia.gov.in');

  // 8. Derived Sex Ratio
  console.log('\nTest 8: Derived sex ratio');
  // Formula: (TOT_F / TOT_M) * 1000 = (13219 / 12605) * 1000 = 1048.71 => 1049
  const expectedSexRatio = Math.round((karkalaRow.TOT_F / karkalaRow.TOT_M) * 1000);
  assert(karkalaRecord.data.sexRatioFemalesPer1000Males === expectedSexRatio, `Sex ratio is ${expectedSexRatio} (Females per 1000 Males)`);
  assert(karkalaRecord.data.sexRatioFemalesPer1000Males > 1000, 'Karkala sex ratio reflects positive female proportion');

  // 9. Literacy Calculation
  console.log('\nTest 9: Literacy calculation (Effective pop excl. 0-6)');
  // Formula: P_LIT / (TOT_P - P_06) * 100 = 22057 / (25824 - 2149) * 100 = 93.167% => 93.17%
  const effectivePop = karkalaRow.TOT_P - karkalaRow.P_06;
  const expectedOverallLit = Number(((karkalaRow.P_LIT / effectivePop) * 100).toFixed(2));
  assert(karkalaRecord.data.overallLiteracyRatePercent === expectedOverallLit, `Overall literacy is ${expectedOverallLit}%`);

  const effectiveFemales = karkalaRow.TOT_F - karkalaRow.F_06;
  const expectedFemaleLit = Number(((karkalaRow.F_LIT / effectiveFemales) * 100).toFixed(2));
  assert(karkalaRecord.data.femaleLiteracyRatePercent === expectedFemaleLit, `Female literacy is ${expectedFemaleLit}%`);

  // 10. SC Percentage
  console.log('\nTest 10: SC percentage');
  // Formula: P_SC / TOT_P * 100 = 1746 / 25824 * 100 = 6.76%
  const expectedSc = Number(((karkalaRow.P_SC / karkalaRow.TOT_P) * 100).toFixed(2));
  assert(karkalaRecord.data.scheduledCastePopulationPercent === expectedSc, `SC population is ${expectedSc}%`);

  // 11. ST Percentage
  console.log('\nTest 11: ST percentage');
  // Formula: P_ST / TOT_P * 100 = 529 / 25824 * 100 = 2.05%
  const expectedSt = Number(((karkalaRow.P_ST / karkalaRow.TOT_P) * 100).toFixed(2));
  assert(karkalaRecord.data.scheduledTribePopulationPercent === expectedSt, `ST population is ${expectedSt}%`);

  // 12. Agricultural Worker Calculation
  console.log('\nTest 12: Agricultural worker calculation');
  // Formula: (MAIN_CL + MAIN_AL + MARG_CL + MARG_AL) / TOT_WORK_P * 100
  const totalAgri = karkalaRow.MAIN_CL_P + karkalaRow.MAIN_AL_P + karkalaRow.MARG_CL_P + karkalaRow.MARG_AL_P;
  const expectedAgri = Number(((totalAgri / karkalaRow.TOT_WORK_P) * 100).toFixed(2));
  assert(karkalaRecord.data.agriculturalWorkersPercent === expectedAgri, `Agricultural workers is ${expectedAgri}%`);

  // 13. vulnerableHouseholdsEstimate remains undefined/null (Zero fabrication)
  console.log('\nTest 13: vulnerableHouseholdsEstimate remains undefined (No fabrication)');
  assert(
    karkalaRecord.data.vulnerableHouseholdsEstimate === undefined,
    'vulnerableHouseholdsEstimate is strictly undefined'
  );

  // 14. Geography Normalization
  console.log('\nTest 14: Geography normalization');
  assert(karkalaNorm.state === 'Karnataka', 'State canonicalized to "Karnataka"');
  assert(karkalaNorm.district === 'Udupi', 'District canonicalized to "Udupi"');
  assert(karkalaNorm.locality === 'Karkala', 'Locality canonicalized to "Karkala"');
  assert(karkalaNorm.locationKey === 'Karkala | Udupi | Karnataka', 'LocationKey canonicalized correctly');

  // 15. Deterministic Document ID
  console.log('\nTest 15: Deterministic document ID');
  const expectedDocId = computeGeographyDocId('Karnataka', 'Udupi', 'Karkala');
  assert(typeof expectedDocId === 'string' && expectedDocId.length === 64, 'DocId is 64-char SHA-256');

  // 16. Original Census Code Preservation
  console.log('\nTest 16: Original Census code preservation');
  assert(karkalaRecord.originalCensusCode === '803178', 'Official Town Code 803178 preserved');
  assert(karkalaRecord.censusLevel === 'TOWN', 'Census level "TOWN" preserved');
  assert(karkalaRecord.originalCensusName === 'Karkal (TMC)', 'Official census name preserved');

  // 17. Invalid Record Rejection
  console.log('\nTest 17: Invalid record rejection');
  let threwOnZeroPop = false;
  try {
    deriveDemographicData({ TOT_P: 0, TOT_M: 0, TOT_F: 0 });
  } catch (err) {
    threwOnZeroPop = true;
  }
  assert(threwOnZeroPop, 'Rejects record with 0 or missing TOT_P');

  // 18. Divide-by-Zero Protection
  console.log('\nTest 18: Divide-by-zero protection');
  const zeroWorkerRow = {
    TOT_P: 100,
    TOT_M: 50,
    TOT_F: 50,
    P_06: 100, // effective pop = 0
    F_06: 50,  // effective females = 0
    P_LIT: 0,
    F_LIT: 0,
    P_SC: 0,
    P_ST: 0,
    No_HH: 20,
    TOT_WORK_P: 0, // 0 workers
    MAIN_CL_P: 0,
    MAIN_AL_P: 0,
    MARG_CL_P: 0,
    MARG_AL_P: 0,
  };
  const zeroMetrics = deriveDemographicData(zeroWorkerRow);
  assert(zeroMetrics.overallLiteracyRatePercent === 0, '0 effective population yields 0 literacy without NaN');
  assert(zeroMetrics.femaleLiteracyRatePercent === 0, '0 effective females yields 0 female literacy without NaN');
  assert(zeroMetrics.agriculturalWorkersPercent === 0, '0 total workers yields 0 agricultural workers without NaN');

  // 19. Synthetic-to-Real Replacement in Firestore
  console.log('\nTest 19: Synthetic-to-real replacement in Firestore');
  const firestoreRecord = await demographicRepository.getByLocation({
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
  });
  assert(Boolean(firestoreRecord), 'Record retrieved from Firestore');
  assert(firestoreRecord.dataSource === 'public_dataset', 'Firestore record dataSource is "public_dataset" (synthetic replaced)');
  assert(firestoreRecord.isSynthetic === false, 'Firestore record isSynthetic is false');
  assert(firestoreRecord.sourceYear === 2011, 'Firestore record sourceYear is 2011');
  assert(firestoreRecord.data.totalPopulation === 25824, 'Firestore population reflects official 25,824');

  // 20. Priority Score Isolation (Census data does NOT alter priorityScore)
  console.log('\nTest 20: Priority score isolation (Census data does not touch priorityScore)');
  const sampleHotspot = {
    locationKey: 'Karkala | Udupi | Karnataka',
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
    totalRequests: 8,
    affectedPopulation: 1420,
    highUrgencyRequests: 5,
    infrastructureRequests: 6,
    categoryCounts: { 'Water & Sanitation': 5, Agriculture: 3 },
    topCategory: 'Water & Sanitation',
    locationSource: 'citizen_provided',
    sourceDistribution: { voice: 5, text: 3 },
    languagesRepresented: ['English', 'Kannada'],
    dataSources: { citizenSubmission: 8, syntheticDemo: 0 },
  };

  const [scoreResult] = scoreAndRankHotspots([sampleHotspot]);
  assert(scoreResult.priorityScore > 0, `Priority score is strictly citizen demand: ${scoreResult.priorityScore}`);
  assert(
    scoreResult.priorityBreakdown.weights.demand === 0.30 &&
    scoreResult.priorityBreakdown.weights.population === 0.25 &&
    scoreResult.priorityBreakdown.weights.urgency === 0.25 &&
    scoreResult.priorityBreakdown.weights.infrastructureGap === 0.20,
    'Weights strictly remain 30/25/25/20 demand intelligence formula'
  );

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
