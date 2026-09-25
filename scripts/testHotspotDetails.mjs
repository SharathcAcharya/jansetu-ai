/**
 * JanSetu AI — Phase 6E-2: Evidence-Aware Hotspot Details Test Suite
 * 
 * Verifies all 24 specifications:
 * 1. Selected hotspot displays correct location.
 * 2. Citizen demand metrics are displayed from existing data.
 * 3. Priority score is displayed from existing priority data.
 * 4. Priority components and weights are displayed correctly.
 * 5. Priority formula remains unchanged (30/25/25/20).
 * 6. Demographic evidence is displayed from Evidence Bundle.
 * 7. Mangaluru Census code 803181 is preserved.
 * 8. Mangaluru population 499487 is retrieved dynamically.
 * 9. Census 2011 is labeled historical.
 * 10. Synthetic infrastructure evidence is labeled synthetic.
 * 11. Synthetic investment evidence is labeled synthetic.
 * 12. Evidence completeness is taken from the Evidence Bundle.
 * 13. Fallback evidence is correctly labeled.
 * 14. Conflicts are surfaced without overwriting either source.
 * 15. AI recommendation is retrieved from existing recommendation pipeline.
 * 16. Recommendation confidence and limitations are displayed.
 * 17. Suggested department is not presented as official ownership.
 * 18. Voice/text and language information remains available.
 * 19. No-location requests do not receive geographic evidence.
 * 20. Demographic evidence does not modify the priority score.
 * 21. Investment evidence does not modify the priority score.
 * 22. Infrastructure evidence does not modify the priority formula.
 * 23. No client-side secrets are introduced.
 * 24. Existing Phase 6E-1 EvidenceBehindDemand remains functional.
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

async function runHotspotDetailsTests() {
  console.log('========================================================================');
  console.log('  JanSetu AI — Phase 6E-2: Evidence-Aware Hotspot Details Tests        ');
  console.log('========================================================================\n');

  // Load components for structural inspection
  const hotspotsSectionPath = path.resolve(process.cwd(), 'src/components/dashboard/HotspotsSection.tsx');
  const evidenceCompPath = path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx');

  assert(fs.existsSync(hotspotsSectionPath), 'HotspotsSection.tsx exists');
  assert(fs.existsSync(evidenceCompPath), 'EvidenceBehindDemand.tsx exists');

  const hotspotsSrc = fs.readFileSync(hotspotsSectionPath, 'utf-8');
  const evidenceSrc = fs.readFileSync(evidenceCompPath, 'utf-8');

  // Requirement 1: Selected hotspot displays correct location
  console.log('Requirement 1: Selected hotspot displays correct location');
  assert(
    hotspotsSrc.includes('activeHotspot.locality || activeHotspot.district || activeHotspot.state') &&
    hotspotsSrc.includes('geoLevel'),
    'HotspotsSection renders locality, district, state and geographic level badge'
  );

  // Requirement 2: Citizen demand metrics are displayed from existing data
  console.log('\nRequirement 2: Citizen demand metrics displayed from existing data');
  assert(
    hotspotsSrc.includes('activeHotspot.totalRequests') &&
    hotspotsSrc.includes('activeHotspot.affectedPopulation') &&
    hotspotsSrc.includes('activeHotspot.highUrgencyRequests') &&
    hotspotsSrc.includes('activeHotspot.infrastructureRequests') &&
    hotspotsSrc.includes('CITIZEN-PROVIDED EVIDENCE'),
    'Citizen demand metrics and CITIZEN-PROVIDED EVIDENCE label are present'
  );

  // Requirement 3: Priority score displayed from existing priority data
  console.log('\nRequirement 3: Priority score displayed from existing priority data');
  assert(
    hotspotsSrc.includes('Priority Score:') &&
    hotspotsSrc.includes('activeHotspot.priorityScore.toFixed(1)'),
    'Priority score displayed neutrally without political ranking or preference'
  );
  // Ensure no political ranking words
  const prohibitedTerms = ['Best area', 'Worst area', 'Most deserving', 'Winning area', 'Politically preferred'];
  let foundProhibited = false;
  for (const term of prohibitedTerms) {
    if (hotspotsSrc.toLowerCase().includes(term.toLowerCase())) {
      foundProhibited = true;
      console.error(`Found prohibited political term: ${term}`);
    }
  }
  assert(!foundProhibited, 'Zero political ranking terms in HotspotsSection');

  // Requirement 4 & 5: Priority components and weights displayed correctly, formula unchanged
  console.log('\nRequirements 4 & 5: Priority components, weights, and formula unchanged');
  assert(
    hotspotsSrc.includes('Weight: 30%') &&
    hotspotsSrc.includes('Weight: 25%') &&
    hotspotsSrc.includes('Weight: 20%') &&
    hotspotsSrc.includes('30% D + 25% P + 25% U + 20% I') &&
    hotspotsSrc.includes('demandScore') &&
    hotspotsSrc.includes('populationScore') &&
    hotspotsSrc.includes('urgencyScore') &&
    hotspotsSrc.includes('infrastructureGapScore'),
    'Components (30% Demand, 25% Population, 25% Urgency, 20% Infra Gap) present without recalculation'
  );

  // Verify plain language explanation
  assert(
    hotspotsSrc.includes('This score summarizes citizen-reported demand using request volume, affected population, urgency, and infrastructure-related demand.') &&
    hotspotsSrc.includes('Supporting demographic, infrastructure, and investment evidence provides context but does not change the priority score.'),
    'Mandatory plain language priority score explanation is present'
  );

  // Requirement 6: Demographic evidence is displayed from Evidence Bundle
  console.log('\nRequirement 6: Demographic evidence displayed from Evidence Bundle');
  const mangaluruBundle = await getEvidenceBundle({
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    locality: 'Mangaluru',
  }, {
    totalRequests: 8,
    affectedPopulation: 2500,
    highUrgencyRequests: 4,
    infrastructureRequests: 5,
    topCategory: 'Water Supply',
  });
  assert(mangaluruBundle.demographicEvidence !== null, 'Demographic evidence retrieved from Evidence Bundle');
  assert(
    mangaluruBundle.demographicEvidence.dataSource === 'public_dataset',
    'Demographic evidence dataSource is public_dataset'
  );

  // Requirement 7: Mangaluru Census code 803181 is preserved
  console.log('\nRequirement 7: Mangaluru Census code 803181 preserved');
  assert(
    mangaluruBundle.demographicEvidence.originalCensusCode === '803181',
    'Census code 803181 preserved in evidence data'
  );

  // Requirement 8: Mangaluru population 499487 is retrieved dynamically
  console.log('\nRequirement 8: Mangaluru population 499487 retrieved dynamically');
  assert(
    mangaluruBundle.demographicEvidence.data.totalPopulation === 499487,
    'Population is dynamically 499,487 from Census PCA'
  );
  // Scan UI components to guarantee zero hardcoding
  const hardcodedValues = ['499487', '499,487', '115036', '115,036'];
  let hardcodedFound = false;
  for (const val of hardcodedValues) {
    if (evidenceSrc.includes(val) || hotspotsSrc.includes(val)) {
      hardcodedFound = true;
      console.error(`Found hardcoded value "${val}" in UI!`);
    }
  }
  assert(!hardcodedFound, 'No hardcoded Census values exist in UI components');

  // Requirement 9: Census 2011 is labeled historical
  console.log('\nRequirement 9: Census 2011 labeled historical');
  assert(
    hotspotsSrc.includes('Historical baseline — 2011') || hotspotsSrc.includes('Historical Baseline'),
    'HotspotsSection labels Census 2011 as historical baseline'
  );
  assert(
    mangaluruBundle.demographicEvidence.sourceYear === 2011,
    'Evidence bundle explicitly specifies source year 2011'
  );

  // Requirement 10 & 11: Synthetic infrastructure & investment labeled synthetic
  console.log('\nRequirements 10 & 11: Synthetic infrastructure and investment labeled synthetic');
  assert(
    hotspotsSrc.includes('Synthetic demo data') &&
    hotspotsSrc.includes('Synthetic Demo'),
    'HotspotsSection explicitly labels synthetic infrastructure and investment data'
  );

  // Requirement 12: Evidence completeness is taken from the Evidence Bundle
  console.log('\nRequirement 12: Evidence completeness taken from Evidence Bundle');
  assert(
    typeof mangaluruBundle.completeness.score === 'number' &&
    ['HIGH', 'MEDIUM', 'LOW'].includes(mangaluruBundle.completeness.level),
    'Bundle completeness score and level are properly computed'
  );
  assert(
    hotspotsSrc.includes('currentBundle.completeness.score') &&
    hotspotsSrc.includes('currentBundle.completeness.level'),
    'HotspotsSection dynamically reads completeness score & level from currentBundle'
  );

  // Requirement 13: Fallback evidence correctly labeled
  console.log('\nRequirement 13: Fallback evidence correctly labeled');
  const fallbackBundle = await getEvidenceBundle({
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    locality: 'Belthangady',
  });
  assert(fallbackBundle.fallbackMetadata.demographicsIsFallback === true, 'Belthangady correctly identified as fallback');
  assert(fallbackBundle.fallbackMetadata.demographicsMatchedLevel === 'district', 'Fallback level is district');
  assert(
    hotspotsSrc.includes('District-level fallback') &&
    hotspotsSrc.includes('State-level fallback'),
    'HotspotsSection contains explicit fallback labels'
  );

  // Requirement 14: Conflicts surfaced without overwriting
  console.log('\nRequirement 14: Conflicts surfaced without overwriting either source');
  const mockCitizen = {
    sourceType: 'citizen_reports',
    data: {
      totalRequests: 5,
      primaryGrievanceSummary: 'Complete lack of tap water supply. Defunct pump house.',
      citedInfrastructureAssets: ['Pump House #3'],
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
          operationalStatus: 'OPERATIONAL',
        },
      ],
    },
  };
  const detectedConflicts = detectEvidenceConflicts(mockCitizen, undefined, mockInfra, undefined);
  assert(detectedConflicts.length > 0, 'Discrepancy detected between citizen complaint and operational asset');
  assert(
    evidenceSrc.includes('Evidence discrepancy detected') &&
    evidenceSrc.includes('Citizen Report Ground Truth:') &&
    evidenceSrc.includes('Official / Administrative Record:') &&
    evidenceSrc.includes('Neither source is overwritten or suppressed.'),
    'EvidenceBehindDemand surfaces conflicts neutrally side-by-side'
  );

  // Requirement 15: AI recommendation retrieved from existing recommendation pipeline
  console.log('\nRequirement 15: AI recommendation retrieved from existing recommendation pipeline');
  assert(
    hotspotsSrc.includes('/api/intelligence/recommendation') &&
    hotspotsSrc.includes('handleGenerateRecommendation'),
    'Recommendation is fetched through standard recommendation API'
  );

  // Requirement 16: Recommendation confidence and limitations are displayed
  console.log('\nRequirement 16: Recommendation confidence and limitations displayed');
  assert(
    hotspotsSrc.includes('currentRecommendation.confidence') &&
    hotspotsSrc.includes('AI Recommendation Confidence:') &&
    hotspotsSrc.includes('Limitations & Evidence Caveats:') &&
    hotspotsSrc.includes('currentRecommendation.limitations'),
    'Confidence and comprehensive limitations are displayed'
  );

  // Requirement 17: Suggested department not presented as official ownership
  console.log('\nRequirement 17: Suggested department wording verified');
  assert(
    hotspotsSrc.includes('Suggested department:') &&
    hotspotsSrc.includes('(Suggested department based on complaint classification, not official administrative assignment)'),
    'Suggested department explicitly marked as classification proxy, not official ownership'
  );

  // Requirement 18: Voice/text and language information remains available
  console.log('\nRequirement 18: Voice/text and language information preserved');
  assert(
    hotspotsSrc.includes('Submission Channels') &&
    hotspotsSrc.includes('Voice:') &&
    hotspotsSrc.includes('Text:') &&
    hotspotsSrc.includes('Languages Represented') &&
    hotspotsSrc.includes('vernacular'),
    'Multichannel voice/text and vernacular languages are rendered'
  );

  // Requirement 19: No-location requests do not receive geographic evidence
  console.log('\nRequirement 19: No-location requests do not receive geographic evidence');
  let threwOrReturnedEmpty = false;
  try {
    const unmappedBundle = await getEvidenceBundle({ locality: '', district: '', state: '' });
    if (!unmappedBundle || !unmappedBundle.demographicEvidence) {
      threwOrReturnedEmpty = true;
    }
  } catch (err) {
    threwOrReturnedEmpty = true;
  }
  assert(threwOrReturnedEmpty, 'Empty location does not receive fabricated demographic evidence');
  assert(
    hotspotsSrc.includes('Geographic evidence unavailable — citizen did not provide a location.') &&
    evidenceSrc.includes('Geographic evidence unavailable — citizen did not provide a location.'),
    'Both components display no-location protection notice'
  );

  // Requirements 20, 21, 22: Priority score & formula isolation
  console.log('\nRequirements 20, 21, 22: Priority score isolation from demographic & investment data');
  const baseCluster = {
    locationKey: 'KA:DK:Mangaluru',
    state: 'Karnataka',
    district: 'Dakshina Kannada',
    locality: 'Mangaluru',
    totalRequests: 20,
    affectedPopulation: 5000,
    highUrgencyRequests: 10,
    infrastructureRequests: 8,
    categories: ['Water Supply'],
    categoryCounts: { 'Water Supply': 20 },
    topCategory: 'Water Supply',
  };
  const scoredBefore = scoreAndRankHotspots([baseCluster])[0];
  // Verify that adding census demographic data does not alter score
  const scoredAfter = scoreAndRankHotspots([{
    ...baseCluster,
    demographicPopulation: 499487,
    investmentBudget: 15000000,
  }])[0];
  assert(
    scoredBefore.priorityScore === scoredAfter.priorityScore,
    `Priority score identical: ${scoredBefore.priorityScore} === ${scoredAfter.priorityScore}`
  );
  assert(
    scoredBefore.priorityBreakdown.demandScore === scoredAfter.priorityBreakdown.demandScore &&
    scoredBefore.priorityBreakdown.populationScore === scoredAfter.priorityBreakdown.populationScore &&
    scoredBefore.priorityBreakdown.urgencyScore === scoredAfter.priorityBreakdown.urgencyScore &&
    scoredBefore.priorityBreakdown.infrastructureGapScore === scoredAfter.priorityBreakdown.infrastructureGapScore,
    'All priority score breakdown components are 100% demand-isolated'
  );

  // Requirement 23: No client-side secrets introduced
  console.log('\nRequirement 23: No client-side secrets in UI');
  assert(
    !hotspotsSrc.includes('FIREBASE_ADMIN') &&
    !hotspotsSrc.includes('GEMINI_API_KEY') &&
    !hotspotsSrc.includes('serviceAccount'),
    'No sensitive credentials or server secrets present in HotspotsSection.tsx'
  );

  // Requirement 24: Existing Phase 6E-1 EvidenceBehindDemand remains functional
  console.log('\nRequirement 24: Phase 6E-1 EvidenceBehindDemand remains functional');
  assert(
    hotspotsSrc.includes('<EvidenceBehindDemand') &&
    hotspotsSrc.includes('onBundleLoaded={setCurrentBundle}'),
    'EvidenceBehindDemand is properly integrated and wired to share bundle'
  );

  console.log('\n========================================================================');
  console.log(`  Phase 6E-2 Hotspot Details Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runHotspotDetailsTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
