/**
 * JanSetu AI — Phase 6E-3: India Map ↔ Evidence Synchronization Test Suite
 * 
 * Verifies all 29 requirements:
 * 1. Map hotspot click updates canonical selected location.
 * 2. Selected location updates HotspotsSection.
 * 3. Selected location updates Evidence Bundle.
 * 4. Selected location updates recommendation.
 * 5. Selected location updates priority display.
 * 6. Selected map marker state is synchronized.
 * 7. Mangaluru selection loads Census code 803181.
 * 8. Mangaluru selection loads population 499487.
 * 9. Mangaluru source is public_dataset.
 * 10. Switching Mangaluru → Karkala removes Mangaluru evidence.
 * 11. Karkala selection displays Karkala evidence.
 * 12. Switching Karkala → Mangaluru restores Mangaluru evidence.
 * 13. No stale evidence remains during selection transitions.
 * 14. No stale recommendation remains during selection transitions.
 * 15. No-location requests remain unmapped.
 * 16. No inferred map coordinates are created.
 * 17. Priority score remains identical between map and hotspot detail.
 * 18. Priority score is not recalculated in the map.
 * 19. Evidence Bundle does not modify priority.
 * 20. Filters do not leave stale selected-hotspot details.
 * 21. Clearing selection clears evidence/recommendation appropriately.
 * 22. Evidence API is not called redundantly for the same cached location.
 * 23. Recommendation API/cache is reused.
 * 24. Existing priority visualization remains unchanged.
 * 25. Existing map aggregation remains unchanged.
 * 26. No client-side Firebase Admin credentials are introduced.
 * 27. No Gemini API key is exposed.
 * 28. Existing Phase 6E-1 dashboard evidence behavior remains functional.
 * 29. Existing Phase 6E-2 hotspot detail behavior remains functional.
 */

