import crypto from 'crypto';
import type { GeographyLevel, NormalizedGeography } from '../types/evidence.ts';

// -------------------------------------------------------------
// Types & Result Contracts
// -------------------------------------------------------------
export interface NormalizedComponent {
  canonical: string;       // Formatted for human display (e.g., "Bengaluru", "Karnataka")
  normalized: string;      // Lowercase, stripped identifier for comparison (e.g., "bengaluru")
  code?: string;           // E.g., ISO state code "KA"
  lgdCode?: string;        // Local Government Directory identifier (compatible schema)
  parentState?: string;    // Known parent state if mapped (e.g., "Karnataka")
  parentDistrict?: string; // Known parent district if mapped (e.g., "Dakshina Kannada")
}

export interface GeographicMatchResult {
  matched: boolean;
  matchedLevel: GeographyLevel | 'none';
  locationKey: string;
  confidence: number;      // 0.0 to 1.0
  reason: string;
  targetCanonical: string;
  candidateCanonical: string;
}

// -------------------------------------------------------------
// Explicit Dictionaries & Aliases
// -------------------------------------------------------------

// Indian States and Union Territories with known abbreviations & aliases
const STATE_ALIASES: Record<string, { canonical: string; code: string; aliases: string[] }> = {
  karnataka: { canonical: 'Karnataka', code: 'KA', aliases: ['ka', 'karnatak'] },
  'tamil nadu': { canonical: 'Tamil Nadu', code: 'TN', aliases: ['tn', 'tamilnadu', 'madras state'] },
  'uttar pradesh': { canonical: 'Uttar Pradesh', code: 'UP', aliases: ['up', 'uttarpradesh', 'u.p.'] },
  maharashtra: { canonical: 'Maharashtra', code: 'MH', aliases: ['mh', 'maharashtra state'] },
  rajasthan: { canonical: 'Rajasthan', code: 'RJ', aliases: ['rj', 'rajputana'] },
  kerala: { canonical: 'Kerala', code: 'KL', aliases: ['kl', 'keralam'] },
  delhi: { canonical: 'Delhi', code: 'DL', aliases: ['dl', 'nct of delhi', 'national capital territory of delhi', 'new delhi', 'delhi nct'] },
  bihar: { canonical: 'Bihar', code: 'BR', aliases: ['br'] },
  'west bengal': { canonical: 'West Bengal', code: 'WB', aliases: ['wb', 'bengal', 'paschim banga'] },
  gujarat: { canonical: 'Gujarat', code: 'GJ', aliases: ['gj'] },
  'madhya pradesh': { canonical: 'Madhya Pradesh', code: 'MP', aliases: ['mp', 'm.p.'] },
  'andhra pradesh': { canonical: 'Andhra Pradesh', code: 'AP', aliases: ['ap', 'andhra', 'a.p.'] },
  telangana: { canonical: 'Telangana', code: 'TG', aliases: ['tg', 'ts'] },
  odisha: { canonical: 'Odisha', code: 'OD', aliases: ['od', 'orissa', 'or'] },
  punjab: { canonical: 'Punjab', code: 'PB', aliases: ['pb'] },
  haryana: { canonical: 'Haryana', code: 'HR', aliases: ['hr'] },
  assam: { canonical: 'Assam', code: 'AS', aliases: ['as', 'asom'] },
  jharkhand: { canonical: 'Jharkhand', code: 'JH', aliases: ['jh'] },
  chhattisgarh: { canonical: 'Chhattisgarh', code: 'CG', aliases: ['cg', 'chattisgarh'] },
  uttarakhand: { canonical: 'Uttarakhand', code: 'UK', aliases: ['uk', 'uttaranchal', 'ua'] },
  'himachal pradesh': { canonical: 'Himachal Pradesh', code: 'HP', aliases: ['hp', 'h.p.'] },
  goa: { canonical: 'Goa', code: 'GA', aliases: ['ga'] },
  'jammu and kashmir': { canonical: 'Jammu and Kashmir', code: 'JK', aliases: ['jk', 'j&k', 'jammu & kashmir'] },
  ladakh: { canonical: 'Ladakh', code: 'LA', aliases: ['la'] },
  puducherry: { canonical: 'Puducherry', code: 'PY', aliases: ['py', 'pondicherry'] },
  chandigarh: { canonical: 'Chandigarh', code: 'CH', aliases: ['ch'] },
  tripura: { canonical: 'Tripura', code: 'TR', aliases: ['tr'] },
  meghalaya: { canonical: 'Meghalaya', code: 'ML', aliases: ['ml'] },
  manipur: { canonical: 'Manipur', code: 'MN', aliases: ['mn'] },
  nagaland: { canonical: 'Nagaland', code: 'NL', aliases: ['nl'] },
  mizoram: { canonical: 'Mizoram', code: 'MZ', aliases: ['mz'] },
  sikkim: { canonical: 'Sikkim', code: 'SK', aliases: ['sk'] },
  'arunachal pradesh': { canonical: 'Arunachal Pradesh', code: 'AR', aliases: ['ar'] },
};

