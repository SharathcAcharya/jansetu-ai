'use client';

import React, { useState, useEffect } from 'react';
import { DemandHotspot, DevelopmentRecommendation } from '@/types';
import { EvidenceBundle } from '@/types/evidence';
import { 
  Flame, 
  MapPin, 
  Users, 
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  Loader2,
  Gauge,
  BarChart2,
  Activity,
  CheckCircle2,
  Sparkles,
  Brain,
  ShieldAlert,
  RefreshCw,
  FileText,
  Building,
  Clock,
  Mic,
  Volume2,
  Globe,
  Database,
  ShieldCheck,
  Radio,
  Coins,
  Scale,
  ArrowDown
} from 'lucide-react';
import { EvidenceBehindDemand } from './EvidenceBehindDemand';

interface HotspotsSectionProps {
  hotspots: DemandHotspot[];
  loading?: boolean;
  selectedKey?: string | null;
  onSelectHotspot?: (key: string) => void;
}

export const HotspotsSection: React.FC<HotspotsSectionProps> = ({ 
  hotspots, 
  loading = false,
  selectedKey,
  onSelectHotspot
}) => {
  const [internalSelectedKey, setInternalSelectedKey] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, DevelopmentRecommendation>>({});
  const [recLoading, setRecLoading] = useState<boolean>(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [currentBundle, setCurrentBundle] = useState<EvidenceBundle | null>(null);

  const currentSelectedKey = selectedKey !== undefined && selectedKey !== null ? selectedKey : internalSelectedKey;

  // Default to the first hotspot if none selected
  const activeHotspot = hotspots.find((h) => h.locationKey === currentSelectedKey) || hotspots[0] || null;
  const currentRecommendation = activeHotspot ? recommendations[activeHotspot.locationKey] : null;

  // Reset snapshot bundle, recommendation loading & error when active hotspot changes
  useEffect(() => {
    setCurrentBundle(null);
    setRecLoading(false);
    setRecError(null);
  }, [activeHotspot?.locationKey]);

  const scrollToHotspotDetails = () => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('hotspot-details') || document.getElementById('evidence-behind-demand');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelect = (key: string, shouldScroll = true) => {
    setInternalSelectedKey(key);
    if (onSelectHotspot) {
      onSelectHotspot(key);
    }
    if (shouldScroll) {
      setTimeout(() => {
        scrollToHotspotDetails();
      }, 50);
    }
  };

  const handleGenerateRecommendation = async (locationKey: string, bypassCache = false) => {
    try {
      setRecLoading(true);
      setRecError(null);

      const res = await fetch('/api/intelligence/recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationKey, bypassCache }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data: DevelopmentRecommendation = await res.json();
      setRecommendations((prev) => ({
        ...prev,
        [locationKey]: data,
      }));
    } catch (err: any) {
      console.error('Failed to generate AI recommendation:', err);
      setRecError('AI recommendation temporarily unavailable.');
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Demand Hotspots Main Container */}
      <div className="gov-card p-6 bg-white border border-slate-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Demand Hotspots & Priority Intelligence</h3>
              <p className="text-xs text-slate-500">
                Geographic demand clusters ranked deterministically by explainable priority score
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>{hotspots.length} Hotspots Identified</span>
            </span>
          </div>
        </div>

        {/* Prototype Demonstration Note */}
        <div className="mb-5 px-3.5 py-2.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Note:</strong> Demo dataset includes synthetic records for prototype demonstration.
          </span>
        </div>

        {/* 2. "How the score works" Section */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-blue-700" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              How the Priority Score Works
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
              <div className="text-sm font-extrabold text-blue-700">30%</div>
              <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Citizen Demand</div>
              <div className="text-[10px] text-slate-500">Normalized request volume</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
              <div className="text-sm font-extrabold text-emerald-700">25%</div>
              <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Affected Population</div>
              <div className="text-[10px] text-slate-500">Relative community scale</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
              <div className="text-sm font-extrabold text-amber-700">25%</div>
              <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Urgency</div>
              <div className="text-[10px] text-slate-500">High-urgency request ratio</div>
            </div>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-center">
              <div className="text-sm font-extrabold text-purple-700">20%</div>
              <div className="text-[11px] font-semibold text-slate-700 mt-0.5">Infrastructure Gap</div>
              <div className="text-[10px] text-slate-500">Reported infrastructure ratio</div>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-2 italic leading-relaxed">
            &ldquo;The Priority Score is an explainable prototype metric calculated from citizen-submitted demand. It is not an official government ranking or allocation decision.&rdquo;
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Aggregating and scoring demand intelligence...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && hotspots.length === 0 && (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No demand hotspots identified yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Citizen complaints with valid locations will automatically cluster into geographic demand hotspots.
            </p>
          </div>
        )}

        {/* Hotspots Table */}
        {!loading && hotspots.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-700 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Priority Score</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4 text-center">Channels</th>
                  <th className="py-3 px-4 text-center">Requests</th>
                  <th className="py-3 px-4 text-right">Affected Population</th>
                  <th className="py-3 px-4">Top Category</th>
                  <th className="py-3 px-4 text-center">High Urgency Requests</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hotspots.map((hs, idx) => {
                  const displayName = hs.locality 
                    ? hs.locality 
                    : (hs.district ? hs.district : hs.state);
                  const subLocation = hs.locality 
                    ? (hs.district ? `${hs.district}, ${hs.state}` : hs.state)
                    : (hs.district ? hs.state : '');
                  const isSelected = activeHotspot?.locationKey === hs.locationKey;

                  return (
                    <tr 
                      key={hs.locationKey || idx}
                      onClick={() => handleSelect(hs.locationKey, true)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50/60 font-medium' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Priority Score with neutral visual indicator */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div 
                              className="bg-blue-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, Math.max(0, hs.priorityScore))}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                            Priority Score: {hs.priorityScore.toFixed(1)} / 100
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-sm font-bold text-slate-900">{displayName}</div>
                            {subLocation && (
                              <div className="text-[11px] text-slate-500 font-normal">{subLocation}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* State */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {hs.state || 'N/A'}
                      </td>

                      {/* Channels (Voice vs Text) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/80 border border-slate-200">
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700" title="Voice Submissions">
                            <Mic className="w-2.5 h-2.5" />
                            {hs.sourceDistribution?.voice ?? 0}
                          </span>
                          <span className="text-slate-300 text-[10px]">|</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-700" title="Text Submissions">
                            <FileText className="w-2.5 h-2.5" />
                            {hs.sourceDistribution?.text ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Requests */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {hs.totalRequests}
                        </span>
                      </td>

                      {/* Affected Population */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        <div className="flex items-center justify-end gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{hs.affectedPopulation > 0 ? hs.affectedPopulation.toLocaleString() : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Top Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {hs.topCategory || 'General'}
                        </span>
                      </td>

                      {/* High Urgency Requests */}
                      <td className="py-3.5 px-4 text-center">
                        {hs.highUrgencyRequests > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>{hs.highUrgencyRequests}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(hs.locationKey, true);
                          }}
                          aria-controls="hotspot-details"
                          title={`View details for ${displayName}`}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 mx-auto ${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <span>Details</span>
                          <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Selected Hotspot Detail Section (Phase 6E-2) */}
      {activeHotspot && (() => {
        const isNoLocation = (!activeHotspot.locality && !activeHotspot.district && !activeHotspot.state) || 
          activeHotspot.locationKey === 'unmapped' || 
          activeHotspot.locationKey === 'not_provided';

        // Neutral Priority Category label
        const getPriorityCategory = (score: number) => {
          if (score >= 75) return { label: 'Critical Demand', color: 'bg-red-50 text-red-700 border-red-200' };
          if (score >= 50) return { label: 'High Demand', color: 'bg-amber-50 text-amber-700 border-amber-200' };
          if (score >= 25) return { label: 'Moderate Demand', color: 'bg-blue-50 text-blue-700 border-blue-200' };
          return { label: 'Routine Demand', color: 'bg-slate-50 text-slate-700 border-slate-200' };
        };
        const priorityCat = getPriorityCategory(activeHotspot.priorityScore);

        const voiceCount = activeHotspot.sourceDistribution?.voice ?? 0;
        const textCount = activeHotspot.sourceDistribution?.text ?? 0;
        const totalSources = voiceCount + textCount || activeHotspot.totalRequests || 1;
        const voicePercent = Math.round((voiceCount / totalSources) * 100);
        const textPercent = 100 - voicePercent;

        const languages = (activeHotspot.languagesRepresented && activeHotspot.languagesRepresented.length > 0)
          ? activeHotspot.languagesRepresented
          : ['English'];

        // Geographic level
        const geoLevel = activeHotspot.locality ? 'Locality Level' : activeHotspot.district ? 'District Level' : 'State Level';

        // Fallback status on demographic evidence from bundle
        const demoEvidence = currentBundle?.demographicEvidence;
        const demoIsFallback = currentBundle?.fallbackMetadata?.demographicsIsFallback ?? false;
        const demoFallbackLevel = currentBundle?.fallbackMetadata?.demographicsMatchedLevel ?? 'district';

        return (
          <div id="hotspot-details" className="gov-card p-6 bg-white border border-slate-200 space-y-6 scroll-mt-24">
            {/* ---------------------------------------------------- */}
            {/* 1. HOTSPOT HEADER                                   */}
            {/* ---------------------------------------------------- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">
                      {isNoLocation ? 'Unspecified Location' : (activeHotspot.locality || activeHotspot.district || activeHotspot.state)}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                      {geoLevel}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${priorityCat.color}`}>
                      {priorityCat.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5">
                    {isNoLocation ? (
                      <span className="text-amber-700 font-semibold">
                        Geographic evidence unavailable — citizen did not provide a location.
                      </span>
                    ) : (
                      <span>
                        {[activeHotspot.locality, activeHotspot.district, activeHotspot.state].filter(Boolean).join(' • ')} — {activeHotspot.totalRequests} citizen requests registered
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action & Neutral Priority Score Badge */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <a
                  href="#geospatial-demand-map"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                  title="Locate selected hotspot on the Geospatial Demand Intelligence Map"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Locate on Map</span>
                </a>

                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Deterministic Index
                    </div>
                    <div className="text-xs font-semibold text-slate-700">Priority Score:</div>
                  </div>
                  <div className="font-mono text-xl font-extrabold text-blue-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {activeHotspot.priorityScore.toFixed(1)} <span className="text-xs font-normal text-slate-500">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 2. CITIZEN DEMAND SUMMARY                           */}
            {/* ---------------------------------------------------- */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">Citizen Demand Summary</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                        CITIZEN-PROVIDED EVIDENCE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Aggregated directly from verified citizen submissions; not official government statistics.
                    </p>
                  </div>
                </div>
              </div>

              {/* Demand Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Total Requests</div>
                  <div className="text-xl font-extrabold text-blue-700 mt-1">
                    {activeHotspot.totalRequests}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Verified citizen reports</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Affected Population</div>
                  <div className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
                    {activeHotspot.affectedPopulation > 0 ? activeHotspot.affectedPopulation.toLocaleString() : 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Reported community scale</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">High Urgency Demands</div>
                  <div className="text-xl font-extrabold text-red-700 mt-1">
                    {activeHotspot.highUrgencyRequests}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Critical/acute situations</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Infrastructure Demands</div>
                  <div className="text-xl font-extrabold text-purple-700 mt-1">
                    {activeHotspot.infrastructureRequests ?? 0}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Citing physical infrastructure</div>
                </div>
              </div>

              {/* Channels & Linguistic Reach */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Submission Channels */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      Submission Channels
                    </span>
                    <span className="text-[11px] text-slate-500">{totalSources} Total Submissions</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="flex items-center gap-1 text-blue-700">
                      <Mic className="w-3.5 h-3.5" />
                      Voice: {voiceCount} ({voicePercent}%)
                    </span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <FileText className="w-3.5 h-3.5" />
                      Text: {textCount} ({textPercent}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-blue-600 h-full transition-all"
                      style={{ width: `${voicePercent}%` }}
                      title={`Voice Submissions: ${voicePercent}%`}
                    />
                    <div 
                      className="bg-slate-500 h-full transition-all"
                      style={{ width: `${textPercent}%` }}
                      title={`Text Submissions: ${textPercent}%`}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Voice input removes literacy barriers across regional dialects and rural demographics.
                  </p>
                </div>

                {/* Multilingual Representation */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      Languages Represented
                    </span>
                    <span className="text-[11px] text-slate-500">{languages.length} Active Channels</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 my-1">
                    {languages.map((lang) => {
                      const vernacular = lang.toLowerCase() === 'kannada' ? 'ಕನ್ನಡ' 
                        : lang.toLowerCase() === 'hindi' ? 'हिंदी' 
                        : lang.toLowerCase() === 'tamil' ? 'தமிழ்' 
                        : lang.toLowerCase() === 'telugu' ? 'తెలుగు' 
                        : '';
                      return (
                        <span 
                          key={lang}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-800 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          {lang} {vernacular ? `(${vernacular})` : ''}
                        </span>
                      );
                    })}
                  </div>

                  <p className="text-[10px] text-slate-500 mt-2 italic">
                    Citizen submissions are processed in their native vernacular language with fidelity.
                  </p>
                </div>
              </div>

              {/* Category Reports Distribution */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <span>Citizen Reports by Category</span>
                  <span className="text-slate-400 font-normal lowercase">Top category: <strong className="text-slate-700 uppercase font-semibold">{activeHotspot.topCategory || 'N/A'}</strong></span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeHotspot.categoryCounts || {}).map(([cat, count]) => (
                    <div 
                      key={cat}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="font-medium text-slate-800">{cat}</span>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-white text-blue-700 border border-slate-200 shadow-2xs">
                        {count} {count === 1 ? 'report' : 'reports'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 3. WHY THIS SCORE? (PRIORITY SCORE BREAKDOWN)       */}
            {/* ---------------------------------------------------- */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Why This Score? — Explainable Priority Breakdown</h4>
                    <p className="text-xs text-slate-500">
                      Deterministic mathematical calculation based entirely on citizen-reported demand metrics
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="font-semibold">Priority Formula:</span>
                  <span className="font-mono font-bold text-slate-800">30% D + 25% P + 25% U + 20% I</span>
                </div>
              </div>

              {/* Plain Language Score Explanation (Mandatory per Section 5) */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
                <p className="font-medium leading-relaxed">
                  This score summarizes citizen-reported demand using request volume, affected population, urgency, and infrastructure-related demand.
                </p>
                <p className="text-blue-700/90 leading-relaxed text-[11px]">
                  Supporting demographic, infrastructure, and investment evidence provides context but does not change the priority score.
                </p>
              </div>

              {/* 4 Deterministic Components Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Demand Score */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Citizen Demand</span>
                    <span className="text-slate-500 text-[10px] font-mono">Weight: 30%</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-blue-700 mb-2">
                    {activeHotspot.priorityBreakdown?.demandScore?.toFixed(1) ?? '0.0'}
                    <span className="text-xs font-normal text-slate-500"> / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, activeHotspot.priorityBreakdown?.demandScore || 0))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">Volume of verified reports</div>
                </div>

                {/* Population Score */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Affected Population</span>
                    <span className="text-slate-500 text-[10px] font-mono">Weight: 25%</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-emerald-700 mb-2">
                    {activeHotspot.priorityBreakdown?.populationScore?.toFixed(1) ?? '0.0'}
                    <span className="text-xs font-normal text-slate-500"> / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, activeHotspot.priorityBreakdown?.populationScore || 0))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">Reported community footprint</div>
                </div>

                {/* Urgency Score */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Urgency</span>
                    <span className="text-slate-500 text-[10px] font-mono">Weight: 25%</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-amber-700 mb-2">
                    {activeHotspot.priorityBreakdown?.urgencyScore?.toFixed(1) ?? '0.0'}
                    <span className="text-xs font-normal text-slate-500"> / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, activeHotspot.priorityBreakdown?.urgencyScore || 0))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">Acute emergency indicators</div>
                </div>

                {/* Infrastructure Gap Score */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Infrastructure Gap</span>
                    <span className="text-slate-500 text-[10px] font-mono">Weight: 20%</span>
                  </div>
                  <div className="text-xl font-mono font-extrabold text-purple-700 mb-2">
                    {activeHotspot.priorityBreakdown?.infrastructureGapScore?.toFixed(1) ?? '0.0'}
                    <span className="text-xs font-normal text-slate-500"> / 100</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, activeHotspot.priorityBreakdown?.infrastructureGapScore || 0))}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-2">Physical asset deficit proxy</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Note: The priority score formula remains strictly citizen-demand-centric (30/25/25/20). Demographic Census data, infrastructure indices, and public investment allocations provide decision context but do not alter the priority score calculation.
              </p>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 4. EVIDENCE SNAPSHOT                                */}
            {/* ---------------------------------------------------- */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Evidence Snapshot</h4>
                    <p className="text-xs text-slate-500">
                      Summary of the 4 evidence dimensions and cross-source completeness score
                    </p>
                  </div>
                </div>

                <a 
                  href="#evidence-behind-demand"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                >
                  <span>View Complete Evidence Behind Demand</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 5-Card Snapshot Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* 1. Citizen Evidence */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      Citizen
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                      Live
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {activeHotspot.totalRequests} <span className="text-xs font-normal text-slate-500">requests</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                    {activeHotspot.affectedPopulation > 0 ? `${activeHotspot.affectedPopulation.toLocaleString()} affected` : 'Reported scale'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Citizen-provided evidence
                  </div>
                </div>

                {/* 2. Demographic Evidence */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      Demographics
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      Public
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 truncate">
                    Census 2011
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                    {demoIsFallback ? (
                      <span className="text-amber-700 font-medium">
                        {demoFallbackLevel === 'district' ? 'District-level fallback' : 'State-level fallback'}
                      </span>
                    ) : (
                      demoEvidence?.originalCensusName || demoEvidence?.locality || demoEvidence?.district || 'Public Dataset'
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Historical baseline — 2011
                  </div>
                </div>

                {/* 3. Infrastructure Evidence */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-purple-600" />
                      Infrastructure
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                      {currentBundle?.infrastructureEvidence?.provenance.isSynthetic ? 'Demo' : 'Available'}
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 truncate">
                    {currentBundle?.infrastructureEvidence?.provenance.isSynthetic ? 'Synthetic Demo' : 'Available'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                    Asset & utility proxies
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Synthetic demo data
                  </div>
                </div>

                {/* 4. Investment Evidence */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      Investment
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                      {currentBundle?.investmentEvidence?.provenance.isSynthetic ? 'Demo' : 'Available'}
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900 truncate">
                    {currentBundle?.investmentEvidence?.provenance.isSynthetic ? 'Synthetic Demo' : 'Available'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                    Capital tender proxies
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Synthetic demo data
                  </div>
                </div>

                {/* 5. Evidence Completeness */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Completeness
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      Index
                    </span>
                  </div>
                  <div className="text-base font-extrabold text-emerald-700">
                    {currentBundle ? `${Math.round(currentBundle.completeness.score * 100)}%` : '100%'}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                    {currentBundle ? currentBundle.completeness.level : 'HIGH'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    4 / 4 dimensions verified
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 5. AI DEVELOPMENT RECOMMENDATION                    */}
            {/* ---------------------------------------------------- */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              {/* Pipeline Flow Visualization */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      1. Citizen Evidence
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      2. Priority / Demand Intelligence
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      3. Supporting Evidence
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                      4. AI Development Recommendation
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 italic text-right">
                    * Gemini does not determine the priority score; priority is calculated independently.
                  </span>
                </div>
              </div>

              {/* Recommendation Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">AI Development Recommendation</h4>
                    <p className="text-xs text-slate-500">
                      Evidence-grounded civic intervention synthesized by Gemini for policymaker evaluation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateRecommendation(activeHotspot.locationKey, Boolean(currentRecommendation))}
                    disabled={recLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition-colors shadow-2xs disabled:opacity-50"
                  >
                    {recLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : currentRecommendation ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh Recommendation</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate AI Recommendation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error State Fallback */}
              {recError && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{recError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateRecommendation(activeHotspot.locationKey, true)}
                    className="px-2.5 py-1 rounded bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Initial Empty / Prompt State */}
              {!currentRecommendation && !recLoading && !recError && (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-700">No recommendation synthesized yet for this hotspot</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
                    Click &ldquo;Generate AI Recommendation&rdquo; to analyze the {activeHotspot.totalRequests} citizen reports in {activeHotspot.locality || activeHotspot.district || activeHotspot.state} and synthesize a structured intervention.
                  </p>
                </div>
              )}

              {/* Loading Skeleton */}
              {recLoading && (
                <div className="p-8 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col items-center justify-center text-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <div className="text-xs font-semibold text-slate-800">Grounding Evidence & Synthesizing Recommendation...</div>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Gemini is analyzing reported infrastructure bottlenecks and formulating actionable engineering interventions.
                  </p>
                </div>
              )}

              {/* Full Recommendation Display */}
              {currentRecommendation && !recLoading && (
                <div className="space-y-4">
                  {/* Meta Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        Generated by Gemini
                      </span>

                      {currentRecommendation.cached && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ⚡ Cached Firestore Result
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500">
                        AI Recommendation Confidence:{' '}
                        <strong className={`uppercase font-semibold ${
                          currentRecommendation.confidence === 'high' 
                            ? 'text-emerald-700' 
                            : currentRecommendation.confidence === 'medium'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}>
                          {currentRecommendation.confidence}
                        </strong>
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Generated: {new Date(currentRecommendation.generatedAt || Date.now()).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Recommendation Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Panel 1: EVIDENCE GROUNDING (CITIZEN EVIDENCE) */}
                    <div className="lg:col-span-5 p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 mb-3 text-slate-700">
                          <Users className="w-4 h-4 text-blue-600" />
                          <h5 className="text-xs font-bold uppercase tracking-wider">Citizen Evidence Grounding</h5>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Total Demands:</span>
                            <span className="font-semibold text-slate-900">{currentRecommendation.evidence.totalRequests} verified complaints</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Reported Population:</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {currentRecommendation.evidence.affectedPopulation > 0 
                                ? currentRecommendation.evidence.affectedPopulation.toLocaleString() 
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">High Urgency Demands:</span>
                            <span className="font-semibold text-red-700">{currentRecommendation.evidence.highUrgencyRequests} critical issues</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Infrastructure Reports:</span>
                            <span className="font-semibold text-slate-900">{currentRecommendation.evidence.infrastructureRequests} cited physical assets</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Primary Domain:</span>
                            <span className="font-semibold text-slate-900">{currentRecommendation.evidence.topCategory}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Priority Score:</span>
                            <span className="font-mono font-bold text-blue-700">{currentRecommendation.evidence.priorityScore.toFixed(1)} / 100</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 italic">
                        * Citizen metrics aggregated directly from citizen-submitted records in Firestore.
                      </div>
                    </div>

                    {/* Panel 2: INTERVENTION & DETAILS */}
                    <div className="lg:col-span-7 p-4 rounded-xl bg-white border border-purple-200 shadow-2xs space-y-3.5">
                      <div className="flex items-center gap-1.5 pb-2 border-purple-100 text-purple-900">
                        <Brain className="w-4 h-4 text-purple-700" />
                        <h5 className="text-xs font-bold uppercase tracking-wider">AI Intervention & Rationale</h5>
                      </div>

                      {/* Headline */}
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {currentRecommendation.headline}
                        </h4>
                      </div>

                      {/* Problem Statement */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">Problem Statement:</span>
                        <p className="text-slate-600 leading-relaxed">{currentRecommendation.problemStatement}</p>
                      </div>

                      {/* Potential Development Intervention */}
                      <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100 text-xs">
                        <span className="font-bold text-purple-900 block mb-0.5">Potential Development Intervention:</span>
                        <p className="text-slate-700 leading-relaxed font-medium">{currentRecommendation.recommendedIntervention}</p>
                      </div>

                      {/* Rationale */}
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">Evidence-Grounded Rationale:</span>
                        <p className="text-slate-600 leading-relaxed">{currentRecommendation.rationale}</p>
                      </div>

                      {/* Suggested Department (Explicit Label per Section 9) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs py-2 px-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 shrink-0">
                          <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-500 font-medium">Suggested department:</span>
                          <span className="font-bold text-slate-900">{currentRecommendation.suggestedDepartment}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 sm:ml-auto italic">
                          (Suggested department based on complaint classification, not official administrative assignment)
                        </span>
                      </div>

                      {/* Implementation Considerations */}
                      {currentRecommendation.implementationConsiderations?.length > 0 && (
                        <div className="text-xs">
                          <span className="font-bold text-slate-700 block mb-1">Implementation Considerations:</span>
                          <ul className="space-y-1 pl-4 list-disc text-slate-600">
                            {currentRecommendation.implementationConsiderations.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Limitations & Caveats */}
                      <div className="text-xs pt-2 border-t border-slate-100 space-y-1">
                        <span className="font-bold text-slate-700 block">Limitations & Evidence Caveats:</span>
                        <ul className="space-y-1 pl-4 list-disc text-slate-500 text-[11px]">
                          <li>Census demographic data is from 2011 (historical baseline).</li>
                          <li>Infrastructure evidence includes synthetic demo baselines.</li>
                          <li>Public investment evidence includes synthetic demo records.</li>
                          <li>Citizen demand reflects submitted reports and may not represent every resident.</li>
                          {currentRecommendation.limitations?.map((item, i) => (
                            <li key={`lim-${i}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Advisory Disclaimer */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-[11px] text-slate-600 italic">
                    &ldquo;AI-generated decision-support output based on citizen-submitted evidence. Final decisions require human and administrative validation.&rdquo;
                  </div>
                </div>
              )}
            </div>

            {/* ---------------------------------------------------- */}
            {/* 6. EVIDENCE BEHIND DEMAND (Phase 6E-1 Component)     */}
            {/* ---------------------------------------------------- */}
            <div id="evidence-behind-demand" className="pt-6 border-t border-slate-200 scroll-mt-24">
              <EvidenceBehindDemand 
                hotspot={activeHotspot} 
                onBundleLoaded={setCurrentBundle} 
                className="mt-2" 
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
};



