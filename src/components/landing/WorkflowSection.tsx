import React from 'react';
import { 
  Mic, 
  BrainCircuit, 
  Database, 
  ClipboardCheck, 
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Voice & Text Intake',
      tag: 'Vernacular Accessibility',
      icon: Mic,
      color: 'from-orange-500 to-amber-600',
      iconBg: 'bg-orange-50 border-orange-200 text-orange-600',
      description: 'Citizens submit grievances in their native tongue via audio speech or simple text across 10+ Indian languages.',
      details: ['Speech-to-Text translation', 'Dialect & Slang normalization', 'Geo-tagging & landmark resolution'],
    },
    {
      step: '02',
      title: 'Gemini AI Analysis',
      tag: 'Multimodal Processing',
      icon: BrainCircuit,
      color: 'from-blue-600 to-indigo-700',
      iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
      description: 'Google Gemini extracts structured civic entities, identifies hazard severity, and computes a transparent urgency score.',
      details: ['Zero-shot category tagging', 'Sentiment & risk assessment', 'Correlates related public infrastructure'],
    },
    {
      step: '03',
      title: 'Data Intelligence',
      tag: 'Clustering & GIS',
      icon: Database,
      color: 'from-emerald-600 to-teal-700',
      iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      description: 'Individual reports are combined with municipal census data and public infrastructure layers to detect demand hotspots.',
      details: ['Ward-level geo-clustering', 'Population impact scoring', 'Historical failure cross-referencing'],
    },
    {
      step: '04',
      title: 'Actionable Recommendation',
      tag: 'Civic Capital Planning',
      icon: ClipboardCheck,
      color: 'from-purple-600 to-violet-700',
      iconBg: 'bg-purple-50 border-purple-200 text-purple-600',
      description: 'Gemini generates an evidence-based project brief with budget estimates and expected beneficiary impact for authorities.',
      details: ['Draft DPR & tender briefs', 'Objective budget estimates', 'District Collector dashboard alerts'],
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold mb-3 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>End-to-End Civic AI Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            How JanSetu AI Works
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            From raw voice audio on a smartphone to an evidence-backed public works project proposal on an administrator&apos;s desk.
          </p>
        </div>

        {/* Pipeline Stepper Visual */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-300 via-blue-300 to-purple-300 -translate-y-12 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.step} 
                  className="gov-card p-6 flex flex-col justify-between bg-white relative group hover:-translate-y-1 transition-all duration-200"
                >
                  {/* Top: Step number & Tag */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        STEP {item.step}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        {item.tag}
                      </span>
                    </div>

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${item.iconBg} border flex items-center justify-center mb-5 shadow-xs group-hover:scale-105 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {item.description}
                    </p>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="pt-4 border-t border-slate-100 space-y-1.5">
                    {item.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Summary Bar */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                The Result: Zero Discretion, 100% Data-Backed Civic Sanctions
              </p>
              <p className="text-xs text-slate-400">
                Reduces public grievance-to-project synthesis time from 9 months down to 48 hours.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-300 hidden sm:inline">Explore in Action:</span>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
            >
              <span>View Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
