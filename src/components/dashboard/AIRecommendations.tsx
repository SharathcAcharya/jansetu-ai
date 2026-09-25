'use client';

import React, { useState } from 'react';
import { AIRecommendation } from '@/types';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Users, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Send
} from 'lucide-react';

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ recommendations }) => {
  const [selectedRec, setSelectedRec] = useState<AIRecommendation | null>(recommendations[0]);
  const [sanctionedList, setSanctionedList] = useState<Record<string, boolean>>({});

  const handleSimulatedSanction = (id: string) => {
    setSanctionedList((prev) => ({ ...prev, [id]: true }));
    alert(`Project Sanction Notice Generated for ${id}. Dispatched to State E-Procurement Portal simulation.`);
  };

  return (
    <div className="gov-card p-6 bg-white border border-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Gemini Evidence-Based Project Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Autonomous capital works proposals generated from clustered citizen demand & public data
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200">
          <span>Gemini 1.5 Pro Civic Reasoning</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendation List */}
        <div className="lg:col-span-1 space-y-3">
          {recommendations.map((rec) => {
            const isSelected = selectedRec?.id === rec.id;
            const isSanctioned = sanctionedList[rec.id] || rec.status === 'APPROVED';

            return (
              <div
                key={rec.id}
                onClick={() => setSelectedRec(rec)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/40 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[11px] font-bold text-slate-500">
                    {rec.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSanctioned
                        ? 'bg-emerald-100 text-emerald-800'
                        : rec.priorityLevel === 'CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {isSanctioned ? 'SANCTIONED' : rec.priorityLevel}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                  {rec.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                  {rec.targetRegion}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">{rec.estimatedBudget}</span>
                  <div className="flex items-center gap-1 text-purple-700 font-medium">
                    <span>View Brief</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Proposal View */}
        {selectedRec && (
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-mono font-bold text-purple-700 block">
                    {selectedRec.code} • {selectedRec.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {selectedRec.title}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedRec.targetRegion} ({selectedRec.state})</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Confidence</span>
                    <span className="text-sm font-bold text-emerald-600">{selectedRec.geminiConfidence}%</span>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Executive Rationale & Problem Diagnosis
                </h5>
                <p className="text-sm text-slate-600 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
                  {selectedRec.urgencyRationale}
                </p>
              </div>

              {/* Key Indicators */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Budget Estimate</span>
                  <span className="text-sm font-bold text-slate-900">{selectedRec.estimatedBudget}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Beneficiaries</span>
                  <span className="text-sm font-bold text-blue-700">{selectedRec.estimatedBeneficiaries}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Target Completion</span>
                  <span className="text-sm font-bold text-slate-900">{selectedRec.projectedTimeline}</span>
                </div>
              </div>

              {/* Evidence Checklist */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Evidence Factors for Municipal Sanction
                </h5>
                <ul className="space-y-1.5">
                  {selectedRec.keyEvidenceFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Ready for District Collector & Municipal Council Approval
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleSimulatedSanction(selectedRec.id)}
                  disabled={sanctionedList[selectedRec.id] || selectedRec.status === 'APPROVED'}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    sanctionedList[selectedRec.id] || selectedRec.status === 'APPROVED'
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-purple-700 text-white hover:bg-purple-800 active:scale-95'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {sanctionedList[selectedRec.id] || selectedRec.status === 'APPROVED'
                      ? 'Project Approved & Sanctioned'
                      : 'Approve & Sanction Project'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
