'use client';

import React, { useState, useEffect } from 'react';
import { 
  MOCK_CATEGORY_METRICS, 
  MOCK_PRIORITY_METRICS, 
  MOCK_CITIZEN_REQUESTS, 
  MOCK_AI_RECOMMENDATIONS,
  INDIAN_STATES
} from '@/data/mockData';
import { HotspotsApiResponse } from '@/types';
import { MetricsGrid } from '@/components/dashboard/MetricsGrid';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { PriorityChart } from '@/components/dashboard/PriorityChart';
import { HotspotsSection } from '@/components/dashboard/HotspotsSection';
import { IndiaMapPlaceholder } from '@/components/dashboard/IndiaMapPlaceholder';
import { AIRecommendations } from '@/components/dashboard/AIRecommendations';
import { RecentRequestsTable } from '@/components/dashboard/RecentRequestsTable';
import { 
  Download, 
  RefreshCw, 
  MapPin,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<HotspotsApiResponse | null>(null);
  const [selectedHotspotKey, setSelectedHotspotKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchHotspots = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/intelligence/hotspots');
      if (!res.ok) {
        throw new Error(`Failed to fetch hotspots intelligence: HTTP ${res.status}`);
      }
      const json: HotspotsApiResponse = await res.json();
      setData(json);
      // Synchronize canonical selected hotspot with loaded dataset
      if (json.hotspots && json.hotspots.length > 0) {
        setSelectedHotspotKey((prevKey) => {
          if (prevKey && json.hotspots.some((h) => h.locationKey === prevKey)) {
            return prevKey;
          }
          return json.hotspots[0].locationKey;
        });
      }
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Error fetching demand hotspots:', err);
      setError(err.message || 'Failed to load live aggregation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotspots();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Dashboard Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                State & Municipal Planning Intelligence • Live Firestore Feed
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Policymaker Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Evidence-based resource allocation synthesized from multi-lingual citizen demands.
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchHotspots}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh Firestore Demand Intelligence"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select className="bg-transparent focus:outline-none cursor-pointer">
                <option value="all">All States ({INDIAN_STATES.length} Regions)</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => alert('Exporting synthesized civic capital brief (PDF/CSV)...')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Capital Brief</span>
            </button>
          </div>
        </div>

        {/* Demo Environment Transparency Indicator */}
        <div className="px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>
              <strong>Demo Environment:</strong> Includes verified Census 2011 public data along with clearly marked synthetic infrastructure and investment demo baselines.
            </span>
          </div>
          <span className="text-[10px] text-amber-700/80 font-mono shrink-0">
            Phase 6E-4 • Fully Provenance-Audited
          </span>
        </div>

        {/* Error Notice if any */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Core KPI Metrics - Real Live Aggregation Results */}
        <MetricsGrid 
          totalRequests={data?.totalRequests ?? 0}
          geographicallyMappedRequests={data?.geographicallyMappedRequests ?? 0}
          unmappedRequests={data?.unmappedRequests ?? 0}
          hotspotsCount={data?.hotspots?.length ?? 0}
          loading={loading}
        />

        {/* 2. Demand Hotspots Section - Real Live Aggregation Results */}
        <HotspotsSection 
          hotspots={data?.hotspots ?? []} 
          loading={loading}
          selectedKey={selectedHotspotKey}
          onSelectHotspot={setSelectedHotspotKey}
        />

        {/* 3. Visual Analytics (Category & Priority Breakdown) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart data={MOCK_CATEGORY_METRICS} />
          <PriorityChart data={MOCK_PRIORITY_METRICS} />
        </div>

        {/* 4. Geospatial Demand Intelligence Map */}
        <IndiaMapPlaceholder 
          hotspots={data?.hotspots ?? []}
          selectedKey={selectedHotspotKey}
          onSelectHotspot={setSelectedHotspotKey}
        />

        {/* 5. Gemini Evidence-Based AI Recommendations */}
        <AIRecommendations recommendations={MOCK_AI_RECOMMENDATIONS} />

        {/* 6. Filterable Recent Citizen Demands Feed */}
        <RecentRequestsTable requests={MOCK_CITIZEN_REQUESTS} />
      </div>
    </div>
  );
}

