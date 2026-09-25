# JanSetu AI — Phase 6E-4: Demo Scenarios & End-to-End Validation

## 1. Objective

Phase 6E-4 establishes a repeatable, automated validation harness for JanSetu AI across five mission-critical citizen-to-policy-intelligence scenarios. The objective is to verify that the end-to-end system reliably handles multimodal citizen intake (text, voice, multilingual), strict location normalization without hallucination, deterministic explainable priority ranking, official Census PCA 2011 demographic grounding, transparent synthetic demo demarcations, neutral evidence conflict surfacing, and map-evidence synchronization.

---

## 2. Five Demo Scenarios

1. **Scenario 1 — Mangaluru Text Complaint**: Full-lifecycle intake of a citizen text report in Mangaluru, structured Gemini analysis, Firestore persistence, demand hotspot aggregation, official Census 2011 public data retrieval, deterministic priority calculation, India map synchronization, and evidence-grounded Gemini AI recommendation.
2. **Scenario 2 — Karkala Voice Complaint**: Vernacular voice input (Kannada script), automated speech transcription and translation, structured intake, Firestore persistence with voice metadata, demand hotspot updates, Census 2011 demographic linkage, and map placement.
3. **Scenario 3 — No-Location Citizen Complaint**: Submission of an urgent complaint omitting geographic proper names, verifying that JanSetu AI classifies the issue while strictly preventing geographic hallucination, leaving location fields empty, counting it as unmapped, and avoiding artificial map coordinates.
4. **Scenario 4 — Evidence Conflict**: Neutral surfacing of discrepancies between citizen ground truth (e.g. reported service breakdown or defunct pump) and official administrative registers (e.g. operational infrastructure survey), presenting both sources side-by-side without silent overwrite.
5. **Scenario 5 — Synthetic Data Transparency**: Strict provenance auditing across all four evidence layers, ensuring citizen submissions and Census data are marked non-synthetic, while prototype infrastructure and public investment records are explicitly demarcated as synthetic demo data.

---

## 3. Inputs Used

### Scenario 1: Mangaluru Text Complaint
```text
Several residential areas in Mangaluru are facing repeated waterlogging during heavy rain. Residents are concerned about blocked stormwater drains and poor drainage near major roads. Around 300 households are affected.
```

### Scenario 2: Karkala Voice Complaint
- **Voice Fixture**: Built-in benchmark sample `kannada_irrigation`
- **Original Vernacular Script**: `ಕಾರ್ಕಳ ತಾಲೂಕಿನಲ್ಲಿ...`
- **Detected Language**: `Kannada`
- **Translated Text**: Structured grievance referencing irrigation pump and canal repairs in Karkala town.

### Scenario 3: No-Location Citizen Complaint
```text
Farmers are facing severe water shortages for irrigation. The nearest irrigation facility is far away and hundreds of farming families are affected.
```

### Scenario 4: Evidence Conflict Simulation
- **Citizen Report**: Verified grievance citing acute water shortage and breakdown involving the *Karkala Lift Irrigation Pump & Canal*.
- **Public Infrastructure Record**: GIS asset registry entry marking *Karkala Lift Irrigation Pump & Canal* as `OPERATIONAL` in `GOOD` condition.

### Scenario 5: Full Provenance Stream
- **Citizen Requests Collection**: Live submissions in Firestore (`citizen_requests`).
- **Demographic Repository**: Official Census PCA 2011 extract (`evidence_demographics`).
- **Infrastructure Repository**: Prototype asset and connectivity indices (`evidence_infrastructure`).
- **Public Investment Repository**: Scheme allocations and expenditures (`evidence_investments`).

---

## 4. Expected Behavior

