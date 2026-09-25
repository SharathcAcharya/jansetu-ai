import { GoogleGenAI } from '@google/genai';
import { VoiceTranscriptionResult } from '@/types';

const VOICE_TRANSCRIPTION_PROMPT = `You are the JanSetu AI Multilingual Speech Transcriber for civic development in India.
Your task is to listen carefully to the attached citizen voice recording and transcribe the grievance with extreme fidelity.

Language Instructions:
1. Detect the spoken Indian language accurately (e.g. "Kannada", "Hindi", "English", "Tamil", "Marathi", "Telugu", "Bengali", etc.).
2. Prioritize Kannada, Hindi, and English accuracy, recognizing regional accents and vernacular civic terminology.
3. Transcribe the original speech VERBATIM in its authentic native script:
   - For Kannada, transcribe in Kannada script (ಕನ್ನಡ).
   - For Hindi, transcribe in Devanagari script (हिन्दी).
   - For English, transcribe in standard English text.
   - For other Indian languages, transcribe in their respective native script.
4. Translate the transcription into clear, professional English. If the spoken language is already English, provide the same text.
5. Do NOT invent or add any words not spoken by the citizen.

You MUST return a pure JSON object adhering strictly to this schema:
{
  "detectedLanguage": "string (e.g. 'Kannada', 'Hindi', 'English')",
  "originalTranscript": "string (Verbatim native script transcription)",
  "translatedText": "string (Accurate English translation)",
  "confidence": "high" | "medium" | "low"
}`;

/**
 * Benchmark vernacular test scenarios for automated verification,
 * demo environments, or when microphone access is restricted.
 */
export const BENCHMARK_VOICE_SAMPLES: Record<string, VoiceTranscriptionResult> = {
  kannada_irrigation: {
    detectedLanguage: 'Kannada',
    originalTranscript:
      'ನಮ್ಮ ಕಾರ್ಕಳ ತಾಲೂಕಿನ ಗ್ರಾಮದಲ್ಲಿ ಕೃಷಿಗೆ ನೀರಿನ ತೀವ್ರ ಕೊರತೆ ಎದುರಾಗಿದೆ. ಹತ್ತಿರದ ನೀರಾವರಿ ಕಾಲುವೆ ಒಡೆದು ಹೋಗಿದ್ದು, ಸುಮಾರು 700 ರೈತ ಕುಟುಂಬಗಳು ಸಂಕಷ್ಟದಲ್ಲಿವೆ. ದಯವಿಟ್ಟು ನೀರಾವರಿ ಕಾಲುವೆಯನ್ನು ತಕ್ಷಣ ದುರಸ್ತಿ ಮಾಡಿ.',
    translatedText:
      'In our village in Karkala taluk, there is a severe shortage of water for agriculture. The nearby irrigation canal has breached, and around 700 farming families are in distress. Please repair the irrigation canal immediately.',
    confidence: 'high',
    durationSeconds: 9,
  },
  hindi_road: {
    detectedLanguage: 'Hindi',
    originalTranscript:
      'हमारे मोहल्ले की मुख्य सड़क पिछले तीन महीने से पूरी तरह टूटी हुई है। बारिश के कारण बड़े-बड़े गड्ढे हो गए हैं और अस्पताल जाने वाली एम्बुलेंस भी फंस जाती है। कृपया इस सड़क का डामरीकरण तुरंत करवाएं।',
    translatedText:
      'The main road in our locality has been completely damaged for the past three months. Large potholes have formed due to rain and even ambulances heading to the hospital get stuck. Please repair and tar this road immediately.',
    confidence: 'high',
    durationSeconds: 8,
  },
  english_drainage: {
    detectedLanguage: 'English',
    originalTranscript:
      'The open stormwater drain in Ward 12 is completely blocked with construction debris. During heavy rains, black contaminated water floods into ground floor homes affecting over 500 residents. Urgent municipal desilting is required.',
    translatedText:
      'The open stormwater drain in Ward 12 is completely blocked with construction debris. During heavy rains, black contaminated water floods into ground floor homes affecting over 500 residents. Urgent municipal desilting is required.',
    confidence: 'high',
    durationSeconds: 11,
  },
};

export interface TranscribeAudioOptions {
  audioBase64?: string;
  mimeType?: string;
  sampleKey?: string;
}

/**
 * Transcribes audio into native script and English translation using Gemini 2.5 Flash.
 */
export async function transcribeCitizenAudio(
  options: TranscribeAudioOptions
): Promise<VoiceTranscriptionResult> {
  const { audioBase64, mimeType = 'audio/webm', sampleKey } = options;

  // 1. Handle simulated/benchmark sample if requested
  if (sampleKey) {
    const sample = BENCHMARK_VOICE_SAMPLES[sampleKey];
    if (sample) {
      return { ...sample };
    }
    throw new Error(`Unknown benchmark sampleKey: "${sampleKey}". Available: ${Object.keys(BENCHMARK_VOICE_SAMPLES).join(', ')}`);
  }

  // 2. Validate audio payload
  if (!audioBase64 || typeof audioBase64 !== 'string' || audioBase64.trim().length === 0) {
    throw new Error('audioBase64 payload is required for audio transcription.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured on the server.');
    (error as any).status = 503;
    throw error;
  }

  // Strip data URL prefix if present (e.g. data:audio/webm;base64,...)
  let cleanBase64 = audioBase64.trim();
  let cleanMimeType = mimeType;
  if (cleanBase64.includes(';base64,')) {
    const parts = cleanBase64.split(';base64,');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    if (mimeMatch && mimeMatch[1]) {
      cleanMimeType = mimeMatch[1];
    }
  }

  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = ['gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash'];
  let rawText = '';
  let lastError: any = null;
  const maxRetries = candidateModels.length;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentModel = candidateModels[attempt];
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: cleanBase64,
                },
              },
              {
                text: VOICE_TRANSCRIPTION_PROMPT,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
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
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('UNAVAILABLE');

      console.warn(`[Gemini Voice Transcription Attempt ${attempt + 1}/${maxRetries} (${currentModel})]: ${err?.message || err}`);

      if (attempt < maxRetries - 1 && isTransient) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }

  if (!rawText) {
    const error = new Error(lastError?.message || 'Gemini returned an empty voice transcription response.');
    (error as any).status = 503;
    throw error;
  }

  // Parse structured JSON
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr: any) {
    const error = new Error(`Failed to parse Gemini voice transcription output: ${parseErr.message}`);
    (error as any).status = 500;
    (error as any).raw = cleaned;
    throw error;
  }

  const detectedLanguage = typeof parsed.detectedLanguage === 'string' && parsed.detectedLanguage.trim()
    ? parsed.detectedLanguage.trim()
    : 'Unknown';

  const originalTranscript = typeof parsed.originalTranscript === 'string' && parsed.originalTranscript.trim()
    ? parsed.originalTranscript.trim()
    : '';

  const translatedText = typeof parsed.translatedText === 'string' && parsed.translatedText.trim()
    ? parsed.translatedText.trim()
    : originalTranscript;

  const confidence = ['high', 'medium', 'low'].includes(parsed.confidence)
    ? parsed.confidence
    : 'medium';

  if (!originalTranscript) {
    const error = new Error('Could not transcribe audio. The recording might be silent or unclear.');
    (error as any).status = 422;
    throw error;
  }

  return {
    detectedLanguage,
    originalTranscript,
    translatedText,
    confidence,
  };
}
