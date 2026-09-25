import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

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

const BASE_URL = 'http://localhost:3000';

function getDb() {
  if (getApps().length > 0) {
    return getFirestore();
  }
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local not found');
  }
  const env = {};
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  });
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: (env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
  return getFirestore();
}

async function runVoiceTests() {
  console.log('\n=== JanSetu AI — Phase 5: Voice & Data Model Test Suite ===\n');

  // Test 1: Voice Transcribe Kannada Benchmark
  console.log('Test 1: Voice Transcription — Kannada Benchmark');
  let kannadaResult = null;
  {
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleKey: 'kannada_irrigation' }),
    });

    assert(res.status === 200, `Returns HTTP 200 (got ${res.status})`);
    const data = await res.json();
    assert(data.success === true, 'Response contains success: true');
    assert(data.detectedLanguage === 'Kannada', `Detected language is Kannada (got ${data.detectedLanguage})`);
    assert(typeof data.originalTranscript === 'string' && data.originalTranscript.includes('ಕಾರ್ಕಳ'), 'Original transcript preserves Kannada script');
    assert(typeof data.translatedText === 'string' && data.translatedText.includes('Karkala'), 'Translated text provides accurate English');

    kannadaResult = data;
  }

  // Test 2: Voice Transcribe Hindi Benchmark
  console.log('\nTest 2: Voice Transcription — Hindi Benchmark');
  {
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleKey: 'hindi_road' }),
    });

    assert(res.status === 200, `Returns HTTP 200 (got ${res.status})`);
    const data = await res.json();
    assert(data.success === true, 'Response contains success: true');
    assert(data.detectedLanguage === 'Hindi', `Detected language is Hindi (got ${data.detectedLanguage})`);
    assert(typeof data.originalTranscript === 'string' && data.originalTranscript.includes('सड़क'), 'Original transcript preserves Hindi Devanagari script');
    assert(typeof data.translatedText === 'string' && data.translatedText.includes('road'), 'Translated text provides English translation');
  }

  // Test 3: Voice Transcribe English Benchmark
  console.log('\nTest 3: Voice Transcription — English Benchmark');
  {
    const res = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleKey: 'english_drainage' }),
    });

    assert(res.status === 200, `Returns HTTP 200 (got ${res.status})`);
    const data = await res.json();
    assert(data.detectedLanguage === 'English', `Detected language is English (got ${data.detectedLanguage})`);
    assert(data.originalTranscript.includes('drain'), 'English transcript contains key civic term');
  }

  // Test 4: Voice Transcribe Validation
  console.log('\nTest 4: Voice Transcribe Validation (Missing payload & Unknown sample)');
  {
    const resEmpty = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(resEmpty.status === 400, `Empty request returns 400 (got ${resEmpty.status})`);

    const resUnknown = await fetch(`${BASE_URL}/api/voice/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sampleKey: 'non_existent_key' }),
    });
    assert(resUnknown.status >= 400, `Unknown sampleKey returns error status (got ${resUnknown.status})`);
  }

  // Test 5: Ingest Voice Complaint through Existing Analysis Pipeline
  console.log('\nTest 5: Pipeline Ingestion with sourceType: "voice"');
  let voiceRequestId = null;
  {
    let res = null;
    let data = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`${BASE_URL}/api/analyze-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: kannadaResult.originalTranscript,
          sourceType: 'voice',
          originalLanguage: kannadaResult.detectedLanguage,
          originalTranscript: kannadaResult.originalTranscript,
          state: 'Karnataka',
          district: 'Udupi',
          locality: 'Karkala',
        }),
      });
      if (res.status === 200) {
        data = await res.json();
        break;
      }
      if (attempt < 2) {
        console.log(`    ⚠️ Retry attempt ${attempt + 1} after HTTP ${res.status} (waiting 6s)...`);
        await new Promise((r) => setTimeout(r, 6000));
      }
    }

    assert(res && res.status === 200, `Returns HTTP 200 (got ${res?.status})`);
    assert(data && data.success === true, 'Analysis succeeded');
    assert(data && data.sourceType === 'voice', `Returned sourceType is "voice" (got ${data?.sourceType})`);
    assert(typeof data?.requestId === 'string' && data.requestId.startsWith('JNS-'), `Valid tracking ID generated: ${data?.requestId}`);

    voiceRequestId = data?.requestId;
  }

  // Test 6: Ingest Regular Text Complaint without breaking existing pipeline
  console.log('\nTest 6: Existing Pipeline Integrity (sourceType defaults to "text")');
  let textRequestId = null;
  {
    let res = null;
    let data = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(`${BASE_URL}/api/analyze-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: 'Street lights in Ward 4 are broken causing public safety issues at night.',
        }),
      });
      if (res.status === 200) {
        data = await res.json();
        break;
      }
      if (attempt < 2) {
        console.log(`    ⚠️ Retry attempt ${attempt + 1} after HTTP ${res.status} (waiting 6s)...`);
        await new Promise((r) => setTimeout(r, 6000));
      }
    }

    assert(res && res.status === 200, `Returns HTTP 200 (got ${res?.status})`);
    assert(data && data.success === true, 'Text complaint analysis succeeded');
    assert(data && data.sourceType === 'text', `Returned sourceType is "text" (got ${data?.sourceType})`);

    textRequestId = data?.requestId;
  }

  // Test 7: Verify Firestore Persistence of Voice and Text Documents
  console.log('\nTest 7: Firestore Document Schema Verification');
  try {
    const db = getDb();
    if (voiceRequestId) {
      const voiceQuery = await db.collection('citizen_requests').where('requestId', '==', voiceRequestId).limit(1).get();
      assert(!voiceQuery.empty, `Found voice document ${voiceRequestId} in Firestore`);
      if (!voiceQuery.empty) {
        const voiceDoc = voiceQuery.docs[0].data();
        assert(voiceDoc.sourceType === 'voice', `Document has sourceType === "voice" (got ${voiceDoc.sourceType})`);
        assert(voiceDoc.originalLanguage === 'Kannada', `Document has originalLanguage === "Kannada" (got ${voiceDoc.originalLanguage})`);
        assert(typeof voiceDoc.originalTranscript === 'string' && voiceDoc.originalTranscript.length > 10, 'Document has non-empty originalTranscript');
        assert(voiceDoc.dataSource === 'citizen_submission', `Document has dataSource === "citizen_submission" (got ${voiceDoc.dataSource})`);
      }
    } else {
      assert(false, 'voiceRequestId was not returned from Test 5');
    }

    if (textRequestId) {
      const textQuery = await db.collection('citizen_requests').where('requestId', '==', textRequestId).limit(1).get();
      assert(!textQuery.empty, `Found text document ${textRequestId} in Firestore`);
      if (!textQuery.empty) {
        const textDoc = textQuery.docs[0].data();
        assert(textDoc.sourceType === 'text', `Document has sourceType === "text" (got ${textDoc.sourceType})`);
      }
    } else {
      assert(false, 'textRequestId was not returned from Test 6');
    }
  } catch (err) {
    console.error('Firestore check error:', err);
    assert(false, `Firestore check encountered error: ${err.message}`);
  }

  console.log(`\n=== Voice & Data Model Tests: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runVoiceTests().catch((err) => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
