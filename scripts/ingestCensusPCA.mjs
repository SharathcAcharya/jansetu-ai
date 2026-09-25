/**
 * JanSetu AI — Phase 6D: Real Census PCA 2011 Demographic Ingestion Script
 * 
 * Imports official Primary Census Abstract 2011 demographic data into Firestore:
 * Collection: evidence_demographics
 * Publisher: Office of the Registrar General & Census Commissioner, India (ORGI), MHA
 * Supported Geographies: Karkala, Udupi, Mangaluru, Dakshina Kannada, Karnataka, Chennai, Tamil Nadu
 * 
 * Guards:
 * - Requires explicit --confirm-ingest flag to write to Firestore (defaults to dry-run).
 * - Enforces dataSource: "public_dataset" and isSynthetic: false.
 * - Leaves vulnerableHouseholdsEstimate strictly undefined (never fabricated).
 * - Preserves original census identifiers (originalCensusCode, censusLevel, originalCensusName).
 * - Safely replaces corresponding synthetic demographic records without touching infrastructure/investment data.
 * - Invalidates cached evidence bundles to ensure fresh multi-source synthesis.
 */

import fs from 'fs';
import path from 'path';
import {
  computeGeographyDocId,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';
import {
  validateEvidenceRecord,
} from '../src/lib/evidence/validation.ts';
import { getFirestoreDb } from '../src/lib/firebaseAdmin.ts';
import { DEMOGRAPHIC_COLLECTION } from '../src/lib/evidence/demographicRepository.ts';
import { EVIDENCE_BUNDLE_CACHE_COLLECTION } from '../src/lib/evidence/evidenceBundleCache.ts';

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

// Configurable allowlist of geographic targets for controlled demonstration ingestion
export const CENSUS_INGEST_TARGETS = [
  { state: 'Karnataka', district: 'Udupi', locality: 'Karkala' },
  { state: 'Karnataka', district: 'Udupi' },
  { state: 'Karnataka', district: 'Dakshina Kannada', locality: 'Mangaluru' },
  { state: 'Karnataka', district: 'Dakshina Kannada' },
  { state: 'Karnataka' },
  { state: 'Tamil Nadu', district: 'Chennai' },
  { state: 'Tamil Nadu' },
];

/**
 * Validates and derives Census PCA demographic metrics from raw census columns.
 * Zero fabrication: vulnerableHouseholdsEstimate is left undefined.
 */
export function deriveDemographicData(row) {
  const totP = Number(row.TOT_P);
  const totM = Number(row.TOT_M);
  const totF = Number(row.TOT_F);
  const p06 = Number(row.P_06 || 0);
  const f06 = Number(row.F_06 || 0);
  const pLit = Number(row.P_LIT || 0);
  const fLit = Number(row.F_LIT || 0);
  const pSc = Number(row.P_SC || 0);
  const pSt = Number(row.P_ST || 0);
  const noHh = Number(row.No_HH || 0);
  const totWorkP = Number(row.TOT_WORK_P || 0);

  const mainCl = Number(row.MAIN_CL_P || 0);
  const mainAl = Number(row.MAIN_AL_P || 0);
  const margCl = Number(row.MARG_CL_P || 0);
  const margAl = Number(row.MARG_AL_P || 0);
  const totalAgri = mainCl + mainAl + margCl + margAl;

  // Basic sanity validation
  if (!totP || totP <= 0 || isNaN(totP)) {
    throw new Error(`Invalid or missing TOT_P (${row.TOT_P})`);
  }

  // Derived: Sex Ratio (Females per 1000 Males)
  const sexRatio = totM > 0 ? Math.round((totF / totM) * 1000) : 0;

  // Derived: Effective Literacy Rate (excl. 0-6 age group per Census convention)
  const effectivePop = totP - p06;
  const overallLiteracyRatePercent = effectivePop > 0
    ? Number(Math.min(100, Math.max(0, (pLit / effectivePop) * 100)).toFixed(2))
    : 0;

  // Derived: Female Effective Literacy Rate
  const effectiveFemales = totF - f06;
  const femaleLiteracyRatePercent = effectiveFemales > 0
    ? Number(Math.min(100, Math.max(0, (fLit / effectiveFemales) * 100)).toFixed(2))
    : 0;

  // Derived: Scheduled Caste Percentage
  const scheduledCastePopulationPercent = Number(
    Math.min(100, Math.max(0, (pSc / totP) * 100)).toFixed(2)
  );

  // Derived: Scheduled Tribe Percentage
  const scheduledTribePopulationPercent = Number(
    Math.min(100, Math.max(0, (pSt / totP) * 100)).toFixed(2)
  );

  // Derived: Agricultural Workers Percentage
  const agriculturalWorkersPercent = totWorkP > 0
    ? Number(Math.min(100, Math.max(0, (totalAgri / totWorkP) * 100)).toFixed(2))
    : 0;

  return {
    totalPopulation: totP,
    householdCount: noHh,
    sexRatioFemalesPer1000Males: sexRatio,
    overallLiteracyRatePercent,
    femaleLiteracyRatePercent,
    scheduledCastePopulationPercent,
    scheduledTribePopulationPercent,
    agriculturalWorkersPercent,
    // CRITICAL: vulnerableHouseholdsEstimate is strictly undefined (never fabricated)
    vulnerableHouseholdsEstimate: undefined,
    demographicSourceNote:
      'Official Primary Census Abstract 2011, Office of the Registrar General & Census Commissioner, India — Historical Baseline',
  };
}

/**
 * Builds a validated DemographicEvidence record from a raw Census row.
 */
export function buildDemographicEvidenceRecord(row) {
  // Map State code to name
  let stateName = row.Name;
  let distName = undefined;
  let locName = undefined;

  if (row.Level === 'STATE') {
    stateName = row.Name === 'KARNATAKA' ? 'Karnataka' : row.Name === 'TAMIL NADU' ? 'Tamil Nadu' : row.Name;
  } else if (row.Level === 'DISTRICT') {
    stateName = row.State === '29' ? 'Karnataka' : row.State === '33' ? 'Tamil Nadu' : 'India';
    distName = row.Name;
  } else if (row.Level === 'TOWN' || row.Level === 'SUB-DISTRICT') {
    stateName = row.State === '29' ? 'Karnataka' : row.State === '33' ? 'Tamil Nadu' : 'India';
    distName = row.District === '569' ? 'Udupi' : row.District === '575' ? 'Dakshina Kannada' : undefined;
    locName = row.Name.replace(/\s*\(M Corp\.\s*\+\s*OG\)\s*/i, '').replace(/\s*\(TMC\)\s*/i, '').trim();
  }

  const norm = normalizeGeography(stateName, distName, locName);
  const data = deriveDemographicData(row);
  const nowIso = new Date().toISOString();

  const originalCensusCode = row.Town_Village && row.Town_Village !== '000000'
    ? row.Town_Village
    : (row.District && row.District !== '000' ? row.District : row.State);

  const sourceId = `CENSUS-PCA-2011-${norm.state.substring(0, 3).toUpperCase()}-${originalCensusCode}`;

  const record = {
    sourceId,
    sourceType: 'demographic_data',
    sourceName: 'Census of India 2011 — Primary Census Abstract',
    sourceUrl: 'https://censusindia.gov.in/',
    sourceReference: 'Primary Census Abstract (PCA) 2011',
    sourceYear: 2011,
    geographyLevel: norm.geographyLevel,
    state: norm.state,
    district: norm.district,
    locality: norm.locality,
    originalCensusCode,
    censusLevel: row.Level,
    originalCensusName: row.Name,
    data,
    dataSource: 'public_dataset',
    isSynthetic: false,
    lastUpdated: nowIso,
    provenance: {
      origin: 'public_dataset',
      publisherName: 'Office of the Registrar General & Census Commissioner, India',
      sourceReference: 'Primary Census Abstract (PCA) 2011',
      sourceUrl: 'https://censusindia.gov.in/',
      retrievalTimestamp: nowIso,
      isSynthetic: false,
      validationMethod: 'manual_curation',
    },
  };

  const validation = validateEvidenceRecord(record);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
  }

  return { record, norm };
}

