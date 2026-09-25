import React from 'react';
import Link from 'next/link';
import { Building2, Sparkles, Heart, Shield, Terminal, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
                <Building2 className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Jan<span className="text-orange-500">Setu</span> <span className="text-blue-400 font-mono text-sm">AI</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              An AI-driven civic development intelligence engine built for India. Empowering citizens to submit localized infrastructure demands in their mother tongue, and converting raw grievances into evidence-based public works prioritization for municipal and state authorities.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Cloud &quot;Build with AI: Code for Communities&quot; Hackathon</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Overview & Pipeline
                </Link>
              </li>
              <li>
                <Link href="/citizen" className="hover:text-white transition-colors">
                  Citizen Request Portal
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Policymaker Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Roadmap */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Next Architecture (Phase 2)</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                <span>Gemini Multimodal Vernacular Audio</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>Cloud Firestore Geo-clustering</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Google Maps Platform Integration</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                <span>Automated DPR & Tender Briefs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>JanSetu AI © 2026</span>
            <span>•</span>
            <span>Open Civic Intelligence Prototype</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Indian Communities
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
