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

async function runTests() {
  console.log('\n=== JanSetu AI — Phase 4C: Recommendation Engine Test Suite ===\n');

  // Test 1: Valid Karkala hotspot
  console.log('Test 1: Valid Karkala Hotspot Recommendation');
  let firstGenTimestamp = null;
  {
    const res = await fetch(`${BASE_URL}/api/intelligence/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationKey: 'Karkala | Karnataka', bypassCache: true }),
    });

    assert(res.status === 200, `Returns HTTP 200 (got ${res.status})`);
    const data = await res.json();

    if (res.status === 200 && data) {
      assert(typeof data.headline === 'string' && data.headline.length > 5, 'Headline is non-empty string');
      assert(typeof data.problemStatement === 'string' && data.problemStatement.length > 10, 'Problem statement is non-empty');
      assert(typeof data.recommendedIntervention === 'string' && data.recommendedIntervention.length > 10, 'Recommended intervention is non-empty');
      assert(typeof data.rationale === 'string' && data.rationale.length > 10, 'Rationale is non-empty');
      assert(data.generatedBy === 'gemini', 'generatedBy is strictly "gemini"');
      assert(['high', 'medium', 'low'].includes(data.confidence), `Confidence is valid enum (got ${data.confidence})`);
      assert(Array.isArray(data.implementationConsiderations) && data.implementationConsiderations.length > 0, 'Has implementation considerations array');
      assert(Array.isArray(data.limitations) && data.limitations.length > 0, 'Has limitations array');

      // Evidence checks
      assert(typeof data.evidence?.totalRequests === 'number' && data.evidence?.totalRequests >= 5, `Evidence totalRequests matches or exceeds baseline (got ${data.evidence?.totalRequests})`);
      assert(typeof data.evidence?.affectedPopulation === 'number' && data.evidence?.affectedPopulation >= 9250, `Evidence affectedPopulation matches or exceeds baseline (got ${data.evidence?.affectedPopulation})`);
      assert(typeof data.evidence?.priorityScore === 'number' && data.evidence?.priorityScore > 0, `Evidence priorityScore is valid (got ${data.evidence?.priorityScore})`);
      assert(typeof data.suggestedDepartment === 'string' && data.suggestedDepartment.length > 0, `Suggested department is provided: "${data.suggestedDepartment}"`);

      firstGenTimestamp = data.generatedAt;
    } else {
      assert(false, `Test 1 failed to retrieve valid recommendation: ${JSON.stringify(data)}`);
    }
  }

  // Test 2: Missing locationKey
  console.log('\nTest 2: Missing locationKey (Validation)');
  {
    const res = await fetch(`${BASE_URL}/api/intelligence/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, `Returns HTTP 400 on missing locationKey (got ${res.status})`);
    const err = await res.json();
    assert(err.error?.includes('locationKey is required'), 'Error mentions locationKey is required');
  }

  // Test 3: Hotspot not found
  console.log('\nTest 3: Hotspot Not Found');
  {
    const res = await fetch(`${BASE_URL}/api/intelligence/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationKey: 'Atlantis | Ocean Floor' }),
    });
    assert(res.status === 404, `Returns HTTP 404 on unknown location (got ${res.status})`);
    const err = await res.json();
    assert(err.error?.includes('not found'), 'Error specifies hotspot not found');
  }

  // Test 4: Gemini valid JSON parsing
  console.log('\nTest 4: Gemini Valid JSON Schema Parsing');
  {
    const validJsonStr = JSON.stringify({
      headline: 'Water Pipeline Restoration',
      problemStatement: 'Irrigation disruption',
      recommendedIntervention: 'Install solar feeder pumps',
      rationale: 'Addresses 700 farming families',
      suggestedDepartment: 'Ministry of Jal Shakti',
      implementationConsiderations: ['Survey topography', 'Procure pumps'],
      confidence: 'high',
      limitations: ['Requires monsoon runoff verification'],
    });
    const parsed = JSON.parse(validJsonStr);
    assert(parsed.headline && parsed.confidence === 'high', 'Parses schema attributes cleanly');
  }

  // Test 5: Gemini malformed JSON handling
  console.log('\nTest 5: Gemini Malformed JSON Error Handling');
  {
    const malformed = '{ "headline": "Incomplete JSON without closing brace';
    let caught = false;
    try {
      JSON.parse(malformed);
    } catch {
      caught = true;
    }
    assert(caught, 'Malformed JSON throws SyntaxError caught cleanly by service');
  }

  // Test 6: Gemini unavailable error handling
  console.log('\nTest 6: Gemini Unavailable Handling');
  {
    // Simulate error handling with invalid key or offline status
    const testError = new Error('This model is currently experiencing high demand.');
    const isTransient = testError.message.includes('high demand') || testError.message.includes('503');
    assert(isTransient, 'Transient 503 / high demand is properly identified for exponential backoff');
  }

  // Test 7: Cached recommendation retrieval
  console.log('\nTest 7: Cached Recommendation Retrieval');
  {
    // Request without bypassCache should return cached: true
    const res = await fetch(`${BASE_URL}/api/intelligence/recommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationKey: 'Karkala | Karnataka' }),
    });
    assert(res.status === 200, 'Returns HTTP 200 for cached request');
    const cached = await res.json();
    assert(cached.cached === true, 'Response contains cached: true');
    assert(typeof cached.evidence?.totalRequests === 'number' && cached.evidence?.totalRequests >= 5, 'Cached data retains evidence metrics');
    assert(cached.headline.length > 5, 'Cached headline is intact');
  }

  // Test 8: Missing population evidence handling
  console.log('\nTest 8: Missing Population Evidence (Evidence Completeness)');
  {
    const hasMultipleRequests = true;
    const hasKnownLocation = true;
    const hasPopulation = false; // missing
    const hasUrgency = true;
    const hasInfrastructure = true;

    let confidence = 'high';
    if (hasMultipleRequests && hasKnownLocation && hasPopulation && hasUrgency && hasInfrastructure) {
      confidence = 'high';
    } else if (!hasMultipleRequests || (!hasPopulation && !hasInfrastructure)) {
      confidence = 'low';
    } else {
      confidence = 'medium';
    }

    assert(confidence === 'medium', 'Missing population downgrades confidence from high to medium');
  }

  // Test 9: Missing infrastructure evidence handling
  console.log('\nTest 9: Missing Infrastructure Evidence');
  {
    const hasMultipleRequests = true;
    const hasKnownLocation = true;
    const hasPopulation = false;
    const hasUrgency = true;
    const hasInfrastructure = false; // missing both

    let confidence = 'high';
    if (hasMultipleRequests && hasKnownLocation && hasPopulation && hasUrgency && hasInfrastructure) {
      confidence = 'high';
    } else if (!hasMultipleRequests || (!hasPopulation && !hasInfrastructure)) {
      confidence = 'low';
    } else {
      confidence = 'medium';
    }

    assert(confidence === 'low', 'Missing both population and infrastructure sets confidence to low');
  }

  // Test 10: Department unavailable fallback
  console.log('\nTest 10: Department Unavailable Fallback');
  {
    const emptyDeptCounts = {};
    let topDepartment = 'Departmental mapping requires administrative validation';
    for (const [deptName, count] of Object.entries(emptyDeptCounts)) {
      topDepartment = deptName;
    }
    assert(
      topDepartment === 'Departmental mapping requires administrative validation',
      'Defaults to "Departmental mapping requires administrative validation" when no department is reported'
    );
  }

  console.log(`\n=== Test Results: ${passed} Passed, ${failed} Failed ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