/**
 * Main ingestion routine.
 */
export async function runIngestion(options = {}) {
  const isConfirmed = options.confirmIngest || process.argv.includes('--confirm-ingest');
  const extractPath = options.extractPath || path.resolve(process.cwd(), 'src/data/census/census_pca_2011_extract.json');

  console.log('\n=============================================================');
  console.log('  JanSetu AI — Phase 6D-1: Census PCA 2011 Ingestion Engine  ');
  console.log('=============================================================\n');
  console.log(`Mode: ${isConfirmed ? 'LIVE FIRESTORE COMMIT (--confirm-ingest active)' : 'DRY-RUN (Safe validation only, no writes)'}`);
  console.log(`Source File: ${extractPath}\n`);

  if (!fs.existsSync(extractPath)) {
    throw new Error(`Census PCA extract file not found at: ${extractPath}`);
  }

  const rawJson = JSON.parse(fs.readFileSync(extractPath, 'utf-8'));
  const rows = rawJson.records || [];

  let recordsRead = rows.length;
  let recordsAccepted = 0;
  let recordsRejected = 0;
  let recordsWritten = 0;
  let recordsReplacedFromSynthetic = 0;
  const acceptedGeographies = [];
  const rejectionReasons = [];

  const preparedRecords = [];

  for (const row of rows) {
    try {
      const { record, norm } = buildDemographicEvidenceRecord(row);
      recordsAccepted++;
      acceptedGeographies.push(`${norm.locationKey} (${record.geographyLevel})`);
      preparedRecords.push({ record, norm });
    } catch (err) {
      recordsRejected++;
      rejectionReasons.push(`Row "${row.Name || 'Unknown'}": ${err.message}`);
    }
  }

  if (isConfirmed && preparedRecords.length > 0) {
    const db = getFirestoreDb();
    const demoCol = db.collection(DEMOGRAPHIC_COLLECTION);
    const cacheCol = db.collection(EVIDENCE_BUNDLE_CACHE_COLLECTION);

    for (const { record, norm } of preparedRecords) {
      const docId = computeGeographyDocId(norm.state, norm.district, norm.locality);
      const existingDoc = await demoCol.doc(docId).get();

      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        if (existingData?.dataSource === 'synthetic_demo') {
          recordsReplacedFromSynthetic++;
        }
      }

      // Clean undefined fields for Firestore serialization
      const cleanRecord = JSON.parse(JSON.stringify(record));
      await demoCol.doc(docId).set(cleanRecord);
      recordsWritten++;

      // Invalidate any existing cached bundle for this geography so fresh synthesis reflects official Census
      try {
        await cacheCol.doc(docId).delete();
      } catch (_) {
        // Cache entry may not exist, safe to ignore
      }
    }
  }

  // Ingestion Summary Report
  console.log('\n---------------- INGESTION AUDIT REPORT ----------------');
  console.log(`Source: Census PCA 2011 (ORGI, Ministry of Home Affairs)`);
  console.log(`Records read: ${recordsRead}`);
  console.log(`Records accepted: ${recordsAccepted}`);
  console.log(`Records rejected: ${recordsRejected}`);
  console.log(`Records written: ${recordsWritten} ${!isConfirmed ? '(Dry-run, 0 written)' : ''}`);
  console.log(`Records replaced from synthetic: ${recordsReplacedFromSynthetic}`);
  console.log('\nAccepted Geographies:');
  acceptedGeographies.forEach((g) => console.log(`  ✓ ${g}`));

  if (recordsRejected > 0) {
    console.log('\nRejections:');
    rejectionReasons.forEach((r) => console.log(`  ✗ ${r}`));
  }

  console.log('--------------------------------------------------------\n');

  return {
    recordsRead,
    recordsAccepted,
    recordsRejected,
    recordsWritten,
    recordsReplacedFromSynthetic,
    acceptedGeographies,
    rejectionReasons,
  };
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('ingestCensusPCA.mjs')) {
  runIngestion()
    .then(() => {
      console.log('Ingestion script execution completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal ingestion error:', err);
      process.exit(1);
    });
}
