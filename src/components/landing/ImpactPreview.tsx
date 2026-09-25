'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Bot, 
  User, 
  FileSpreadsheet,
  Layers,
  Building
} from 'lucide-react';

export const ImpactPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'input' | 'analysis' | 'recommendation'>('analysis');

  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold mb-3 border border-orange-200">
            <Bot className="w-3.5 h-3.5 text-orange-600" />
            <span>Interactive Architecture Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            See the AI Transformation in Action
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Experience how unstructured citizen inputs in Hindi/vernacular get synthesized into a structured public works recommendation.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('input')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'input'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <User className="w-4 h-4 text-orange-400" />
            <span>1. Raw Citizen Voice Input</span>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'analysis'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>2. Gemini Entity Extraction</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'recommendation'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-400" />
            <span>3. Policymaker Brief</span>
          </button>
        </div>

        {/* Tab Content Cards */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {activeTab === 'input' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    हि
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Recorded Citizen Grievance</h4>
                    <p className="text-xs text-slate-500">Location: Ward 44, Laxmi Nagar, East Delhi • Audio & Text</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Hindi (Vernacular)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-slate-800 text-base leading-relaxed italic">
                &ldquo;पिछले 10 दिनों से हमारे इलाके में सीवर का गंदा पानी सड़क पर बह रहा है। स्कूल जाने वाले बच्चों और बुजुर्गों को भारी परेशानी हो रही है। दुर्गंध और मच्छरों से डेंगू का खतरा बना हुआ है। कृपया तुरंत ड्रेनेज लाइन साफ़ करवाएं।&rdquo;
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Reported By</span>
                  <span className="font-semibold text-slate-800">Sunita Sharma (Resident)</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Mode</span>
                  <span className="font-semibold text-slate-800">Voice Note + Form</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 block mb-0.5">Attached Coordinates</span>
                  <span className="font-semibold text-slate-800">28.6328° N, 77.2798° E</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Gemini Structured Synthesis</h4>
                    <p className="text-xs text-slate-500">Autonomous entity extraction & urgency evaluation</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                    Urgency: CRITICAL (93/100)
                  </span>
                  <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Confidence: 96%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Synthesized Executive Summary</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    Raw sewage backflow onto pedestrian road near school zone creating vector-borne epidemic hazard and blocking public right-of-way.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Infrastructure Correlations</span>
                  <ul className="text-xs text-slate-700 space-y-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Trunk Sewer Line S-4 (Overcapacity detected)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Monsoon Buffer Drain Blockage (Zone East-2)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <span>Adjacent School Transit Zone (High Vulnerability)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <strong>Cluster Detection:</strong> This report matches <strong>427 other reports</strong> in the same 1.2 km radius over the last 21 days, automatically classifying this area as an active <em>Infrastructure Crisis Hotspot</em>.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recommendation' && (
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Actionable Civic Sanction Brief</h4>
                    <p className="text-xs text-slate-500">Auto-generated for Municipal Commissioner & District Magistrate</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  Project Code: REC-2026-WTR-01
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Integrated Stormwater Outfall & Siphon Overhaul — Ward 44
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Estimated Budget</span>
                    <span className="text-sm font-bold text-slate-900">₹ 3.85 Crore</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Beneficiaries</span>
                    <span className="text-sm font-bold text-blue-700">145,000 People</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Projected Timeline</span>
                    <span className="text-sm font-bold text-slate-900">4 - 6 Months</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[11px] text-slate-500 block">Gemini Confidence</span>
                    <span className="text-sm font-bold text-emerald-600">97.4%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <span className="font-bold text-slate-800 block">Evidence Factors for Administrative Sanction:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>428 verified citizen complaints in 21 days with matching GPS coordinates</li>
                    <li>78% projected reduction in seasonal dengue and malaria vector breeding</li>
                    <li>Tender brief automatically formatted for state e-procurement portal</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Card Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {activeTab === 'input' && 'Step 1 of 3: Citizen grievance collected via mobile web or IVR'}
              {activeTab === 'analysis' && 'Step 2 of 3: Gemini multimodal model parses semantics and urgency'}
              {activeTab === 'recommendation' && 'Step 3 of 3: Prioritized project ready for municipal sanction'}
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              <span>Explore live dashboard data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
