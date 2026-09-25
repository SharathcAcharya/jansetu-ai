# JanSetu AI (जनसेतु)
### *Turning Citizen Voices into Development Priorities*

**Google Cloud "Build with AI: Code for Communities — Second Edition" Hackathon Submission**

---

## 🌟 Executive Summary & Problem Statement

In India, municipal and state development planning faces a structural disconnect:
1. **Linguistic & Digital Divide**: Millions of citizens speak regional dialects and cannot articulate infrastructure grievances into formal, complex English portal forms.
2. **Siloed Complaints**: Citizen grievances are handled as fragmented, isolated tickets rather than analyzed as collective indicators of systemic infrastructure failure.
3. **Subjective Capital Allocation**: Public works funds are often disbursed based on ad-hoc or discretionary inputs rather than empirical, ground-up demand density.

**JanSetu AI** bridges this critical gap. It is an AI-powered civic intelligence engine that ingests citizen complaints via vernacular voice and text across 10+ Indian languages, transforms them into structured civic entities with computed urgency scores, clusters them into geographic demand hotspots, and uses **Google Gemini** to generate evidence-based public works project recommendations for policymakers and municipal engineers.

---

## 🔄 Core End-to-End Workflow

```
Citizen submits a development complaint/request (Voice / Text in Hindi, Marathi, Tamil, etc.)
        ↓
Gemini AI analyzes the request & extracts structured entities
        ↓
Complaint is converted into structured data with computed urgency
        ↓
Citizen request is stored in Cloud Firestore
        ↓
Infrastructure & public data is combined with citizen demand
        ↓
A transparent priority score is calculated (Risk × Vulnerability × Density)
        ↓
Demand hotspots are identified at the Ward & District level
        ↓
Gemini generates an evidence-based development project recommendation (Budget & Beneficiaries)
        ↓
Policymaker Dashboard displays real-time intelligence for administrative sanction
```

---

## 🚀 Current Status: Phase 2 Gemini Integration Completed

This repository contains **Phase 1 (Frontend Foundation & Intelligence Dashboard)** and **Phase 2 (Server-Side Gemini API Integration & Structured Civic Extraction)**:

### Phase 2: Live Google Gemini API Integration (`/api/analyze-request`)
- **Server-Side AI Engine**: Securely invokes `@google/genai` (Gemini 2.5 Flash) server-side via Next.js App Router API Route.
- **Strict Structured Schema**: Returns pure validated JSON:
  - `language`: Detected language (e.g. English, Hindi, Tamil, Marathi)
  - `translated_text`: English translation of non-English complaints
  - `category`: 11 standardized sectors (Roads & Transport, Healthcare, Water & Sanitation, Agriculture, etc.)
  - `issue`: Core civic issue title
  - `state`, `district`, `locality`: Extracted ONLY when explicitly stated (never hallucinated)
  - `affected_infrastructure`: Physical asset (e.g. Irrigation facility, Trunk sewer, Transformer)
  - `urgency`: Low, Medium, High
  - `affected_population_estimate`: Number of citizens affected (extracted only when explicitly stated)
  - `government_department`: Relevant Indian ministry or department (e.g. Ministry of Jal Shakti)
  - `summary`: Concise executive summary
  - `recommended_action`: Practical engineering/administrative recommendation
- **Professional AI Result Card**: Displayed directly in the Citizen Portal with loading, error, and retry states.
- **Zero Client-Side Exposure**: API keys are isolated in `.env.local` and never sent to the browser.


### 1. Landing Page (`/`)
- Professional Indian GovTech / civic intelligence visual identity (Ashoka Navy, Tiranga Saffron & Green accents, clean high-contrast layout).
- Clear problem framing: Conventional siloed grievance portals vs. JanSetu AI intelligence.
- The 4-step pipeline: **Voice → AI Analysis → Data Intelligence → Development Recommendation**.
- Interactive transformation demonstration showing how raw vernacular text turns into an administrative proposal.
- Direct quick-action CTAs to report issues and view the intelligence dashboard.

### 2. Citizen Request Portal (`/citizen`)
- **Multilingual Support**: Selector for 10 major Indian languages (English, Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Punjabi, Odia).
- **Comprehensive Civic Fields**: State, District/City, Ward/Panchayat, Landmark, Pincode.
- **Category Selector**: Roads & Transit, Water Supply & Drainage, Solid Waste & Sanitation, Power & Lighting, Primary Health, School Infrastructure.
- **Voice Intake UI**: Simulated speech-to-text recording interface with animated soundwaves and vernacular transcription previews.
- **Structured Payload Verification**: Generates a live structured schema view showing exactly what will be sent to Gemini and stored in Firestore in Phase 2.

