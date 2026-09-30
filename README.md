# JanSetu AI (जनसेतु)

### *Turning Citizen Voices into Development Priorities*

**Google Cloud — Build with AI: Code for Communities — Second Edition**

---

## 📋 Executive Summary

JanSetu AI is a multilingual civic intelligence platform that transforms citizen voice and text complaints into structured development insights. Using Google Gemini, Firebase/Firestore, deterministic priority scoring, and evidence integration, it identifies geographic demand hotspots and generates evidence-aware development recommendations. The platform supports multilingual voice input, provenance tracking, location-hallucination protection, transparent evidence visualization, and human validation.

> **Important Principal Notice:**  
> **JanSetu AI assists decision-makers; it does not replace human decision-making.** All recommendations, priority scores, and evidence summaries are intended as decision-support intelligence for municipal officers, district collectors, and urban local bodies.

---

## 🎯 The Problem

1. **Linguistic & Accessibility Barriers**: Millions of citizens speak regional vernaculars and dialects, making text-heavy official portals inaccessible. Critical civic grievances often remain unvoiced.
2. **Fragmented, Isolated Grievances**: Traditional grievance systems treat complaints as isolated, disconnected tickets rather than aggregated indicators of systemic infrastructure failure.
3. **Limited Demand Aggregation**: Individual grievances are often difficult to aggregate into geographic patterns that reveal recurring development needs.
4. **Lack of Verifiable Ground Truth**: Grievance portals rarely corroborate citizen claims with demographic baselines or operational infrastructure records, leading to skepticism or misallocation.

---

## 💡 The Solution

JanSetu AI bridges the civic-administrative divide by pairing **multimodal vernacular intake** with **rigorous, explainable evidence synthesis**:
- Citizens voice or write issues in their mother tongue.
- **Google Gemini** parses vernacular audio and text into standardized civic records without hallucinating missing geography.
- Grievances are clustered into geographic demand hotspots.
- Application logic calculates a **transparent, deterministic priority score** (Gemini does not decide the score).
- An **Evidence Bundle** combines citizen demand with Census 2011 demographic evidence and explicitly labelled infrastructure and investment evidence.
- **Google Gemini** drafts an advisory development recommendation, providing engineers with an immediate starting brief.

---

## 🔄 Core Workflow

```
Citizen Voice / Text (Vernacular Indian Languages)
        ↓
Gemini Multimodal / Language Analysis
        ↓
Structured Civic Request (Issue, Category, Verified Geography, Urgency)
        ↓
Firestore Persistence (Cloud Database Ingestion)
        ↓
Demand Intelligence & Geographic Hotspots (Density & Cluster Analysis)
        ↓
Deterministic Explainable Priority Score (30% Demand + 25% Pop + 25% Urgency + 20% Infra Gap)
        ↓
Evidence Bundle (Citizen + Census 2011 Demographic + Infrastructure + Investment)
        ↓
Gemini Evidence-Aware Recommendation (Project Scope, Suggested Intervention, Implementation Considerations, Timeline & Administrative Next Steps)
        ↓
Policymaker Dashboard (Interactive India Map, Hotspot Details, Evidence Inspection)
```

### Role of Google Gemini
- **Language Detection & Vernacular Translation**: Recognizes regional languages (Hindi, Kannada, Tamil, Marathi, Bengali, Telugu, etc.) and provides English translations of supported vernacular inputs.
- **Civic Issue & Entity Extraction**: Identifies the core grievance, sector, affected physical asset, and explicitly stated citizen estimates.
- **Voice Transcription**: Transcribes spoken audio into native vernacular script and English representations via Gemini multimodal audio processing.
- **Advisory Recommendation Generation**: Synthesizes the assembled Evidence Bundle into a structured project proposal brief.

> **Crucial Architectural Boundary:**  
> **Google Gemini DOES NOT calculate the priority score.**  
> The priority score is computed deterministically by mathematical application logic, making the calculation reproducible and auditable.

---

## 🚀 Current Prototype Capabilities

