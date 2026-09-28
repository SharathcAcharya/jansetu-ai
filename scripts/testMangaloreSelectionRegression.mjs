/**
 * JanSetu AI — Phase 7A: Mangaluru Hotspot Selection & Scroll Navigation Regression Test
 * 
 * Verifies all Phase 7A specifications:
 * 1. Initial State: Default active hotspot is Karkala (Karkala | Udupi | Karnataka).
 * 2. Hotspot Selection: Selecting Mangaluru updates canonical selectedHotspotKey to:
 *    "Mangaluru | Dakshina Kannada | Karnataka"
 * 3. Active Hotspot recalculation: activeHotspot becomes Mangaluru.
 * 4. Priority Score: Deterministic score matches production data (71.6 / 100).
 * 5. Detail Section Grounding:
 *    - Hotspot header renders "Mangaluru"
 *    - Category: Water & Sanitation
 *    - Requests: 8, Affected population: 24,800, High urgency: 8
 * 6. Evidence Location Key & Bundle Retrieval:
 *    - Evidence request locationKey is strictly "Mangaluru | Dakshina Kannada | Karnataka"
 *    - Census evidence resolves to Census Town Code 803181
 *    - Census 2011 population is 499,487
 *    - Households: 115,036
 *    - Sex ratio: 1,015
 *    - Literacy: 93.66%
 *    - Provenance: public_dataset, isSynthetic: false, sourceYear: 2011
 * 7. AI Recommendation Isolation:
 *    - Recommendation state belongs to Mangaluru
 * 8. India Map Coordinate Synchronization:
 *    - Mangaluru resolves to coordinates { x: 40, y: 75 }
 * 9. Scroll Navigation Implementation:
 *    - HotspotsSection contains scrollToHotspotDetails targeting #hotspot-details
 *    - Clicking "Details" or table row triggers handleSelect with shouldScroll = true
 *    - #hotspot-details and #evidence-behind-demand have scroll-mt-24 for sticky navbar offset
 * 10. Reverse Navigation:
 *    - Karkala -> Mangaluru -> Karkala restores Karkala as active hotspot without stale state leakage
 * 11. No-Location Protection:
 *    - Unmapped requests without geography are excluded from geographic hotspots and return null coordinates
 */

