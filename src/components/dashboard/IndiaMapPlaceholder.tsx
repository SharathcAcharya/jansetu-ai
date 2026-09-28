'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Sparkles, 
  Layers, 
  Info, 
  Mic, 
  FileText, 
  ArrowDownCircle, 
  Flame, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { DemandHotspot } from '@/types';

interface IndiaMapProps {
  hotspots?: DemandHotspot[];
  selectedKey?: string | null;
  onSelectHotspot?: (key: string) => void;
}

/**
 * Maps known locations/districts/states to visual coordinate percentages (x, y) on the India SVG map.
 * Returns null if location is unmapped or unknown (never fabricates artificial coordinates).
 */
export function getHotspotCoordinates(hs: DemandHotspot): { x: number; y: number } | null {
  // If location was not provided or is explicitly unmapped, do NOT assign artificial coordinates
  if (
    (!hs.locality && !hs.district && !hs.state) ||
    hs.locationKey === 'unmapped' ||
    hs.locationKey === 'not_provided' ||
    (hs as any).location_source === 'not_provided'
  ) {
    return null;
  }

  const loc = (hs.locality || '').toLowerCase();
  const dist = (hs.district || '').toLowerCase();
  const st = (hs.state || '').toLowerCase();

  // Locality & District direct lookup
  if (loc.includes('karkala') || loc.includes('karkal') || dist.includes('udupi')) return { x: 42, y: 73 };
  if (loc.includes('bengaluru') || dist.includes('bengaluru')) return { x: 46, y: 74 };
  if (loc.includes('mangaluru') || loc.includes('mangalore') || dist.includes('dakshina')) return { x: 40, y: 75 };
  if (loc.includes('mysuru') || dist.includes('mysuru')) return { x: 43, y: 77 };
  if (loc.includes('coimbatore') || dist.includes('coimbatore')) return { x: 45, y: 81 };
  if (loc.includes('kanchipuram') || dist.includes('kanchipuram')) return { x: 50, y: 77 };
  if (loc.includes('chennai') || dist.includes('chennai')) return { x: 52, y: 76 };
  if (loc.includes('kochi') || dist.includes('ernakulam')) return { x: 41, y: 84 };
  if (loc.includes('wayanad') || dist.includes('wayanad')) return { x: 41, y: 79 };
  if (loc.includes('pune') || dist.includes('pune')) return { x: 38, y: 55 };
  if (loc.includes('mumbai') || dist.includes('mumbai')) return { x: 34, y: 53 };
  if (loc.includes('jaipur') || dist.includes('jaipur')) return { x: 38, y: 35 };
  if (loc.includes('barmer') || dist.includes('barmer')) return { x: 29, y: 38 };
  if (loc.includes('delhi') || dist.includes('delhi') || st.includes('delhi')) return { x: 45, y: 28 };
  if (loc.includes('lucknow') || dist.includes('lucknow')) return { x: 54, y: 36 };
  if (loc.includes('varanasi') || dist.includes('varanasi')) return { x: 60, y: 39 };
  if (loc.includes('patna') || dist.includes('patna')) return { x: 66, y: 38 };

  // State level fallbacks
  if (st.includes('karnataka')) return { x: 43, y: 73 };
  if (st.includes('tamil nadu')) return { x: 48, y: 80 };
  if (st.includes('kerala')) return { x: 41, y: 82 };
  if (st.includes('maharashtra')) return { x: 39, y: 55 };
  if (st.includes('rajasthan')) return { x: 34, y: 36 };
  if (st.includes('uttar pradesh')) return { x: 55, y: 36 };
  if (st.includes('bihar')) return { x: 67, y: 38 };
  if (st.includes('west bengal')) return { x: 70, y: 46 };
  if (st.includes('gujarat')) return { x: 28, y: 47 };
  if (st.includes('madhya pradesh')) return { x: 46, y: 45 };

  // Unknown location without recognized state/district
  return null;
}

