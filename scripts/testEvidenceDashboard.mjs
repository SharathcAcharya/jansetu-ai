/**
 * JanSetu AI — Phase 6E-1: Evidence-Aware Dashboard Integration Test Suite
 * 
 * Verifies:
 * 1. Evidence Bundle loads dynamically for Mangaluru.
 * 2. Mangaluru demographic evidence has dataSource: 'public_dataset'.
 * 3. Mangaluru demographic evidence has isSynthetic: false.
 * 4. Census year is strictly 2011.
 * 5. Official Census code 803181 is preserved.
 * 6. Population 499,487 comes dynamically from the returned evidence object.
 * 7. Zero hardcoded demographic values in UI components (verified by AST/source scan).
 * 8. Synthetic infrastructure/investment evidence is labeled correctly.
 * 9. containsSyntheticData flag is accurately computed and respected.
 * 10. Completeness score and rating level come strictly from the Evidence Bundle.
 * 11. Historical Census 2011 data is labeled as historical baseline.
 * 12. Fallback evidence (district level) is explicitly identified and not misrepresented as locality.
 * 13. No-location requests do not receive fabricated geographic evidence.
 * 14. Evidence conflicts are surfaced neutrally without overwriting either source.
 * 15. Priority score remains 100% demand-centric and isolated when demographic evidence changes.
 */

