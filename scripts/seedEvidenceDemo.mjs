import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  computeGeographyDocId,
  normalizeGeography,
} from '../src/lib/geographyNormalizer.ts';

// -------------------------------------------------------------
// Safeguard: Manual confirmation flag is strictly required
// -------------------------------------------------------------
if (!process.argv.includes('--confirm-seed')) {
  console.error('\n❌ Execution Blocked.');
  console.error('The synthetic evidence demo seed script cannot be triggered accidentally in production.');
  console.error('To run manual seeding in development, execute:');
  console.error('  node scripts/seedEvidenceDemo.mjs --confirm-seed\n');
  process.exit(1);
}

// Read .env.local safely
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
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

const projectId = env.FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawPrivateKey) {
  console.error('❌ Missing FIREBASE_* environment variables in .env.local.');
  process.exit(1);
}

const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

const app = getApps().length > 0 ? getApps()[0] : initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = getFirestore(app);

// -------------------------------------------------------------
// Controlled Synthetic Demonstration Records
// IMPORTANT: All records are strictly marked as synthetic_demo.
// -------------------------------------------------------------

const nowIso = new Date().toISOString();

// 1. Demographic Evidence Records
const DEMOGRAPHIC_RECORDS = [
  // Karnataka (State)
  {
    sourceId: 'DEMO-DEMO-KARNATAKA',
    sourceType: 'demographic_data',
    sourceName: 'Synthetic Demographic Baseline — Karnataka',
    sourceReference: 'JanSetu AI Calibration Model (State Aggregate Demo)',
    sourceYear: 2024,
    geographyLevel: 'state',
    state: 'Karnataka',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Demo Table KAR-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalPopulation: 67560000,
      householdCount: 15200000,
      sexRatioFemalesPer1000Males: 973,
      overallLiteracyRatePercent: 75.4,
      femaleLiteracyRatePercent: 68.1,
      scheduledCastePopulationPercent: 17.1,
      scheduledTribePopulationPercent: 7.0,
      agriculturalWorkersPercent: 43.5,
      vulnerableHouseholdsEstimate: 3200000,
      demographicSourceNote: 'Simulated demographic indicator profile for state-level prototype testing.',
    },
  },
  // Udupi (District)
  {
    sourceId: 'DEMO-DEMO-UDUPI',
    sourceType: 'demographic_data',
    sourceName: 'Synthetic Demographic Baseline — Udupi District',
    sourceReference: 'JanSetu AI Calibration Model (District Demo)',
    sourceYear: 2024,
    geographyLevel: 'district',
    state: 'Karnataka',
    district: 'Udupi',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Demo Table UDU-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalPopulation: 1177000,
      householdCount: 265000,
      sexRatioFemalesPer1000Males: 1094,
      overallLiteracyRatePercent: 86.2,
      femaleLiteracyRatePercent: 81.5,
      scheduledCastePopulationPercent: 6.4,
      scheduledTribePopulationPercent: 4.5,
      agriculturalWorkersPercent: 28.3,
      vulnerableHouseholdsEstimate: 42000,
      demographicSourceNote: 'Simulated demographic indicator profile for coastal district testing.',
    },
  },
  // Karkala (Locality)
  {
    sourceId: 'DEMO-DEMO-KARKALA',
    sourceType: 'demographic_data',
    sourceName: 'Synthetic Demographic Baseline — Karkala Taluk',
    sourceReference: 'JanSetu AI Calibration Model (Locality Demo)',
    sourceYear: 2024,
    geographyLevel: 'locality',
    state: 'Karnataka',
    district: 'Udupi',
    locality: 'Karkala',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Demo Table KARK-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalPopulation: 42500,
      householdCount: 9400,
      sexRatioFemalesPer1000Males: 1082,
      overallLiteracyRatePercent: 88.5,
      femaleLiteracyRatePercent: 84.2,
      scheduledCastePopulationPercent: 5.8,
      scheduledTribePopulationPercent: 4.2,
      agriculturalWorkersPercent: 34.0,
      vulnerableHouseholdsEstimate: 1450,
      demographicSourceNote: 'Simulated demographic indicator profile for taluk-level testing.',
    },
  },
  // Tamil Nadu (State)
  {
    sourceId: 'DEMO-DEMO-TAMILNADU',
    sourceType: 'demographic_data',
    sourceName: 'Synthetic Demographic Baseline — Tamil Nadu',
    sourceReference: 'JanSetu AI Calibration Model (State Aggregate Demo)',
    sourceYear: 2024,
    geographyLevel: 'state',
    state: 'Tamil Nadu',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Demo Table TN-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalPopulation: 76500000,
      householdCount: 19800000,
      sexRatioFemalesPer1000Males: 996,
      overallLiteracyRatePercent: 80.1,
      femaleLiteracyRatePercent: 73.4,
      scheduledCastePopulationPercent: 20.0,
      scheduledTribePopulationPercent: 1.1,
      agriculturalWorkersPercent: 32.5,
      vulnerableHouseholdsEstimate: 3600000,
      demographicSourceNote: 'Simulated demographic indicator profile for Tamil Nadu baseline.',
    },
  },
  // Chennai (District)
  {
    sourceId: 'DEMO-DEMO-CHENNAI',
    sourceType: 'demographic_data',
    sourceName: 'Synthetic Demographic Baseline — Chennai District',
    sourceReference: 'JanSetu AI Calibration Model (District Demo)',
    sourceYear: 2024,
    geographyLevel: 'district',
    state: 'Tamil Nadu',
    district: 'Chennai',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Demo Table CHN-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalPopulation: 4680000,
      householdCount: 1150000,
      sexRatioFemalesPer1000Males: 989,
      overallLiteracyRatePercent: 90.2,
      femaleLiteracyRatePercent: 87.5,
      scheduledCastePopulationPercent: 14.3,
      scheduledTribePopulationPercent: 0.3,
      agriculturalWorkersPercent: 1.2,
      vulnerableHouseholdsEstimate: 180000,
      demographicSourceNote: 'Simulated demographic indicator profile for Chennai urban district.',
    },
  },
];

