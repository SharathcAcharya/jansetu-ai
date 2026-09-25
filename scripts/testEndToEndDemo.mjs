/**
 * JanSetu AI — Phase 6E-4: End-to-End Demo Scenarios & System Validation
 * 
 * Validates the five core demo scenarios:
 * 1. Scenario 1 — Mangaluru Text Complaint (Citizen intake -> Gemini -> Firestore -> Hotspots -> Census 2011 -> Recommendation)
 * 2. Scenario 2 — Karkala Voice Complaint (Multilingual voice -> Transcription -> Translation -> Hotspot -> Map -> Evidence)
 * 3. Scenario 3 — No-Location Citizen Complaint (Location omission protection -> Unmapped counting -> No artificial coordinates)
 * 4. Scenario 4 — Evidence Conflict (Neutral side-by-side discrepancy surfacing -> Neither source overwritten)
 * 5. Scenario 5 — Synthetic Data Transparency (Strict provenance tags across citizen, public, and demo records)
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  normalizeGeography,
  computeGeographyDocId,
} from '../src/lib/geographyNormalizer.ts';
import {
  getEvidenceBundle,
  detectEvidenceConflicts,
} from '../src/lib/evidence/evidenceBundleService.ts';
import { getHotspotCoordinates } from '../src/components/dashboard/IndiaMapPlaceholder.tsx';

// Load .env.local
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

function getDb() {
  if (getApps().length > 0) {
    return getFirestore();
  }
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
  return getFirestore();
}

const BASE_URL = 'http://localhost:3000';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    console.log(`    ✓ ${message}`);
    passedAssertions++;
  } else {
    console.error(`    ✗ FAIL: ${message}`);
    failedAssertions++;
  }
}

async function runEndToEndDemoValidation() {
  console.log('==================================================');
  console.log('JANSETU AI — END-TO-END DEMO VALIDATION');
  console.log('==================================================\n');

  const demoRunId = `demo-6e4-${Date.now()}`;
  const scenarioResults = {
    s1: false,
    s2: false,
    s3: false,
    s4: false,
    s5: false,
  };

  const db = getDb();

  // =========================================================================
  // SCENARIO 1 — MANGALURU TEXT COMPLAINT
  // =========================================================================
  console.log('--------------------------------------------------');
  console.log('SCENARIO 1 — MANGALURU TEXT COMPLAINT');
  console.log('--------------------------------------------------');
  try {
    const s1Complaint = "Several residential areas in Mangaluru are facing repeated waterlogging during heavy rain. Residents are concerned about blocked stormwater drains and poor drainage near major roads. Around 300 households are affected.";

    console.log('  1. Ingesting realistic citizen text complaint for Mangaluru...');
    const ingestRes = await fetch(`${BASE_URL}/api/analyze-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint: s1Complaint,
        selectedLanguage: 'English',
        sourceType: 'text',
        demoRunId,
      }),
    });

    assert(ingestRes.status === 200, `Intake API returned HTTP 200 (got ${ingestRes.status})`);
    const ingestJson = await ingestRes.json();
    assert(ingestJson.success === true, 'Complaint intake and analysis succeeded');
    assert(typeof ingestJson.requestId === 'string' && ingestJson.requestId.startsWith('JNS-'), `Valid tracking ID assigned: ${ingestJson.requestId}`);

    const extracted = ingestJson.data;
    assert(extracted.locality.toLowerCase().includes('mangaluru') || extracted.locality.toLowerCase().includes('mangalore'), `Locality extracted as Mangaluru (got "${extracted.locality}")`);
    assert(extracted.location_source === 'citizen_provided', `location_source is citizen_provided (got "${extracted.location_source}")`);
    assert(extracted.location_confidence === 'high', `location_confidence is high (got "${extracted.location_confidence}")`);

    // Verify Firestore persistence
    console.log('  2. Verifying Firestore citizen_requests persistence...');
    const docSnap = await db.collection('citizen_requests').doc(ingestJson.firestoreDocId).get();
    assert(docSnap.exists, `Document ${ingestJson.firestoreDocId} exists in Firestore`);
    const docData = docSnap.data();
    assert(docData.dataSource === 'citizen_submission', `Stored with dataSource = "citizen_submission" (got "${docData.dataSource}")`);
    assert(docData.demoRunId === demoRunId, `Demo run identifier tagged: ${docData.demoRunId}`);
    assert(docData.sourceType === 'text', `sourceType is "text" (got "${docData.sourceType}")`);

    // Verify Geography normalization
    console.log('  3. Verifying Geographic normalization to Karnataka & Dakshina Kannada...');
    const norm = normalizeGeography(extracted.state, extracted.district, extracted.locality);
    assert(norm.locality === 'Mangaluru', `Locality canonicalized to "Mangaluru" (got "${norm.locality}")`);
    assert(norm.district === 'Dakshina Kannada', `District resolved to "Dakshina Kannada" (got "${norm.district}")`);
    assert(norm.state === 'Karnataka', `State resolved to "Karnataka" (got "${norm.state}")`);
    assert(norm.locationKey === 'Mangaluru | Dakshina Kannada | Karnataka', `Canonical locationKey is "Mangaluru | Dakshina Kannada | Karnataka"`);

    // Verify Demand Hotspot Inclusion & Priority Scoring
    console.log('  4. Verifying Demand Hotspot intelligence aggregation...');
    const hotspotsRes = await fetch(`${BASE_URL}/api/intelligence/hotspots`);
    assert(hotspotsRes.status === 200, `Hotspots API returned HTTP 200 (got ${hotspotsRes.status})`);
    const hotspotsJson = await hotspotsRes.json();
    assert(hotspotsJson.geographicallyMappedRequests > 0, `geographicallyMappedRequests includes mapped demands (${hotspotsJson.geographicallyMappedRequests})`);

    const mangaluruHotspot = hotspotsJson.hotspots.find((h) => 
      h.locationKey === 'Mangaluru | Dakshina Kannada | Karnataka' || 
      (h.locality && h.locality.toLowerCase().includes('mangaluru'))
    );
    assert(Boolean(mangaluruHotspot), 'Mangaluru hotspot is detected and included in demand intelligence');
    assert(typeof mangaluruHotspot?.priorityScore === 'number' && mangaluruHotspot.priorityScore > 0 && mangaluruHotspot.priorityScore <= 100, `Deterministic priority score calculated: ${mangaluruHotspot?.priorityScore?.toFixed(1)} / 100`);

    // Verify India Map coordinate lookup
    console.log('  5. Verifying India Demand Map coordinate placement...');
    const coords = getHotspotCoordinates(mangaluruHotspot);
    assert(coords !== null, 'Mangaluru hotspot has valid map coordinates');
    assert(coords?.x === 40 && coords?.y === 75, `Coordinates match verified SVG location {x: 40, y: 75} (got {x: ${coords?.x}, y: ${coords?.y}})`);

    // Verify Evidence Bundle & Official Census 2011 Data
    console.log('  6. Verifying Evidence Bundle retrieval and Census PCA 2011 integration...');
    const mangaluruBundle = await getEvidenceBundle('Mangaluru | Dakshina Kannada | Karnataka');
    assert(Boolean(mangaluruBundle), 'Evidence Bundle synthesized for Mangaluru');
    assert(mangaluruBundle.demographicEvidence?.dataSource === 'public_dataset', 'Demographic evidence dataSource is strictly "public_dataset"');
    assert(mangaluruBundle.demographicEvidence?.provenance.isSynthetic === false, 'Demographic evidence is NOT synthetic');
    assert(mangaluruBundle.demographicEvidence?.originalCensusCode === '803181', `Census Town Code is 803181 (got "${mangaluruBundle.demographicEvidence?.originalCensusCode}")`);
    assert(mangaluruBundle.demographicEvidence?.data.totalPopulation === 499487, `Census 2011 Population is exactly 499,487 (got ${mangaluruBundle.demographicEvidence?.data.totalPopulation})`);
    assert(mangaluruBundle.demographicEvidence?.data.householdCount === 115036, `Census 2011 Households is 115,036 (got ${mangaluruBundle.demographicEvidence?.data.householdCount})`);
    assert(mangaluruBundle.demographicEvidence?.data.sexRatioFemalesPer1000Males === 1015, `Sex ratio is 1,015 (got ${mangaluruBundle.demographicEvidence?.data.sexRatioFemalesPer1000Males})`);
    assert(mangaluruBundle.demographicEvidence?.data.overallLiteracyRatePercent === 93.66, `Overall literacy is 93.66% (got ${mangaluruBundle.demographicEvidence?.data.overallLiteracyRatePercent}%)`);
    assert(mangaluruBundle.infrastructureEvidence?.provenance.isSynthetic === true, 'Infrastructure evidence remains clearly marked as synthetic_demo');
    assert(mangaluruBundle.investmentEvidence?.provenance.isSynthetic === true, 'Investment evidence remains clearly marked as synthetic_demo');

    // Verify Gemini AI Recommendation
    console.log('  7. Verifying Gemini AI Development Recommendation generation & caching...');
    const recRes = await fetch(`${BASE_URL}/api/intelligence/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationKey: 'Mangaluru | Dakshina Kannada | Karnataka' }),
    });
    assert(recRes.status === 200, `Recommendation API returned HTTP 200 (got ${recRes.status})`);
    const recJson = await recRes.json();
    assert(typeof recJson.headline === 'string' && recJson.headline.length > 5, `Recommendation headline generated: "${recJson.headline}"`);
    assert(typeof recJson.recommendedIntervention === 'string', 'Recommended intervention is non-empty');
    assert(recJson.generatedBy === 'gemini', 'generatedBy is strictly "gemini"');
    assert(Array.isArray(recJson.limitations) && recJson.limitations.length > 0, 'Advisory limitations and evidence caveats are present');
    assert(!recJson.recommendedIntervention.toLowerCase().includes('official sanction') && !recJson.recommendedIntervention.toLowerCase().includes('guaranteed budget'), 'Recommendation does not fabricate official commitments or budget sanctions');

    scenarioResults.s1 = true;
    console.log('[PASS] Scenario 1 — Mangaluru text complaint\n');
  } catch (err) {
    console.error('Scenario 1 Error:', err);
    console.log('[FAIL] Scenario 1 — Mangaluru text complaint\n');
  }

  // =========================================================================
  // SCENARIO 2 — KARKALA VOICE COMPLAINT
  // =========================================================================
  console.log('--------------------------------------------------');
  console.log('SCENARIO 2 — KARKALA VOICE COMPLAINT');
  console.log('--------------------------------------------------');
  try {
    console.log('  1. Testing Voice Transcription fixture (Kannada Irrigation)...');
    const voiceRes = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleKey: 'kannada_irrigation' }),
    });

    assert(voiceRes.status === 200, `Voice transcription API returned HTTP 200 (got ${voiceRes.status})`);
    const voiceJson = await voiceRes.json();
    assert(voiceJson.success === true, 'Voice transcription succeeded');
    assert(voiceJson.detectedLanguage === 'Kannada', `detectedLanguage is "Kannada" (got "${voiceJson.detectedLanguage}")`);
    assert(typeof voiceJson.originalTranscript === 'string' && voiceJson.originalTranscript.includes('ಕಾರ್ಕಳ'), 'Original transcript preserves Kannada vernacular script');
    assert(typeof voiceJson.translatedText === 'string' && voiceJson.translatedText.includes('Karkala'), 'Translated English text retains locality "Karkala"');

    console.log('  2. Ingesting transcribed voice complaint into pipeline...');
    const voiceIngestRes = await fetch(`${BASE_URL}/api/analyze-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint: voiceJson.translatedText,
        sourceType: 'voice',
        originalLanguage: voiceJson.detectedLanguage,
        originalTranscript: voiceJson.originalTranscript,
        demoRunId,
      }),
    });

    assert(voiceIngestRes.status === 200, `Voice intake returned HTTP 200 (got ${voiceIngestRes.status})`);
    const voiceIngestJson = await voiceIngestRes.json();
    assert(voiceIngestJson.sourceType === 'voice', `Returned sourceType is "voice" (got "${voiceIngestJson.sourceType}")`);

    console.log('  3. Verifying Firestore voice metadata schema...');
    const voiceDocSnap = await db.collection('citizen_requests').doc(voiceIngestJson.firestoreDocId).get();
    assert(voiceDocSnap.exists, 'Voice request document persisted in Firestore');
    const voiceDocData = voiceDocSnap.data();
    assert(voiceDocData.sourceType === 'voice', `Firestore sourceType is strictly "voice" (got "${voiceDocData.sourceType}")`);
    assert(voiceDocData.originalLanguage === 'Kannada', `originalLanguage is strictly "Kannada" (got "${voiceDocData.originalLanguage}")`);
    assert(voiceDocData.originalTranscript.includes('ಕಾರ್ಕಳ'), 'originalTranscript preserves native vernacular script');
    assert(voiceDocData.dataSource === 'citizen_submission', 'dataSource is "citizen_submission"');

    console.log('  4. Verifying Karkala Demand Hotspot and Evidence Bundle...');
    const karkalaBundle = await getEvidenceBundle('Karkala | Udupi | Karnataka');
    assert(Boolean(karkalaBundle), 'Evidence Bundle synthesized for Karkala');
    assert(karkalaBundle.demographicEvidence?.originalCensusCode === '803178', `Karkala Census code is 803178 (got "${karkalaBundle.demographicEvidence?.originalCensusCode}")`);
    assert(karkalaBundle.demographicEvidence?.data.totalPopulation === 25824, `Karkala Census 2011 population is 25,824 (got ${karkalaBundle.demographicEvidence?.data.totalPopulation})`);
    assert(karkalaBundle.demographicEvidence?.dataSource === 'public_dataset', 'Karkala Census evidence is public_dataset');
    assert(karkalaBundle.infrastructureEvidence?.provenance.isSynthetic === true, 'Karkala infrastructure evidence remains synthetic_demo');

    console.log('  5. Verifying Karkala Map coordinate synchronization...');
    const karkalaCoords = getHotspotCoordinates({
      locationKey: 'Karkala | Udupi | Karnataka',
      locality: 'Karkala',
      district: 'Udupi',
      state: 'Karnataka',
      priorityScore: 85,
    });
    assert(karkalaCoords !== null, 'Karkala has valid map coordinates');
    assert(karkalaCoords?.x === 42 && karkalaCoords?.y === 73, `Karkala resolves to {x: 42, y: 73} (got {x: ${karkalaCoords?.x}, y: ${karkalaCoords?.y}})`);

    scenarioResults.s2 = true;
    console.log('[PASS] Scenario 2 — Karkala voice complaint\n');
  } catch (err) {
    console.error('Scenario 2 Error:', err);
    console.log('[FAIL] Scenario 2 — Karkala voice complaint\n');
  }

  // =========================================================================
  // SCENARIO 3 — NO-LOCATION CITIZEN COMPLAINT
  // =========================================================================
  console.log('--------------------------------------------------');
  console.log('SCENARIO 3 — NO-LOCATION PROTECTION');
  console.log('--------------------------------------------------');
  try {
    const s3Complaint = "Farmers are facing severe water shortages for irrigation. The nearest irrigation facility is far away and hundreds of farming families are affected.";

    console.log('  1. Ingesting complaint with no geographic proper names...');
    const noLocRes = await fetch(`${BASE_URL}/api/analyze-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint: s3Complaint,
        selectedLanguage: 'English',
        demoRunId,
      }),
    });

    assert(noLocRes.status === 200, `Intake API returned HTTP 200 (got ${noLocRes.status})`);
    const noLocJson = await noLocRes.json();
    const noLocExtracted = noLocJson.data;

    assert(noLocExtracted.category === 'Agriculture' || noLocExtracted.category === 'Water & Sanitation', `Category classified appropriately (got "${noLocExtracted.category}")`);
    assert(noLocExtracted.locality === '', `locality is empty string "" (got "${noLocExtracted.locality}")`);
    assert(noLocExtracted.district === '', `district is empty string "" (got "${noLocExtracted.district}")`);
    assert(noLocExtracted.state === '', `state is empty string "" (got "${noLocExtracted.state}")`);
    assert(noLocExtracted.location_source === 'not_provided', `location_source is strictly "not_provided" (got "${noLocExtracted.location_source}")`);
    assert(noLocExtracted.location_confidence === 'none', `location_confidence is strictly "none" (got "${noLocExtracted.location_confidence}")`);

    console.log('  2. Verifying Firestore persistence as unmapped request...');
    const noLocDocSnap = await db.collection('citizen_requests').doc(noLocJson.firestoreDocId).get();
    assert(noLocDocSnap.exists, 'Unmapped request persisted in Firestore');
    const noLocDocData = noLocDocSnap.data();
    assert(noLocDocData.locationSource === 'not_provided', 'Firestore locationSource is "not_provided"');
    assert(noLocDocData.locality === '' && noLocDocData.district === '' && noLocDocData.state === '', 'Firestore geographic fields remain empty');

    console.log('  3. Verifying demand aggregation exclusion from geographic hotspots...');
    const hotspotsRes = await fetch(`${BASE_URL}/api/intelligence/hotspots`);
    const hotspotsJson = await hotspotsRes.json();
    assert(hotspotsJson.unmappedRequests > 0, `unmappedRequests counter is incremented (${hotspotsJson.unmappedRequests})`);

    // Verify unmapped hotspot has no map coordinates
    console.log('  4. Verifying coordinate inference prevention (Zero Hallucination)...');
    const unmappedCoords = getHotspotCoordinates({
      locationKey: 'not_provided',
      locality: '',
      district: '',
      state: '',
      priorityScore: 30,
    });
    assert(unmappedCoords === null, 'getHotspotCoordinates strictly returns null for unmapped complaint');

    const evidenceSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx'), 'utf-8');
    assert(
      evidenceSrc.includes('Geographic evidence unavailable — citizen did not provide a location.'),
      'UI explicitly communicates: "Geographic evidence unavailable — citizen did not provide a location."'
    );

    scenarioResults.s3 = true;
    console.log('[PASS] Scenario 3 — No-location protection\n');
  } catch (err) {
    console.error('Scenario 3 Error:', err);
    console.log('[FAIL] Scenario 3 — No-location protection\n');
  }

  // =========================================================================
  // SCENARIO 4 — EVIDENCE CONFLICT
  // =========================================================================
  console.log('--------------------------------------------------');
  console.log('SCENARIO 4 — EVIDENCE CONFLICT');
  console.log('--------------------------------------------------');
  try {
    console.log('  1. Testing neutral discrepancy detection between citizen grievances and operational status...');
    const mockCitizenEvidence = {
      sourceId: 'CITIZEN-TEST-01',
      sourceType: 'citizen_reports',
      sourceName: 'JanSetu Citizen Demand Aggregator',
      sourceReference: 'Live Multi-channel Submissions',
      sourceYear: 2026,
      geographyLevel: 'locality',
      data: {
        totalRequests: 8,
        voiceSubmissions: 5,
        textSubmissions: 3,
        languagesRepresented: ['Kannada', 'English'],
        aggregatedAffectedPopulation: 5000,
        highUrgencyCount: 4,
        citedInfrastructureAssets: ['Karkala Lift Irrigation Pump & Canal'],
        topCategories: [{ category: 'Water & Sanitation', count: 8 }],
        primaryGrievanceSummary: 'Farmers face severe acute water shortage and pump breakdown in Karkala.',
      },
      provenance: {
        origin: 'citizen_submission',
        publisherName: 'JanSetu AI Reporting Pipeline',
        sourceReference: 'Live Submissions',
        retrievalTimestamp: new Date().toISOString(),
        isSynthetic: false,
        validationMethod: 'citizen_verification',
      },
      dataSource: 'citizen_submission',
      lastUpdated: new Date().toISOString(),
    };

    const mockInfraEvidence = {
      sourceId: 'INFRA-TEST-01',
      sourceType: 'infrastructure_data',
      sourceName: 'State Infrastructure GIS Asset Registry',
      sourceReference: 'Irrigation & Public Works Database',
      sourceYear: 2025,
      geographyLevel: 'locality',
      data: {
        pmgsyRoadConnectivityStatus: 'CONNECTED',
        tapWaterCoveragePercent: 78,
        primaryHealthCentresCount: 2,
        powerSupplyReliabilityHoursPerDay: 21,
        criticalDeficits: ['Canal tail-end siltation'],
        surveyedAssets: [
          {
            assetId: 'AST-KARKALA-IRR-01',
            assetName: 'Karkala Lift Irrigation Pump & Canal',
            assetType: 'Irrigation Facility',
            operationalStatus: 'OPERATIONAL',
            conditionRating: 'GOOD',
            lastAuditYear: 2024,
          },
        ],
      },
      provenance: {
        origin: 'synthetic_demo',
        publisherName: 'State Water Resources Department',
        sourceReference: 'Asset Register 2024-25',
        retrievalTimestamp: new Date().toISOString(),
        isSynthetic: true,
        validationMethod: 'synthetic_calibration',
      },
      dataSource: 'synthetic_demo',
      lastUpdated: new Date().toISOString(),
    };

    const conflicts = detectEvidenceConflicts(mockCitizenEvidence, undefined, mockInfraEvidence, undefined);
    assert(conflicts.length > 0, `Evidence discrepancy detected (${conflicts.length} conflict surfaced)`);
    assert(conflicts[0].dimension === 'infrastructure', `Conflict dimension is "infrastructure" (got "${conflicts[0].dimension}")`);
    assert(conflicts[0].severity === 'HIGH', `Conflict severity is "HIGH" (got "${conflicts[0].severity}")`);
    assert(conflicts[0].citizenStatement.includes('Karkala Lift Irrigation Pump & Canal'), 'Citizen statement preserved verbatim');
    assert(conflicts[0].publicRecord.includes('OPERATIONAL'), 'Public record preserved verbatim');

    // Verify neutral wording in UI
    const hotspotsSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/dashboard/HotspotsSection.tsx'), 'utf-8');
    const evidenceCompSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx'), 'utf-8');
    assert(
      evidenceCompSrc.includes('JanSetu AI surfaces discrepancies neutrally for policymaker evaluation. Neither source is overwritten or suppressed.'),
      'Neutral discrepancy principle explicitly rendered: "Neither source is overwritten or suppressed."'
    );

    scenarioResults.s4 = true;
    console.log('[PASS] Scenario 4 — Evidence conflict\n');
  } catch (err) {
    console.error('Scenario 4 Error:', err);
    console.log('[FAIL] Scenario 4 — Evidence conflict\n');
  }

  // =========================================================================
  // SCENARIO 5 — SYNTHETIC DATA TRANSPARENCY
  // =========================================================================
  console.log('--------------------------------------------------');
  console.log('SCENARIO 5 — SYNTHETIC DATA TRANSPARENCY');
  console.log('--------------------------------------------------');
  try {
    console.log('  1. Verifying data provenance contracts across all evidence layers...');
    const mangaluruBundle = await getEvidenceBundle('Mangaluru | Dakshina Kannada | Karnataka', { skipCache: true });

    // Citizen Evidence
    assert(mangaluruBundle.citizenEvidence.dataSource === 'citizen_submission', 'Citizen data has dataSource = "citizen_submission"');
    assert(mangaluruBundle.citizenEvidence.provenance.isSynthetic === false, 'Citizen data has isSynthetic = false');

    // Census PCA 2011
    assert(mangaluruBundle.demographicEvidence?.dataSource === 'public_dataset', 'Census data has dataSource = "public_dataset"');
    assert(mangaluruBundle.demographicEvidence?.provenance.isSynthetic === false, 'Census data has isSynthetic = false');
    assert(mangaluruBundle.demographicEvidence?.sourceYear === 2011, 'Census sourceYear is strictly 2011 (historical baseline)');

    // Infrastructure Demo
    assert(mangaluruBundle.infrastructureEvidence?.dataSource === 'synthetic_demo', 'Infrastructure demo has dataSource = "synthetic_demo"');
    assert(mangaluruBundle.infrastructureEvidence?.provenance.isSynthetic === true, 'Infrastructure demo has isSynthetic = true');

    // Investment Demo
    assert(mangaluruBundle.investmentEvidence?.dataSource === 'synthetic_demo', 'Investment demo has dataSource = "synthetic_demo"');
    assert(mangaluruBundle.investmentEvidence?.provenance.isSynthetic === true, 'Investment demo has isSynthetic = true');

    // UI Badges and Disclaimers
    console.log('  2. Verifying explicit UI transparency badges and banners...');
    const evidenceCompSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/dashboard/EvidenceBehindDemand.tsx'), 'utf-8');
    const pageSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/app/dashboard/page.tsx'), 'utf-8');

    assert(evidenceCompSrc.includes('CITIZEN SUBMISSION'), 'UI renders CITIZEN SUBMISSION badge');
    assert(evidenceCompSrc.includes('PUBLIC DATASET'), 'UI renders PUBLIC DATASET badge');
    assert(evidenceCompSrc.includes('SYNTHETIC DEMO'), 'UI renders SYNTHETIC DEMO badge');
    assert(evidenceCompSrc.includes('HISTORICAL BASELINE'), 'UI renders HISTORICAL BASELINE notice');
    assert(pageSrc.includes('Demo Environment:'), 'Dashboard page displays Demo Environment transparency banner');

    scenarioResults.s5 = true;
    console.log('[PASS] Scenario 5 — Synthetic data provenance\n');
  } catch (err) {
    console.error('Scenario 5 Error:', err);
    console.log('[FAIL] Scenario 5 — Synthetic data provenance\n');
  }

  // =========================================================================
  // FINAL RESULT SUMMARY
  // =========================================================================
  const allScenariosPassed = Object.values(scenarioResults).every(Boolean);
  const passedScenarioCount = Object.values(scenarioResults).filter(Boolean).length;

  console.log('--------------------------------------------------');
  console.log('RESULT');
  console.log('--------------------------------------------------');
  console.log(`Scenarios: ${passedScenarioCount}/5`);
  console.log(`Assertions: ${passedAssertions}/${totalAssertions}`);
  console.log(`Status: ${allScenariosPassed && failedAssertions === 0 ? 'PASS' : 'FAIL'}`);
  console.log('==================================================\n');

  if (!allScenariosPassed || failedAssertions > 0) {
    process.exit(1);
  }
}

runEndToEndDemoValidation().catch((err) => {
  console.error('Fatal Validation Error:', err);
  process.exit(1);
});