1. **Scenario 1**: Locality extracted as `Mangaluru`, canonicalized to `Mangaluru | Dakshina Kannada | Karnataka`. Stored as `citizen_submission`. Hotspot included in demand aggregation. Map coordinates resolve to `{x: 40, y: 75}`. Census code `803181` and population `499,487` load from `public_dataset`. Recommendation generated without fabricating budgets or official sanctions.
2. **Scenario 2**: Speech transcribed with native Kannada script preserved in `originalTranscript`. `sourceType` stored as `voice`. Hotspot reflects voice distribution and language representation. Karkala Census code `803178` and population `25,824` load from `public_dataset`.
3. **Scenario 3**: Category classified as `Agriculture` or `Water & Sanitation`. `locality`, `district`, and `state` remain empty string `""`. `location_source = "not_provided"`, `location_confidence = "none"`. Increments `unmappedRequests`. Zero map coordinates plotted (`getHotspotCoordinates === null`). Evidence UI renders: *"Geographic evidence unavailable — citizen did not provide a location."*
4. **Scenario 4**: Conflict engine surfaces discrepancy with `dimension = "infrastructure"` and `severity = "HIGH"`. Citizen statement and public record preserved verbatim with neutral explanation. UI renders: *"JanSetu AI surfaces discrepancies neutrally for policymaker evaluation. Neither source is overwritten or suppressed."*
5. **Scenario 5**: Citizen data tagged `citizen_submission` (`isSynthetic: false`). Census data tagged `public_dataset` (`isSynthetic: false`, `sourceYear: 2011`). Infrastructure and investment demo records tagged `synthetic_demo` (`isSynthetic: true`). Clear UI badges distinguish all four layers.

---

## 5. Actual Validation Results

| Step / Scenario | Expected | Actual Result | Status |
| :--- | :--- | :--- | :---: |
| **S1: Intake & ID** | HTTP 200, `JNS-XXXXXX` | HTTP 200, `JNS-000057` | **PASS** |
| **S1: Extraction** | Mangaluru, citizen_provided | Locality: `Mangaluru`, `location_source: citizen_provided` | **PASS** |
| **S1: Normalization** | Mangaluru \| Dakshina Kannada \| Karnataka | Canonical key: `Mangaluru \| Dakshina Kannada \| Karnataka` | **PASS** |
| **S1: Hotspot & Score** | Included, Score 0-100 | Included, Deterministic Priority Score: `67.3 / 100` | **PASS** |
| **S1: Map Coordinates** | `{x: 40, y: 75}` | `{x: 40, y: 75}` (Verified SVG percentage) | **PASS** |
| **S1: Census Data** | Code `803181`, Pop `499,487` | Code `803181`, Pop `499,487`, Sex Ratio `1,015`, Lit `93.66%` | **PASS** |
| **S1: Recommendation** | Gemini, Advisory, No fake budgets | Valid headline, intervention, grounded rationale, no fake budgets | **PASS** |
| **S2: Voice Transcription** | Kannada, script preserved | `detectedLanguage: "Kannada"`, contains `ಕಾರ್ಕಳ` | **PASS** |
| **S2: Voice Intake** | `sourceType: "voice"` | Stored in Firestore with `sourceType: "voice"`, native script | **PASS** |
| **S2: Hotspot & Evidence** | Karkala, Code `803178`, Pop `25,824` | Code `803178`, Pop `25,824`, Map `{x: 42, y: 73}` | **PASS** |
| **S3: No-Location Intake** | `location_source: "not_provided"` | `location_source: "not_provided"`, `location_confidence: "none"` | **PASS** |
| **S3: Geography Fields** | Empty string `""` | `state: ""`, `district: ""`, `locality: ""` | **PASS** |
| **S3: Unmapped Counter** | `unmappedRequests` incremented | Incremented in live intelligence summary | **PASS** |
| **S3: Coordinate Safety** | `getHotspotCoordinates === null` | Returned `null` (zero artificial coordinates) | **PASS** |
| **S4: Conflict Detection** | Infrastructure discrepancy | Surfaced High-severity conflict on Lift Irrigation Canal | **PASS** |
| **S4: Neutral Wording** | Neither overwritten | Neutral UI text: *"Neither source is overwritten or suppressed."* | **PASS** |
| **S5: Provenance Audit** | Strict dataset tags | 100% compliant contracts across citizen, public, demo records | **PASS** |
| **S5: UI Badges** | Clear visual demarcation | `CITIZEN SUBMISSION`, `PUBLIC DATASET`, `SYNTHETIC DEMO` verified | **PASS** |