// Known explicit district aliases (maintainable, curated map)
const DISTRICT_ALIASES: Record<string, { canonical: string; aliases: string[]; lgdCode?: string }> = {
  udupi: { canonical: 'Udupi', aliases: ['udipi', 'oodipi'] },
  bengaluru: { canonical: 'Bengaluru', aliases: ['bangalore', 'bengaluru urban', 'bangalore urban', 'bangalore city', 'bengaluru city'] },
  'bengaluru rural': { canonical: 'Bengaluru Rural', aliases: ['bangalore rural'] },
  mumbai: { canonical: 'Mumbai', aliases: ['bombay', 'mumbai city'] },
  'mumbai suburban': { canonical: 'Mumbai Suburban', aliases: ['bombay suburban'] },
  pune: { canonical: 'Pune', aliases: ['poona'] },
  varanasi: { canonical: 'Varanasi', aliases: ['banaras', 'benares', 'kashi'] },
  prayagraj: { canonical: 'Prayagraj', aliases: ['allahabad', 'ilhabad'] },
  gurugram: { canonical: 'Gurugram', aliases: ['gurgaon'] },
  vadodara: { canonical: 'Vadodara', aliases: ['baroda'] },
  belagavi: { canonical: 'Belagavi', aliases: ['belgaum'] },
  ballari: { canonical: 'Ballari', aliases: ['bellary'] },
  kalaburagi: { canonical: 'Kalaburagi', aliases: ['gulbarga'] },
  mysuru: { canonical: 'Mysuru', aliases: ['mysore'] },
  shivamogga: { canonical: 'Shivamogga', aliases: ['shimoga'] },
  vijayapura: { canonical: 'Vijayapura', aliases: ['bijapur'] },
  'dakshina kannada': { canonical: 'Dakshina Kannada', aliases: ['south canara', 'south kanara', 'mangaluru district', 'mangalore district'] },
  'uttara kannada': { canonical: 'Uttara Kannada', aliases: ['north canara', 'north kanara', 'karwar'] },
  ernakulam: { canonical: 'Ernakulam', aliases: ['kochi', 'cochin'] },
  kolkata: { canonical: 'Kolkata', aliases: ['calcutta'] },
  chennai: { canonical: 'Chennai', aliases: ['madras', 'madras city'] },
  kanchipuram: { canonical: 'Kanchipuram', aliases: ['kancheepuram', 'conjeevaram'] },
  coimbatore: { canonical: 'Coimbatore', aliases: ['kovai'] },
  tiruchirappalli: { canonical: 'Tiruchirappalli', aliases: ['trichy', 'tiruchi'] },
  puducherry: { canonical: 'Puducherry', aliases: ['pondicherry'] },
  lucknow: { canonical: 'Lucknow', aliases: ['lakhnau'] },
  patna: { canonical: 'Patna', aliases: ['pataliputra'] },
  jaipur: { canonical: 'Jaipur', aliases: ['pink city'] },
  barmer: { canonical: 'Barmer', aliases: ['balmer'] },
  wayanad: { canonical: 'Wayanad', aliases: ['wynad', 'wynaad'] },
};

