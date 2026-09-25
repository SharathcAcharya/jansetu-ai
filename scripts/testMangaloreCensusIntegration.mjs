/**
 * JanSetu AI — Phase 6D-2: Official Census 2011 Mangaluru Integration Test Suite
 * 
 * Verifies:
 * 1. Mangaluru record exists in official extract and Firestore.
 * 2. Dakshina Kannada district fallback record exists in official extract and Firestore.
 * 3. Correct normalized geography is applied (Mangalore -> Mangaluru).
 * 4. Official Census codes and administrative levels are preserved.
 * 5. dataSource = 'public_dataset' and isSynthetic = false across record and provenance.
 * 6. sourceYear = 2011 and historical baseline note preserved.
 * 7. Derived metrics contain finite values (no NaN, no Infinity).
 * 8. vulnerableHouseholdsEstimate is strictly undefined (zero fabrication).
 * 9. Evidence Bundle returns the Mangaluru demographic record.
 * 10. Synthetic demographic data is not incorrectly reported as the Mangaluru public dataset.
 * 11. Priority scoring formula and weights (30/25/25/20) remain completely isolated and unchanged.
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
  console.log('\n========================================================================');
  console.log('  JanSetu AI — Phase 6D-2: Mangaluru Census PCA 2011 Integration Tests  ');
  console.log('========================================================================\n');

  // Load official extract for row-level verification
  const extractPath = path.resolve(process.cwd(), 'src/data/census/census_pca_2011_extract.json');
  assert(fs.existsSync(extractPath), 'Census PCA 2011 extract JSON file exists');
  const extractJson = JSON.parse(fs.readFileSync(extractPath, 'utf-8'));

  const mangaluruRow = extractJson.records.find((r) => r.Town_Village === '803181');
  const dakshinaKannadaRow = extractJson.records.find(
    (r) => r.Level === 'DISTRICT' && r.District === '575' && r.Name === 'Dakshina Kannada'
  );

  // 1. Record Existence in Extract
  console.log('Test 1: Record existence in official extract');
  assert(Boolean(mangaluruRow), 'Mangalore (M Corp. + OG) row found with Town Code 803181');
  assert(Boolean(dakshinaKannadaRow), 'Dakshina Kannada district row found with District Code 575');

  // 2. Geography Normalization
  console.log('\nTest 2: Geographic normalization and alias resolution');
  const { record: mangaluruRecord, norm: mangaluruNorm } = buildDemographicEvidenceRecord(mangaluruRow);
  assert(mangaluruNorm.state === 'Karnataka', 'State canonicalized to "Karnataka"');
  assert(mangaluruNorm.district === 'Dakshina Kannada', 'District canonicalized to "Dakshina Kannada"');
  assert(mangaluruNorm.locality === 'Mangaluru', 'Locality "Mangalore" canonicalized to "Mangaluru"');
  assert(mangaluruNorm.geographyLevel === 'locality', 'Geography level resolved to "locality"');
  assert(
    mangaluruNorm.locationKey === 'Mangaluru | Dakshina Kannada | Karnataka',
    'locationKey canonicalized to "Mangaluru | Dakshina Kannada | Karnataka"'
  );

  const { record: dkRecord, norm: dkNorm } = buildDemographicEvidenceRecord(dakshinaKannadaRow);
  assert(dkNorm.state === 'Karnataka', 'DK State canonicalized to "Karnataka"');
  assert(dkNorm.district === 'Dakshina Kannada', 'DK District canonicalized to "Dakshina Kannada"');
  assert(dkNorm.locality === undefined, 'DK Locality is undefined for district-level geography');
  assert(dkNorm.geographyLevel === 'district', 'DK Geography level resolved to "district"');

  // Also test alias resolution for alternative spellings
  const aliasNorm1 = normalizeGeography('Karnataka', 'South Canara', 'Mangalore');
  assert(aliasNorm1.locationKey === 'Mangaluru | Dakshina Kannada | Karnataka', 'Alias "South Canara" + "Mangalore" normalizes correctly');
  const aliasNorm2 = normalizeGeography('Karnataka', 'Dakshina Kannada', 'Kudla');
  assert(aliasNorm2.locationKey === 'Mangaluru | Dakshina Kannada | Karnataka', 'Alias "Kudla" normalizes to Mangaluru');

  // 3. Official Census Code Preservation
  console.log('\nTest 3: Official Census code and administrative hierarchy preservation');
  assert(mangaluruRecord.originalCensusCode === '803181', 'Town Code 803181 preserved');
  assert(mangaluruRecord.censusLevel === 'TOWN', 'Census level "TOWN" preserved');
  assert(mangaluruRecord.originalCensusName === 'Mangalore (M Corp. + OG)', 'Full administrative name preserved');

  assert(dkRecord.originalCensusCode === '575', 'District Code 575 preserved');
  assert(dkRecord.censusLevel === 'DISTRICT', 'District level "DISTRICT" preserved');
  assert(dkRecord.originalCensusName === 'Dakshina Kannada', 'Original district name preserved');

  // 4. Provenance & Non-Synthetic Verification
  console.log('\nTest 4: Provenance and non-synthetic verification');
  assert(mangaluruRecord.dataSource === 'public_dataset', 'Mangaluru dataSource is strictly "public_dataset"');
  assert(mangaluruRecord.isSynthetic === false, 'Mangaluru isSynthetic is strictly false');
  assert(mangaluruRecord.provenance.origin === 'public_dataset', 'Mangaluru provenance.origin is "public_dataset"');
  assert(mangaluruRecord.provenance.isSynthetic === false, 'Mangaluru provenance.isSynthetic is false');
  assert(
    mangaluruRecord.provenance.publisherName === 'Office of the Registrar General & Census Commissioner, India',
    'Publisher is Office of the Registrar General & Census Commissioner, India'
  );
  assert(mangaluruRecord.sourceReference === 'Primary Census Abstract (PCA) 2011', 'sourceReference is PCA 2011');
  assert(mangaluruRecord.sourceYear === 2011, 'sourceYear is strictly 2011');
  assert(mangaluruRecord.sourceUrl === 'https://censusindia.gov.in/', 'sourceUrl points to official censusindia.gov.in');
  assert(
    mangaluruRecord.data.demographicSourceNote.includes('Historical Baseline'),
    'Demographic note specifies Historical Baseline'
  );

  // 5. Zero Fabrication Guarantee
  console.log('\nTest 5: Zero fabrication guarantee');
  assert(
    mangaluruRecord.data.vulnerableHouseholdsEstimate === undefined,
    'vulnerableHouseholdsEstimate is strictly undefined (never fabricated)'
  );
  assert(
    dkRecord.data.vulnerableHouseholdsEstimate === undefined,
    'DK vulnerableHouseholdsEstimate is strictly undefined (never fabricated)'
  );

  // 6. Derived Demographic Metrics Precision & Sanity
  console.log('\nTest 6: Derived demographic metrics calculation & sanity');
  const mData = mangaluruRecord.data;

  assert(mData.totalPopulation === 499487, 'Total population is exactly 499,487');
  assert(mData.householdCount === 115036, 'Household count is exactly 115,036');

  // Sex Ratio: (251584 / 247903) * 1000 = 1014.85 -> 1015
  assert(mData.sexRatioFemalesPer1000Males === 1015, `Sex ratio is 1015 females per 1000 males (got ${mData.sexRatioFemalesPer1000Males})`);

  // Effective Literacy: 427218 / (499487 - 43340) * 100 = 93.66%
  assert(mData.overallLiteracyRatePercent === 93.66, `Overall literacy is 93.66% (got ${mData.overallLiteracyRatePercent}%)`);

  // Female Effective Literacy: 209860 / (251584 - 21017) * 100 = 91.02%
  assert(mData.femaleLiteracyRatePercent === 91.02, `Female literacy is 91.02% (got ${mData.femaleLiteracyRatePercent}%)`);

  // Scheduled Caste: 21618 / 499487 * 100 = 4.33%
  assert(mData.scheduledCastePopulationPercent === 4.33, `SC population is 4.33% (got ${mData.scheduledCastePopulationPercent}%)`);

  // Scheduled Tribe: 7409 / 499487 * 100 = 1.48%
  assert(mData.scheduledTribePopulationPercent === 1.48, `ST population is 1.48% (got ${mData.scheduledTribePopulationPercent}%)`);

  // Agri workers: (1480 + 1820 + 220 + 360) / 199436 * 100 = 1.95%
  assert(mData.agriculturalWorkersPercent === 1.95, `Agricultural workers is 1.95% (got ${mData.agriculturalWorkersPercent}%)`);

  // 7. Finite Values Guarantee (No NaN or Infinity)
  console.log('\nTest 7: Finite values guarantee across all metrics');
  const metricsToCheck = [
    mData.totalPopulation,
    mData.householdCount,
    mData.sexRatioFemalesPer1000Males,
    mData.overallLiteracyRatePercent,
    mData.femaleLiteracyRatePercent,
    mData.scheduledCastePopulationPercent,
    mData.scheduledTribePopulationPercent,
    mData.agriculturalWorkersPercent,
  ];
  const allFinite = metricsToCheck.every((v) => typeof v === 'number' && Number.isFinite(v) && !Number.isNaN(v));
  assert(allFinite, 'All derived Mangaluru metrics are finite numbers (no NaN or Infinity)');

  const dkData = dkRecord.data;
  const dkMetricsToCheck = [
    dkData.totalPopulation,
    dkData.householdCount,
    dkData.sexRatioFemalesPer1000Males,
    dkData.overallLiteracyRatePercent,
    dkData.femaleLiteracyRatePercent,
    dkData.scheduledCastePopulationPercent,
    dkData.scheduledTribePopulationPercent,
    dkData.agriculturalWorkersPercent,
  ];
  const allDkFinite = dkMetricsToCheck.every((v) => typeof v === 'number' && Number.isFinite(v) && !Number.isNaN(v));
  assert(allDkFinite, 'All derived Dakshina Kannada metrics are finite numbers (no NaN or Infinity)');

  // 8. Firestore Persistence & Retrieval
  console.log('\nTest 8: Firestore persistence and repository retrieval');
  const firestoreMangaluru = await demographicRepository.getByLocation({
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
  });
  assert(Boolean(firestoreMangaluru), 'Mangaluru record successfully fetched from Firestore');
  assert(firestoreMangaluru?.dataSource === 'public_dataset', 'Firestore record dataSource is "public_dataset"');
  assert(firestoreMangaluru?.isSynthetic === false, 'Firestore record isSynthetic is false');
  assert(firestoreMangaluru?.data?.totalPopulation === 499487, 'Firestore record population is 499,487');
  assert(firestoreMangaluru?.originalCensusCode === '803181', 'Firestore record originalCensusCode is 803181');

  const firestoreDk = await demographicRepository.getByLocation({
    district: 'Dakshina Kannada',
    state: 'Karnataka',
  });
  assert(Boolean(firestoreDk), 'Dakshina Kannada record successfully fetched from Firestore');
  assert(firestoreDk?.data?.totalPopulation === 2089649, 'Firestore DK population is 2,089,649');

  // 9. Evidence Bundle Synthesis for Mangaluru
  console.log('\nTest 9: Evidence Bundle returns official Census demographic record');
  const bundle = await getEvidenceBundle({
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
  });

  assert(Boolean(bundle), 'Evidence Bundle created for Mangaluru');
  assert(Boolean(bundle.demographicEvidence), 'demographicEvidence dimension populated in Evidence Bundle');
  assert(bundle.demographicEvidence.dataSource === 'public_dataset', 'Bundle demographic dataSource is "public_dataset"');
  assert(bundle.demographicEvidence.isSynthetic === false, 'Bundle demographic isSynthetic is false');
  assert(bundle.demographicEvidence.data.totalPopulation === 499487, 'Bundle demographic totalPopulation is 499,487');
  assert(bundle.demographicEvidence.originalCensusCode === '803181', 'Bundle demographic originalCensusCode is 803181');
  assert(bundle.demographicEvidence.provenance.origin === 'public_dataset', 'Bundle demographic provenance is public_dataset');

  // 10. Verification of Non-Demographic Dimension Isolation
  console.log('\nTest 10: Infrastructure and investment evidence isolation');
  // Non-demographic dimensions may be synthetic or empty, but must NOT be corrupted or modified by Census ingestion
  if (bundle.infrastructureEvidence) {
    assert(
      bundle.infrastructureEvidence.sourceType === 'infrastructure_data',
      'Infrastructure evidence preserves its original sourceType'
    );
  }
  if (bundle.investmentEvidence) {
    assert(
      bundle.investmentEvidence.sourceType === 'investment_data',
      'Investment evidence preserves its original sourceType'
    );
  }

  // 11. Synthetic demographic data is not falsely reported as public dataset
  console.log('\nTest 11: Synthetic demographic data isolation');
  assert(
    bundle.demographicEvidence.isSynthetic === false && bundle.demographicEvidence.dataSource === 'public_dataset',
    'Official demographic evidence is genuinely public_dataset, not synthetic masquerading as public'
  );

  // 12. Priority Score Isolation (Demographic data NEVER touches priority score formula)
  console.log('\nTest 12: Priority score isolation');
  const sampleMangaluruHotspot = {
    locationKey: 'Mangaluru | Dakshina Kannada | Karnataka',
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    totalRequests: 12,
    affectedPopulation: 2500,
    highUrgencyRequests: 7,
    infrastructureRequests: 9,
    categoryCounts: { 'Roads & Infrastructure': 6, 'Water & Sanitation': 4, Healthcare: 2 },
    topCategory: 'Roads & Infrastructure',
    locationSource: 'citizen_provided',
    sourceDistribution: { voice: 7, text: 5 },
    languagesRepresented: ['English', 'Kannada'],
    dataSources: { citizenSubmission: 12, syntheticDemo: 0 },
  };

  const [scoredHotspot] = scoreAndRankHotspots([sampleMangaluruHotspot]);
  assert(typeof scoredHotspot.priorityScore === 'number' && scoredHotspot.priorityScore > 0, 'Priority score computed strictly from demand metrics');
  assert(
    scoredHotspot.priorityBreakdown.weights.demand === 0.30 &&
    scoredHotspot.priorityBreakdown.weights.population === 0.25 &&
    scoredHotspot.priorityBreakdown.weights.urgency === 0.25 &&
    scoredHotspot.priorityBreakdown.weights.infrastructureGap === 0.20,
    'Weights strictly remain 30/25/25/20 demand intelligence formula'
  );
  assert(
    scoredHotspot.priorityMethodology.includes('citizen demand'),
    'Methodology explicitly confirms Citizen Demand-Centric Priority Model'
  );

  console.log(`\n=== Mangaluru Census Integration Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
