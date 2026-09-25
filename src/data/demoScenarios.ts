/**
 * JanSetu AI — Curated Multi-Sector Demo Scenarios (Phase 5)
 * 
 * Realistic, verified scenarios covering diverse linguistic regions and civic sectors.
 * Each scenario is strictly tagged with dataSource: "synthetic_demo" to maintain
 * transparent decision support principles.
 */

export interface CivicDemoScenario {
  id: string;
  sector: 'Agriculture' | 'Water & Sanitation' | 'Healthcare' | 'Electricity' | 'Roads & Transport';
  title: string;
  locality: string;
  district: string;
  state: string;
  originalLanguage: string;
  sourceType: 'voice' | 'text';
  complaintText: string;
  originalTranscript: string;
  englishTranslation: string;
  reportedInfrastructure: string;
  affectedPopulation: number;
  urgency: 'High' | 'Medium' | 'Low';
  suggestedDepartment: string;
  dataSource: 'synthetic_demo';
}

export const CIVIC_DEMO_SCENARIOS: CivicDemoScenario[] = [
  {
    id: 'SCENARIO-AGRI-01',
    sector: 'Agriculture',
    title: 'Swarna Feeder Canal Breach & Irrigation Shortage',
    locality: 'Karkala',
    district: 'Udupi',
    state: 'Karnataka',
    originalLanguage: 'Kannada',
    sourceType: 'voice',
    complaintText: 'ನಮ್ಮ ಕಾರ್ಕಳ ತಾಲೂಕಿನ ಗ್ರಾಮದಲ್ಲಿ ಕೃಷಿಗೆ ನೀರಿನ ತೀವ್ರ ಕೊರತೆ ಎದುರಾಗಿದೆ. ಹತ್ತಿರದ ನೀರಾವರಿ ಕಾಲುವೆ ಒಡೆದು ಹೋಗಿದ್ದು, ಸುಮಾರು 700 ರೈತ ಕುಟುಂಬಗಳು ಸಂಕಷ್ಟದಲ್ಲಿವೆ. ದಯವಿಟ್ಟು ನೀರಾವರಿ ಕಾಲುವೆಯನ್ನು ತಕ್ಷಣ ದುರಸ್ತಿ ಮಾಡಿ.',
    originalTranscript: 'ನಮ್ಮ ಕಾರ್ಕಳ ತಾಲೂಕಿನ ಗ್ರಾಮದಲ್ಲಿ ಕೃಷಿಗೆ ನೀರಿನ ತೀವ್ರ ಕೊರತೆ ಎದುರಾಗಿದೆ. ಹತ್ತಿರದ ನೀರಾವರಿ ಕಾಲುವೆ ಒಡೆದು ಹೋಗಿದ್ದು, ಸುಮಾರು 700 ರೈತ ಕುಟುಂಬಗಳು ಸಂಕಷ್ಟದಲ್ಲಿವೆ. ದಯವಿಟ್ಟು ನೀರಾವರಿ ಕಾಲುವೆಯನ್ನು ತಕ್ಷಣ ದುರಸ್ತಿ ಮಾಡಿ.',
    englishTranslation: 'In our village in Karkala taluk, there is a severe shortage of water for agriculture. The nearby irrigation canal has breached, and around 700 farming families are in distress. Please repair the irrigation canal immediately.',
    reportedInfrastructure: 'Irrigation Canal',
    affectedPopulation: 700,
    urgency: 'High',
    suggestedDepartment: 'Ministry of Jal Shakti',
    dataSource: 'synthetic_demo',
  },
  {
    id: 'SCENARIO-WATER-02',
    sector: 'Water & Sanitation',
    title: 'Contaminated Pipeline & Saline Infiltration',
    locality: 'Sheo Village',
    district: 'Barmer',
    state: 'Rajasthan',
    originalLanguage: 'Hindi',
    sourceType: 'voice',
    complaintText: 'शिव गांव में पेयजल की मुख्य पाइपलाइन पिछले दो हफ्तों से टूटी पड़ी है। नलों में गंदा और खारा पानी आ रहा है जिससे 1200 से अधिक ग्रामीण बीमार हो रहे हैं। नई बोरवेल और पाइपलाइन मरम्मत की तत्काल आवश्यकता है।',
    originalTranscript: 'शिव गांव में पेयजल की मुख्य पाइपलाइन पिछले दो हफ्तों से टूटी पड़ी है। नलों में गंदा और खारा पानी आ रहा है जिससे 1200 से अधिक ग्रामीण बीमार हो रहे हैं। नई बोरवेल और पाइपलाइन मरम्मत की तत्काल आवश्यकता है।',
    englishTranslation: 'In Sheo village, the main drinking water pipeline has been broken for the last two weeks. Dirty and saline water is coming into taps, making over 1,200 villagers sick. Urgent deep borewell and pipeline repair needed.',
    reportedInfrastructure: 'Drinking Water Pipeline',
    affectedPopulation: 1200,
    urgency: 'High',
    suggestedDepartment: 'Public Health Engineering Department (PHED)',
    dataSource: 'synthetic_demo',
  },
  {
    id: 'SCENARIO-HEALTH-03',
    sector: 'Healthcare',
    title: 'Primary Health Centre Doctor Vacancy & Cold-Chain Failure',
    locality: 'Pennagaram',
    district: 'Dharmapuri',
    state: 'Tamil Nadu',
    originalLanguage: 'Tamil',
    sourceType: 'text',
    complaintText: 'பென்னாகரம் ஆரம்ப சுகாதார நிலையத்தில் கடந்த 4 மாதங்களாக மருத்துவர் இல்லை. தடுப்பூசி குளிரூட்டி இயங்காததால் தாய்மார்கள் 25 கி.மீ தொலைவு தர்மபுரி செல்ல வேண்டியுள்ளது. 3500 கிராம மக்கள் பாதிக்கப்பட்டுள்ளனர்.',
    originalTranscript: 'பென்னாகரம் ஆரம்ப சுகாதார நிலையத்தில் கடந்த 4 மாதங்களாக மருத்துவர் இல்லை. தடுப்பூசி குளிரூட்டி இயங்காததால் தாய்மார்கள் 25 கி.மீ தொலைவு தர்மபுரி செல்ல வேண்டியுள்ளது. 3500 கிராம மக்கள் பாதிக்கப்பட்டுள்ளனர்.',
    englishTranslation: 'Pennagaram Primary Health Centre has had no medical officer for the past 4 months. The vaccine cold-chain refrigerator is defunct, forcing mothers to travel 25 km to Dharmapuri. Approximately 3,500 rural citizens are affected.',
    reportedInfrastructure: 'Primary Health Centre',
    affectedPopulation: 3500,
    urgency: 'High',
    suggestedDepartment: 'Ministry of Health and Family Welfare',
    dataSource: 'synthetic_demo',
  },
  {
    id: 'SCENARIO-ELEC-04',
    sector: 'Electricity',
    title: 'Agricultural Transformer Burnout & Voltage Collapse',
    locality: 'Umred Taluk',
    district: 'Nagpur',
    state: 'Maharashtra',
    originalLanguage: 'Marathi',
    sourceType: 'voice',
    complaintText: 'उमरेड तालुक्यातील कृषी फीडरचा १०० কেव्हीए ट्रान्सफॉर्मर जळाला आहे. सलग १० दिवसांपासून वीज नसल्यामुळे विहिरींचे पंप बंद आहेत आणि कापसाचे पीक वाळत आहे. ९०० शेतकरी कुटुंबे संकटात आहेत.',
    originalTranscript: 'उमरेड तालुक्यातील कृषी फीडरचा १०० কেव्हीए ट्रान्सफॉर्मर जळाला आहे. सलग १० दिवसांपासून वीज नसल्यामुळे विहिरींचे पंप बंद आहेत आणि कापसाचे पीक वाळत आहे. ९०० शेतकरी कुटुंबे संकटात आहेत.',
    englishTranslation: 'The 100 kVA distribution transformer on the agricultural feeder in Umred taluk burned out. Due to continuous power failure for 10 days, irrigation pumps are stopped and cotton crops are drying. Around 900 farming families affected.',
    reportedInfrastructure: 'Distribution Transformer',
    affectedPopulation: 900,
    urgency: 'High',
    suggestedDepartment: 'State Electricity Distribution Company (MSEDCL)',
    dataSource: 'synthetic_demo',
  },
  {
    id: 'SCENARIO-ROADS-05',
    sector: 'Roads & Transport',
    title: 'Arterial Bituminous Road Washout & Ambulance Isolation',
    locality: 'Rohania Ward 7',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    originalLanguage: 'Hindi',
    sourceType: 'text',
    complaintText: 'रोहनिया वार्ड ७ की मुख्य संपर्क सड़क पिछले तीन महीने से पूरी तरह उखड़ चुकी है। भारी बारिश से सड़क पर तीन फीट गहरे गड्ढे हो गए हैं जिससे अस्पताल जाने वाली एम्बुलेंस भी नहीं आ पाती। लगभग २८०० नागरिक प्रभावित हैं।',
    originalTranscript: 'रोहनिया वार्ड ७ की मुख्य संपर्क सड़क पिछले तीन महीने से पूरी तरह उखड़ चुकी है। भारी बारिश से सड़क पर तीन फीट गहरे गड्ढे हो गए हैं जिससे अस्पताल जाने वाली एम्बुलेंस भी नहीं आ पाती। लगभग २८०० नागरिक प्रभावित हैं।',
    englishTranslation: 'The main link road in Rohania Ward 7 has been completely eroded for the past three months. Heavy monsoon rains created three-foot-deep ditches, preventing ambulances from reaching patients. Approximately 2,800 residents affected.',
    reportedInfrastructure: 'Arterial Bituminous Road',
    affectedPopulation: 2800,
    urgency: 'High',
    suggestedDepartment: 'Public Works Department (PWD)',
    dataSource: 'synthetic_demo',
  },
];