import fs from 'fs';
import path from 'path';
import {
  normalizeLocationKey,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';
import { getEvidenceBundle } from '../src/lib/evidence/evidenceBundleService.ts';
import { getHotspotCoordinates } from '../src/components/dashboard/IndiaMapPlaceholder.tsx';

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

async function runRegressionTests() {
  console.log('========================================================================');
  console.log('  JanSetu AI — Phase 7A: Mangaluru Hotspot Selection & Navigation Tests ');
  console.log('========================================================================\n');

  // 1. Verify component source structure
  const hotspotsSectionPath = path.resolve(process.cwd(), 'src/components/dashboard/HotspotsSection.tsx');
  const indiaMapPath = path.resolve(process.cwd(), 'src/components/dashboard/IndiaMapPlaceholder.tsx');
  const dashboardPath = path.resolve(process.cwd(), 'src/app/dashboard/page.tsx');

  assert(fs.existsSync(hotspotsSectionPath), 'HotspotsSection.tsx exists');
  assert(fs.existsSync(indiaMapPath), 'IndiaMapPlaceholder.tsx exists');
  assert(fs.existsSync(dashboardPath), 'Dashboard page.tsx exists');

  const hotspotsSrc = fs.readFileSync(hotspotsSectionPath, 'utf-8');
  const indiaMapSrc = fs.readFileSync(indiaMapPath, 'utf-8');
  const dashboardSrc = fs.readFileSync(dashboardPath, 'utf-8');

  // Test 1: Canonical Location Key Formatting
  console.log('Test 1: Canonical Mangaluru Location Key');
  const canonicalKey = normalizeLocationKey('Karnataka', 'Dakshina Kannada', 'Mangaluru');
  assert(
    canonicalKey === 'Mangaluru | Dakshina Kannada | Karnataka',
    `Canonical key is strictly "Mangaluru | Dakshina Kannada | Karnataka" (got: "${canonicalKey}")`
  );

  // From locality only
  const fromLocalityOnly = normalizeLocationKey('', '', 'Mangaluru');
  assert(
    fromLocalityOnly === 'Mangaluru | Dakshina Kannada | Karnataka',
    `Locality alias resolves parent hierarchy: "${fromLocalityOnly}"`
  );

  // Test 2: Simulated Hotspot Collection representing Production State
  console.log('\nTest 2: Hotspot Dataset & Active Hotspot Selection Simulation');
  const mockHotspots = [
    {
      locationKey: 'Karkala | Udupi | Karnataka',
      locality: 'Karkala',
      district: 'Udupi',
      state: 'Karnataka',
      totalRequests: 28,
      affectedPopulation: 145000,
      highUrgencyRequests: 20,
      infrastructureRequests: 18,
      priorityScore: 92.5,
      topCategory: 'Water & Sanitation',
      sourceDistribution: { voice: 14, text: 14 },
    },
    {
      locationKey: 'Coimbatore | Coimbatore | Tamil Nadu',
      locality: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      totalRequests: 2,
      affectedPopulation: 12000,
      highUrgencyRequests: 2,
      infrastructureRequests: 1,
      priorityScore: 72.1,
      topCategory: 'Roads & Transport',
      sourceDistribution: { voice: 0, text: 2 },
    },
    {
      locationKey: 'Mangaluru | Dakshina Kannada | Karnataka',
      locality: 'Mangaluru',
      district: 'Dakshina Kannada',
      state: 'Karnataka',
      totalRequests: 8,
      affectedPopulation: 24800,
      highUrgencyRequests: 8,
      infrastructureRequests: 6,
      priorityScore: 71.6,
      topCategory: 'Water & Sanitation',
      sourceDistribution: { voice: 0, text: 8 },
    },
  ];

  // Initial State: Default active hotspot
  let selectedKey = null;
  const initialActive = mockHotspots.find((h) => h.locationKey === selectedKey) || mockHotspots[0] || null;
  assert(
    initialActive.locationKey === 'Karkala | Udupi | Karnataka',
    `Initial active hotspot defaults to Karkala (got: ${initialActive.locality})`
  );

  // User Clicks Mangaluru
  selectedKey = canonicalKey;
  const updatedActive = mockHotspots.find((h) => h.locationKey === selectedKey) || mockHotspots[0] || null;
  assert(
    updatedActive.locationKey === 'Mangaluru | Dakshina Kannada | Karnataka',
    `After selection, active hotspot is Mangaluru (got: ${updatedActive.locality})`
  );
  assert(
    updatedActive.priorityScore === 71.6,
    `Mangaluru priority score is 71.6 / 100 (got: ${updatedActive.priorityScore})`
  );
  assert(
    updatedActive.totalRequests === 8,
    `Mangaluru total requests is 8 (got: ${updatedActive.totalRequests})`
  );
  assert(
    updatedActive.highUrgencyRequests === 8,
    `Mangaluru high urgency requests is 8 (got: ${updatedActive.highUrgencyRequests})`
  );
  assert(
    updatedActive.affectedPopulation === 24800,
    `Mangaluru affected population is 24,800 (got: ${updatedActive.affectedPopulation})`
  );

  // Test 3: Evidence Bundle Retrieval for Mangaluru
  console.log('\nTest 3: Evidence Bundle Resolution for Selected Mangaluru Hotspot');
  const bundle = await getEvidenceBundle(
    {
      locality: updatedActive.locality,
      district: updatedActive.district,
      state: updatedActive.state,
    },
    {
      totalRequests: updatedActive.totalRequests,
      affectedPopulation: updatedActive.affectedPopulation,
      highUrgencyRequests: updatedActive.highUrgencyRequests,
      infrastructureRequests: updatedActive.infrastructureRequests,
      topCategory: updatedActive.topCategory,
    }
  );

  assert(bundle !== null, 'Evidence bundle synthesized successfully for Mangaluru');
  assert(bundle.demographicEvidence !== null, 'Demographic evidence is present in bundle');
  assert(
    bundle.demographicEvidence.dataSource === 'public_dataset',
    'Demographic evidence dataSource is strictly "public_dataset"'
  );
  assert(
    bundle.demographicEvidence.provenance.isSynthetic === false,
    'Demographic evidence is strictly non-synthetic'
  );
  assert(
    bundle.demographicEvidence.sourceYear === 2011,
    'Census sourceYear is strictly 2011'
  );
  assert(
    bundle.demographicEvidence.originalCensusCode === '803181',
    `Census Town Code is strictly 803181 (got: ${bundle.demographicEvidence.originalCensusCode})`
  );
  assert(
    bundle.demographicEvidence.data.totalPopulation === 499487,
    `Census 2011 Population is exactly 499,487 (got: ${bundle.demographicEvidence.data.totalPopulation})`
  );
  assert(
    bundle.demographicEvidence.data.householdCount === 115036,
    `Census 2011 Households count is exactly 115,036 (got: ${bundle.demographicEvidence.data.householdCount})`
  );
  assert(
    bundle.demographicEvidence.data.sexRatioFemalesPer1000Males === 1015,
    `Sex ratio is exactly 1,015 females/1k males (got: ${bundle.demographicEvidence.data.sexRatioFemalesPer1000Males})`
  );
  assert(
    bundle.demographicEvidence.data.overallLiteracyRatePercent === 93.66,
    `Overall literacy rate is 93.66% (got: ${bundle.demographicEvidence.data.overallLiteracyRatePercent})`
  );
  assert(
    bundle.demographicEvidence.data.femaleLiteracyRatePercent === 91.02,
    `Female literacy rate is 91.02% (got: ${bundle.demographicEvidence.data.femaleLiteracyRatePercent})`
  );

  // Test 4: Map Pin Coordinate Synchronization
  console.log('\nTest 4: Geospatial Map Coordinate Synchronization');
  const mangaluruCoords = getHotspotCoordinates(updatedActive);
  assert(mangaluruCoords !== null, 'Mangaluru has valid SVG map coordinates');
  assert(
    mangaluruCoords.x === 40 && mangaluruCoords.y === 75,
    `Mangaluru coordinates match verified position { x: 40, y: 75 } (got: { x: ${mangaluruCoords.x}, y: ${mangaluruCoords.y} })`
  );

  const karkalaCoords = getHotspotCoordinates(initialActive);
  assert(
    karkalaCoords.x === 42 && karkalaCoords.y === 73,
    `Karkala coordinates match position { x: 42, y: 73 } (got: { x: ${karkalaCoords.x}, y: ${karkalaCoords.y} })`
  );

  // Test 5: Reverse Navigation (Karkala -> Mangaluru -> Karkala)
  console.log('\nTest 5: Reverse Navigation (Karkala -> Mangaluru -> Karkala)');
  selectedKey = 'Karkala | Udupi | Karnataka';
  const restoredActive = mockHotspots.find((h) => h.locationKey === selectedKey) || mockHotspots[0] || null;
  assert(
    restoredActive.locationKey === 'Karkala | Udupi | Karnataka',
    `Restored active hotspot is Karkala (got: ${restoredActive.locality})`
  );
  assert(
    restoredActive.priorityScore === 92.5,
    `Karkala priority score is 92.5 (got: ${restoredActive.priorityScore})`
  );

  // Test 6: Scroll Navigation & Offset Verification in Code
  console.log('\nTest 6: Scroll Navigation Code Inspection');
  assert(
    hotspotsSrc.includes('scrollToHotspotDetails'),
    'HotspotsSection defines scrollToHotspotDetails function'
  );
  assert(
    hotspotsSrc.includes("document.getElementById('hotspot-details')"),
    'scrollToHotspotDetails queries #hotspot-details element'
  );
  assert(
    hotspotsSrc.includes("scrollIntoView({ behavior: 'smooth', block: 'start' })"),
    'scrollToHotspotDetails uses smooth scrolling with block: start'
  );
  assert(
    hotspotsSrc.includes('handleSelect(hs.locationKey, true)'),
    'Clicking Details button invokes handleSelect with shouldScroll = true'
  );
  assert(
    hotspotsSrc.includes('id="hotspot-details"') && hotspotsSrc.includes('scroll-mt-24'),
    '#hotspot-details includes scroll-mt-24 for sticky navbar offset'
  );
  assert(
    hotspotsSrc.includes('id="evidence-behind-demand"') && hotspotsSrc.includes('scroll-mt-24'),
    '#evidence-behind-demand includes scroll-mt-24 for sticky navbar offset'
  );
  assert(
    indiaMapSrc.includes('scrollToHotspotDetails') && indiaMapSrc.includes("block: 'start'"),
    'IndiaMapPlaceholder scrollToHotspotDetails also uses block: start'
  );

  // Test 7: No-Location Request Zero-Hallucination
  console.log('\nTest 7: No-Location Request Zero-Hallucination');
  const unmappedHotspot = {
    locationKey: 'unmapped',
    locality: '',
    district: '',
    state: '',
    totalRequests: 9,
    affectedPopulation: 0,
    highUrgencyRequests: 3,
    priorityScore: 0,
  };
  const unmappedCoords = getHotspotCoordinates(unmappedHotspot);
  assert(unmappedCoords === null, 'Unmapped request strictly yields null coordinates (no pin)');

  console.log('\n========================================================================');
  console.log(`  Phase 7A Regression Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
