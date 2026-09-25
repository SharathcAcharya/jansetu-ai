import React from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Languages, 
  Layers, 
  Scale, 
  TrendingUp,
  XCircle
} from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5 text-orange-600" />
            <span>The Civic Planning Paradox</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Why Traditional Public Works Planning Leaves Communities Behind
          </h2>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            In a nation of 1.4 billion people, development requests often end up lost in departmental silos. JanSetu AI reimagines civic governance by converting scattered voices into clear, data-backed development mandates.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: The Conventional Broken Workflow */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-red-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Current Grievance Systems</h3>
                    <p className="text-xs text-slate-500">Siloed, reactive & manual</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">The Problem</span>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">✕</div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-800 block">Linguistic Barriers</strong>
                    <span className="text-sm text-slate-600">Most portals demand English or standard text. Vernacular dialects and spoken voice grievances are ignored.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">✕</div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-800 block">No Hotspot Clustering</strong>
                    <span className="text-sm text-slate-600">50 separate complaints regarding the same overflowing canal are treated as isolated tickets instead of a single major infrastructure failure.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">✕</div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-800 block">Ad-Hoc Budget Allocations</strong>
                    <span className="text-sm text-slate-600">Public funds are often allocated without verifiable demand density data, causing under-investment in critical low-income wards.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 bg-red-50/50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 rounded-b-2xl">
              <span className="text-xs font-medium text-red-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Result: Low citizen trust, wasteful expenditure & recurring civic disasters.</span>
              </span>
            </div>
          </div>

          {/* Right: The JanSetu AI Solution */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-200 shadow-md flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -z-10" />

            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">JanSetu AI Intelligence</h3>
                    <p className="text-xs text-slate-500">Multimodal, proactive & evidence-based</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">The Solution</span>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-800 block">Multilingual & Voice-First Intake</strong>
                    <span className="text-sm text-slate-600">Citizens can speak or write in Hindi, Tamil, Bengali, or Marathi. Gemini converts vernacular input into standardized civic entities.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-800 block">Transparent AI Hotspot Detection</strong>
                    <span className="text-sm text-slate-600">Automatically aggregates related requests into geographic demand clusters with calculated urgency and population impact scores.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">✓</div>
                  <div>
                    <strong className="text-sm font-semibold text-slate-800 block">Actionable Project Recommendations</strong>
                    <span className="text-sm text-slate-600">Gemini drafts concrete project briefs with budget projections, urgency rationales, and beneficiary estimates for policymakers.</span>
                  </div>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 bg-emerald-50/60 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 rounded-b-2xl">
              <span className="text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Result: Transparent capital allocation, faster municipal response & empowered citizens.</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