---

## 6. Provenance Verification

- **Citizen Reports**: `origin: "citizen_submission"`, `isSynthetic: false`, `validationMethod: "citizen_verification"`
- **Census Demographics**: `origin: "public_dataset"`, `isSynthetic: false`, `sourceYear: 2011`, `publisher: "Office of the Registrar General & Census Commissioner, India"`, `sourceUrl: "https://censusindia.gov.in"`
- **Infrastructure Indicators**: `origin: "synthetic_demo"`, `isSynthetic: true`, `validationMethod: "synthetic_calibration"`
- **Public Investment Allocations**: `origin: "synthetic_demo"`, `isSynthetic: true`, `validationMethod: "synthetic_calibration"`

---

## 7. No-Location Verification

When a citizen omits geographic proper names:
- The system extracts civic category, urgency, and affected scale.
- Location fields are set to empty strings (`locality = ""`, `district = ""`, `state = ""`).
- `location_source` is set to `"not_provided"` and `location_confidence` is set to `"none"`.
- The request is saved in Firestore for overall demand statistics.
- It is excluded from geographic hotspot aggregation and assigned no map coordinates.
- The UI explicitly renders: *"Geographic evidence unavailable — citizen did not provide a location."*
- **Guarantee**: JanSetu AI never invents or guesses coordinates.

---

## 8. Evidence Conflict Verification

- Discrepancies between field citizen feedback and administrative registers are detected deterministically by `detectEvidenceConflicts`.
- **Preservation**: The citizen assertion and official asset survey record are preserved verbatim without truncation.
- **Neutrality**: JanSetu AI does not declare either source as definitively true; rather, it highlights the delta for policymaker investigation.

---

## 9. Synthetic Data Verification

- Prototype infrastructure indicators and capital project records are clearly labeled as `synthetic_demo`.
- The dashboard displays a dedicated **Demo Environment Banner**:
  > *"Demo Environment: Includes verified Census 2011 public data along with clearly marked synthetic infrastructure and investment demo baselines."*
- Zero synthetic records are presented as official government data.

---

## 10. Test Command

To execute the automated end-to-end demo validation harness:

```bash
npm run test:e2e-demo
```

---

## 11. Final Result

```text
==================================================
JANSETU AI — END-TO-END DEMO VALIDATION
==================================================

[PASS] Scenario 1 — Mangaluru text complaint
[PASS] Scenario 2 — Karkala voice complaint
[PASS] Scenario 3 — No-location protection
[PASS] Scenario 4 — Evidence conflict
[PASS] Scenario 5 — Synthetic data provenance

--------------------------------------------------
RESULT
--------------------------------------------------
Scenarios: 5/5
Assertions: 88/88
Status: PASS
==================================================
```

---

## 12. Known Limitations

1. **Census 2011 Historical Baseline**: Decennial Census of India records (Mangaluru population `499,487`, Karkala population `25,824`) represent 2011 official figures and are explicitly labeled as *Historical Baseline — 2011*. They do not represent real-time post-2011 population counts.
2. **Synthetic Infrastructure & Investment Data**: Infrastructure coverage metrics and public expenditure allocations currently rely on calibrated synthetic demonstration records labeled `synthetic_demo`.
3. **Advisory Decision Support**: Gemini development interventions provide decision support for policymakers; administrative sanctioning and department assignment require official administrative validation.
4. **Deterministic Priority Score Isolation**: The citizen-demand-centric Priority Score formula ($30\% + 25\% + 25\% + 20\%$) remains strictly isolated from demographic and public investment evidence.
