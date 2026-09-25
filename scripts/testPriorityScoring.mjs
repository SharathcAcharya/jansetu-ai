import {
  calculateDemandScore,
  calculatePopulationScore,
  calculateUrgencyScore,
  calculateInfrastructureGapScore,
  calculateFinalPriorityScore,
  computeHotspotPriority,
  scoreAndRankHotspots,
  PRIORITY_WEIGHTS,
} from '../src/lib/priorityScoringService.ts';

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

console.log('\n=== JanSetu AI — Priority Scoring Engine Unit Tests ===\n');

// 1. Edge Case: Single Hotspot
console.log('Test 1: Single Hotspot');
{
  const single = [
    {
      locationKey: 'Karkala | Udupi | Karnataka',
      totalRequests: 5,
      affectedPopulation: 9250,
      highUrgencyRequests: 4,
      infrastructureRequests: 5,
    },
  ];
  const result = scoreAndRankHotspots(single);
  assert(result.length === 1, 'Returns exactly 1 hotspot');
  assert(result[0].priorityScore >= 0 && result[0].priorityScore <= 100, 'Score is between 0 and 100');
  assert(result[0].priorityBreakdown.demandScore === 100, 'Single hotspot receives 100 demandScore');
  assert(result[0].priorityBreakdown.populationScore === 100, 'Single hotspot receives 100 populationScore');
  assert(result[0].priorityBreakdown.urgencyScore === 80, '4/5 high urgency yields 80 urgencyScore');
  assert(result[0].priorityBreakdown.infrastructureGapScore === 100, '5/5 infrastructure yields 100 infraScore');
  // 100*0.30 + 100*0.25 + 80*0.25 + 100*0.20 = 30 + 25 + 20 + 20 = 95
  assert(result[0].priorityScore === 95, `Expected 95 priorityScore, got ${result[0].priorityScore}`);
  assert(!isNaN(result[0].priorityScore), 'No NaN');
  assert(isFinite(result[0].priorityScore), 'No Infinity');
}

// 2. Edge Case: totalRequests = 0
console.log('\nTest 2: totalRequests = 0');
{
  const zeroRequests = [
    {
      locationKey: 'Empty Hotspot',
      totalRequests: 0,
      affectedPopulation: 0,
      highUrgencyRequests: 0,
      infrastructureRequests: 0,
    },
  ];
  const result = scoreAndRankHotspots(zeroRequests);
  assert(result[0].priorityScore === 0, 'Zero requests yields 0 priorityScore');
  assert(result[0].priorityBreakdown.demandScore === 0, 'Zero requests yields 0 demandScore');
  assert(result[0].priorityBreakdown.populationScore === 0, 'Zero population yields 0 populationScore');
  assert(result[0].priorityBreakdown.urgencyScore === 0, 'Zero requests yields 0 urgencyScore');
  assert(result[0].priorityBreakdown.infrastructureGapScore === 0, 'Zero requests yields 0 infraScore');
  assert(!isNaN(result[0].priorityScore), 'No NaN on zero requests');
  assert(isFinite(result[0].priorityScore), 'No Infinity on zero requests');
}

// 3. Edge Case: affectedPopulation = 0
console.log('\nTest 3: affectedPopulation = 0');
{
  const zeroPop = [
    {
      locationKey: 'Zero Pop',
      totalRequests: 10,
      affectedPopulation: 0,
      highUrgencyRequests: 5,
      infrastructureRequests: 5,
    },
  ];
  const result = scoreAndRankHotspots(zeroPop);
  assert(result[0].priorityBreakdown.populationScore === 0, '0 population yields 0 populationScore');
  assert(!isNaN(result[0].priorityScore), 'No NaN on 0 population');
  assert(isFinite(result[0].priorityScore), 'No Infinity on 0 population');
  assert(result[0].priorityScore >= 0 && result[0].priorityScore <= 100, 'Score is clamped [0, 100]');
}

// 4. Edge Case: No requests contain infrastructure information
console.log('\nTest 4: No requests contain infrastructure information (infrastructureRequests = 0)');
{
  const noInfra = [
    {
      locationKey: 'No Infra',
      totalRequests: 10,
      affectedPopulation: 5000,
      highUrgencyRequests: 5,
      infrastructureRequests: 0,
    },
  ];
  const result = scoreAndRankHotspots(noInfra);
  assert(result[0].priorityBreakdown.infrastructureGapScore === 0, '0 infrastructure requests yields 0 infraScore');
  assert(!isNaN(result[0].priorityScore), 'No NaN on 0 infrastructure');
  assert(isFinite(result[0].priorityScore), 'No Infinity on 0 infrastructure');
}

// 5. Multiple Hotspots: Sorting and Normalization
console.log('\nTest 5: Multiple Hotspots (Descending Sort & Normalization)');
{
  const multi = [
    {
      locationKey: 'Low Priority Hotspot',
      totalRequests: 2,
      affectedPopulation: 500,
      highUrgencyRequests: 0,
      infrastructureRequests: 0,
    },
    {
      locationKey: 'High Priority Hotspot',
      totalRequests: 20,
      affectedPopulation: 50000,
      highUrgencyRequests: 18,
      infrastructureRequests: 19,
    },
    {
      locationKey: 'Medium Priority Hotspot',
      totalRequests: 10,
      affectedPopulation: 25000,
      highUrgencyRequests: 5,
      infrastructureRequests: 8,
    },
  ];
  const result = scoreAndRankHotspots(multi);
  assert(result[0].locationKey === 'High Priority Hotspot', 'Highest priority is ranked first');
  assert(result[1].locationKey === 'Medium Priority Hotspot', 'Medium priority is ranked second');
  assert(result[2].locationKey === 'Low Priority Hotspot', 'Lowest priority is ranked last');
  assert(result[0].priorityScore >= result[1].priorityScore, 'Sorted descending');
  assert(result[1].priorityScore >= result[2].priorityScore, 'Sorted descending');
  assert(result[0].priorityBreakdown.demandScore === 100, 'Max requests hotspot gets 100 demandScore');
  assert(result[0].priorityBreakdown.populationScore === 100, 'Max population hotspot gets 100 populationScore');
}

// 6. Weight Verification: 30% + 25% + 25% + 20% = 100%
console.log('\nTest 6: Priority Weights Verification');
{
  const totalWeight =
    PRIORITY_WEIGHTS.demand +
    PRIORITY_WEIGHTS.population +
    PRIORITY_WEIGHTS.urgency +
    PRIORITY_WEIGHTS.infrastructureGap;
  assert(Math.abs(totalWeight - 1.0) < 0.0001, 'Weights sum to exactly 1.0 (100%)');
  assert(PRIORITY_WEIGHTS.demand === 0.30, 'Demand weight is 30%');
  assert(PRIORITY_WEIGHTS.population === 0.25, 'Population weight is 25%');
  assert(PRIORITY_WEIGHTS.urgency === 0.25, 'Urgency weight is 25%');
  assert(PRIORITY_WEIGHTS.infrastructureGap === 0.20, 'Infrastructure Gap weight is 20%');
}

console.log(`\n=== Results: ${passed} Passed, ${failed} Failed ===\n`);
if (failed > 0) {
  process.exit(1);
}