1. **Multilingual Citizen Text Submission**: Intuitive text grievance submission supporting English and Indian languages.
2. **Multilingual Voice Submission**: Audio recording interface processed server-side via Gemini multimodal audio analysis.
3. **Structured Civic Request Extraction**: Automated extraction of standardized category, urgency tier, affected asset, and citizen impact.
4. **Location Hallucination Protection**: Strict verification ensuring locations are accepted *only* when explicitly stated by the citizen.
5. **Firestore Persistence**: Real-time storage of structured requests, provenance metadata, and hotspot snapshots via Firebase Admin SDK.
6. **Geographic Normalization**: Canonical location hierarchy normalization (`Locality | District | State`) resolving local aliases.
7. **Demand Hotspot Aggregation**: Dynamic aggregation of citizen requests into geographic clusters with aggregated urgency metrics.
8. **Explainable Deterministic Priority Scoring**: Fully auditable mathematical formula combining demand, affected population, urgency, and infrastructure gaps.
9. **Evidence Bundle Architecture**: Modular provider layer synthesizing multi-stream evidence for any selected hotspot.
10. **Census 2011 Demographic Evidence**: Integration of official Government of India Census 2011 Primary Census Abstract (PCA) data.
11. **Infrastructure Evidence Layer**: Operational status, facility capacity, and failure mode tracking for affected public assets.
12. **Public Investment Evidence Layer**: Prior fiscal allocations, approved works, and expenditure records relevant to the problem area.
13. **Evidence Provenance & Freshness Tracking**: Granular tracking of source provenance, retrieval timestamps, collection years, and synthetic flags.
14. **Conflict Transparency**: Neutral side-by-side surfacing of discrepancies between citizen reports and administrative data without suppression.
15. **AI Development Recommendations**: Gemini-generated project briefs detailing intervention scopes, implementation considerations, and completion timelines.
16. **Policymaker Dashboard**: Comprehensive command center with KPI metrics, category breakdowns, and priority ranking.
17. **India Demand Map**: Thematic geospatial visualization pinning active geographic demand clusters across India.
18. **Hotspot ↔ Map Synchronization**: Two-way interactive binding between table rows, map pins, and evidence inspection panels (`selectedHotspotKey`).
19. **No-Location / Unmapped Request Protection**: Citizens reporting issues without location are protected and aggregated as unmapped requests rather than pinned to an arbitrary coordinate.
20. **Human Validation Framing**: Explicit visual cues, confidence levels, and validation prompts reinforcing that AI outputs are advisory.
21. **Production Prototype Deployment on Vercel**: Live cloud deployment accessible to hackathon evaluators.

---

## 🤖 Gemini AI Integration

JanSetu AI leverages the Google GenAI SDK (`@google/genai`) and `@google/generative-ai` with **Gemini 2.5 Flash** for high-speed, cost-effective multimodal analysis.

### 1. Structured Civic Extraction (`/api/analyze-request`)
- **Strict Output Schema**: Enforces strict JSON extraction containing `language`, `translated_text`, `category`, `issue`, `state`, `district`, `locality`, `affected_infrastructure`, `urgency`, `affected_population_estimate`, `government_department`, `summary`, and `recommended_action`.
- **Location Hallucination Protection**: Prompts explicitly forbid inferring or guessing geographic locations, pin codes, or population numbers not explicitly uttered or typed.

### 2. Vernacular Voice Processing (`/api/voice/transcribe`)
- **Multimodal Audio Ingestion**: Direct PCM/WAV/WebM audio stream ingestion.
- **Vernacular Recognition**: Transcribes native script (e.g., Kannada, Hindi) while concurrently producing an accurate English translation and structured entity payload.

### 3. Evidence-Aware Recommendations (`/api/intelligence/recommendation`)
- Ingests the unified **Evidence Bundle** (demographics, citizen sentiment, infrastructure history).
- Produces actionable project recommendations:
  - Project Title & Target Department
  - Implementation Considerations
  - Estimated Beneficiary Reach
  - Recommended Project Duration & Milestone Phases
  - Risk Factors & Administrative Next Steps

---

## 📊 Deterministic Priority Scoring

Priority ranking in JanSetu AI is strictly mathematical and deterministic.

### The Formula
```
Priority Score =
(Demand × 0.30)
+ (Affected Population × 0.25)
+ (Urgency × 0.25)
+ (Infrastructure Gap × 0.20)
```

| Factor | Weight | Component Definition | Normalization Range |
| :--- | :---: | :--- | :---: |
| **Demand** | **30%** | Normalized volume of verified citizen requests in the hotspot cluster | 0 – 100 |
| **Affected Population** | **25%** | Normalized aggregate population reported directly by affected citizens | 0 – 100 |
| **Urgency** | **25%** | Ratio of requests classified as `HIGH` urgency | 0 – 100 |
| **Infrastructure Gap** | **20%** | Citizen-reported infrastructure failure proxy | 0 – 100 |

> **Important Disclosure on Infrastructure Gap:**  
> In the current prototype, the **Infrastructure Gap** score is a **citizen-reported proxy** derived from the proportion of complaints citing chronic physical asset failure. It is **NOT** an official government infrastructure index.

