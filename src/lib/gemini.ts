import { GoogleGenAI } from '@google/genai';
import { GeminiAnalysisResult, GeminiCategory, GeminiUrgency } from '@/types';

const ALLOWED_CATEGORIES: GeminiCategory[] = [
  'Roads & Transport',
  'Healthcare',
  'Water & Sanitation',
  'Education',
  'Agriculture',
  'Electricity',
  'Climate & Environment',
  'Digital Public Infrastructure',
  'Public Safety',
  'Housing',
  'Other',
];

const ALLOWED_URGENCIES: GeminiUrgency[] = ['Low', 'Medium', 'High'];

const SYSTEM_INSTRUCTION = `You are the JanSetu AI Civic Intelligence Engine for India.
Your mission is to analyze citizen development complaints/requests and return pure structured JSON adhering strictly to the schema below.

GEMINI ANALYSIS SCHEMA:
{
  "language": "string (The detected language name, e.g. English, Hindi, Marathi, Tamil, Bengali, Telugu, Kannada, Gujarati, Punjabi, Odia, etc.)",
  "translated_text": "string (English translation of the complaint. If original is in English, keep original English text)",
  "category": "string (Must strictly be one of: 'Roads & Transport', 'Healthcare', 'Water & Sanitation', 'Education', 'Agriculture', 'Electricity', 'Climate & Environment', 'Digital Public Infrastructure', 'Public Safety', 'Housing', 'Other')",
  "issue": "string (Concise title of the core civic development issue detected)",
  "state": "string (Extract ONLY when an actual state name is explicitly mentioned in the text, otherwise empty string \"\")",
  "district": "string (Extract ONLY when an actual district name is explicitly mentioned in the text, otherwise empty string \"\")",
  "locality": "string (Extract specific town/village/ward/neighborhood name ONLY when an actual named place is explicitly mentioned, otherwise empty string \"\")",
  "location_source": "string (Must be 'citizen_provided' if an explicit named place is stated, otherwise 'not_provided')",
  "location_confidence": "string (Must be 'high' if location_source is 'citizen_provided', and MUST strictly be 'none' if location_source is 'not_provided')",
  "affected_infrastructure": "string (The physical or civic asset affected, e.g. Irrigation facility, Arterial road, Primary Health Centre, Stormwater canal, Streetlights, School boundary wall, Transformer, etc.)",
  "urgency": "string (Must strictly be one of: 'Low', 'Medium', 'High')",
  "affected_population_estimate": "number or null (Extract ONLY if explicitly stated in input, e.g. 700. Never invent population numbers, return null if not explicitly mentioned)",
  "government_department": "string (Relevant Indian government department or ministry, e.g. Ministry of Jal Shakti, Public Works Department (PWD), Department of Agriculture & Farmers Welfare, Ministry of Health and Family Welfare, State Electricity Distribution Company, Municipal Corporation, etc.)",
  "department_source": "string (Must be 'citizen_provided' if the citizen explicitly named this government department in their complaint text, otherwise 'ai_inferred')",
  "summary": "string (Concise 1-2 sentence executive summary of the problem)",
  "recommended_action": "string (Concrete, actionable development or engineering recommendation to address the problem)"
}

CRITICAL LOCATION RULES (ABSOLUTE PRIORITY):
1. Never infer, guess, assume, or hallucinate a geographic location under any circumstances.
2. Only extract state, district, or locality when an explicit geographic proper name is stated in the citizen's complaint text.
3. If the citizen uses relative or generic phrases such as:
   - "our village" / "गांव" / "गाँव"
   - "my town" / "शहर"
   - "nearby" / "पास में"
   - "our area" / "हमारा इलाका"
   - "our district" / "हमारा जिला"
   - "here" / "यहाँ" / "यहाँ पर"
   WITHOUT giving the actual proper geographic name, you MUST leave state: "", district: "", locality: "".
   In this case, location_source MUST be "not_provided" and location_confidence MUST be "none".
4. Never use model knowledge, IP location, browser location, default location, server location, or inferred geography (e.g. NEVER default to Delhi or any other city).
5. For benchmark complaints with no geographic names (e.g. "Farmers in our village are facing severe water shortages..."), the result MUST contain:
   state: ""
   district: ""
   locality: ""
   location_source: "not_provided"
   location_confidence: "none"
6. If an actual proper location name is explicitly provided (e.g. "Farmers in Karkala, Karnataka..."), extract:
   locality: "Karkala"
   state: "Karnataka"
   district: "" (unless a district is also explicitly named)
   location_source: "citizen_provided"
   location_confidence: "high"
7. If location_source is "not_provided", location_confidence MUST strictly be "none".
8. Do not generate latitude or longitude coordinates.

CRITICAL DEPARTMENT RULES:
1. Do not present an inferred government department as a confirmed fact.
2. If the citizen explicitly named the department in their complaint, set department_source: "citizen_provided".
3. If the department is suggested/inferred by AI analysis, set department_source: "ai_inferred".

OTHER RULES:
1. Detect the language accurately and translate non-English input into English.
2. Classify the development problem strictly into one of the 11 allowed categories.
3. Extract affected population ONLY when explicitly stated in numbers or words (e.g. 700 families -> 700). Never invent population numbers; return null if not stated.
4. Identify affected infrastructure asset.
5. Determine urgency (Low, Medium, High) from the information provided.
6. Return pure structured JSON matching the exact schema above.`;

