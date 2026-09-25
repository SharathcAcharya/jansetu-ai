'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { BENCHMARK_VOICE_SAMPLES } from '@/lib/voiceService';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
  onTranscriptComplete: (data: {
    originalTranscript: string;
    detectedLanguage: string;
    translatedText?: string;
  }) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  selectedLanguage,
  onTranscriptComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const startLiveRecording = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone audio is not supported in this browser environment. Use a test sample below.');
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
      setIsRecording(true);
    } catch (err: any) {
      console.warn('Microphone access warning:', err);
      setErrorMessage(err.message || 'Microphone access was denied or not available.');
    }
  };

  const stopLiveRecording = async () => {
    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    setIsProcessing(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const res = await fetch('/api/voice/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Audio,
                mimeType: 'audio/webm',
              }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
              throw new Error(json.error || 'Failed to transcribe audio.');
            }
            onTranscriptComplete({
              originalTranscript: json.originalTranscript,
              detectedLanguage: json.detectedLanguage,
              translatedText: json.translatedText,
            });
            onClose();
          } catch (err: any) {
            setErrorMessage(err.message || 'Gemini voice transcription failed.');
          } finally {
            setIsProcessing(false);
          }
        };
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to read recorded audio data.');
        setIsProcessing(false);
      }
    };

    mediaRecorderRef.current.stop();
    // Stop all media tracks to release the microphone indicator
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  const handleBenchmarkSample = async (sampleKey: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleKey }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process voice sample.');
      }
      onTranscriptComplete({
        originalTranscript: json.originalTranscript,
        detectedLanguage: json.detectedLanguage,
        translatedText: json.translatedText,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Voice sample processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold mb-3 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Gemini Multilingual Voice</span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Speak Your Civic Issue
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Speaks naturally in Kannada, Hindi, English, or any Indian vernacular language.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Audio Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Waveform / Visualizer */}
          <div className="h-28 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl border border-slate-200 mb-6 p-4">
            {isRecording ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 rounded-full bg-orange-600 animate-soundwave-1" />
                <div className="w-2 rounded-full bg-blue-600 animate-soundwave-2" />
                <div className="w-2 rounded-full bg-emerald-600 animate-soundwave-3" />
                <div className="w-2 rounded-full bg-orange-500 animate-soundwave-4" />
                <div className="w-2 rounded-full bg-blue-700 animate-soundwave-5" />
                <div className="w-2 rounded-full bg-emerald-500 animate-soundwave-2" />
                <div className="w-2 rounded-full bg-orange-600 animate-soundwave-3" />
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-xs font-semibold text-blue-700">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span>Transcribing & Detecting Language...</span>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                <Mic className="w-6 h-6 text-slate-300" />
                <span>Tap the microphone button below to record your voice</span>
              </div>
            )}
          </div>

          {/* Timer when recording */}
          {isRecording && (
            <div className="text-xs font-mono font-bold text-red-600 mb-4 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>RECORDING {formatTimer(recordingSeconds)}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col gap-3">
            <button
              onClick={isRecording ? stopLiveRecording : startLiveRecording}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm transition-all shadow-sm ${
                isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
                  : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20 disabled:opacity-50'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop & Transcribe Audio</span>
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Audio...</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Microphone Recording</span>
                </>
              )}
            </button>

            {/* Quick Vernacular Speech Scenarios */}
            <div className="mt-2 text-left">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Instant Vernacular Voice Samples:
              </span>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleBenchmarkSample('kannada_irrigation')}
                  disabled={isProcessing || isRecording}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span className="font-semibold text-slate-800">ಕನ್ನಡ (Kannada)</span>
                  <span className="text-[11px] text-slate-500 truncate ml-2">ಕಾರ್ಕಳ ನೀರಾವರಿ ಸಮಸ್ಯೆ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBenchmarkSample('hindi_road')}
                  disabled={isProcessing || isRecording}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span className="font-semibold text-slate-800">हिन्दी (Hindi)</span>
                  <span className="text-[11px] text-slate-500 truncate ml-2">सड़क मरम्मत एवं गड्ढे</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBenchmarkSample('english_drainage')}
                  disabled={isProcessing || isRecording}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-colors disabled:opacity-50"
                >
                  <span className="font-semibold text-slate-800">English</span>
                  <span className="text-[11px] text-slate-500 truncate ml-2">Ward 12 stormwater drain</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Voice complaints are transcribed in native script and fed into the AI priority pipeline.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