---

## 📑 Evidence Architecture & Provenance

JanSetu AI implements an **Evidence Bundle** architecture that corroborates citizen claims before any administrative proposal is generated.

```
                    ┌─────────────────────────┐
                    │     EVIDENCE BUNDLE     │
                    └────────────┬────────────┘
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Citizen Demands  │    │  Demographics    │    │  Infrastructure  │
│ (Voice/Text)     │    │  (Census PCA)    │    │  & Investment    │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │                       │                       │
         ▼                       ▼                       ▼
  CITIZEN EVIDENCE         PUBLIC DATASET        SYNTHETIC DEMO
 (isSynthetic: false)    (isSynthetic: false)  (isSynthetic: true)
```

### Provenance Tracking Contract
Every piece of evidence stored and displayed carries explicit provenance fields:
- `dataSource`: Provenance origin (`citizen_submission` | `public_dataset` | `synthetic_demo`)
- `isSynthetic`: Boolean indicator preventing simulated test data from being mistaken for real records.
- `sourceName`: Institutional publisher (e.g., *Census of India — Primary Census Abstract*)
- `sourceReference`: Specific table, bulletin, or survey code (e.g., *Census of India — Primary Census Abstract 2011*)
- `sourceUrl`: Official government portal URL or canonical archive reference.
- `sourceYear`: Reference year of the dataset (e.g., `2011`).
- `retrievalTimestamp`: Exact ISO-8601 timestamp of record ingestion.

---

## 🏛️ Census 2011 Demographic Evidence Integration

JanSetu AI incorporates verified official demographic data from the Government of India to contextualize citizen demands against baseline demographic vulnerability.

- **Official Source**: Census of India — Primary Census Abstract (PCA) 2011
- **Publisher**: Office of the Registrar General & Census Commissioner, India (ORGI), Ministry of Home Affairs, Government of India.

### Integrated Reference Geography: Mangaluru, Karnataka
- **Canonical Key**: `Mangaluru | Dakshina Kannada | Karnataka`
- **Census Town Code**: `803181`
- **Total Population**: `499,487`
- **Total Households**: `115,036`
- **Sex Ratio**: `1,015` females per 1,000 males
- **Overall Effective Literacy**: `93.66%`
- **Female Effective Literacy**: `91.02%`

> **Historical Baseline Notice:**  
> These demographic figures reflect **historical 2011 Census records** and are used strictly as a verified baseline. They are **NOT** current population estimates.

---

## 🛡️ Trust, Provenance & Safety

### 1. Location Hallucination Protection
Grievance portals often suffer when models attempt to guess addresses. The system prevents unsupported geographic inference by leaving location fields empty when the citizen does not explicitly provide a location (`location_source = "not_provided"`). Unlocated complaints are aggregated as unmapped requests and are never plotted arbitrarily on the map.

### 2. Deterministic Priority (No Black-Box Ranking)
AI algorithms can exhibit bias or hallucinations when ranking public fund allocation. JanSetu AI delegates prioritization strictly to mathematical code, while Gemini is reserved for natural language comprehension and narrative summarization.

### 3. Provenance Transparency Badges
Every card in the policymaker dashboard displays visible visual provenance badges:
- `[CITIZEN SUBMISSION]` (Verified citizen intake)
- `[PUBLIC DATASET]` (Official government baseline)
- `[SYNTHETIC DEMO]` (Explicitly labelled prototype test data)

### 4. Conflict Transparency
When citizen reports contradict official infrastructure status (e.g., citizens report contaminated drinking water while the local utility records a pipeline as fully operational), JanSetu AI surfaces both perspectives side-by-side:
> *"Neither source is overwritten or suppressed."*

### 5. Human Validation Framing
All AI recommendations are explicitly marked with an advisory disclaimer requiring administrative inspection, on-site physical survey, and departmental approval before tender sanction.

---

## 📸 Recorded Prototype Demonstration Snapshot

The following data represents the **recorded demonstration scenario** showcased in the submission video and evaluation walk-through:

### Selected Hotspot: Mangaluru, Karnataka
- **Canonical Location**: `Mangaluru | Dakshina Kannada | Karnataka`
- **Citizen Requests**: `12`
- **Reported Affected Population**: `25,700` citizens
- **High-Urgency Demands**: `12`
- **Infrastructure Demands**: `12`
- **Calculated Priority Score**: **`74.9 / 100`**

#### Category Distribution
- **Water & Sanitation**: 11 reports (92%)
- **Roads & Transport**: 1 report (8%)

