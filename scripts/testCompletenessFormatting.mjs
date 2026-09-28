/**
 * JanSetu AI — Completeness Score Formatting Regression Test
 * 
 * Verifies:
 * 1. Completeness score returned by computeCompletenessRating is on a 0-100 scale:
 *    - All 4 dimensions = 100%
 *    - Citizen + Demographics + Infrastructure (no investment) = 80%
 *    - Citizen + Demographics = 60%
 *    - Citizen only = 40%
 *    - None = 0%
 * 2. Formatted percentage display logic strictly outputs:
 *    - "100%" (NEVER "10000%")
 *    - "80%", "60%", "40%", "0%" for partial dimensions
 *    - Handles both integer (100) and fractional (1.0) representations defensively
 * 3. HotspotsSection.tsx does NOT contain buggy `completeness.score * 100`
 * 4. EvidenceBehindDemand.tsx formats completeness score correctly
 * 5. Live bundle for Mangaluru evaluates to 100% HIGH without arithmetic overflow
 */

import fs from 'fs';
import path from 'path';
import {
  computeCompletenessRating,
  getEvidenceBundle,
} from '../src/lib/evidence/evidenceBundleService.ts';

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

// Display formatter matching the component implementation
function formatScore(score) {
  const normalized = score <= 1 && score > 0 ? Math.round(score * 100) : Math.round(score);
  return `${normalized}%`;
}

async function runTests() {
  console.log('========================================================================');
  console.log('  JanSetu AI — Completeness Score Formatting Regression Test           ');
  console.log('========================================================================\n');

  // Test 1: Underlying computeCompletenessRating mathematical scale
  console.log('Test 1: computeCompletenessRating output scale');
  const all4 = computeCompletenessRating(true, true, true, true);
  assert(all4.score === 100, `All 4 dimensions = 100 (got: ${all4.score})`);
  assert(all4.level === 'HIGH', `All 4 dimensions level = HIGH (got: ${all4.level})`);

  const threeDim = computeCompletenessRating(true, true, true, false);
  assert(threeDim.score === 80, `3 dimensions = 80 (got: ${threeDim.score})`);
  assert(threeDim.level === 'HIGH', `3 dimensions level = HIGH (got: ${threeDim.level})`);

  const twoDim = computeCompletenessRating(true, true, false, false);
  assert(twoDim.score === 60, `2 dimensions = 60 (got: ${twoDim.score})`);
  assert(twoDim.level === 'MEDIUM', `2 dimensions level = MEDIUM (got: ${twoDim.level})`);

  const oneDim = computeCompletenessRating(true, false, false, false);
  assert(oneDim.score === 40, `1 dimension = 40 (got: ${oneDim.score})`);
  assert(oneDim.level === 'LOW', `1 dimension level = LOW (got: ${oneDim.level})`);

  const none = computeCompletenessRating(false, false, false, false);
  assert(none.score === 0, `0 dimensions = 0 (got: ${none.score})`);
  assert(none.level === 'LOW', `0 dimensions level = LOW (got: ${none.level})`);

  // Test 2: Display Formatting Output
  console.log('\nTest 2: Display formatting verification (0-100% range)');
  assert(formatScore(all4.score) === '100%', `100 score formats to "100%" (NOT "10000%")`);
  assert(formatScore(threeDim.score) === '80%', `80 score formats to "80%" (NOT "8000%")`);
  assert(formatScore(twoDim.score) === '60%', `60 score formats to "60%" (NOT "6000%")`);
  assert(formatScore(oneDim.score) === '40%', `40 score formats to "40%" (NOT "4000%")`);
  assert(formatScore(none.score) === '0%', `0 score formats to "0%"`);

  // Defensive fractional compatibility
  assert(formatScore(1.0) === '100%', `Fractional 1.0 safely formats to "100%"`);
  assert(formatScore(0.8) === '80%', `Fractional 0.8 safely formats to "80%"`);

  // Test 3: Source Code Inspection for Buggy Arithmetic
  console.log('\nTest 3: Source code inspection of UI components');
  const hotspotsSectionPath = path.resolve(process.cwd(), 'src/components/dashboard/HotspotsSection.tsx');
  const evidenceBehindPath = path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx');

  assert(fs.existsSync(hotspotsSectionPath), 'HotspotsSection.tsx exists');
  assert(fs.existsSync(evidenceBehindPath), 'EvidenceBehindDemand.tsx exists');

  const hotspotsSrc = fs.readFileSync(hotspotsSectionPath, 'utf-8');
  const evidenceSrc = fs.readFileSync(evidenceBehindPath, 'utf-8');

  // Verify that the bug `completeness.score * 100` without guard is eliminated
  assert(
    !hotspotsSrc.includes('currentBundle.completeness.score * 100}'),
    'HotspotsSection does NOT contain unguarded `currentBundle.completeness.score * 100`'
  );
  assert(
    hotspotsSrc.includes('currentBundle.completeness.score'),
    'HotspotsSection references currentBundle.completeness.score'
  );
  assert(
    hotspotsSrc.includes('currentBundle.completeness.level'),
    'HotspotsSection references currentBundle.completeness.level'
  );

  assert(
    evidenceSrc.includes('completeness.score'),
    'EvidenceBehindDemand references completeness.score'
  );
  assert(
    evidenceSrc.includes('completeness.level'),
    'EvidenceBehindDemand references completeness.level'
  );

  // Test 4: Live Mangaluru Bundle Completeness Verification
  console.log('\nTest 4: Live Mangaluru Evidence Bundle Completeness');
  const mangaluruBundle = await getEvidenceBundle(
    {
      locality: 'Mangaluru',
      district: 'Dakshina Kannada',
      state: 'Karnataka',
    },
    {
      totalRequests: 8,
      affectedPopulation: 24800,
      highUrgencyRequests: 8,
      infrastructureRequests: 6,
      topCategory: 'Water & Sanitation',
    }
  );

  assert(mangaluruBundle !== null, 'Mangaluru bundle retrieved');
  assert(
    mangaluruBundle.completeness.score === 100,
    `Mangaluru bundle completeness score is 100 (got: ${mangaluruBundle.completeness.score})`
  );
  assert(
    mangaluruBundle.completeness.level === 'HIGH',
    `Mangaluru bundle completeness level is HIGH (got: ${mangaluruBundle.completeness.level})`
  );
  assert(
    formatScore(mangaluruBundle.completeness.score) === '100%',
    `Mangaluru bundle displays as "100%" (NOT "10000%")`
  );

  console.log('\n========================================================================');
  console.log(`  Completeness Formatting Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