### 3. Policymaker Intelligence Dashboard (`/dashboard`)
- **Key Performance Indicators**: Total Citizen Requests (18,450+), High Priority Requests (4,210), Infrastructure Gaps (984), States Covered (14 Regions).
- **Visual Analytics**:
  - Issue Category Distribution bar chart powered by **Recharts**.
  - Priority & Urgency tiering distribution.
- **Demand Hotspots Section**: Identifies high-density geographic clusters (e.g. East Delhi Drainage Cluster, Bengaluru Silk Board Corridor, Varanasi Ghat Sector 4, Patna Primary Care Void).
- **Geospatial Map Canvas**: Pan-India thematic GIS representation plotting active hotspots and regional zones, ready for Google Maps API.
- **Evidence-Based AI Recommendations**: Actionable project briefs with estimated budgets, beneficiary counts, completion timelines, and Gemini confidence scores.
- **Live Demands Feed**: Searchable, filterable citizen request table with detail inspection modals.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **Data Visualizations** | Recharts |
| **Icons** | Lucide React |
| **AI (Phase 2)** | Google Gemini 1.5 Pro / Flash & Vertex AI Multimodal |
| **Database (Phase 2)** | Google Cloud Firestore / Firebase |
| **Geospatial (Phase 2)**| Google Maps Platform (JavaScript API + MarkerClusterer) |
| **Hosting (Phase 2)** | Google Cloud Run / Firebase App Hosting |

---

## 📁 Repository Structure

```
jansetu-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with GovTech navigation & footer
│   │   ├── page.tsx                  # High-impact Landing Page
│   │   ├── citizen/
│   │   │   └── page.tsx              # Citizen Request Portal route
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Policymaker Intelligence Dashboard route
│   │   └── globals.css               # Design tokens, GovTech color palette, utility styles
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx            # GovTech header & mobile navigation
│   │   │   └── Footer.tsx            # Hackathon attribution & roadmap
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx       # Value proposition & live metrics
│   │   │   ├── ProblemSection.tsx    # Civic gap comparison
│   │   │   ├── WorkflowSection.tsx   # 4-stage pipeline visualization
│   │   │   └── ImpactPreview.tsx     # Interactive AI transformation showcase
│   │   ├── citizen/
│   │   │   ├── CitizenForm.tsx       # Multi-field citizen grievance intake form
│   │   │   └── VoiceInputModal.tsx   # Simulated vernacular voice recording modal
│   │   └── dashboard/
│   │       ├── MetricsGrid.tsx       # 4 core KPI metric cards
│   │       ├── CategoryChart.tsx     # Recharts categorical distribution
│   │       ├── PriorityChart.tsx     # Urgency level breakdown
│   │       ├── HotspotsSection.tsx   # Ward-level demand clusters
│   │       ├── IndiaMapPlaceholder.tsx # Geospatial India cluster view
│   │       ├── AIRecommendations.tsx # Gemini-generated project proposals
│   │       └── RecentRequestsTable.tsx # Searchable civic requests with inspection modal
│   ├── types/
│   │   └── index.ts                  # Type definitions for requests, hotspots & recommendations
│   └── data/
│       └── mockData.ts               # Realistic pan-India civic dataset
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔮 Planned Architecture (Phase 2 & Beyond)

1. **Gemini Multimodal Audio Intake**:
   - Direct audio stream processing via Vertex AI / Gemini API to transcribe Indian dialects, extract location landmarks, and translate into standardized Hindi & English.
2. **Cloud Firestore Sync**:
   - Real-time document ingestion with geo-hash indexing for sub-second spatial querying.
3. **Geo-Clustering Algorithm**:
   - DBSCAN spatial clustering to automatically bundle proximate citizen grievances into distinct hotspot polygons.
4. **Google Maps Platform Integration**:
   - Dynamic vector map rendering with heatmap layers, custom SVG pins, and ward boundary overlays.
5. **Automated DPR (Detailed Project Report) Generation**:
   - Gemini generating formal PDF project briefs conforming to Indian CPWD / municipal tender formats.

---

## ⚡ How to Run Locally

### Prerequisites
- Node.js (v18 or higher recommended; developed on Node v24)
- npm (v10 or higher)

### Steps

1. **Navigate to the project directory**:
   ```bash
   cd "C:\Users\HP\.gemini\antigravity-ide\scratch\jansetu-ai"
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in your browser**:
   - Landing Page: [http://localhost:3000](http://localhost:3000)
   - Citizen Portal: [http://localhost:3000/citizen](http://localhost:3000/citizen)
   - Policymaker Dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

5. **Build for Production / Verification**:
   ```bash
   npm run build
   ```