// 2. Infrastructure Evidence Records
const INFRASTRUCTURE_RECORDS = [
  // Karnataka (State)
  {
    sourceId: 'INFRA-DEMO-KARNATAKA',
    sourceType: 'infrastructure_data',
    sourceName: 'Synthetic Infrastructure Indices — Karnataka',
    sourceReference: 'JanSetu AI Calibration Model (State Aggregate Demo)',
    sourceYear: 2024,
    geographyLevel: 'state',
    state: 'Karnataka',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Infra Table KAR-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      sectorIndices: {
        Roads: 72,
        Water: 65,
        Healthcare: 70,
        Electricity: 88,
        Education: 74,
      },
      criticalDeficits: [
        'Summer groundwater depletion in dry agro-climatic zones',
        'Interior rural road resurfacing backlog',
      ],
      surveyedAssets: [],
      pmgsyRoadConnectivityStatus: 'PARTIALLY_CONNECTED',
      tapWaterCoveragePercent: 71.5,
    },
  },
  // Udupi (District)
  {
    sourceId: 'INFRA-DEMO-UDUPI',
    sourceType: 'infrastructure_data',
    sourceName: 'Synthetic Infrastructure Indices — Udupi District',
    sourceReference: 'JanSetu AI Calibration Model (District Demo)',
    sourceYear: 2024,
    geographyLevel: 'district',
    state: 'Karnataka',
    district: 'Udupi',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Infra Table UDU-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      sectorIndices: {
        Roads: 78,
        Water: 58,
        Healthcare: 84,
        Electricity: 92,
        Education: 86,
      },
      criticalDeficits: [
        'Lift irrigation pump maintenance and canal tail-end siltation',
        'Seasonal salinity intrusion in coastal drinking water wells',
      ],
      surveyedAssets: [
        {
          sector: 'Water',
          assetName: 'Udupi Central Reservoir Pipeline',
          assetType: 'Water Trunk',
          operationalStatus: 'OPERATIONAL',
          distanceToNearestAlternateKm: 8,
        },
      ],
      pmgsyRoadConnectivityStatus: 'CONNECTED',
      tapWaterCoveragePercent: 78.4,
      nearestPrimaryHealthCenterKm: 4.5,
    },
  },
  // Karkala (Locality)
  {
    sourceId: 'INFRA-DEMO-KARKALA',
    sourceType: 'infrastructure_data',
    sourceName: 'Synthetic Infrastructure Indices — Karkala Locality',
    sourceReference: 'JanSetu AI Calibration Model (Locality Demo)',
    sourceYear: 2024,
    geographyLevel: 'locality',
    state: 'Karnataka',
    district: 'Udupi',
    locality: 'Karkala',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Infra Table KARK-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      sectorIndices: {
        Roads: 64,
        Water: 42,
        Agriculture: 36,
        Healthcare: 80,
        Electricity: 88,
      },
      criticalDeficits: [
        'Non-functional lift irrigation pump set serving 700+ farm holdings',
        'Canal feeder silt buildup preventing gravity discharge to lower paddy terraces',
      ],
      surveyedAssets: [
        {
          sector: 'Agriculture',
          assetName: 'Karkala Lift Irrigation Pump Station No. 2',
          assetType: 'Irrigation Pump Set',
          operationalStatus: 'DEGRADED',
          distanceToNearestAlternateKm: 15,
        },
        {
          sector: 'Water',
          assetName: 'Karkala Town Drinking Water Feeder',
          assetType: 'Distribution Ductile Pipeline',
          operationalStatus: 'DEGRADED',
          distanceToNearestAlternateKm: 11,
        },
      ],
      pmgsyRoadConnectivityStatus: 'CONNECTED',
      tapWaterCoveragePercent: 62.0,
      nearestPrimaryHealthCenterKm: 3.2,
    },
  },
  // Chennai (District)
  {
    sourceId: 'INFRA-DEMO-CHENNAI',
    sourceType: 'infrastructure_data',
    sourceName: 'Synthetic Infrastructure Indices — Chennai District',
    sourceReference: 'JanSetu AI Calibration Model (District Demo)',
    sourceYear: 2024,
    geographyLevel: 'district',
    state: 'Tamil Nadu',
    district: 'Chennai',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Infra Table CHN-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      sectorIndices: {
        Roads: 82,
        Water: 68,
        Healthcare: 92,
        Electricity: 94,
        Education: 88,
      },
      criticalDeficits: [
        'Stormwater drainage siltation in flood-prone micro-catchments',
      ],
      surveyedAssets: [],
      tapWaterCoveragePercent: 91.0,
    },
  },
];

