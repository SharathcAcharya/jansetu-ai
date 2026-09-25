'use client';

import React, { useState } from 'react';
import { CitizenRequest } from '@/types';
import { 
  Search, 
  Filter, 
  MapPin, 
  Eye, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface RecentRequestsTableProps {
  requests: CitizenRequest[];
}

export const RecentRequestsTable: React.FC<RecentRequestsTableProps> = ({ requests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<CitizenRequest | null>(null);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.wardOrPanchayat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || req.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CLUSTERED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">In Hotspot Cluster</span>;
      case 'ANALYZED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">AI Analyzed</span>;
      case 'IN_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">Under Review</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="gov-card p-6 bg-white border border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Citizen Demands Feed</h3>
            <p className="text-xs text-slate-500">Live incoming grievances with AI entity extraction</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Ward, ID, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Sectors</option>
            <option value="Water Supply & Drainage">Water & Drainage</option>
            <option value="Roads & Public Transit">Roads & Transit</option>
            <option value="Primary Health & Clinics">Primary Health</option>
            <option value="Power & Street Lighting">Power & Lighting</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
              <th className="py-3 px-4">Tracking Code</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Location (Ward / State)</th>
              <th className="py-3 px-4">Language</th>
              <th className="py-3 px-4">Priority & Score</th>
              <th className="py-3 px-4">Pipeline Status</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {req.trackingNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800">{req.category}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{req.location.wardOrPanchayat}, {req.location.state}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {req.language}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(req.urgency)}
                      <span className="font-mono text-slate-500">{req.priorityScore}/100</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No citizen demands match the search filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Detailed Request Inspection */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-orange-600">
                  {selectedRequest.trackingNumber}
                </span>
                <span>•</span>
                <span className="text-xs text-slate-500">{selectedRequest.submittedAt}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedRequest.category} — {selectedRequest.location.wardOrPanchayat}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedRequest.location.district}, {selectedRequest.location.state} • Pincode: {selectedRequest.location.pincode}
              </p>
            </div>

            {/* Original Citizen Input */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Original Citizen Grievance ({selectedRequest.language})
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed italic">
                  &ldquo;{selectedRequest.description}&rdquo;
                </div>
                {selectedRequest.location.landmark && (
                  <p className="text-xs text-slate-500 mt-1">
                    Landmark: {selectedRequest.location.landmark}
                  </p>
                )}
              </div>

              {/* Gemini AI Synthesis breakdown */}
              {selectedRequest.aiAnalysis && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Gemini AI Synthesis & Verification
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-800">
                      Confidence: {selectedRequest.aiAnalysis.confidenceScore}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-0.5">Synthesized Issue:</span>
                    <p className="text-xs text-slate-800 font-medium">
                      {selectedRequest.aiAnalysis.summary}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">Key Vulnerability Factors:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRequest.aiAnalysis.keyFactors.map((factor, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-blue-200 text-blue-900">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-blue-200/60">
                    <span className="text-[11px] font-bold text-slate-600 block mb-0.5">Recommended Municipal Action:</span>
                    <p className="text-xs text-blue-900">
                      {selectedRequest.aiAnalysis.suggestedAction}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