import fs from 'fs';
import path from 'path';
import {
  computeGeographyDocId,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';
import {
  getEvidenceBundle,
  detectEvidenceConflicts,
} from '../src/lib/evidence/evidenceBundleService.ts';
import { demographicRepository } from '../src/lib/evidence/demographicRepository.ts';
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
  console.log('  JanSetu AI — Phase 6E-1: Evidence-Aware Dashboard Integration Tests   ');
  console.log('========================================================================\n');

  // Test 1: Evidence Bundle loads dynamically for Mangaluru
  console.log('Test 1: Load Evidence Bundle for Mangaluru');
  const mangaluruBundle = await getEvidenceBundle({
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
  });
  assert(Boolean(mangaluruBundle), 'Evidence Bundle synthesized for Mangaluru');
  assert(Boolean(mangaluruBundle.bundleId), `Bundle ID generated: ${mangaluruBundle?.bundleId}`);
  assert(Boolean(mangaluruBundle.demographicEvidence), 'demographicEvidence dimension populated');

  // Test 2: Mangaluru demographic evidence dataSource = public_dataset
  console.log('\nTest 2: Mangaluru demographic dataSource verification');
  const demoEv = mangaluruBundle.demographicEvidence;
  assert(demoEv.dataSource === 'public_dataset', 'dataSource is strictly "public_dataset"');
  assert(demoEv.provenance.origin === 'public_dataset', 'provenance.origin is strictly "public_dataset"');

  // Test 3: Mangaluru demographic evidence isSynthetic = false
  console.log('\nTest 3: Non-synthetic verification');
  assert(demoEv.isSynthetic === false, 'isSynthetic is strictly false');
  assert(demoEv.provenance.isSynthetic === false, 'provenance.isSynthetic is strictly false');

  // Test 4: Census year is 2011
  console.log('\nTest 4: Census year verification');
  assert(demoEv.sourceYear === 2011, 'sourceYear is strictly 2011');
  assert(demoEv.sourceName.includes('2011'), 'sourceName references 2011 decennial census');

  // Test 5: Census code 803181 preserved
  console.log('\nTest 5: Census code and administrative details preservation');
  assert(demoEv.originalCensusCode === '803181', 'Town Code 803181 preserved');
  assert(demoEv.censusLevel === 'TOWN', 'Census level "TOWN" preserved');
  assert(demoEv.originalCensusName === 'Mangalore (M Corp. + OG)', 'Official census name preserved');

  // Test 6: Population 499,487 comes from the returned evidence object
  console.log('\nTest 6: Dynamic demographic metrics from returned object');
  const d = demoEv.data;
  assert(d.totalPopulation === 499487, 'totalPopulation is exactly 499,487');
  assert(d.householdCount === 115036, 'householdCount is exactly 115,036');
  assert(d.sexRatioFemalesPer1000Males === 1015, 'Sex ratio is 1,015');
  assert(d.overallLiteracyRatePercent === 93.66, 'Overall literacy is 93.66%');
  assert(d.femaleLiteracyRatePercent === 91.02, 'Female literacy is 91.02%');
  assert(d.scheduledCastePopulationPercent === 4.33, 'SC population is 4.33%');
  assert(d.scheduledTribePopulationPercent === 1.48, 'ST population is 1.48%');
  assert(d.agriculturalWorkersPercent === 1.95, 'Agricultural workers is 1.95%');

  // Test 7: Zero hardcoded demographic values in UI components
  console.log('\nTest 7: Verification of zero hardcoded demographic values in UI components');
  const evidenceCompPath = path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx');
  const hotspotsSectionPath = path.resolve(process.cwd(), 'src/components/dashboard/HotspotsSection.tsx');

  assert(fs.existsSync(evidenceCompPath), 'EvidenceBehindDemand.tsx component exists');
  assert(fs.existsSync(hotspotsSectionPath), 'HotspotsSection.tsx component exists');

  const evidenceCompSrc = fs.readFileSync(evidenceCompPath, 'utf-8');
  const hotspotsSectionSrc = fs.readFileSync(hotspotsSectionPath, 'utf-8');

  // Check that neither UI file hardcodes the Mangaluru population or households
  const hardcodedValues = ['499487', '499,487', '115036', '115,036'];
  let hardcodedFound = false;
  for (const val of hardcodedValues) {
    if (evidenceCompSrc.includes(val) || hotspotsSectionSrc.includes(val)) {
      hardcodedFound = true;
      console.error(`Found hardcoded value "${val}" in UI code!`);
    }
  }
  assert(!hardcodedFound, 'No hardcoded Mangaluru demographic values exist in UI components');

  // Test 8: Synthetic infrastructure/investment evidence is correctly labeled
  console.log('\nTest 8: Synthetic infrastructure/investment labeling');
  if (mangaluruBundle.infrastructureEvidence) {
    const isSynth = mangaluruBundle.infrastructureEvidence.dataSource === 'synthetic_demo';
    assert(
      isSynth ? mangaluruBundle.infrastructureEvidence.provenance.isSynthetic === true : true,
      'Infrastructure synthetic flag is consistent with dataSource'
    );
  }
  if (mangaluruBundle.investmentEvidence) {
    const isSynth = mangaluruBundle.investmentEvidence.dataSource === 'synthetic_demo';
    assert(
      isSynth ? mangaluruBundle.investmentEvidence.provenance.isSynthetic === true : true,
      'Investment synthetic flag is consistent with dataSource'
    );
  }

  // Test 9: containsSyntheticData is correctly respected
  console.log('\nTest 9: containsSyntheticData flag handling');
  const pSum = mangaluruBundle.provenanceSummary;
  const expectedContainsSynth = pSum.syntheticDemoCount > 0;
  assert(
    pSum.containsSyntheticData === expectedContainsSynth,
    `containsSyntheticData is correctly ${expectedContainsSynth}`
  );

  // Test 10: Completeness taken from Evidence Bundle
  console.log('\nTest 10: Completeness score & rating level from Evidence Bundle');
  assert(typeof mangaluruBundle.completeness.score === 'number', 'completeness.score is numeric');
  assert(
    ['HIGH', 'MEDIUM', 'LOW'].includes(mangaluruBundle.completeness.level),
    `completeness.level is valid enum: ${mangaluruBundle.completeness.level}`
  );

  // Test 11: Historical Census data labeled as historical
  console.log('\nTest 11: Historical baseline labeling');
  assert(
    demoEv.data.demographicSourceNote.includes('Historical Baseline'),
    'demographicSourceNote explicitly contains "Historical Baseline"'
  );

  // Test 12: Fallback evidence is explicitly identified
  console.log('\nTest 12: District-level fallback identification');
  // Query a location in Dakshina Kannada without a town-level record (e.g. Belthangady)
  const fallbackBundle = await getEvidenceBundle({
    locality: 'Belthangady',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
  });
  assert(Boolean(fallbackBundle.demographicEvidence), 'Fallback demographic evidence found for Belthangady');
  assert(
    fallbackBundle.fallbackMetadata.demographicsIsFallback === true,
    'demographicsIsFallback is true for Belthangady'
  );
  assert(
    fallbackBundle.fallbackMetadata.demographicsMatchedLevel === 'district',
    'demographicsMatchedLevel is strictly "district" for fallback'
  );
  assert(
    fallbackBundle.demographicEvidence.data.totalPopulation === 2089649,
    'District fallback yields Dakshina Kannada population 2,089,649'
  );

  // Test 13: No-location request does not receive fabricated geographic evidence
  console.log('\nTest 13: Unmapped / No-location request handling');
  let threwOrReturnedEmpty = false;
  try {
    const unmappedBundle = await getEvidenceBundle({
      locality: '',
      district: '',
      state: '',
    });
    // If not thrown, demographicEvidence must be undefined
    if (!unmappedBundle || !unmappedBundle.demographicEvidence) {
      threwOrReturnedEmpty = true;
    }
  } catch (err) {
    threwOrReturnedEmpty = true;
  }
  assert(threwOrReturnedEmpty, 'Empty location does not receive fabricated demographic evidence');

  // Test 14: Evidence conflicts surfaced without overwriting either source
  console.log('\nTest 14: Conflict detection without overwriting');
  const mockCitizen = {
    sourceType: 'citizen_reports',
    data: {
      totalRequests: 5,
      primaryGrievanceSummary: 'Complete lack of tap water supply. Defunct pump house.',
      citedInfrastructureAssets: ['Pump House #3', 'Main Pipeline'],
    },
  };
  const mockInfra = {
    sourceType: 'infrastructure_data',
    data: {
      surveyedAssets: [
        {
          assetName: 'Pump House #3',
          assetType: 'Water Pump Station',
          sector: 'Water',
          operationalStatus: 'OPERATIONAL', // Discrepancy!
        },
      ],
    },
  };
  const detectedConflicts = detectEvidenceConflicts(mockCitizen, undefined, mockInfra, undefined);
  assert(detectedConflicts.length > 0, 'Discrepancy detected between citizen complaint and operational asset');
  assert(detectedConflicts[0].dimension === 'infrastructure', 'Discrepancy correctly attributed to infrastructure');
  assert(detectedConflicts[0].citizenStatement.includes('Pump House #3'), 'Citizen statement preserved intact');
  assert(detectedConflicts[0].publicRecord.includes('OPERATIONAL'), 'Public record preserved intact');

  // Test 15: Priority score is completely unchanged when demographic evidence changes
  console.log('\nTest 15: Priority score strict isolation');
  const sampleHotspot = {
    locationKey: 'Mangaluru | Dakshina Kannada | Karnataka',
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    totalRequests: 10,
    affectedPopulation: 2000,
    highUrgencyRequests: 6,
    infrastructureRequests: 8,
    categoryCounts: { 'Roads & Infrastructure': 5, 'Water & Sanitation': 5 },
    topCategory: 'Roads & Infrastructure',
    locationSource: 'citizen_provided',
  };

  const [scoreBefore] = scoreAndRankHotspots([sampleHotspot]);
  // Re-score with extra contextual properties (simulating demographic presence)
  const sampleHotspotWithContext = {
    ...sampleHotspot,
    demographicContext: {
      totalPopulation: 499487,
      source: 'Census 2011',
    },
  };
  const [scoreAfter] = scoreAndRankHotspots([sampleHotspotWithContext]);

  assert(
    scoreBefore.priorityScore === scoreAfter.priorityScore,
    `Priority score is strictly identical: ${scoreBefore.priorityScore} === ${scoreAfter.priorityScore}`
  );
  assert(
    scoreBefore.priorityBreakdown.demandScore === scoreAfter.priorityBreakdown.demandScore,
    'Demand score strictly identical'
  );
  assert(
    scoreBefore.priorityBreakdown.populationScore === scoreAfter.priorityBreakdown.populationScore,
    'Population score strictly identical'
  );
  assert(
    scoreBefore.priorityBreakdown.weights.demand === 0.30 &&
    scoreBefore.priorityBreakdown.weights.population === 0.25 &&
    scoreBefore.priorityBreakdown.weights.urgency === 0.25 &&
    scoreBefore.priorityBreakdown.weights.infrastructureGap === 0.20,
    'Weights strictly remain 30/25/25/20 demand intelligence formula'
  );

  console.log(`\n=== Evidence Dashboard Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
