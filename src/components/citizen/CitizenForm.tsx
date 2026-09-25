'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  SUPPORTED_LANGUAGES, 
  CIVIC_CATEGORIES, 
  INDIAN_STATES 
} from '@/data/mockData';
import { VoiceInputModal } from './VoiceInputModal';
import { GeminiAnalysisResult } from '@/types';
import { 
  Send, 
  Mic, 
  MapPin, 
  Languages, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Car,
  Droplet,
  Trash2,
  Zap,
  HeartPulse,
  GraduationCap,
  Building,
  Users,
  AlertTriangle,
  RotateCcw,
  Edit3,
  FileCode,
  ShieldCheck,
  Square,
  Volume2,
  Radio
} from 'lucide-react';

export const CitizenForm: React.FC = () => {
  const [submissionMode, setSubmissionMode] = useState<'text' | 'voice'>('text');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('Roads & Transport');
  const [description, setDescription] = useState('');
  const [citizenName, setCitizenName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'card' | 'json'>('card');

  // Phase 5 Voice Workflow States
  const [voiceStatus, setVoiceStatus] = useState<
    'idle' | 'recording' | 'transcribing' | 'language_detected' | 'analyzing' | 'completed' | 'error'
  >('idle');
  const [voiceTimer, setVoiceTimer] = useState(0);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [originalVoiceTranscript, setOriginalVoiceTranscript] = useState<string>('');
  const [translatedVoiceText, setTranslatedVoiceText] = useState<string>('');
  const [submittedSourceType, setSubmittedSourceType] = useState<'text' | 'voice'>('text');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (voiceStatus === 'recording') {
      interval = setInterval(() => {
        setVoiceTimer((prev) => prev + 1);
      }, 1000);
    } else if (voiceStatus === 'idle') {
      setVoiceTimer(0);
    }
    return () => clearInterval(interval);
  }, [voiceStatus]);

  // Category Icon helper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Car': return <Car className="w-4 h-4" />;
      case 'Droplet': return <Droplet className="w-4 h-4" />;
      case 'Trash2': return <Trash2 className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'HeartPulse': return <HeartPulse className="w-4 h-4" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const u = urgency.toLowerCase();
    if (u === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span>High Urgency</span>
        </span>
      );
    }
    if (u === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Medium Urgency</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Low Urgency</span>
      </span>
    );
  };

  const executeAnalysis = async (customPayload?: {
    complaintText: string;
    sourceType?: 'voice' | 'text';
    originalLanguage?: string;
    originalTranscript?: string;
  }) => {
    const textToSubmit = customPayload ? customPayload.complaintText : description;

    if (!textToSubmit || textToSubmit.trim().length === 0) {
      setAnalysisError('Please provide a development grievance before submitting.');
      return;
    }

    setIsLoading(true);
    setAnalysisError(null);

    const sType = customPayload?.sourceType || 'text';
    setSubmittedSourceType(sType);

    try {
      const response = await fetch('/api/analyze-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint: textToSubmit.trim(),
          sourceType: sType,
          originalLanguage: customPayload?.originalLanguage || language,
          originalTranscript: customPayload?.originalTranscript || textToSubmit.trim(),
          state: state || undefined,
          district: district.trim() || undefined,
          locality: ward.trim() || landmark.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gemini analysis failed to process the request.');
      }

      setTrackingNumber(data.requestId || 'JNS-000001');
      setAnalysisResult(data.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission analysis error:', err);
      setAnalysisError(err.message || 'Failed to connect to the Gemini intelligence service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Live Microphone Recording for Voice Mode
  const startRecording = async () => {
    setAnalysisError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone audio is not accessible in this environment. Use one of the instant vernacular voice samples below.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setVoiceStatus('recording');
    } catch (err: any) {
      console.warn('Microphone error:', err);
      setAnalysisError(err.message || 'Microphone permission denied. You can still test with the instant vernacular voice samples.');
      setVoiceStatus('idle');
    }
  };

  const stopRecordingAndProcess = async () => {
    if (!mediaRecorderRef.current) return;
    setVoiceStatus('transcribing');

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await processVoicePayload({ audioBase64: base64Audio, mimeType: 'audio/webm' });
        };
      } catch (err: any) {
        setAnalysisError(err.message || 'Failed to read recorded audio data.');
        setVoiceStatus('idle');
      }
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  // Processes either Base64 audio or a benchmark sampleKey through the Gemini Voice -> Analysis pipeline
  const processVoicePayload = async (payload: { audioBase64?: string; mimeType?: string; sampleKey?: string }) => {
    setAnalysisError(null);
    setVoiceStatus('transcribing');

    try {
      // 1. Transcribe & detect language with Gemini
      const transcribeRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const transcribeJson = await transcribeRes.json();
      if (!transcribeRes.ok || !transcribeJson.success) {
        throw new Error(transcribeJson.error || 'Gemini voice transcription failed.');
      }

      const { detectedLanguage: lang, originalTranscript: transcript, translatedText } = transcribeJson;
      setDetectedLanguage(lang);
      setOriginalVoiceTranscript(transcript);
      setTranslatedVoiceText(translatedText || transcript);

      // Step indicator: Language detected
      setVoiceStatus('language_detected');
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step indicator: AI analyzing
      setVoiceStatus('analyzing');

      // 2. Feed directly into existing Gemini complaint analysis pipeline
      await executeAnalysis({
        complaintText: transcript,
        sourceType: 'voice',
        originalLanguage: lang,
        originalTranscript: transcript,
      });

      setVoiceStatus('completed');
    } catch (err: any) {
      console.error('Voice processing pipeline error:', err);
      setAnalysisError(err.message || 'Voice pipeline processing failed. Please try again.');
      setVoiceStatus('idle');
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setDescription('');
    setDistrict('');
    setWard('');
    setLandmark('');
    setPincode('');
    setCitizenName('');
    setContactNumber('');
    setVoiceStatus('idle');
    setOriginalVoiceTranscript('');
    setTranslatedVoiceText('');
  };

  const handleModifyComplaint = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setVoiceStatus('idle');
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If Gemini has analyzed the request and it was saved to Firestore, display the professional "AI Analysis" result card
  if (analysisResult) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-lg animate-in fade-in-50 duration-300">
        {/* Header: AI Analysis, Request ID, and Status: Successfully submitted */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  AI Analysis
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Status: Successfully submitted</span>
                </span>
                {submittedSourceType === 'voice' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                    <Mic className="w-3 h-3 text-orange-600" />
                    <span>Voice Grievance ({analysisResult.language || detectedLanguage})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <Edit3 className="w-3 h-3 text-slate-600" />
                    <span>Written Grievance</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Request ID: <span className="font-mono text-orange-600 font-extrabold">{trackingNumber}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'card'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Intelligence Card
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Structured JSON</span>
            </button>
          </div>
        </div>

        {/* Tab 1: AI Analysis Result Card */}
        {activeTab === 'card' ? (
          <div className="mt-6 space-y-6">
            {/* If voice submitted, display original vernacular transcript alongside translation */}
            {submittedSourceType === 'voice' && (originalVoiceTranscript || analysisResult.translated_text) && (
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-orange-900 uppercase tracking-wider">
                  <Volume2 className="w-4 h-4 text-orange-600" />
                  <span>Original Vernacular Voice Transcript ({analysisResult.language || detectedLanguage})</span>
                </div>
                <p className="text-sm font-medium text-slate-900 leading-relaxed bg-white/80 p-3 rounded-lg border border-orange-100 mb-2">
                  {originalVoiceTranscript || description}
                </p>
                {analysisResult.translated_text && analysisResult.language.toLowerCase() !== 'english' && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      English Translation:
                    </span>
                    <p className="text-xs text-slate-700 italic bg-white/60 p-2.5 rounded-lg border border-slate-200">
                      "{analysisResult.translated_text}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Top Quick Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Urgency Level
                </span>
                <div>{getUrgencyBadge(analysisResult.urgency)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Civic Category
                </span>
                <span className="text-sm font-bold text-slate-900 block truncate">
                  {analysisResult.category}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Detected Language
                </span>
                <span className="text-sm font-bold text-blue-700 block">
                  {analysisResult.language}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Target Department
                </span>
                <span className="text-xs font-bold text-slate-800 block truncate" title={analysisResult.government_department}>
                  {analysisResult.government_department}
                </span>
              </div>
            </div>

            {/* Extracted Core Civic Issue */}
            <div className="p-5 rounded-xl bg-blue-50/50 border border-blue-100">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">
                Core Civic Issue Identified
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {analysisResult.issue}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {analysisResult.summary}
              </p>
            </div>

            {/* Evidence & Location Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Verification Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Geographic Evidence</span>
                  </span>
                  {analysisResult.location_source === 'citizen_provided' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Citizen Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Not Provided
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Locality:</span>
                    <span className="font-semibold text-slate-900">
                      {analysisResult.locality || '— (None extracted)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">District:</span>
                    <span className="font-semibold text-slate-900">
                      {analysisResult.district || '— (None extracted)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">State:</span>
                    <span className="font-semibold text-slate-900">
                      {analysisResult.state || '— (None extracted)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Infrastructure & Beneficiary Impact Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>Infrastructure & Beneficiaries</span>
                </span>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Affected Infrastructure:</span>
                    <span className="font-semibold text-slate-900">
                      {analysisResult.affected_infrastructure || 'General Civic Area'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Beneficiary Estimate:</span>
                    <span className="font-semibold text-slate-900">
                      {analysisResult.affected_population_estimate !== null
                        ? `~${analysisResult.affected_population_estimate.toLocaleString()} citizens`
                        : '— (Not stated in complaint)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Department Mapping:</span>
                    <span className="font-semibold text-slate-900">
                      {analysisResult.department_source === 'citizen_provided'
                        ? 'Citizen-Named Department'
                        : 'AI-Inferred Department'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Recommended Development Action
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-950 leading-relaxed">
                {analysisResult.recommended_action}
              </p>
            </div>
          </div>
        ) : (
          /* Tab 2: Raw Structured JSON */
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Raw Gemini JSON Output (Matching Schema)
              </span>
              <span className="text-xs font-mono text-slate-500">sourceType: {submittedSourceType}</span>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-96">
              {JSON.stringify(
                {
                  requestId: trackingNumber,
                  status: 'new',
                  sourceType: submittedSourceType,
                  ...analysisResult,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleModifyComplaint}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Complaint & Re-analyze</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Request</span>
            </button>
          </div>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span>View Policymaker Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // The Main Citizen Form
  return (
    <div className="gov-card p-6 sm:p-10 bg-white border border-slate-200">
      <div className="space-y-8">
        {/* Error Alert if analysis failed */}
        {analysisError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in-50">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold">Analysis Failed</h4>
              <p className="text-xs text-red-800 mt-0.5">{analysisError}</p>
            </div>
            <button
              type="button"
              onClick={() => executeAnalysis()}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Section 1: Language & Category */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Language & Civic Category</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 ml-8">
            Select your preferred language. Gemini will automatically detect and translate non-English complaints.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Language dropdown */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-slate-500" />
                <span>Preferred Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Select Chips */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>Development Sector (Self-Selected)</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              >
                {CIVIC_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Category Badges */}
          <div className="mt-3 flex flex-wrap gap-2">
            {CIVIC_CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat.name
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Mode Selector & Complaint Input (Write vs Speak) */}
        <div className="pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                <span>Grievance Submission Mode *</span>
              </h3>
              <p className="text-xs text-slate-500 ml-8">
                Choose to type your complaint or speak in your native dialect.
              </p>
            </div>

            {/* Mode Toggle Buttons: [ Write Complaint ] [ 🎙️ Speak Complaint ] */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSubmissionMode('text')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  submissionMode === 'text'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Write Complaint</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmissionMode('voice')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  submissionMode === 'voice'
                    ? 'bg-orange-600 text-white shadow-xs shadow-orange-600/20'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>🎙️ Speak Complaint</span>
              </button>
            </div>
          </div>

          {/* Conditional Input UI: Text Mode vs Voice Mode */}
          {submissionMode === 'text' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Type in any Indian language or dialect:</span>
                <button
                  type="button"
                  onClick={() => setVoiceModalOpen(true)}
                  className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 font-semibold"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Attach voice note instead</span>
                </button>
              </div>

              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the development or infrastructure problem in detail. E.g.: Farmers in our village are facing severe water shortages for irrigation. The nearest irrigation facility is 15 km away and approximately 700 farming families are affected."
                className="w-full p-4 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 leading-relaxed"
              />

              <div className="flex items-center justify-between text-xs text-slate-400 mt-1 px-1">
                <span>{description.length} characters</span>
                <span className="flex items-center gap-1 text-blue-600 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Google Gemini API connected</span>
                </span>
              </div>
            </div>
          ) : (
            /* Voice Mode Console */
            <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-6">
              <div className="text-center max-w-md mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-bold mb-3 border border-orange-200">
                  <Mic className="w-3.5 h-3.5 text-orange-600" />
                  <span>Multilingual Voice Engine (Kannada • Hindi • English)</span>
                </span>

                <h4 className="text-base font-bold text-slate-900">
                  Speak Naturally in Your Native Language
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Gemini listens, detects your language, preserves the original vernacular transcript, and analyzes civic urgency.
                </p>

                {/* Animated Waveform / Recording Visualizer */}
                <div className="h-24 flex items-center justify-center gap-1.5 bg-white rounded-xl border border-orange-200 my-5 p-4 shadow-2xs">
                  {voiceStatus === 'recording' ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 rounded-full bg-orange-600 animate-soundwave-1" />
                      <div className="w-2 rounded-full bg-blue-600 animate-soundwave-2" />
                      <div className="w-2 rounded-full bg-emerald-600 animate-soundwave-3" />
                      <div className="w-2 rounded-full bg-orange-500 animate-soundwave-4" />
                      <div className="w-2 rounded-full bg-blue-700 animate-soundwave-5" />
                      <div className="w-2 rounded-full bg-emerald-500 animate-soundwave-2" />
                      <div className="w-2 rounded-full bg-orange-600 animate-soundwave-3" />
                    </div>
                  ) : voiceStatus === 'transcribing' || voiceStatus === 'language_detected' || voiceStatus === 'analyzing' ? (
                    <div className="flex flex-col items-center gap-2 text-xs font-semibold text-orange-800">
                      <RefreshCw className="w-5 h-5 animate-spin text-orange-600" />
                      {voiceStatus === 'transcribing' && <span>Transcribing...</span>}
                      {voiceStatus === 'language_detected' && (
                        <span className="text-emerald-700 font-bold">Language detected: {detectedLanguage}</span>
                      )}
                      {voiceStatus === 'analyzing' && <span>AI analyzing...</span>}
                    </div>
                  ) : (
                    <div className="text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                      <Mic className="w-6 h-6 text-slate-300" />
                      <span>Click the button below to start microphone recording</span>
                    </div>
                  )}
                </div>

                {/* Live Recording Timer */}
                {voiceStatus === 'recording' && (
                  <div className="text-xs font-mono font-bold text-red-600 mb-4 flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                    <span>Recording... ({formatTimer(voiceTimer)})</span>
                  </div>
                )}

                {/* Step Indicators requested in prompt */}
                {voiceStatus !== 'idle' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold mb-4">
                    <span className={`px-2 py-0.5 rounded-md ${voiceStatus === 'recording' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-500'}`}>
                      Recording...
                    </span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded-md ${voiceStatus === 'transcribing' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                      Transcribing...
                    </span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded-md ${voiceStatus === 'language_detected' ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                      Language detected{detectedLanguage ? `: ${detectedLanguage}` : ''}
                    </span>
                    <span>→</span>
                    <span className={`px-2 py-0.5 rounded-md ${voiceStatus === 'analyzing' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                      AI analyzing...
                    </span>
                  </div>
                )}

                {/* Main Microphone Button */}
                <div className="flex justify-center mb-6">
                  {voiceStatus === 'recording' ? (
                    <button
                      type="button"
                      onClick={stopRecordingAndProcess}
                      className="px-6 py-3.5 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/30 flex items-center gap-2 active:scale-95 transition-all"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop & Process Voice Grievance</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={voiceStatus === 'transcribing' || voiceStatus === 'analyzing'}
                      onClick={startRecording}
                      className="px-6 py-3.5 rounded-xl font-bold text-sm bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/30 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Mic className="w-5 h-5 animate-pulse" />
                      <span>Start Voice Recording</span>
                    </button>
                  )}
                </div>

                {/* Instant Vernacular Voice Test Scenarios */}
                <div className="pt-4 border-t border-orange-200/60 text-left">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Instant Vernacular Voice Test Scenarios (Click to test pipeline):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={voiceStatus !== 'idle'}
                      onClick={() => processVoicePayload({ sampleKey: 'kannada_irrigation' })}
                      className="text-left p-2.5 rounded-lg bg-white hover:bg-orange-100/60 border border-orange-200 flex items-center justify-between text-xs transition-colors disabled:opacity-50"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">ಕನ್ನಡ (Kannada)</span>
                        <span className="text-[11px] text-slate-600">ಕಾರ್ಕಳ ನೀರಾವರಿ ಕಾಲುವೆ ಒಡೆದು ಹೋದ ಸಮಸ್ಯೆ</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                        Test Voice
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={voiceStatus !== 'idle'}
                      onClick={() => processVoicePayload({ sampleKey: 'hindi_road' })}
                      className="text-left p-2.5 rounded-lg bg-white hover:bg-orange-100/60 border border-orange-200 flex items-center justify-between text-xs transition-colors disabled:opacity-50"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">हिन्दी (Hindi)</span>
                        <span className="text-[11px] text-slate-600">मोहल्ले की सड़क के गड्ढे एवं एम्बुलेंस समस्या</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                        Test Voice
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={voiceStatus !== 'idle'}
                      onClick={() => processVoicePayload({ sampleKey: 'english_drainage' })}
                      className="text-left p-2.5 rounded-lg bg-white hover:bg-orange-100/60 border border-orange-200 flex items-center justify-between text-xs transition-colors disabled:opacity-50"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">English</span>
                        <span className="text-[11px] text-slate-600">Ward 12 stormwater drain blockage</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                        Test Voice
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Location Information */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
            <span>Location Information (Optional / Contextual)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 ml-8">
            Note: Per AI Rule 4 & 5, Gemini extracts location only when explicitly provided and never invents one.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State / UT</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              >
                <option value="">(None / Mentioned in Text)</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">District / City</label>
              <input
                type="text"
                placeholder="e.g. East Delhi / Varanasi"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ward / Village / Locality</label>
              <input
                type="text"
                placeholder="e.g. Rampur Village / Ward 44"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 110092"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Citizen Details (Optional) */}
        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
            <span>Citizen Details (Optional)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 ml-8">
            You may remain anonymous if you prefer.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Submit Button & Loading State for Text Mode */}
        {submissionMode === 'text' && (
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Server-side Gemini processing. API key is never exposed to browser.</span>
            </div>

            <button
              type="button"
              onClick={() => executeAnalysis()}
              disabled={isLoading || description.trim().length === 0}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-all shadow-md shadow-orange-600/20 active:scale-98 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>Analyzing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-200" />
                  <span>Analyze & Submit with Gemini</span>
                  <Send className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Voice Input Modal (Alternative Trigger) */}
      <VoiceInputModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        selectedLanguage={language}
        onTranscriptComplete={({ originalTranscript, detectedLanguage: lang }) => {
          setDescription((prev) => (prev ? `${prev}\n\n${originalTranscript}` : originalTranscript));
          setLanguage(lang.toLowerCase().slice(0, 2));
        }}
      />
    </div>
  );
};
