import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Safeguard 1: Manual confirmation flag is strictly required
if (!process.argv.includes('--confirm-seed')) {
  console.error('\n❌ Execution Blocked.');
  console.error('The synthetic demo seed mechanism cannot be triggered accidentally in production.');
  console.error('To run manual seeding in development, execute:');
  console.error('  node scripts/seedDemoData.mjs --confirm-seed\n');
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

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = getFirestore(app);

const SYNTHETIC_REQUESTS = [
  // 1. Karnataka - Karkala (Agriculture & Water)
  {
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
    category: 'Agriculture',
    issue: 'Severe irrigation water deficit during summer crop season',
    originalText: 'Farmers across Karkala taluk are facing severe irrigation water shortage due to dry feeder canals. Approximately 1200 farming families are in distress.',
    language: 'English',
    translatedText: 'Farmers across Karkala taluk are facing severe irrigation water shortage due to dry feeder canals. Approximately 1200 farming families are in distress.',
    affectedInfrastructure: 'Lift Irrigation Canal & Pump System',
    urgency: 'High',
    affectedPopulationEstimate: 1200,
    governmentDepartment: 'Department of Agriculture, Government of Karnataka',
    summary: 'Severe drought in Karkala has left 1200 farming families without canal irrigation water for their paddy crops.',
    recommendedAction: 'Dredge silt from the primary lift irrigation canal and deploy solar pumps to revive water distribution.',
  },
  {
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
    category: 'Water & Sanitation',
    issue: 'Broken drinking water pipeline along main market road',
    originalText: 'The municipal drinking water trunk line in Karkala town has developed three major leakages, wasting thousands of litres daily.',
    language: 'English',
    translatedText: 'The municipal drinking water trunk line in Karkala town has developed three major leakages, wasting thousands of litres daily.',
    affectedInfrastructure: 'Municipal Drinking Water Pipeline',
    urgency: 'Medium',
    affectedPopulationEstimate: 4500,
    governmentDepartment: 'Karnataka Urban Water Supply and Drainage Board',
    summary: 'Water pipeline leakages on Karkala market road causing low pressure and contamination risks for 4500 residents.',
    recommendedAction: 'Replace degraded ductile iron pipe sections and install acoustic leak monitoring meters.',
  },
  {
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
    category: 'Roads & Transport',
    issue: 'Unpaved connecting road between Karkala and rural tribal hamlets',
    originalText: 'The 4 km link road connecting Karkala to interior forest hamlets is completely eroded after monsoon floods.',
    language: 'English',
    translatedText: 'The 4 km link road connecting Karkala to interior forest hamlets is completely eroded after monsoon floods.',
    affectedInfrastructure: 'Rural Arterial Road',
    urgency: 'High',
    affectedPopulationEstimate: 850,
    governmentDepartment: 'Public Works Department (PWD), Karnataka',
    summary: 'Eroded rural link road isolates tribal residents from emergency medical access in Karkala.',
    recommendedAction: 'Re-lay road with all-weather bituminous macadam and concrete culverts.',
  },

  // 2. Karnataka - Mangaluru (Water & Sanitation / Roads)
  {
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    category: 'Water & Sanitation',
    issue: 'Stormwater drainage clog causing seasonal inundation near central bus station',
    originalText: 'Continuous sewage backup in stormwater channels near State Bank bus terminus causing hazardous water stagnation for 8000 commuters daily.',
    language: 'English',
    translatedText: 'Continuous sewage backup in stormwater channels near State Bank bus terminus causing hazardous water stagnation for 8000 commuters daily.',
    affectedInfrastructure: 'Stormwater Outfall Channel',
    urgency: 'High',
    affectedPopulationEstimate: 8000,
    governmentDepartment: 'Mangaluru City Corporation',
    summary: 'Clogged primary stormwater outfall channel causing chronic flooding at Mangaluru city center.',
    recommendedAction: 'Deploy mechanized suction cleaners and remodel the outfall discharge gradient into Gurupura river.',
  },
  {
    locality: 'Mangaluru',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    category: 'Roads & Transport',
    issue: 'Heavy freight transit potholes on port connectivity highway',
    originalText: 'Severe cratering on NH-66 bypass leading to New Mangalore Port, causing truck breakdowns and fatal two-wheeler accidents.',
    language: 'English',
    translatedText: 'Severe cratering on NH-66 bypass leading to New Mangalore Port, causing truck breakdowns and fatal two-wheeler accidents.',
    affectedInfrastructure: 'National Highway Port Link',
    urgency: 'High',
    affectedPopulationEstimate: 15000,
    governmentDepartment: 'National Highways Authority of India (NHAI)',
    summary: 'Port freight corridor highway surface degraded, risking heavy commercial and civilian traffic accidents.',
    recommendedAction: 'Undertake micro-surfacing and reinforced concrete overlay along port transit lanes.',
  },

  // 3. Karnataka - Mysuru (Education & Electricity)
  {
    locality: 'Mysuru',
    district: 'Mysuru',
    state: 'Karnataka',
    category: 'Education',
    issue: 'Dilapidated government higher primary school building and lack of sanitation facilities',
    originalText: 'Two classrooms in the municipal school near Chamundi foothill are leaking dangerously and toilets for girls have been non-functional for 6 months.',
    language: 'English',
    translatedText: 'Two classrooms in the municipal school near Chamundi foothill are leaking dangerously and toilets for girls have been non-functional for 6 months.',
    affectedInfrastructure: 'Government School Building & Sanitation Block',
    urgency: 'High',
    affectedPopulationEstimate: 420,
    governmentDepartment: 'Department of Public Instruction, Karnataka',
    summary: 'Unsafe structural roof leaks and broken sanitation facilities threatening 420 elementary students.',
    recommendedAction: 'Sanction emergency roof waterproofing and construct modernized bio-toilets under school infrastructure grants.',
  },
  {
    locality: 'Mysuru',
    district: 'Mysuru',
    state: 'Karnataka',
    category: 'Electricity',
    issue: 'Frequent voltage spikes burning home appliances in Saraswathipuram',
    originalText: 'Distribution transformer in our residential block trips 6 times daily due to overload, destroying home water pumps.',
    language: 'English',
    translatedText: 'Distribution transformer in our residential block trips 6 times daily due to overload, destroying home water pumps.',
    affectedInfrastructure: '100 kVA Distribution Transformer',
    urgency: 'Medium',
    affectedPopulationEstimate: 650,
    governmentDepartment: 'Chamundeshwari Electricity Supply Corporation (CESC)',
    summary: 'Overloaded transformer causing severe power instability and household appliance losses for 650 residents.',
    recommendedAction: 'Upgrade substation feeder capacity and replace 100 kVA transformer with a 250 kVA unit.',
  },

  // 4. Kerala - Kochi (Climate & Environment / Water & Sanitation)
  {
    locality: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    category: 'Climate & Environment',
    issue: 'Plastic waste and water hyacinth choking backwater canals',
    originalText: 'Perandoor canal in central Kochi is completely choked with plastic debris, generating foul odor and stopping water ferry movement.',
    language: 'English',
    translatedText: 'Perandoor canal in central Kochi is completely choked with plastic debris, generating foul odor and stopping water ferry movement.',
    affectedInfrastructure: 'Perandoor Inland Canal',
    urgency: 'High',
    affectedPopulationEstimate: 12000,
    governmentDepartment: 'Kochi Municipal Corporation & Irrigation Department',
    summary: 'Choked urban canals in Kochi creating toxic public health risks and halting eco-transit routes.',
    recommendedAction: 'Deploy automated weed harvesters, erect floating trash barriers, and install continuous aerators.',
  },
  {
    locality: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    category: 'Water & Sanitation',
    issue: 'Saltwater intrusion into groundwater wells in coastal Chellanam panchayat',
    originalText: 'Seawater has seeped into drinking water open wells of 300 coastal households following high tide surges.',
    language: 'English',
    translatedText: 'Seawater has seeped into drinking water open wells of 300 coastal households following high tide surges.',
    affectedInfrastructure: 'Community Groundwater Wells & Sea Wall',
    urgency: 'High',
    affectedPopulationEstimate: 1800,
    governmentDepartment: 'Kerala Water Authority (KWA)',
    summary: 'Coastal saline ingress rendering open water sources undrinkable for 1800 coastal residents.',
    recommendedAction: 'Extend piped water supply network and install localized reverse osmosis community water kiosks.',
  },

  // 5. Tamil Nadu - Coimbatore (Roads & Healthcare)
  {
    locality: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    category: 'Roads & Transport',
    issue: 'Severe traffic bottleneck on Singanallur railway overbridge',
    originalText: 'The narrow two-lane rail overbridge at Singanallur causes 45-minute daily traffic jams for industrial workers and ambulances.',
    language: 'English',
    translatedText: 'The narrow two-lane rail overbridge at Singanallur causes 45-minute daily traffic jams for industrial workers and ambulances.',
    affectedInfrastructure: 'Railway Overbridge (ROB)',
    urgency: 'High',
    affectedPopulationEstimate: 25000,
    governmentDepartment: 'Highways and Minor Ports Department, Tamil Nadu',
    summary: 'Narrow rail overbridge bottlenecking Coimbatore industrial and emergency transit.',
    recommendedAction: 'Expedite construction of an additional 4-lane elevated rotary corridor.',
  },
  {
    locality: 'Coimbatore',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    category: 'Healthcare',
    issue: 'Primary Health Centre lacks emergency oxygen concentrators and nighttime staff',
    originalText: 'The Government Primary Health Centre in Madukkarai has no medical officer available after 5 PM, forcing patients to travel 22 km.',
    language: 'English',
    translatedText: 'The Government Primary Health Centre in Madukkarai has no medical officer available after 5 PM, forcing patients to travel 22 km.',
    affectedInfrastructure: 'Primary Health Centre (PHC)',
    urgency: 'High',
    affectedPopulationEstimate: 9500,
    governmentDepartment: 'Health and Family Welfare Department, Tamil Nadu',
    summary: 'Nighttime healthcare desert for 9500 peri-urban residents due to lack of medical staffing at local PHC.',
    recommendedAction: 'Sanction 24x7 doctor roster and equip the facility with a 5-bed stabilization ward.',
  },

  // 6. Maharashtra - Pune (Roads & Electricity)
  {
    locality: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    category: 'Roads & Transport',
    issue: 'Unpaved potholes and unlit stretches along Hinjewadi Phase 3 tech corridor',
    originalText: 'Over 3 km of the link road connecting tech parks to employee housing has severe potholes and no functional streetlighting.',
    language: 'English',
    translatedText: 'Over 3 km of the link road connecting tech parks to employee housing has severe potholes and no functional streetlighting.',
    affectedInfrastructure: 'Industrial Transit Arterial',
    urgency: 'High',
    affectedPopulationEstimate: 18000,
    governmentDepartment: 'Maharashtra Industrial Development Corporation (MIDC) & PMRDA',
    summary: 'Dangerous road conditions and zero illumination on Pune IT corridor posing acute safety risks for late-night staff.',
    recommendedAction: 'Resurface roadway with mastic asphalt and install smart high-mast LED poles.',
  },
  {
    locality: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    category: 'Electricity',
    issue: 'Hazardous hanging high-voltage electrical wires near market square in Hadapsar',
    originalText: 'Sagging 11 kV power lines are hanging within 8 feet of the vegetable market stalls, posing high electrocution danger.',
    language: 'English',
    translatedText: 'Sagging 11 kV power lines are hanging within 8 feet of the vegetable market stalls, posing high electrocution danger.',
    affectedInfrastructure: '11 kV High-Voltage Overhead Distribution Lines',
    urgency: 'High',
    affectedPopulationEstimate: 5000,
    governmentDepartment: 'Maharashtra State Electricity Distribution Company Limited (MSEDCL)',
    summary: 'Low-hanging live high-tension cables creating immediate public fatality risk in crowded vegetable market.',
    recommendedAction: 'Restring lines with aerial bunched cables (ABC) and increase pole elevation.',
  },

  // 7. Rajasthan - Jaipur (Water & Sanitation / Agriculture)
  {
    locality: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    category: 'Water & Sanitation',
    issue: 'High fluoride and salinity in village community tubewells in Sanganer block',
    originalText: 'Community tubewell drinking water in rural Jaipur cluster contains dangerous fluoride levels causing bone deformities in children.',
    language: 'English',
    translatedText: 'Community tubewell drinking water in rural Jaipur cluster contains dangerous fluoride levels causing bone deformities in children.',
    affectedInfrastructure: 'Deep Tubewell Water Supply',
    urgency: 'High',
    affectedPopulationEstimate: 3200,
    governmentDepartment: 'Public Health Engineering Department (PHED), Rajasthan',
    summary: 'Fluoride contamination in drinking tubewells affecting 3200 residents across rural Sanganer.',
    recommendedAction: 'Connect village to Bisalpur dam surface water pipeline and install defluoridation plants.',
  },
  {
    locality: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    category: 'Agriculture',
    issue: 'Lack of cold storage and farm-gate market facilities for vegetable growers',
    originalText: 'Tomato and pea farmers in Bassi are forced to sell produce at throwaway prices or let it rot due to zero refrigerated warehouse facility.',
    language: 'English',
    translatedText: 'Tomato and pea farmers in Bassi are forced to sell produce at throwaway prices or let it rot due to zero refrigerated warehouse facility.',
    affectedInfrastructure: 'Post-Harvest Cold Storage Facility',
    urgency: 'Medium',
    affectedPopulationEstimate: 1400,
    governmentDepartment: 'Rajasthan State Agricultural Marketing Board',
    summary: 'Heavy post-harvest losses for 1400 vegetable farming families due to lack of cold chain infrastructure.',
    recommendedAction: 'Construct a solar-powered multi-commodity cold storage warehouse under rural agricultural grants.',
  },

  // 8. Uttar Pradesh - Lucknow (Healthcare & Water & Sanitation)
  {
    locality: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    category: 'Water & Sanitation',
    issue: 'Raw untreated municipal sewage discharge into Gomti riverbank residential colony',
    originalText: 'Broken sewer trunk line is flooding the residential streets of Ghaus Nagar and discharging toxic sewage near human habitations.',
    language: 'Hindi',
    translatedText: 'A broken sewer trunk line is flooding the residential streets of Ghaus Nagar in Lucknow and discharging toxic sewage near human habitations.',
    affectedInfrastructure: 'Trunk Sewer Line & Pumping Station',
    urgency: 'High',
    affectedPopulationEstimate: 7500,
    governmentDepartment: 'Lucknow Jal Sansthan & UP Jal Nigam',
    summary: 'Raw sewage inundation in residential area creating severe dengue and cholera epidemic hazard for 7500 residents.',
    recommendedAction: 'Deploy high-capacity suction jetting machines and reconstruct collapsed masonry sewer culvert.',
  },
  {
    locality: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    category: 'Healthcare',
    issue: 'Lack of anti-rabies and snake-venom serums at community health centre in Mohanlalganj',
    originalText: 'The Mohanlalganj Community Health Centre has been without anti-rabies vaccine for four months, endangering rural bite victims.',
    language: 'Hindi',
    translatedText: 'The Mohanlalganj Community Health Centre in Lucknow district has been without anti-rabies vaccine for four months, endangering rural bite victims.',
    affectedInfrastructure: 'Community Health Centre (CHC) Pharmacy',
    urgency: 'High',
    affectedPopulationEstimate: 11000,
    governmentDepartment: 'Department of Medical Health & Family Welfare, Uttar Pradesh',
    summary: 'Life-saving vaccine stockout in peri-urban Lucknow exposing 11,000 residents to preventable rabies mortality.',
    recommendedAction: 'Establish guaranteed cold-chain inventory buffer and deliver 500 vials of anti-rabies serum immediately.',
  },
];

async function seedData() {
  console.log(`\n======================================================`);
  console.log(`JanSetu AI — Synthetic Demo Data Seed Utility`);
  console.log(`Project ID: ${projectId}`);
  console.log(`======================================================\n`);

  const collectionRef = db.collection('citizen_requests');
  const counterRef = db.collection('system_counters').doc('citizen_requests');

  // Check how many synthetic records already exist
  const existingSynthetic = await collectionRef.where('dataSource', '==', 'synthetic_demo').get();
  console.log(`Current existing synthetic demo records in Firestore: ${existingSynthetic.size}`);

  // Fetch current counter
  const counterDoc = await counterRef.get();
  let currentCounter = counterDoc.exists && typeof counterDoc.data()?.lastNumber === 'number'
    ? counterDoc.data().lastNumber
    : 0;

  console.log(`Current system counter lastNumber: ${currentCounter}`);
  console.log(`Preparing to seed ${SYNTHETIC_REQUESTS.length} synthetic demo requests...\n`);

  let addedCount = 0;

  for (const item of SYNTHETIC_REQUESTS) {
    currentCounter += 1;
    const requestId = `JNS-${String(currentCounter).padStart(6, '0')}`;

    const docData = {
      requestId,
      originalText: item.originalText,
      language: item.language,
      translatedText: item.translatedText,
      category: item.category,
      issue: item.issue,
      state: item.state,
      district: item.district,
      locality: item.locality,
      locationSource: 'citizen_provided',
      locationConfidence: 'high',
      affectedInfrastructure: item.affectedInfrastructure,
      urgency: item.urgency,
      affectedPopulationEstimate: item.affectedPopulationEstimate,
      governmentDepartment: item.governmentDepartment,
      departmentSource: 'ai_inferred',
      summary: item.summary,
      recommendedAction: item.recommendedAction,
      status: 'new',
      dataSource: 'synthetic_demo', // Explicitly marked as synthetic demo data
      createdAt: FieldValue.serverTimestamp(),
    };

    await collectionRef.add(docData);
    addedCount += 1;
    console.log(`  [+] Seeded ${requestId} -> ${item.locality}, ${item.state} (${item.category} | ${item.urgency} Urgency)`);
  }

  // Update counter in transaction / set
  await counterRef.set(
    {
      lastNumber: currentCounter,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(`\n======================================================`);
  console.log(`✅ Successfully seeded ${addedCount} synthetic demo records.`);
  console.log(`Updated system counter lastNumber to: ${currentCounter}`);
  console.log(`Every seeded record strictly includes: dataSource: "synthetic_demo"`);
  console.log(`======================================================\n`);
}

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
