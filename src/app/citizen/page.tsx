import React from 'react';
import { CitizenForm } from '@/components/citizen/CitizenForm';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  Users, 
  FileText 
} from 'lucide-react';

export default function CitizenPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-900 text-xs font-semibold mb-3 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            <span>Public Civic Redressal & Capital Works Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Report a Development Issue
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Submit a neighborhood infrastructure grievance. JanSetu AI clusters your complaint with surrounding citizens to compute transparent priority scores for municipal action.
          </p>
        </div>

        {/* Informative Guidance Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Vernacular Voice & Text</h4>
              <p className="text-xs text-slate-500 mt-0.5">Speak or write in 10+ Indian regional languages.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Collective Demand Power</h4>
              <p className="text-xs text-slate-500 mt-0.5">Multiple reports in a ward form a high-priority hotspot.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Zero Red Tape</h4>
              <p className="text-xs text-slate-500 mt-0.5">Data is directly synthesized for public works engineers.</p>
            </div>
          </div>
        </div>

        {/* The Main Citizen Form */}
        <CitizenForm />
      </div>
    </div>
  );
}