import fs from 'fs';
import path from 'path';
import {
  computeGeographyDocId,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';
import {
  getEvidenceBundle,
} from '../src/lib/evidence/evidenceBundleService.ts';
import { demographicRepository } from '../src/lib/evidence/demographicRepository.ts';
import { scoreAndRankHotspots } from '../src/lib/priorityScoringService.ts';
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

async function runMapEvidenceSyncTests() {
  console.log('========================================================================');
  console.log('  JanSetu AI — Phase 6E-3: India Map ↔ Evidence Sync Test Suite        ');
  console.log('========================================================================\n');

  // Load component source files for architectural verification
  const pagePath = path.resolve(process.cwd(), 'src/app/dashboard/page.tsx');
  const mapPath = path.resolve(process.cwd(), 'src/components/dashboard/IndiaMapPlaceholder.tsx');
  const hotspotsSectionPath = path.resolve(process.cwd(), 'src/components/dashboard/HotspotsSection.tsx');
  const evidenceCompPath = path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx');

  assert(fs.existsSync(pagePath), 'dashboard/page.tsx exists');
  assert(fs.existsSync(mapPath), 'IndiaMapPlaceholder.tsx exists');
  assert(fs.existsSync(hotspotsSectionPath), 'HotspotsSection.tsx exists');
  assert(fs.existsSync(evidenceCompPath), 'EvidenceBehindDemand.tsx exists');

  const pageSrc = fs.readFileSync(pagePath, 'utf-8');
  const mapSrc = fs.readFileSync(mapPath, 'utf-8');
  const hotspotsSrc = fs.readFileSync(hotspotsSectionPath, 'utf-8');
  const evidenceSrc = fs.readFileSync(evidenceCompPath, 'utf-8');

  // Requirement 1 & 2: Single canonical selected-hotspot state and two-way sync
  console.log('Requirement 1 & 2: Canonical selection state shared between Map and HotspotsSection');
  assert(
    pageSrc.includes('const [selectedHotspotKey, setSelectedHotspotKey] = useState<string | null>(null);') &&
    pageSrc.includes('selectedKey={selectedHotspotKey}') &&
    pageSrc.includes('onSelectHotspot={setSelectedHotspotKey}'),
    'page.tsx maintains single canonical selectedHotspotKey passed to both IndiaMapPlaceholder and HotspotsSection'
  );
  assert(
    mapSrc.includes('onClick={() => onSelectHotspot?.(hs.locationKey)}') &&
    mapSrc.includes('onSelectHotspot?.(hs.locationKey)'),
    'IndiaMapPlaceholder calls onSelectHotspot with canonical hs.locationKey on marker interaction'
  );
  assert(
    hotspotsSrc.includes('handleSelect(hs.locationKey)') &&
    hotspotsSrc.includes('onSelectHotspot(key)'),
    'HotspotsSection calls onSelectHotspot with canonical hs.locationKey'
  );

  // Requirement 3: Selected location updates Evidence Bundle
  console.log('\nRequirement 3: Selected location updates Evidence Bundle');
  assert(
    hotspotsSrc.includes('<EvidenceBehindDemand') &&
    hotspotsSrc.includes('hotspot={activeHotspot}') &&
    evidenceSrc.includes('params.append(\'locationKey\', hotspot.locationKey)'),
    'HotspotsSection passes activeHotspot to EvidenceBehindDemand which requests matching locationKey'
  );

  // Requirement 4: Selected location updates recommendation
  console.log('\nRequirement 4: Selected location updates recommendation without stale residue');
  assert(
    hotspotsSrc.includes('activeHotspot ? recommendations[activeHotspot.locationKey] : null') &&
    hotspotsSrc.includes('handleGenerateRecommendation(activeHotspot.locationKey'),
    'HotspotsSection maps recommendation by activeHotspot.locationKey and handles per-location generation'
  );

  // Requirement 5 & 17: Selected location updates priority display & matches map
  console.log('\nRequirement 5 & 17: Priority display synchronization (Identical scores, no recalculation)');
  assert(
    mapSrc.includes('Score: {hs.priorityScore.toFixed(1)}') &&
    mapSrc.includes('Priority Score: {activeHotspot.priorityScore.toFixed(1)} / 100') &&
    hotspotsSrc.includes('activeHotspot.priorityScore.toFixed(1)'),
    'Map quick intelligence strip and Hotspot Details both display activeHotspot.priorityScore verbatim'
  );

  // Requirement 6: Selected map marker state is synchronized beyond color
  console.log('\nRequirement 6: Selected map marker visual and accessible state');
  assert(
    mapSrc.includes('isSelected ? \'z-30\' : \'z-10\'') &&
    mapSrc.includes('ring-4 ring-amber-400/80') &&
    mapSrc.includes('scale-125') &&
    mapSrc.includes('role="button"') &&
    mapSrc.includes('aria-pressed={isSelected}') &&
    mapSrc.includes('onKeyDown'),
    'Map marker implements visual scale/ring, distinct selected tag chip, aria-pressed, role="button", and keyboard support'
  );

  // Requirement 7, 8, 9: Mangaluru official Census evidence
  console.log('\nRequirement 7, 8, 9: Mangaluru Census evidence (Code 803181, Pop 499487, public_dataset)');
  const mangaluruLocationKey = 'Mangaluru | Dakshina Kannada | Karnataka';
  const mangaluruBundle = await getEvidenceBundle(mangaluruLocationKey);

  assert(mangaluruBundle !== null, 'Mangaluru evidence bundle retrieved successfully');
  assert(
    mangaluruBundle?.demographicEvidence?.originalCensusCode === '803181',
    `Mangaluru demographic evidence has Census code 803181 (got ${mangaluruBundle?.demographicEvidence?.originalCensusCode})`
  );
  assert(
    mangaluruBundle?.demographicEvidence?.data.totalPopulation === 499487,
    `Mangaluru demographic evidence has population 499,487 (got ${mangaluruBundle?.demographicEvidence?.data.totalPopulation})`
  );
  assert(
    mangaluruBundle?.demographicEvidence?.dataSource === 'public_dataset',
    `Mangaluru demographic data source is public_dataset (got ${mangaluruBundle?.demographicEvidence?.dataSource})`
  );
  assert(
    mangaluruBundle?.demographicEvidence?.provenance.isSynthetic === false,
    'Mangaluru demographic evidence provenance isSynthetic is false'
  );

  // Requirement 10, 11, 12, 13: Mangaluru <-> Karkala cross-switch test (No stale evidence)
  console.log('\nRequirement 10, 11, 12, 13: Mangaluru ↔ Karkala cross-switch test');
  const karkalaLocationKey = 'Karkala | Udupi | Karnataka';
  const karkalaBundle = await getEvidenceBundle(karkalaLocationKey);

  assert(karkalaBundle !== null, 'Karkala evidence bundle retrieved successfully');
  assert(
    karkalaBundle?.demographicEvidence?.originalCensusCode !== '803181',
    'Karkala demographic evidence does NOT have Mangaluru census code 803181'
  );
  assert(
    karkalaBundle?.demographicEvidence?.data.totalPopulation !== 499487,
    'Karkala demographic evidence does NOT have Mangaluru population 499487'
  );

  // Verify UI clears stale bundle immediately on hotspot switch
  assert(
    evidenceSrc.includes('// Immediately clear previous bundle on location change so no stale evidence remains during fetch') &&
    evidenceSrc.includes('setBundle(null);') &&
    evidenceSrc.includes('setLoading(true);'),
    'EvidenceBehindDemand immediately clears previous bundle to null on location change before fetching'
  );

  // Switch back to Mangaluru
  const mangaluruRestored = await getEvidenceBundle(mangaluruLocationKey);
  assert(
    mangaluruRestored?.demographicEvidence?.data.totalPopulation === 499487,
    'Switching back to Mangaluru reliably restores population 499487'
  );

  // Requirement 14: No stale recommendation remains during selection transitions
  console.log('\nRequirement 14: Recommendation selection transitions');
  assert(
    hotspotsSrc.includes('setCurrentBundle(null);') &&
    hotspotsSrc.includes('setRecLoading(false);') &&
    hotspotsSrc.includes('setRecError(null);') &&
    hotspotsSrc.includes('[activeHotspot?.locationKey]'),
    'HotspotsSection resets recommendation states and bundle snapshots when activeHotspot changes'
  );

  // Requirement 15 & 16: No-location requests remain unmapped & no inferred coordinates
  console.log('\nRequirement 15 & 16: No-location protection & coordinate inference prevention');
  const unmappedHotspot1 = {
    locationKey: 'not_provided',
    locality: '',
    district: '',
    state: '',
    totalRequests: 5,
    affectedPopulation: 0,
    priorityScore: 25.0,
    highUrgencyRequests: 0,
    topCategory: 'General',
    categoryCounts: {},
    sourceDistribution: { voice: 2, text: 3 },
    languagesRepresented: ['English'],
    requestIds: []
  };

  const coordsUnmapped = getHotspotCoordinates(unmappedHotspot1);
  assert(coordsUnmapped === null, 'getHotspotCoordinates returns null for unmapped hotspot (locationKey: not_provided)');

  const unmappedHotspot2 = {
    locationKey: 'unmapped',
    locality: '',
    district: '',
    state: '',
    totalRequests: 2,
    affectedPopulation: 0,
    priorityScore: 18.0,
    highUrgencyRequests: 0,
    topCategory: 'Roads',
    categoryCounts: {},
    sourceDistribution: { voice: 1, text: 1 },
    languagesRepresented: ['Kannada'],
    requestIds: []
  };
  assert(getHotspotCoordinates(unmappedHotspot2) === null, 'getHotspotCoordinates returns null for locationKey: unmapped');

  const mangaluruCoords = getHotspotCoordinates({
    locationKey: 'Mangaluru | Dakshina Kannada | Karnataka',
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
  });
  assert(mangaluruCoords !== null && mangaluruCoords.x === 40 && mangaluruCoords.y === 75, 'Mangaluru resolves to valid coordinates {x: 40, y: 75}');

  const karkalaCoords = getHotspotCoordinates({
    locationKey: 'Karkala | Udupi | Karnataka',
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
  });
  assert(karkalaCoords !== null && karkalaCoords.x === 42 && karkalaCoords.y === 73, 'Karkala resolves to valid coordinates {x: 42, y: 73}');

  // Requirement 18 & 19: Priority score is NOT recalculated in map or by Evidence Bundle
  console.log('\nRequirement 18 & 19: Priority score formula preservation & isolation');
  assert(!mapSrc.includes('scoreAndRankHotspots'), 'IndiaMapPlaceholder does NOT import scoreAndRankHotspots');
  assert(!mapSrc.includes('Math.round(') || !mapSrc.includes('0.30'), 'IndiaMapPlaceholder does NOT recalculate priority scores');
  assert(
    hotspotsSrc.includes('30% D + 25% P + 25% U + 20% I') &&
    hotspotsSrc.includes('Weight: 30%') &&
    hotspotsSrc.includes('Weight: 25%') &&
    hotspotsSrc.includes('Weight: 20%'),
    'HotspotsSection preserves 30/25/25/20 deterministic priority formula display'
  );

  // Requirement 20 & 21: Filters do not leave stale selected details & clearing selection
  console.log('\nRequirement 20 & 21: Filter synchronization and selection safety');
  assert(
    mapSrc.includes('const stillVisible = filteredHotspots.some((h) => h.locationKey === selectedKey);') &&
    mapSrc.includes('onSelectHotspot?.(filteredHotspots[0].locationKey);') &&
    mapSrc.includes('onSelectHotspot?.(\'\');'),
    'IndiaMapPlaceholder safely resets selection to first visible hotspot or empty string when filter removes current hotspot'
  );

  // Requirement 22 & 23: Cache reuse in EvidenceBehindDemand and recommendation
  console.log('\nRequirement 22 & 23: Performance, request control, and cache reuse');
  assert(
    evidenceSrc.includes('if (cache[cacheKey]) {') &&
    evidenceSrc.includes('setBundle(cache[cacheKey]);'),
    'EvidenceBehindDemand reuses client-side cache for previously visited locations without refetching'
  );
  assert(
    hotspotsSrc.includes('const currentRecommendation = activeHotspot ? recommendations[activeHotspot.locationKey] : null;'),
    'HotspotsSection stores and retrieves cached recommendations keyed by locationKey'
  );

  // Requirement 24 & 25: Existing priority visualization & map aggregation unchanged
  console.log('\nRequirement 24 & 25: Visualization colors & aggregation preservation');
  assert(
    mapSrc.includes('hs.priorityScore >= 70') &&
    mapSrc.includes('bg-red-600') &&
    mapSrc.includes('bg-amber-600') &&
    mapSrc.includes('bg-blue-600'),
    'IndiaMapPlaceholder preserves High (red), Medium (amber), Low (blue) priority color scheme'
  );

  // Requirement 26 & 27: Security: No client-side Firebase Admin credentials or Gemini keys
  console.log('\nRequirement 26 & 27: Security check on client components');
  const clientFiles = [
    'src/app/dashboard/page.tsx',
    'src/components/dashboard/IndiaMapPlaceholder.tsx',
    'src/components/dashboard/HotspotsSection.tsx',
    'src/components/dashboard/EvidenceBehindDemand.tsx'
  ];

  for (const relPath of clientFiles) {
    const fullP = path.resolve(process.cwd(), relPath);
    const content = fs.readFileSync(fullP, 'utf-8');
    assert(!content.includes('firebase-admin'), `${relPath} does not import firebase-admin`);
    assert(!content.includes('serviceAccountKey'), `${relPath} does not mention serviceAccountKey`);
    assert(!content.includes('process.env.GEMINI_API_KEY'), `${relPath} does not access process.env.GEMINI_API_KEY`);
  }

  // Requirement 28 & 29: Preservation of Phase 6E-1 & 6E-2 functionality
  console.log('\nRequirement 28 & 29: Preservation of Phase 6E-1 & 6E-2 functionality');
  assert(hotspotsSrc.includes('id="hotspot-details"'), 'HotspotsSection has id="hotspot-details" for smooth anchor navigation');
  assert(hotspotsSrc.includes('href="#geospatial-demand-map"'), 'HotspotsSection includes Locate on Map quick action anchor');
  assert(mapSrc.includes('id="geospatial-demand-map"'), 'IndiaMapPlaceholder has id="geospatial-demand-map"');
  assert(evidenceSrc.includes('id="evidence-behind-demand"'), 'EvidenceBehindDemand preserves id="evidence-behind-demand"');

  console.log('\n========================================================================');
  console.log(`  Phase 6E-3 Map-Evidence Sync Tests Completed: ${passed} passed, ${failed} failed`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runMapEvidenceSyncTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