const GENERIC_LOCALITY_WORDS = new Set([
  'our village',
  'village',
  'my village',
  'the village',
  'our town',
  'town',
  'my town',
  'nearby',
  'our area',
  'area',
  'here',
  'our district',
  'district',
  'city',
  'our city',
  'गांव',
  'गाँव',
  'हमारा गांव',
  'हमारा गाँव',
  'हमारा इलाका',
  'इलाका',
  'मोहल्ला',
  'हमारा मोहल्ला',
]);

export async function analyzeCitizenComplaint(
  complaintText: string,
  contextLocation?: { state?: string; district?: string; locality?: string; selectedLanguage?: string }
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured in the server environment. Please set GEMINI_API_KEY in .env.local.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let userPrompt = `Citizen Development Request:\n"${complaintText.trim()}"`;

  // Only append explicit non-empty location hints if genuinely provided by the user
  if (contextLocation) {
    const hints: string[] = [];
    if (contextLocation.state && contextLocation.state.trim() && contextLocation.state !== 'Select State') {
      hints.push(`State: ${contextLocation.state.trim()}`);
    }
    if (contextLocation.district && contextLocation.district.trim()) {
      hints.push(`District: ${contextLocation.district.trim()}`);
    }
    if (contextLocation.locality && contextLocation.locality.trim()) {
      hints.push(`Locality/Ward: ${contextLocation.locality.trim()}`);
    }

    if (hints.length > 0) {
      userPrompt += `\n\nExplicit Location metadata entered by citizen in form fields:\n${hints.join('\n')}`;
    }
  }

  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
  ];
  let rawText = '';
  let lastError: any = null;
  const maxRetries = candidateModels.length;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentModel = candidateModels[attempt];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: userPrompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1,
        },
      });

      rawText = response.text || '';
      if (rawText) break;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');
      console.warn(`[Gemini Model ${currentModel} Attempt ${attempt + 1}/${maxRetries} Warning]: ${err?.message || err}`);
      if (attempt < maxRetries - 1 && isTransient) {
        let backoffMs = 3000 * (attempt + 1);
        const matchSec = err?.message?.match(/retry in ([0-9.]+)s/i) || err?.message?.match(/retryDelay":\s*"(\d+)s/i);
        if (matchSec && matchSec[1]) {
          backoffMs = Math.min(65000, Math.ceil(parseFloat(matchSec[1]) * 1000) + 2000);
        }
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  if (!rawText) {
    throw new Error(lastError?.message || 'Gemini API returned an empty response.');
  }

  // Parse JSON safely, cleaning any accidental code fence formatting
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err: any) {
    // Resilient fallback: extract substring between first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(candidate);
      } catch {
        // Repair accidental unescaped newline quote collisions in model output
        try {
          const repaired = candidate.replace(/:\s*"([^"]*)"\s*\n\s*([a-zA-Z0-9\s,.'-]*)"\s*,?/g, ': "$1 $2",');
          parsed = JSON.parse(repaired);
        } catch {
          throw new Error(`Failed to parse Gemini structured JSON response: ${err.message}. Raw output: ${rawText}`);
        }
      }
    } else {
      throw new Error(`Failed to parse Gemini structured JSON response: ${err.message}. Raw output: ${rawText}`);
    }
  }

  // Normalize category
  let category = parsed.category || 'Other';
  if (!ALLOWED_CATEGORIES.includes(category as GeminiCategory)) {
    const matched = ALLOWED_CATEGORIES.find(
      (c) => c.toLowerCase() === String(category).toLowerCase() || String(category).toLowerCase().includes(c.toLowerCase())
    );
    category = matched || 'Other';
  }

  // Normalize urgency
  let urgency = parsed.urgency || 'Medium';
  const urgencyUpper = String(urgency).toLowerCase();
  if (urgencyUpper.includes('high') || urgencyUpper.includes('critical')) {
    urgency = 'High';
  } else if (urgencyUpper.includes('low')) {
    urgency = 'Low';
  } else {
    urgency = 'Medium';
  }

  // Normalize affected population
  let population: number | null = null;
  if (typeof parsed.affected_population_estimate === 'number') {
    population = parsed.affected_population_estimate;
  } else if (typeof parsed.affected_population_estimate === 'string') {
    const num = parseInt(parsed.affected_population_estimate.replace(/[^0-9]/g, ''), 10);
    population = isNaN(num) ? null : num;
  }

  // Sanitize geographic fields (filter out generic placeholders like "our village", "village", etc.)
  let state = String(parsed.state || '').trim();
  let district = String(parsed.district || '').trim();
  let locality = String(parsed.locality || '').trim();

  if (GENERIC_LOCALITY_WORDS.has(locality.toLowerCase())) {
    locality = '';
  }
  if (GENERIC_LOCALITY_WORDS.has(district.toLowerCase())) {
    district = '';
  }
  if (GENERIC_LOCALITY_WORDS.has(state.toLowerCase())) {
    state = '';
  }

  const hasLocation = Boolean(state || district || locality);
  const location_source: 'citizen_provided' | 'not_provided' = hasLocation ? 'citizen_provided' : 'not_provided';
  const location_confidence: 'high' | 'none' = hasLocation ? 'high' : 'none';

  // Determine department source
  const dept = String(parsed.government_department || 'Municipal Administration');
  let department_source: 'citizen_provided' | 'ai_inferred' = 'ai_inferred';
  if (parsed.department_source === 'citizen_provided') {
    department_source = 'citizen_provided';
  } else {
    // Check if citizen text explicitly mentioned the department name
    const lowerComplaint = complaintText.toLowerCase();
    const lowerDept = dept.toLowerCase();
    if (lowerComplaint.includes(lowerDept) || lowerComplaint.includes('department') || lowerComplaint.includes('ministry')) {
      department_source = 'citizen_provided';
    } else {
      department_source = 'ai_inferred';
    }
  }

  const result: GeminiAnalysisResult = {
    language: String(parsed.language || 'English'),
    translated_text: String(parsed.translated_text || complaintText),
    category,
    issue: String(parsed.issue || 'Civic Infrastructure Concern'),
    state,
    district,
    locality,
    location_source,
    location_confidence,
    affected_infrastructure: String(parsed.affected_infrastructure || 'Public Infrastructure'),
    urgency,
    affected_population_estimate: population,
    government_department: dept,
    department_source,
    summary: String(parsed.summary || complaintText),
    recommended_action: String(parsed.recommended_action || 'Inspect site and deploy municipal field team.'),
  };

  return result;
}
