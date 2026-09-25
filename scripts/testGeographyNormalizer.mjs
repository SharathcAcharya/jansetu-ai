import { 
  normalizeGeography, 
  normalizeLocationKey, 
  computeGeographyDocId, 
  normalizeStateName, 
  normalizeDistrictName, 
  normalizeLocalityName, 
  matchGeography 
} from '../src/lib/geographyNormalizer.ts';

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
  console.log('\n=== JanSetu AI — Phase 6A: Geography Normalizer & Matching Test Suite ===\n');

  // Test 1: Bengaluru / Bangalore alias normalization & display name preservation
  console.log('Test 1: Bengaluru / Bangalore Normalization');
  {
    const fromBangalore = normalizeDistrictName('Bangalore', 'Karnataka');
    const fromBengaluru = normalizeDistrictName('Bengaluru', 'Karnataka');
    const fromBangaloreUrban = normalizeDistrictName('Bangalore Urban District', 'Karnataka');

    assert(fromBangalore.canonical === 'Bengaluru', 'Bangalore resolves to canonical "Bengaluru"');
    assert(fromBengaluru.canonical === 'Bengaluru', 'Bengaluru resolves to canonical "Bengaluru"');
    assert(fromBangaloreUrban.canonical === 'Bengaluru', 'Bangalore Urban District resolves to canonical "Bengaluru"');
    assert(fromBangalore.normalized === 'bengaluru', 'Bangalore normalized is "bengaluru"');
    assert(fromBengaluru.normalized === 'bengaluru', 'Bengaluru normalized is "bengaluru"');
    assert(fromBangalore.normalized === fromBengaluru.normalized, 'Bangalore and Bengaluru share identical normalized identity');
  }

  // Test 2: Udupi / Udipi alias normalization & display name preservation
  console.log('\nTest 2: Udupi / Udipi Normalization');
  {
    const fromUdupi = normalizeDistrictName('Udupi');
    const fromUdipi = normalizeDistrictName('Udipi');
    const fromUdipiDist = normalizeDistrictName('Udipi District');

    assert(fromUdupi.canonical === 'Udupi', 'Udupi canonical is "Udupi"');
    assert(fromUdipi.canonical === 'Udupi', 'Udipi resolves to canonical "Udupi"');
    assert(fromUdipiDist.canonical === 'Udupi', 'Udipi District resolves to canonical "Udupi"');
    assert(fromUdupi.normalized === 'udupi', 'Udupi normalized is "udupi"');
    assert(fromUdipi.normalized === 'udupi', 'Udipi normalized is "udupi"');
  }

  // Test 3: Karkal / Karkala alias normalization
  console.log('\nTest 3: Karkal / Karkala Normalization');
  {
    const fromKarkala = normalizeLocalityName('Karkala');
    const fromKarkal = normalizeLocalityName('Karkal');
    const fromKarkalTaluk = normalizeLocalityName('Karkal Taluk');

    assert(fromKarkala.canonical === 'Karkala', 'Karkala canonical is "Karkala"');
    assert(fromKarkal.canonical === 'Karkala', 'Karkal resolves to canonical "Karkala"');
    assert(fromKarkalTaluk.canonical === 'Karkala', 'Karkal Taluk resolves to canonical "Karkala"');
    assert(fromKarkala.normalized === 'karkala', 'Karkala normalized is "karkala"');
    assert(fromKarkal.normalized === 'karkala', 'Karkal normalized is "karkala"');
  }

  // Test 4: Whitespace and case normalization
  console.log('\nTest 4: Whitespace and Case Normalization');
  {
    const dirtyLoc = normalizeLocalityName('   kArKaLa   ');
    const dirtyDist = normalizeDistrictName('   uDuPi   dIsTrIcT   ');
    const dirtyState = normalizeStateName('   kArNaTaKa   ');

    assert(dirtyLoc.canonical === 'Karkala', 'Messy whitespace & case locality yields "Karkala"');
    assert(dirtyDist.canonical === 'Udupi', 'Messy whitespace & case district yields "Udupi"');
    assert(dirtyState.canonical === 'Karnataka', 'Messy whitespace & case state yields "Karnataka"');
    assert(dirtyState.code === 'KA', 'State code resolved to "KA"');
  }

  // Test 5: Punctuation normalization
  console.log('\nTest 5: Punctuation Normalization');
  {
    const punctState = normalizeStateName('U.P.');
    const punctLoc = normalizeLocalityName('Rohania - Ward 7 (Rural)');
    const punctDist = normalizeDistrictName('South Canara / Dakshina Kannada');

    assert(punctState.canonical === 'Uttar Pradesh', '"U.P." punctuation resolves to "Uttar Pradesh"');
    assert(punctLoc.canonical.includes('Rohania'), 'Hyphens & parentheses stripped gracefully');
    assert(punctDist.canonical === 'Dakshina Kannada', 'Slash & alternate naming resolves to "Dakshina Kannada"');
  }

  // Test 6: Location key generation
  console.log('\nTest 6: State / District / Locality Key Generation');
  {
    const fullKey = normalizeLocationKey('Karnataka', 'Udupi District', 'Karkal');
    const distStateKey = normalizeLocationKey('KA', 'Bangalore', '');
    const stateOnlyKey = normalizeLocationKey('Tamilnadu', '', '');

    assert(fullKey === 'Karkala | Udupi | Karnataka', `Full location key formatted properly: "${fullKey}"`);
    assert(distStateKey === 'Bengaluru | Karnataka', `District + State key formatted properly: "${distStateKey}"`);
    assert(stateOnlyKey === 'Tamil Nadu', `State-only key formatted properly: "${stateOnlyKey}"`);
  }

  // Test 7: Deterministic geography document IDs
  console.log('\nTest 7: Deterministic Geography Document IDs');
  {
    const docId1 = computeGeographyDocId('Karnataka', 'Udupi', 'Karkala');
    const docId2 = computeGeographyDocId('  ka  ', '  udipi district  ', '  karkal taluk  ');
    const docIdOther = computeGeographyDocId('Karnataka', 'Bengaluru', 'Whitefield');

    assert(typeof docId1 === 'string' && docId1.length === 64, 'DocId is 64-char hex string (SHA-256)');
    assert(docId1 === docId2, 'Synonyms and messy inputs produce identical deterministic document IDs');
    assert(docId1 !== docIdOther, 'Different geographic locations produce distinct document IDs');
  }

  // Test 8: Locality exact match
  console.log('\nTest 8: Geographic Matching — Locality Exact Match');
  {
    const target = { locality: 'Karkala', district: 'Udupi', state: 'Karnataka' };
    const candidate = { locality: 'Karkal', district: 'Udipi', state: 'KA' };

    const match = matchGeography(target, candidate);
    assert(match.matched === true, 'Matches successfully');
    assert(match.matchedLevel === 'locality', 'matchedLevel is strictly "locality"');
    assert(match.confidence === 1.0, 'Full confidence 1.0 for locality match');
  }

  // Test 9: District fallback (do not treat district match as locality match)
  console.log('\nTest 9: Geographic Matching — District Fallback');
  {
    const target = { locality: 'Karkala', district: 'Udupi', state: 'Karnataka' };
    const candidate = { district: 'Udipi', state: 'Karnataka' }; // No locality in candidate

    const match = matchGeography(target, candidate);
    assert(match.matched === true, 'Matches on district fallback');
    assert(match.matchedLevel === 'district', 'matchedLevel is strictly "district" (NOT locality)');
    assert(match.confidence === 0.75, 'Confidence is 0.75 for district fallback match');
    assert(match.reason.includes('District fallback'), 'Reason explicitly notes district fallback');
  }

  // Test 10: State fallback
  console.log('\nTest 10: Geographic Matching — State Fallback');
  {
    const target = { locality: 'Karkala', district: 'Udupi', state: 'Karnataka' };
    const candidate = { locality: 'Mysuru', district: 'Mysuru', state: 'Karnataka' }; // Different district & locality

    const match = matchGeography(target, candidate);
    assert(match.matched === true, 'Matches on regional state fallback');
    assert(match.matchedLevel === 'state', 'matchedLevel is strictly "state"');
    assert(match.confidence === 0.5, 'Confidence is 0.5 for state fallback');
  }

  // Test 11: No-match behavior (different states)
  console.log('\nTest 11: Geographic Matching — State Mismatch (No Match)');
  {
    const target = { locality: 'Karkala', district: 'Udupi', state: 'Karnataka' };
    const candidate = { locality: 'Karkala', district: 'Udupi', state: 'Kerala' };

    const match = matchGeography(target, candidate);
    assert(match.matched === false, 'State mismatch returns matched: false');
    assert(match.matchedLevel === 'none', 'matchedLevel is "none"');
    assert(match.confidence === 0, 'Confidence is 0 for state mismatch');
    assert(match.reason.includes('State mismatch'), 'Reason specifies state mismatch');
  }

  // Test 12: NormalizedGeography Object Integrity
  console.log('\nTest 12: NormalizedGeography Object Structure');
  {
    const norm = normalizeGeography('Tamilnadu', 'Madras', 'conjeevaram');
    assert(norm.country === 'India', 'Country is strictly "India"');
    assert(norm.state === 'Tamil Nadu', 'State canonicalized to "Tamil Nadu"');
    assert(norm.district === 'Chennai', 'Madras district canonicalized to "Chennai"');
    assert(norm.geographyLevel === 'locality', 'geographyLevel is "locality"');
    assert(norm.locationKey.includes('Tamil Nadu'), 'LocationKey contains state');
    assert(typeof norm.normalizedIdentifier === 'string', 'Has internal normalizedIdentifier');
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
