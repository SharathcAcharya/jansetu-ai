import React from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  FileText, 
  BarChart3, 
  Sparkles, 
  ShieldCheck, 
  Radio,
  Users,
  MapPin
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-200 bg-civic-grid">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[250px] bg-orange-100/50 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Hackathon Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Google Cloud &quot;Build with AI: Code for Communities&quot;</span>
            <span className="hidden sm:inline text-blue-400">•</span>
            <span className="hidden sm:inline text-blue-700 font-normal">Second Edition</span>
          </div>

          {/* Main Title & Tagline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
            Turning Citizen Voices into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-800 to-orange-600">
              Development Priorities
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mb-10">
            <strong>JanSetu AI</strong> (जनसेतु) bridges the gap between hyper-local community grievances and evidence-based municipal capital planning. Powered by Gemini AI, it transforms multi-lingual citizen reports into structured civic intelligence and prioritized public works projects.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-14">
            <Link
              href="/citizen"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-700 active:scale-98 transition-all"
            >
              <FileText className="w-5 h-5 text-orange-200" />
              <span>Report a Development Issue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-slate-800 active:scale-98 transition-all"
            >
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>View Intelligence Dashboard</span>
            </Link>
          </div>

          {/* Trust & Live Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 w-full max-w-3xl pt-8 border-t border-slate-200">
            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">18,450+</span>
              <span className="text-xs text-slate-500 font-medium">Citizen Inputs</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-2xl sm:text-3xl font-bold text-orange-600">10+</span>
              <span className="text-xs text-slate-500 font-medium">Indian Languages</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-2xl sm:text-3xl font-bold text-blue-700">984</span>
              <span className="text-xs text-slate-500 font-medium">Gaps Identified</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600">97.4%</span>
              <span className="text-xs text-slate-500 font-medium">AI Confidence</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