// 3. Public Investment Evidence Records
const INVESTMENT_RECORDS = [
  // Karnataka (State)
  {
    sourceId: 'INV-DEMO-KARNATAKA',
    sourceType: 'investment_data',
    sourceName: 'Synthetic Scheme Allocations — Karnataka',
    sourceReference: 'JanSetu AI Calibration Model (State Aggregate Demo)',
    sourceYear: 2024,
    geographyLevel: 'state',
    state: 'Karnataka',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Investment Table KAR-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalSanctionedInrLakhs: 185000,
      totalExpenditureInrLakhs: 142000,
      overallUtilizationPercent: 76.8,
      activeSchemes: [
        {
          schemeName: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)',
          department: 'Water Resources Department',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 48000,
          expenditureInrLakhs: 39500,
          utilizationRatePercent: 82.3,
          status: 'IN_EXECUTION',
        },
        {
          schemeName: 'Jal Jeevan Mission (JJM)',
          department: 'Rural Drinking Water & Sanitation',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 92000,
          expenditureInrLakhs: 69000,
          utilizationRatePercent: 75.0,
          status: 'IN_EXECUTION',
        },
      ],
      primaryFundingSource: 'CENTRAL_SCHEME',
    },
  },
  // Udupi (District)
  {
    sourceId: 'INV-DEMO-UDUPI',
    sourceType: 'investment_data',
    sourceName: 'Synthetic Scheme Allocations — Udupi District',
    sourceReference: 'JanSetu AI Calibration Model (District Demo)',
    sourceYear: 2024,
    geographyLevel: 'district',
    state: 'Karnataka',
    district: 'Udupi',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Investment Table UDU-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalSanctionedInrLakhs: 8900,
      totalExpenditureInrLakhs: 6850,
      overallUtilizationPercent: 77.0,
      activeSchemes: [
        {
          schemeName: 'District Minor Irrigation Canal Modernization',
          department: 'Minor Irrigation Department, Karnataka',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 2400,
          expenditureInrLakhs: 1820,
          utilizationRatePercent: 75.8,
          status: 'IN_EXECUTION',
        },
        {
          schemeName: 'Jal Jeevan Mission Piped Village Networks',
          department: 'Rural Water Supply Division Udupi',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 4500,
          expenditureInrLakhs: 3720,
          utilizationRatePercent: 82.7,
          status: 'IN_EXECUTION',
        },
      ],
      primaryFundingSource: 'STATE_SCHEME',
    },
  },
  // Karkala (Locality)
  {
    sourceId: 'INV-DEMO-KARKALA',
    sourceType: 'investment_data',
    sourceName: 'Synthetic Scheme Allocations — Karkala Locality',
    sourceReference: 'JanSetu AI Calibration Model (Locality Demo)',
    sourceYear: 2024,
    geographyLevel: 'locality',
    state: 'Karnataka',
    district: 'Udupi',
    locality: 'Karkala',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Investment Table KARK-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalSanctionedInrLakhs: 340,
      totalExpenditureInrLakhs: 110,
      overallUtilizationPercent: 32.4,
      activeSchemes: [
        {
          schemeName: 'Karkala Lift Irrigation Pump & Weir Upgradation',
          department: 'Minor Irrigation Department, Udupi Sub-division',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 180,
          expenditureInrLakhs: 45,
          utilizationRatePercent: 25.0,
          status: 'STALLED', // Demonstrates stalled project evidence correlating with citizen complaints
        },
        {
          schemeName: 'Town Feeder Pipeline Relining',
          department: 'Municipal Public Works',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 160,
          expenditureInrLakhs: 65,
          utilizationRatePercent: 40.6,
          status: 'IN_EXECUTION',
        },
      ],
      primaryFundingSource: 'STATE_SCHEME',
    },
  },
  // Chennai (District)
  {
    sourceId: 'INV-DEMO-CHENNAI',
    sourceType: 'investment_data',
    sourceName: 'Synthetic Scheme Allocations — Chennai District',
    sourceReference: 'JanSetu AI Calibration Model (District Demo)',
    sourceYear: 2024,
    geographyLevel: 'district',
    state: 'Tamil Nadu',
    district: 'Chennai',
    dataSource: 'synthetic_demo',
    isSynthetic: true,
    lastUpdated: nowIso,
    provenance: {
      origin: 'synthetic_demo',
      publisherName: 'JanSetu AI Simulation Lab',
      sourceReference: 'Prototype Benchmark Investment Table CHN-2024',
      retrievalTimestamp: nowIso,
      isSynthetic: true,
      validationMethod: 'manual_curation',
    },
    data: {
      totalSanctionedInrLakhs: 12500,
      totalExpenditureInrLakhs: 10400,
      overallUtilizationPercent: 83.2,
      activeSchemes: [
        {
          schemeName: 'Integrated Stormwater Micro-Drainage',
          department: 'Greater Chennai Corporation',
          financialYear: '2023-2024',
          sanctionedBudgetInrLakhs: 12500,
          expenditureInrLakhs: 10400,
          utilizationRatePercent: 83.2,
          status: 'IN_EXECUTION',
        },
      ],
      primaryFundingSource: 'STATE_SCHEME',
    },
  },
];