// Known explicit locality / town / taluk aliases with parent administrative hierarchy
const LOCALITY_ALIASES: Record<string, { canonical: string; aliases: string[]; lgdCode?: string; parentDistrict?: string; parentState?: string }> = {
  karkala: { canonical: 'Karkala', aliases: ['karkal', 'karkal taluk', 'karkala town'], parentDistrict: 'Udupi', parentState: 'Karnataka' },
  bengaluru: { canonical: 'Bengaluru', aliases: ['bangalore', 'bangalore town', 'bengaluru city'], parentDistrict: 'Bengaluru', parentState: 'Karnataka' },
  udupi: { canonical: 'Udupi', aliases: ['udipi', 'udupi town'], parentDistrict: 'Udupi', parentState: 'Karnataka' },
  mangaluru: { canonical: 'Mangaluru', aliases: ['mangalore', 'kudla'], parentDistrict: 'Dakshina Kannada', parentState: 'Karnataka' },
  mysuru: { canonical: 'Mysuru', aliases: ['mysore', 'mysore city'], parentDistrict: 'Mysuru', parentState: 'Karnataka' },
  varanasi: { canonical: 'Varanasi', aliases: ['banaras', 'benares', 'kashi'], parentDistrict: 'Varanasi', parentState: 'Uttar Pradesh' },
  rohania: { canonical: 'Rohania', aliases: ['rohania ward', 'rohania ward 7', 'rohania block'], parentDistrict: 'Varanasi', parentState: 'Uttar Pradesh' },
  meppadi: { canonical: 'Meppadi', aliases: ['meppadi panchayat', 'meppadi gp', 'meppady'], parentDistrict: 'Wayanad', parentState: 'Kerala' },
  sheo: { canonical: 'Sheo', aliases: ['sheo village', 'sheo tehsil', 'shiv'], parentDistrict: 'Barmer', parentState: 'Rajasthan' },
  hinjewadi: { canonical: 'Hinjewadi', aliases: ['hinjawadi', 'hinjewadi phase 1', 'hinjewadi it park'], parentDistrict: 'Pune', parentState: 'Maharashtra' },
};

// Administrative suffixes to strip for canonical matching
const ADMIN_SUFFIXES = [
  'district panchayat',
  'municipal corporation',
  'municipal council',
  'gram panchayat',
  'panchayat',
  'district',
  'taluka',
  'taluk',
  'mandal',
  'tehsil',
  'tahsil',
  'village',
  'block',
  'city',
  'town',
  'dist',
  'dt',
  'tq',
  'gp',
];

// -------------------------------------------------------------
// Normalization Helper Functions
// -------------------------------------------------------------

/**
 * Strips punctuation, collapses whitespace, converts to lowercase.
 * Safely handles single-letter abbreviations (e.g., "U.P." -> "up", "M.P." -> "mp").
 */
function cleanString(input?: string): string {
  if (!input) return '';
  return input
    .replace(/\b([a-zA-Z])\.([a-zA-Z])\.?(\b|$)/g, '$1$2')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()\[\]"?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Capitalizes each word properly for human presentation.
 */
function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Strips trailing administrative suffixes (e.g., "Udupi District" -> "udupi").
 */
function stripAdminSuffixes(input: string): string {
  let cleaned = cleanString(input);
  if (!cleaned) return '';

  for (const suffix of ADMIN_SUFFIXES) {
    const pattern = new RegExp(`\\b${suffix}\\b$`, 'i');
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, '').trim();
      break;
    }
  }
  return cleaned;
}

// -------------------------------------------------------------
// Exported Core Normalization Functions
// -------------------------------------------------------------

/**
 * Normalizes an Indian State name against canonical LGD/ISO standards.
 */
export function normalizeStateName(state: string): NormalizedComponent {
  // Check if multiple slash-delimited alternatives are provided
  if (state.includes('/') || state.includes(';')) {
    const segments = state.split(/[\/;]/).map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      const segRes = normalizeStateName(seg);
      if (STATE_ALIASES[segRes.normalized]) {
        return segRes;
      }
    }
  }

  const cleaned = cleanString(state);
  if (!cleaned) {
    return { canonical: '', normalized: '' };
  }

  // Direct alias check
  for (const [key, entry] of Object.entries(STATE_ALIASES)) {
    if (key === cleaned || entry.aliases.includes(cleaned)) {
      return {
        canonical: entry.canonical,
        normalized: key,
        code: entry.code,
      };
    }
  }

  // Fallback: title-cased string
  const canonical = toTitleCase(cleaned);
  return {
    canonical,
    normalized: cleaned,
  };
}

/**
 * Normalizes an Indian District name against canonical aliases.
 */
export function normalizeDistrictName(district: string, state?: string): NormalizedComponent {
  // Check if multiple slash-delimited alternatives are provided (e.g., "South Canara / Dakshina Kannada")
  if (district.includes('/') || district.includes(';')) {
    const segments = district.split(/[\/;]/).map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      const segRes = normalizeDistrictName(seg, state);
      if (DISTRICT_ALIASES[segRes.normalized]) {
        return segRes;
      }
    }
  }

  const stripped = stripAdminSuffixes(district);
  if (!stripped) {
    return { canonical: '', normalized: '' };
  }

  // Direct alias match
  for (const [key, entry] of Object.entries(DISTRICT_ALIASES)) {
    if (key === stripped || entry.aliases.includes(stripped)) {
      return {
        canonical: entry.canonical,
        normalized: key,
        lgdCode: entry.lgdCode,
      };
    }
  }

  // Fallback
  return {
    canonical: toTitleCase(stripped),
    normalized: stripped,
  };
}