#### Intake Source Distribution
- **Voice Submissions**: 1 (8%) — Kannada vernacular voice complaint
- **Text Submissions**: 11 (92%)

*(Note: This snapshot represents a controlled prototype scenario used for functional verification and demonstration. It does not reflect aggregate national deployment statistics or government impact figures.)*

---

## 💻 Technology Stack

| Layer | Component | Implementation |
| :--- | :--- | :--- |
| **Frontend UI** | Next.js 16 (App Router) | React 19, TypeScript 5, Tailwind CSS v4, Lucide Icons |
| **Visualizations** | Recharts & SVG Map | Responsive category distributions, priority breakdown, interactive SVG India map |
| **AI Engine** | Google Gemini 2.5 Flash | Google GenAI SDK (`@google/genai`), Multimodal vernacular audio intake, Structured JSON extraction |
| **Backend API** | Next.js Route Handlers | Node.js runtime, RESTful endpoints (`/api/analyze-request`, `/api/voice/transcribe`, `/api/evidence/bundle`) |
| **Database** | Cloud Firestore | Firebase Admin SDK (`firebase-admin`), Structured grievance storage, Hotspot collections |
| **Demographic Data** | Census PCA 2011 | Office of the Registrar General & Census Commissioner, India (ORGI) |
| **Production Hosting**| Vercel | Production cloud deployment with continuous integration from GitHub |
| **Testing** | Node.js Test Suites | 472 automated assertions across geography, scoring, Census, evidence, dashboard, synchronization, completeness, and end-to-end validation. |

---

## 🏗️ System Architecture

```
[ Citizen Portal (/citizen) ]          [ Policymaker Dashboard (/dashboard) ]
      │             │                                 │
 (Text Intake)  (Voice Intake)                        │
      │             │                                 │
      ▼             ▼                                 ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│  /api/analyze-request           │       │  /api/intelligence/hotspots     │
│  /api/voice/transcribe          │       │  /api/intelligence/recommendation│
│  (Google Gemini 2.5 Flash)      │       │  /api/evidence/bundle           │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                    CLOUD FIRESTORE (Database Layer)                       │
│  Collections: citizen_requests | demand_hotspots | evidence_demographics  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Known Limitations

1. **Census Demographic Baseline**: Demographic data is sourced from the official Census 2011 historical baseline.
2. **Prototype Evidence Data**: While demographic data for integrated test locations is official Census data, infrastructure and public investment records in the prototype currently use explicitly labelled **synthetic demo data**.
3. **Prototype Status**: JanSetu AI is a hackathon prototype submitted for technical evaluation; it is not currently deployed as an official government production system.
4. **Advisory AI Outputs**: All Gemini-generated recommendations are assistive starting briefs and must be vetted by licensed engineers and administrative officers.
5. **Geographic Coverage**: Current prototype maps and datasets focus on verified test clusters and should not be construed as comprehensive nationwide operational coverage.

---

## 🌐 Architecture Designed for India-Scale Expansion

The modular architecture of JanSetu AI is engineered for phased expansion across India:
- **Expanded Vernacular Intake**: Expansion to all 22 Eighth Schedule Indian languages and local tribal dialects.
- **Official Infrastructure API Connectors**: Future integration with municipal GIS databases, Jal Jeevan Mission dashboards, and PMGSY road quality portals.
- **National Expenditure Portals**: Connectors to PFMS (Public Financial Management System) for real-time local capital works expenditure tracking.
- **Automated Evidence Freshness Workers**: Scheduled background jobs to pull updated public survey bulletins and satellite infrastructure indicators.
- **Institutional Workflow Integration**: End-to-end integration with state CM Helpline and CPGRAMS grievance resolution workflows.

---

## 🌐 Live Prototype

- **Live Production Deployment**: [https://jansetu-ai-seven.vercel.app/](https://jansetu-ai-seven.vercel.app/)
  - Citizen Intake Portal: [https://jansetu-ai-seven.vercel.app/citizen](https://jansetu-ai-seven.vercel.app/citizen)
  - Policymaker Intelligence Dashboard: [https://jansetu-ai-seven.vercel.app/dashboard](https://jansetu-ai-seven.vercel.app/dashboard)
- **Source Code Repository**: [https://github.com/SharathAcharya/jansetu-ai](https://github.com/SharathAcharya/jansetu-ai)

---

## 📂 Repository Structure

```
jansetu-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # GovTech root layout with navigation
│   │   ├── page.tsx                       # Landing page explaining civic-administrative gap
│   │   ├── citizen/
│   │   │   └── page.tsx                   # Multilingual Citizen Intake Portal
│   │   ├── dashboard/
│   │   │   └── page.tsx                   # Policymaker Intelligence Dashboard
│   │   └── api/
│   │       ├── analyze-request/           # Gemini structured text extraction
│   │       ├── voice/transcribe/          # Gemini multimodal vernacular audio intake
│   │       ├── evidence/bundle/           # Multi-stream Evidence Bundle synthesis
│   │       ├── intelligence/hotspots/     # Demand hotspot aggregation API
│   │       └── intelligence/recommendation/ # Gemini evidence-aware project generator
│   ├── components/
│   │   ├── citizen/
│   │   │   ├── CitizenForm.tsx            # Multilingual grievance submission form
│   │   │   └── VoiceInputModal.tsx        # Voice recording and transcription modal
│   │   ├── dashboard/
│   │   │   ├── HotspotsSection.tsx        # High-priority clusters & detail inspector
│   │   │   ├── EvidenceBehindDemand.tsx   # Comprehensive evidence & provenance view
│   │   │   ├── IndiaMapPlaceholder.tsx    # Interactive SVG India cluster map
│   │   │   ├── MetricsGrid.tsx            # KPI metric summaries
│   │   │   ├── CategoryChart.tsx          # Recharts category distribution
│   │   │   ├── PriorityChart.tsx          # Urgency breakdown chart
│   │   │   ├── AIRecommendations.tsx      # Gemini project recommendation card
│   │   │   └── RecentRequestsTable.tsx    # Searchable citizen requests feed
│   │   └── layout/
│   │       ├── Navbar.tsx                 # Navigation header
│   │       └── Footer.tsx                 # Attribution and governance disclaimers
│   ├── lib/
│   │   ├── firebaseAdmin.ts               # Firebase Admin SDK initialization
│   │   ├── gemini.ts                      # Google GenAI client configuration
│   │   ├── normalizers/geography.ts       # Canonical location normalization
│   │   ├── scoring/priorityScoring.ts     # Deterministic 30/25/25/20 priority logic
│   │   └── evidence/                      # Evidence providers & bundle service
│   ├── types/                             # TypeScript definitions for requests, evidence, hotspots
│   └── data/                              # Demo seed records and Census baselines
├── scripts/                               # Ingestion, seeding, and verification suites
├── package.json
└── README.md
```

---

## 🛠️ Local Setup & Development

### Prerequisites
- **Node.js**: v18+ (tested on Node v20 & v24)
- **npm**: v9+
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)
- **Firebase Service Account**: Cloud Firestore credentials

### 1. Clone & Install
```bash
git clone https://github.com/SharathAcharya/jansetu-ai.git
cd jansetu-ai
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