async function seedEvidenceDemo() {
  console.log(`\n======================================================`);
  console.log(`JanSetu AI — Synthetic Evidence Demo Data Seeder`);
  console.log(`Target Project: ${projectId}`);
  console.log(`======================================================\n`);

  let demoCount = 0;
  let infraCount = 0;
  let invCount = 0;

  // 1. Seed Demographics
  console.log('Seeding evidence_demographics...');
  const demoCol = db.collection('evidence_demographics');
  for (const record of DEMOGRAPHIC_RECORDS) {
    const norm = normalizeGeography(record.state, record.district, record.locality);
    const docId = computeGeographyDocId(norm.state, norm.district, norm.locality);

    await demoCol.doc(docId).set({
      ...record,
      state: norm.state,
      district: norm.district || null,
      locality: norm.locality || null,
      geographyLevel: norm.geographyLevel,
    }, { merge: true });

    demoCount += 1;
    console.log(`  [+] Demographic: ${norm.locationKey} (${norm.geographyLevel}) -> docId: ${docId.slice(0, 12)}...`);
  }

  // 2. Seed Infrastructure
  console.log('\nSeeding evidence_infrastructure...');
  const infraCol = db.collection('evidence_infrastructure');
  for (const record of INFRASTRUCTURE_RECORDS) {
    const norm = normalizeGeography(record.state, record.district, record.locality);
    const docId = computeGeographyDocId(norm.state, norm.district, norm.locality);

    await infraCol.doc(docId).set({
      ...record,
      state: norm.state,
      district: norm.district || null,
      locality: norm.locality || null,
      geographyLevel: norm.geographyLevel,
    }, { merge: true });

    infraCount += 1;
    console.log(`  [+] Infrastructure: ${norm.locationKey} (${norm.geographyLevel}) -> docId: ${docId.slice(0, 12)}...`);
  }

  // 3. Seed Investments
  console.log('\nSeeding evidence_public_investments...');
  const invCol = db.collection('evidence_public_investments');
  for (const record of INVESTMENT_RECORDS) {
    const norm = normalizeGeography(record.state, record.district, record.locality);
    const docId = computeGeographyDocId(norm.state, norm.district, norm.locality);

    await invCol.doc(docId).set({
      ...record,
      state: norm.state,
      district: norm.district || null,
      locality: norm.locality || null,
      geographyLevel: norm.geographyLevel,
    }, { merge: true });

    invCount += 1;
    console.log(`  [+] Public Investment: ${norm.locationKey} (${norm.geographyLevel}) -> docId: ${docId.slice(0, 12)}...`);
  }

  console.log(`\n======================================================`);
  console.log(`✅ Successfully seeded Phase 6B synthetic demo evidence:`);
  console.log(`   - Demographic records: ${demoCount}`);
  console.log(`   - Infrastructure records: ${infraCount}`);
  console.log(`   - Investment records: ${invCount}`);
  console.log(`   - Total evidence records: ${demoCount + infraCount + invCount}`);
  console.log(`All records explicitly labeled: dataSource: "synthetic_demo"`);
  console.log(`======================================================\n`);
}

seedEvidenceDemo().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