/**
 * Normalizes a Locality, Ward, Taluk, or Village name against canonical aliases.
 */
export function normalizeLocalityName(locality: string): NormalizedComponent {
  // Check if multiple slash-delimited alternatives are provided
  if (locality.includes('/') || locality.includes(';')) {
    const segments = locality.split(/[\/;]/).map((s) => s.trim()).filter(Boolean);
    for (const seg of segments) {
      const segRes = normalizeLocalityName(seg);
      if (LOCALITY_ALIASES[segRes.normalized]) {
        return segRes;
      }
    }
  }

  const stripped = stripAdminSuffixes(locality);
  if (!stripped) {
    return { canonical: '', normalized: '' };
  }

  // Direct alias match
  for (const [key, entry] of Object.entries(LOCALITY_ALIASES)) {
    if (key === stripped || entry.aliases.includes(stripped)) {
      return {
        canonical: entry.canonical,
        normalized: key,
        lgdCode: entry.lgdCode,
        parentDistrict: entry.parentDistrict,
        parentState: entry.parentState,
      };
    }
  }

  // Fallback
  return {
    canonical: toTitleCase(stripped),
    normalized: stripped,
  };
}

/**
 * Builds the canonical compound location key:
 * - Locality + District + State => "Locality | District | State"
 * - Locality + State (no district) => "Locality | State"
 * - District + State (no locality) => "District | State"
 * - State only => "State"
 */
export function normalizeLocationKey(state: string, district?: string, locality?: string): string {
  const normLoc = locality ? normalizeLocalityName(locality) : null;
  const effectiveState = (!state && normLoc?.parentState) ? normLoc.parentState : state;
  const effectiveDistrict = (!district && normLoc?.parentDistrict) ? normLoc.parentDistrict : district;

  const normState = normalizeStateName(effectiveState);
  const normDist = effectiveDistrict ? normalizeDistrictName(effectiveDistrict, effectiveState) : null;

  const parts: string[] = [];
  if (normLoc && normLoc.canonical) parts.push(normLoc.canonical);
  if (normDist && normDist.canonical) parts.push(normDist.canonical);
  if (normState && normState.canonical) parts.push(normState.canonical);

  return parts.join(' | ');
}

/**
 * Computes a deterministic 32-character SHA-256 hexadecimal hash document ID.
 * Standardizes matching across disparate datasets into identical Firestore document keys.
 */