JanSetu AI includes a comprehensive suite of automated verification scripts testing all functional layers:

```bash
# Run core verification suites
npm run test:geography          # Canonical location resolution (33 tests)
npm run test:scoring            # Deterministic priority scoring math (14 tests)
npm run test:census             # Census PCA 2011 data integration (33 tests)
npm run test:mangalore          # Mangaluru Census data verification (27 tests)
npm run test:evidence           # Evidence provider contracts & provenance (42 tests)
npm run test:bundle             # Evidence bundle synthesis (28 tests)
npm run test:dashboard          # Evidence-aware dashboard integration (64 tests)
npm run test:hotspot-details    # Hotspot detail synchronization (42 tests)
npm run test:map-sync           # India map ↔ hotspot synchronization (38 tests)
npm run test:mangalore-select   # Mangaluru details selection regression (35 tests)
npm run test:completeness       # Evidence completeness formatting verification (28 tests)
npm run test:e2e-demo           # End-to-end 5-scenario demo validation (88 tests)
```

### Production Build Validation
```bash
npm run build
```
Executes Turbopack compilation, TypeScript strict type-checking, and static generation (zero warnings, zero errors).

---

## 🔒 Security & Privacy Notes

- **Zero Client Credential Exposure**: `GEMINI_API_KEY` and Firebase Admin credentials are executed solely in server-side API routes and are never bundled into client JavaScript.
- **Git Hygiene**: Environment files (`.env`, `.env.local`, `.env*.local`) and service account private keys are explicitly ignored in `.gitignore`.
- **Anonymized Civic Records**: Citizen telephone numbers and personal identifiers are isolated from administrative public views.

---

## 📜 Hackathon Attribution & License

- **Project**: JanSetu AI (जनसेतु)
- **Hackathon**: Google Cloud — *Build with AI: Code for Communities — Second Edition*
- **License**: MIT License
- **Attribution**: Built with Google Gemini, Firebase, Next.js, and official public open data from the Census of India.