export const IndiaMapPlaceholder: React.FC<IndiaMapProps> = ({
  hotspots = [],
  selectedKey,
  onSelectHotspot,
}) => {
  const [selectedZone, setSelectedZone] = useState('all');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const zones = [
    { id: 'all', name: 'All India' },
    { id: 'north', name: 'North (Delhi, UP, Rajasthan, Bihar)' },
    { id: 'south', name: 'South (Karnataka, Kerala, Tamil Nadu)' },
    { id: 'west', name: 'West (Maharashtra, Gujarat)' },
  ];

  // Filter hotspots based on geographic zone
  const filteredHotspots = hotspots.filter((hs) => {
    if (selectedZone === 'all') return true;
    const st = (hs.state || '').toLowerCase();
    if (selectedZone === 'north') {
      return (
        st.includes('delhi') ||
        st.includes('uttar pradesh') ||
        st.includes('bihar') ||
        st.includes('rajasthan') ||
        st.includes('punjab') ||
        st.includes('haryana')
      );
    }
    if (selectedZone === 'south') {
      return (
        st.includes('karnataka') ||
        st.includes('kerala') ||
        st.includes('tamil nadu') ||
        st.includes('andhra') ||
        st.includes('telangana')
      );
    }
    if (selectedZone === 'west') {
      return st.includes('maharashtra') || st.includes('gujarat') || st.includes('goa');
    }
    return true;
  });

  // Plottable hotspots with recognized coordinates
  const plottableHotspots = filteredHotspots.filter((hs) => getHotspotCoordinates(hs) !== null);
  const unplottableCount = filteredHotspots.length - plottableHotspots.length;

  // When geographic zone filter changes, ensure selectedKey remains synchronized to a visible hotspot
  useEffect(() => {
    if (selectedKey && filteredHotspots.length > 0) {
      const stillVisible = filteredHotspots.some((h) => h.locationKey === selectedKey);
      if (!stillVisible) {
        onSelectHotspot?.(filteredHotspots[0].locationKey);
      }
    } else if (selectedKey && filteredHotspots.length === 0) {
      onSelectHotspot?.('');
    }
  }, [selectedZone]);

  const activeHotspot = hotspots.find(
    (h) => h.locationKey === (selectedKey || hoveredKey)
  ) || null;

  const scrollToHotspotDetails = () => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('hotspot-details') || document.getElementById('evidence-behind-demand');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="geospatial-demand-map" className="gov-card p-6 bg-white border border-slate-200 flex flex-col justify-between">
      <div>
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Geospatial Demand Intelligence Map</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Interactive Pan-India demand clusters synchronized with explainable evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedZone === zone.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas / Simulated GIS Layer */}
        <div className="relative h-80 sm:h-96 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
          {/* Subtle grid lines simulating GIS coordinate grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

          {/* Abstract SVG outline of India */}
          <svg
            className="w-full h-full max-h-80 sm:max-h-92 opacity-35 text-blue-400 stroke-current"
            viewBox="0 0 500 550"
            fill="none"
            strokeWidth="1.5"
            aria-label="Map of India showing regional civic demand distribution"
          >
            {/* Stylized representative India boundary path */}
            <path 
              d="M 230 40 L 260 70 L 290 85 L 320 120 L 300 150 L 350 170 L 410 180 L 460 170 L 470 200 L 420 220 L 360 230 L 340 260 L 330 300 L 310 340 L 290 380 L 260 440 L 240 480 L 230 470 L 210 420 L 180 360 L 160 320 L 140 270 L 120 240 L 150 200 L 170 170 L 200 130 L 210 90 Z" 
              fill="rgba(30, 58, 138, 0.25)" 
            />
            {/* Tropic of Cancer & Equator dashed markers */}
            <line x1="80" y1="260" x2="420" y2="260" stroke="#334155" strokeDasharray="4 4" />
          </svg>

          {/* Plotted Live Hotspot Markers */}
          {plottableHotspots.map((hs) => {
            const coords = getHotspotCoordinates(hs)!;
            const isSelected = selectedKey === hs.locationKey;
            const isHovered = hoveredKey === hs.locationKey;
            const displayName = hs.locality || hs.district || hs.state;

            // Color coding based on priority score
            const isHighPriority = hs.priorityScore >= 70;
            const isMediumPriority = hs.priorityScore >= 40 && hs.priorityScore < 70;

            const pinBgColor = isHighPriority 
              ? 'bg-red-600' 
              : isMediumPriority 
              ? 'bg-amber-600' 
              : 'bg-blue-600';
            const pingColor = isHighPriority 
              ? 'bg-red-500' 
              : isMediumPriority 
              ? 'bg-amber-500' 
              : 'bg-blue-500';

            return (
              <div
                key={hs.locationKey}
                style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer ${
                  isSelected ? 'z-30' : 'z-10'
                }`}
                onMouseEnter={() => setHoveredKey(hs.locationKey)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => onSelectHotspot?.(hs.locationKey)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Hotspot ${displayName}, Priority Score ${hs.priorityScore.toFixed(1)} / 100, ${hs.totalRequests} citizen requests. ${isSelected ? 'Currently selected' : 'Click or press enter to select'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectHotspot?.(hs.locationKey);
                  }
                }}
              >
                {/* Visible Selected Tag Pin */}
                {isSelected && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-extrabold shadow-lg whitespace-nowrap border border-white flex items-center gap-1 z-30 pointer-events-none">
                    <MapPin className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                    <span>{displayName}</span>
                  </div>
                )}

                <div className="relative flex items-center justify-center">
                  {(isSelected || isHovered || isHighPriority) && (
                    <span className={`w-6 h-6 rounded-full ${isSelected ? 'bg-amber-400' : pingColor} animate-ping absolute opacity-70`} />
                  )}
                  <div 
                    className={`w-6 h-6 rounded-full ${pinBgColor} border-2 ${
                      isSelected 
                        ? 'border-amber-300 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-slate-950 scale-125 shadow-xl' 
                        : 'border-white shadow-md'
                    } flex items-center justify-center text-[9px] font-extrabold text-white transition-all`}
                  >
                    {hs.totalRequests}
                  </div>
                </div>

                {/* Floating Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-40 bg-slate-900/95 text-white text-[11px] p-2.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700 backdrop-blur-xs min-w-[190px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1 mb-1.5">
                    <span className="font-bold text-white text-xs">{displayName}</span>
                    <span className="font-mono text-amber-400 font-extrabold text-[10px]">
                      Score: {hs.priorityScore.toFixed(1)}
                    </span>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Demands:</span>
                      <span className="font-semibold text-white">{hs.totalRequests} requests</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Channels:</span>
                      <span className="text-blue-300 font-medium">
                        🎙️ {hs.sourceDistribution?.voice ?? 0} Voice • ✍️ {hs.sourceDistribution?.text ?? 0} Text
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Top Issue:</span>
                      <span className="text-emerald-300 font-medium">{hs.topCategory}</span>
                    </div>
                    {hs.affectedPopulation > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Population:</span>
                        <span className="font-mono text-white">{hs.affectedPopulation.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-1.5 pt-1 border-t border-slate-800 text-[9px] text-slate-400 text-center">
                    Click marker to inspect full evidence breakdown
                  </div>
                </div>
              </div>
            );
          })}

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{plottableHotspots.length} Demand Clusters Plotted</span>
            {unplottableCount > 0 && (
              <span className="text-amber-400 text-[10px]">({unplottableCount} unmapped)</span>
            )}
          </div>

          <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 hidden sm:flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600" /> High</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600" /> Med</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Low</span>
          </div>
        </div>

        {/* Selected Hotspot Quick Intelligence Strip */}
        {activeHotspot && (
          <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                <MapPin className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {activeHotspot.locality ? `${activeHotspot.locality}, ` : ''}{activeHotspot.district ? `${activeHotspot.district}, ` : ''}{activeHotspot.state}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    Priority Score: {activeHotspot.priorityScore.toFixed(1)} / 100
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5">
                  {activeHotspot.totalRequests} Citizen Demands • Primary Domain: <strong className="text-slate-700">{activeHotspot.topCategory}</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToHotspotDetails}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 px-3.5 py-1.5 rounded-lg border border-blue-200 transition-colors shadow-2xs shrink-0"
            >
              <span>View Breakdown & Evidence</span>
              <ArrowDownCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Integration Notice */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Multimodal GIS Demand Layer • Synchronized with Explainable Evidence Engine</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">GIS Engine v1.3</span>
      </div>
    </div>
  );
};