export function computeGeographyDocId(state: string, district?: string, locality?: string): string {
  const normLoc = locality ? normalizeLocalityName(locality) : null;
  const effectiveState = (!state && normLoc?.parentState) ? normLoc.parentState : state;
  const effectiveDistrict = (!district && normLoc?.parentDistrict) ? normLoc.parentDistrict : district;

  const normState = normalizeStateName(effectiveState).normalized;
  const normDist = effectiveDistrict ? normalizeDistrictName(effectiveDistrict, effectiveState).normalized : '';
  const locIdentifier = normLoc ? normLoc.normalized : '';

  const rawKey = `${normState}:${normDist}:${locIdentifier}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Master geographic normalizer: takes raw geographic components and produces
 * a validated, canonical NormalizedGeography structure.
 */
export function normalizeGeography(
  state: string,
  district?: string,
  locality?: string,
  censusLgdCode?: string
): NormalizedGeography {
  const locComp = locality ? normalizeLocalityName(locality) : undefined;
  const effectiveState = (!state && locComp?.parentState) ? locComp.parentState : state;
  const effectiveDistrict = (!district && locComp?.parentDistrict) ? locComp.parentDistrict : district;

  const stateComp = normalizeStateName(effectiveState);
  const distComp = effectiveDistrict ? normalizeDistrictName(effectiveDistrict, effectiveState) : undefined;

  let geographyLevel: GeographyLevel = 'country';
  if (locComp && locComp.canonical) {
    geographyLevel = 'locality';
  } else if (distComp && distComp.canonical) {
    geographyLevel = 'district';
  } else if (stateComp && stateComp.canonical) {
    geographyLevel = 'state';
  }

  const locationKey = normalizeLocationKey(effectiveState, effectiveDistrict, locality);
  const normalizedIdentifier = `${locComp?.normalized || ''}:${distComp?.normalized || ''}:${stateComp.normalized}`;

  return {
    country: 'India',
    state: stateComp.canonical,
    district: distComp?.canonical || undefined,
    locality: locComp?.canonical || undefined,
    locationKey,
    geographyLevel,
    censusLgdCode: censusLgdCode || locComp?.lgdCode || distComp?.lgdCode,
    normalizedIdentifier,
  };
}

/**
 * Hierarchical Geographic Matcher:
 * Compares a candidate location with a target location across the hierarchy:
 * Locality -> District -> State -> Country.
 *
 * Rules:
 * 1. State mismatch ALWAYS returns matched: false, matchedLevel: 'none', confidence: 0.
 * 2. If localities match exactly, returns matchedLevel: 'locality', confidence: 1.0.
 * 3. Does NOT silently treat a district match as a locality match!
 *    If target has a locality but candidate only matches on district, returns matchedLevel: 'district' with confidence: 0.75.
 * 4. If neither matches locality/district but states match, returns matchedLevel: 'state' with confidence: 0.5.
 */
export function matchGeography(
  target: { state: string; district?: string; locality?: string },
  candidate: { state: string; district?: string; locality?: string }
): GeographicMatchResult {
  const targetNorm = normalizeGeography(target.state, target.district, target.locality);
  const candidateNorm = normalizeGeography(candidate.state, candidate.district, candidate.locality);

  const targetStateNorm = normalizeStateName(target.state).normalized;
  const candStateNorm = normalizeStateName(candidate.state).normalized;

  // 1. State must match
  if (!targetStateNorm || !candStateNorm || targetStateNorm !== candStateNorm) {
    return {
      matched: false,
      matchedLevel: 'none',
      locationKey: targetNorm.locationKey,
      confidence: 0,
      reason: `State mismatch: Target state "${targetNorm.state}" does not match candidate state "${candidateNorm.state}".`,
      targetCanonical: targetNorm.locationKey,
      candidateCanonical: candidateNorm.locationKey,
    };
  }

  const targetDistNorm = target.district ? normalizeDistrictName(target.district, target.state).normalized : '';
  const candDistNorm = candidate.district ? normalizeDistrictName(candidate.district, candidate.state).normalized : '';

  const targetLocNorm = target.locality ? normalizeLocalityName(target.locality).normalized : '';
  const candLocNorm = candidate.locality ? normalizeLocalityName(candidate.locality).normalized : '';

  // 2. Locality level comparison
  if (targetLocNorm && candLocNorm) {
    if (targetLocNorm === candLocNorm) {
      // Both localities match
      const distMatches = !targetDistNorm || !candDistNorm || targetDistNorm === candDistNorm;
      return {
        matched: true,
        matchedLevel: 'locality',
        locationKey: targetNorm.locationKey,
        confidence: distMatches ? 1.0 : 0.9,
        reason: `Exact locality match: "${targetNorm.locality}" matches "${candidateNorm.locality}".`,
        targetCanonical: targetNorm.locationKey,
        candidateCanonical: candidateNorm.locationKey,
      };
    }
  }

  // 3. District level comparison (Fallback or explicit district level)
  if (targetDistNorm && candDistNorm && targetDistNorm === candDistNorm) {
    const isTargetLocalitySpecified = Boolean(targetLocNorm);
    const confidence = isTargetLocalitySpecified ? 0.75 : 0.95;
    const reason = isTargetLocalitySpecified
      ? `District fallback: Locality "${targetNorm.locality}" not present in candidate, but District "${targetNorm.district}" matches.`
      : `Exact district match: "${targetNorm.district}" matches "${candidateNorm.district}".`;

    return {
      matched: true,
      matchedLevel: 'district',
      locationKey: targetNorm.locationKey,
      confidence,
      reason,
      targetCanonical: targetNorm.locationKey,
      candidateCanonical: candidateNorm.locationKey,
    };
  }

  // 4. State level fallback
  return {
    matched: true,
    matchedLevel: 'state',
    locationKey: targetNorm.locationKey,
    confidence: 0.5,
    reason: `State fallback: Regional data for "${targetNorm.state}" matched. District and locality are unaligned or unspecified.`,
    targetCanonical: targetNorm.locationKey,
    candidateCanonical: candidateNorm.locationKey,
  };
}
