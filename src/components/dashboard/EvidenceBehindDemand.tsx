'use client';

import React, { useState, useEffect } from 'react';
import { 
  EvidenceBundle, 
  DemographicEvidence, 
  InfrastructureEvidence, 
  InvestmentEvidence,
  EvidenceConflict
} from '@/types/evidence';
import { DemandHotspot } from '@/types';
import { 
  Database, 
  Users, 
  FileText, 
  Building, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  Layers, 
  Clock, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Flame,
  Scale
} from 'lucide-react';

interface EvidenceBehindDemandProps {
  hotspot: DemandHotspot | null;
  className?: string;
  onBundleLoaded?: (bundle: EvidenceBundle | null) => void;
}

export const EvidenceBehindDemand: React.FC<EvidenceBehindDemandProps> = ({ 
  hotspot,
  className = '',
  onBundleLoaded
}) => {
  const [bundle, setBundle] = useState<EvidenceBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, EvidenceBundle>>({});
  const [showFullProvenance, setShowFullProvenance] = useState<boolean>(false);

  // Check if location is completely empty / unmapped
  const hasValidLocation = Boolean(
    hotspot && (
      (hotspot.locationKey && hotspot.locationKey.trim().length > 0) ||
      (hotspot.state && hotspot.state.trim().length > 0) ||
      (hotspot.district && hotspot.district.trim().length > 0) ||
      (hotspot.locality && hotspot.locality.trim().length > 0)
    )
  );

  // Notify parent component of the active bundle for compact snapshots
  useEffect(() => {
    onBundleLoaded?.(bundle);
  }, [bundle, onBundleLoaded]);

  useEffect(() => {
    if (!hotspot || !hasValidLocation) {
      setBundle(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cacheKey = hotspot.locationKey || `${hotspot.locality || ''}:${hotspot.district || ''}:${hotspot.state || ''}`;

    if (cache[cacheKey]) {
      setBundle(cache[cacheKey]);
      setLoading(false);
      setError(null);
      return;
    }

    // Immediately clear previous bundle on location change so no stale evidence remains during fetch
    setBundle(null);
    setLoading(true);
    setError(null);

    let isMounted = true;
    const fetchBundle = async () => {
      try {
        const params = new URLSearchParams();
        if (hotspot.locationKey) {
          params.append('locationKey', hotspot.locationKey);
        } else {
          if (hotspot.state) params.append('state', hotspot.state);
          if (hotspot.district) params.append('district', hotspot.district);
          if (hotspot.locality) params.append('locality', hotspot.locality);
        }

        const res = await fetch(`/api/evidence/bundle?${params.toString()}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP ${res.status}`);
        }

        const json = await res.json();
        if (isMounted) {
          if (json.success && json.bundle) {
            setBundle(json.bundle);
            setCache((prev) => ({ ...prev, [cacheKey]: json.bundle }));
          } else {
            throw new Error(json.error || 'Failed to synthesize evidence bundle.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[EvidenceBehindDemand] Error loading evidence bundle:', err);
          setError(err.message || 'Evidence bundle unavailable for this geography.');
          setBundle(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBundle();

    return () => {
      isMounted = false;
    };
  }, [hotspot?.locationKey, hotspot?.state, hotspot?.district, hotspot?.locality, hasValidLocation]);

  // Case 1: Unmapped / No location provided
  if (!hotspot || !hasValidLocation) {
    return (
      <div className={`p-6 rounded-xl border border-amber-200 bg-amber-50/60 text-center ${className}`}>
        <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 mx-auto mb-2.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-amber-900">Geographic evidence unavailable — citizen did not provide a location.</h4>
        <p className="text-xs text-amber-800/90 mt-1 max-w-lg mx-auto">
          Official Census baselines, infrastructure metrics, and public investment records are strictly bound to verified geographies. JanSetu AI does not infer locations or fabricate demographic data for unmapped requests.
        </p>
      </div>
    );
  }

  // Case 2: Loading State
  if (loading) {
    return (
      <div className={`p-8 rounded-xl border border-slate-200 bg-slate-50/70 text-center flex flex-col items-center justify-center gap-3 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <div className="text-xs font-semibold text-slate-800">
          Synthesizing Evidence Bundle across 4 Public & Citizen Layers...
        </div>
        <p className="text-[11px] text-slate-500 max-w-md">
          Retrieving ground-truth citizen demand, official Census 2011 demographic baselines, infrastructure connectivity, and public project expenditure for {hotspot.locality || hotspot.district || hotspot.state}.
        </p>
      </div>
    );
  }

  // Case 3: Error State (Non-blocking: priority score & other sections unaffected)
  if (error || !bundle) {
    return (
      <div className={`p-5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold">Supporting Evidence Unavailable</div>
            <div className="text-amber-700 text-[11px]">{error || 'Could not retrieve evidence bundle.'}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (hotspot) {
              const cacheKey = hotspot.locationKey || `${hotspot.locality || ''}:${hotspot.district || ''}:${hotspot.state || ''}`;
              setCache((prev) => {
                const next = { ...prev };
                delete next[cacheKey];
                return next;
              });
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-amber-200 text-amber-900 font-semibold hover:bg-amber-300 transition-colors shrink-0 text-xs"
        >
          Retry Retrieval
        </button>
      </div>
    );
  }

  const { completeness, provenanceSummary, conflicts = [], fallbackMetadata = {} } = bundle;

  // Helper for completeness color badge
  const getCompletenessBadge = () => {
    switch (completeness.level) {
      case 'HIGH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div id="evidence-behind-demand" className={`space-y-5 ${className}`}>
      {/* 1. Header Bar: Evidence Completeness & Provenance Status */}
      <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold tracking-tight">Evidence Behind Demand</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {bundle.bundleId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-source intelligence synthesizing citizen ground truth with verified demographic baselines, infrastructure metrics, and public investment data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Completeness Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <span className="text-slate-400 font-medium">Evidence Completeness:</span>
              <span className="font-bold text-white font-mono">
                {completeness.score <= 1 && completeness.score > 0 ? Math.round(completeness.score * 100) : Math.round(completeness.score)}%
              </span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold border ${getCompletenessBadge()}`}>
                {completeness.level}
              </span>
            </div>

            {/* Provenance Audit Details Toggle */}
            <button
              type="button"
              onClick={() => setShowFullProvenance((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <span>Audit Trail</span>
              {showFullProvenance ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 2. Synthetic Data Transparency Banner */}
        <div className="mt-3 pt-3 border-t border-slate-800">
          {provenanceSummary.containsSyntheticData ? (
            <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-lg">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Notice:</strong> Some supporting evidence is synthetic demo data. Calibration records are demarcated as <code className="bg-amber-900/60 px-1 py-0.5 rounded text-[11px] font-mono">synthetic_demo</code>. Live citizen requests and official Census 2011 records are strictly preserved as non-synthetic.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 rounded-lg">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Verified:</strong> All displayed supporting evidence is from citizen submissions or public datasets. Zero synthetic demo records.
              </span>
            </div>
          )}
        </div>

        {/* Expandable Audit Trail Details */}
        {showFullProvenance && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-950/50 p-3 rounded-lg">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Bundle Version</span>
              <span className="font-mono font-medium text-slate-200">{bundle.bundleVersion}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Data Freshness</span>
              <span className="font-semibold text-emerald-400">{provenanceSummary.dataFreshnessRating}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Source Records</span>
              <span className="text-slate-200">
                {provenanceSummary.citizenSubmissionCount} Citizen • {provenanceSummary.publicDatasetCount} Public • {provenanceSummary.syntheticDemoCount} Synthetic
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Priority Isolation</span>
              <span className="text-slate-200">Strict (Contextual only; does NOT modify 30/25/25/20 score)</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Evidence Discrepancy / Conflict Notice (ONLY if conflicts exist) */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Scale className="w-4 h-4 text-amber-700" />
            <span>Evidence discrepancy detected ({conflicts.length})</span>
          </div>
          <p className="text-xs text-amber-800">
            JanSetu AI surfaces discrepancies neutrally for policymaker evaluation. Neither source is overwritten or suppressed.
          </p>

          <div className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white border border-amber-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                    Dimension: {conflict.dimension}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    conflict.severity === 'HIGH' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {conflict.severity} Severity Discrepancy
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div className="p-2 rounded bg-emerald-50/50 border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 block">Citizen Report Ground Truth:</span>
                    <span className="text-slate-700 italic">&ldquo;{conflict.citizenStatement}&rdquo;</span>
                  </div>
                  <div className="p-2 rounded bg-blue-50/50 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-800 block">Official / Administrative Record:</span>
                    <span className="text-slate-700 italic">&ldquo;{conflict.publicRecord}&rdquo;</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  <strong>Analysis:</strong> {conflict.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. The Four Core Evidence Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel A: Citizen Demand Evidence */}
        <CitizenDemandPanel evidence={bundle.citizenEvidence} hotspot={hotspot} />

        {/* Panel B: Demographic Evidence */}
        <DemographicPanel 
          evidence={bundle.demographicEvidence} 
          fallback={fallbackMetadata.demographicsIsFallback}
          matchedLevel={fallbackMetadata.demographicsMatchedLevel}
          hotspot={hotspot}
        />

        {/* Panel C: Infrastructure Evidence */}
        <InfrastructurePanel 
          evidence={bundle.infrastructureEvidence} 
          fallback={fallbackMetadata.infrastructureIsFallback}
          matchedLevel={fallbackMetadata.infrastructureMatchedLevel}
        />

        {/* Panel D: Public Investment Evidence */}
        <PublicInvestmentPanel 
          evidence={bundle.investmentEvidence} 
          fallback={fallbackMetadata.investmentIsFallback}
          matchedLevel={fallbackMetadata.investmentMatchedLevel}
        />
      </div>

      {/* Priority Isolation Note */}
      <div className="px-3.5 py-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-2 text-[11px] text-slate-600">
        <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>
          <strong>Priority Score Isolation:</strong> Calculated strictly as 30% Citizen Demand, 25% Affected Population, 25% Urgency, and 20% Infrastructure Gap. Supporting demographic, infrastructure, and investment records provide rich decision context but do not alter the deterministic priority score.
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: Panel A — Citizen Demand Evidence
// ---------------------------------------------------------------------------
const CitizenDemandPanel: React.FC<{ 
  evidence?: any; 
  hotspot: DemandHotspot;
}> = ({ evidence, hotspot }) => {
  const data = evidence?.data;
  const totalReq = data?.totalRequests ?? hotspot.totalRequests;
  const affectedPop = data?.aggregatedAffectedPopulation ?? hotspot.affectedPopulation;
  const highUrgency = data?.highUrgencyCount ?? hotspot.highUrgencyRequests;
  const infraReq = data?.citedInfrastructureAssets?.length ?? hotspot.infrastructureRequests ?? 0;
  const topCat = hotspot.topCategory || (data?.topCategories?.[0]?.category ?? 'General Grievance');

  return (
    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-emerald-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                A. Citizen Demand Evidence
              </h5>
              <span className="text-[10px] text-emerald-700 font-medium">Citizen-provided evidence</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            CITIZEN SUBMISSION
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-white border border-emerald-100">
            <span className="text-[10px] text-slate-500 block">Total Demands</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">{totalReq}</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-emerald-100">
            <span className="text-[10px] text-slate-500 block">Impacted Scale</span>
            <span className="text-base font-extrabold text-slate-900 font-mono">{affectedPop.toLocaleString()}</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-emerald-100">
            <span className="text-[10px] text-slate-500 block">High Urgency</span>
            <span className="text-base font-extrabold text-red-600 font-mono">{highUrgency}</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-emerald-100">
            <span className="text-[10px] text-slate-500 block">Infra Citations</span>
            <span className="text-base font-extrabold text-blue-600 font-mono">{infraReq}</span>
          </div>
        </div>

        {/* Top Category & Summary */}
        <div className="space-y-1.5 text-xs text-slate-700">
          <div className="flex items-center justify-between py-1 px-2.5 rounded bg-white border border-emerald-100">
            <span className="text-slate-600 font-medium">Leading Issue Domain:</span>
            <span className="font-bold text-slate-900">{topCat}</span>
          </div>
          {data?.primaryGrievanceSummary && (
            <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-emerald-100">
              &ldquo;{data.primaryGrievanceSummary}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Verified Ground Truth</span>
        <span className="font-semibold text-emerald-800">Not an official census statistic</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: Panel B — Demographic Evidence
// ---------------------------------------------------------------------------
const DemographicPanel: React.FC<{ 
  evidence?: DemographicEvidence;
  fallback?: boolean;
  matchedLevel?: string;
  hotspot: DemandHotspot;
}> = ({ evidence, fallback, matchedLevel, hotspot }) => {
  if (!evidence || !evidence.data) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                <FileText className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                B. Demographic Evidence
              </h5>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
              UNAVAILABLE
            </span>
          </div>
          <div className="p-6 text-center text-xs text-slate-500">
            Not available for this geography
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400">
          No demographic record found for {hotspot.locality || hotspot.district || hotspot.state}.
        </div>
      </div>
    );
  }

  const { data, dataSource, sourceYear, sourceName, originalCensusCode, censusLevel, originalCensusName } = evidence;
  const isPublic = dataSource === 'public_dataset';

  return (
    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-blue-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                B. Demographic Evidence
              </h5>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="font-semibold text-blue-800">{sourceName || 'Census of India — Primary Census Abstract 2011'}</span>
                <span>•</span>
                <span className="text-slate-500">{sourceYear || 2011}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
              isPublic ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}>
              {isPublic ? 'PUBLIC DATASET' : 'SYNTHETIC DEMO'}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              HISTORICAL BASELINE — {sourceYear || 2011}
            </span>
          </div>
        </div>

        {/* Fallback or Locality Specific Notice */}
        <div className="mb-2.5 flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded bg-white border border-blue-100">
          <span className="text-slate-600 font-medium">
            {fallback ? (
              <span className="text-amber-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {matchedLevel === 'district' ? 'District-level fallback' : 'State-level fallback'}
              </span>
            ) : (
              <span className="text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Locality-specific baseline
              </span>
            )}
          </span>
          {originalCensusCode && (
            <span className="font-mono text-slate-500 text-[10px]">
              Census Code: <strong className="text-slate-800">{originalCensusCode}</strong> {censusLevel ? `(${censusLevel})` : ''}
            </span>
          )}
        </div>

        {/* Demographic Derived Metrics Grid (Dynamic from Evidence Bundle) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">Total Population</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono">
              {data.totalPopulation ? data.totalPopulation.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">Households</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono">
              {data.householdCount ? data.householdCount.toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">Sex Ratio</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono">
              {data.sexRatioFemalesPer1000Males ? `${data.sexRatioFemalesPer1000Males}` : 'N/A'}
            </span>
            <span className="text-[9px] text-slate-400 block">females/1k males</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">Overall Literacy</span>
            <span className="text-sm font-extrabold text-emerald-700 font-mono">
              {data.overallLiteracyRatePercent !== undefined ? `${data.overallLiteracyRatePercent}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Secondary Demographic Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">Female Literacy</span>
            <span className="font-bold text-slate-900 font-mono">
              {data.femaleLiteracyRatePercent !== undefined ? `${data.femaleLiteracyRatePercent}%` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">SC Population</span>
            <span className="font-bold text-slate-900 font-mono">
              {data.scheduledCastePopulationPercent !== undefined ? `${data.scheduledCastePopulationPercent}%` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">ST Population</span>
            <span className="font-bold text-slate-900 font-mono">
              {data.scheduledTribePopulationPercent !== undefined ? `${data.scheduledTribePopulationPercent}%` : 'N/A'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-blue-100">
            <span className="text-[10px] text-slate-500 block">Agri Workers</span>
            <span className="font-bold text-slate-900 font-mono">
              {data.agriculturalWorkersPercent !== undefined ? `${data.agriculturalWorkersPercent}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Official decennial Census anchor ({originalCensusName || 'Census PCA'})</span>
        <span className="italic">Historical baseline — not current population</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: Panel C — Infrastructure Evidence
// ---------------------------------------------------------------------------
const InfrastructurePanel: React.FC<{ 
  evidence?: InfrastructureEvidence;
  fallback?: boolean;
  matchedLevel?: string;
}> = ({ evidence, fallback, matchedLevel }) => {
  if (!evidence || !evidence.data) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                <Building className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                C. Infrastructure Evidence
              </h5>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
              UNAVAILABLE
            </span>
          </div>
          <div className="p-6 text-center text-xs text-slate-500">
            Not available for this geography
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400">
          No infrastructure dataset mapped to this locality or district.
        </div>
      </div>
    );
  }

  const { data, dataSource } = evidence;
  const isSynthetic = dataSource === 'synthetic_demo';

  return (
    <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/20 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-purple-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                C. Infrastructure Evidence
              </h5>
              <span className="text-[10px] text-purple-800 font-medium">Physical Asset Condition & Coverage</span>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
            isSynthetic ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {isSynthetic ? 'SYNTHETIC DEMO' : 'PUBLIC DATASET'}
          </span>
        </div>

        {/* Fallback Notice */}
        {fallback && (
          <div className="mb-2 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            {matchedLevel === 'district' ? 'District-level fallback' : 'State-level fallback'}
          </div>
        )}

        {/* Infrastructure Indicators */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="p-2 rounded-lg bg-white border border-purple-100">
            <span className="text-[10px] text-slate-500 block">PMGSY Road Status</span>
            <span className="text-xs font-bold text-slate-900">
              {data.pmgsyRoadConnectivityStatus || 'CONNECTED'}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-purple-100">
            <span className="text-[10px] text-slate-500 block">Tap Water Coverage</span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              {data.tapWaterCoveragePercent !== undefined ? `${data.tapWaterCoveragePercent}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Critical Deficits */}
        {data.criticalDeficits && data.criticalDeficits.length > 0 && (
          <div className="space-y-1 mb-2">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Recorded Deficits:</span>
            <div className="flex flex-wrap gap-1">
              {data.criticalDeficits.map((def, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white text-slate-700 text-[10px] border border-purple-100">
                  • {def}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Surveyed Assets */}
        {data.surveyedAssets && data.surveyedAssets.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Surveyed Facilities:</span>
            <div className="space-y-1 text-[11px]">
              {data.surveyedAssets.slice(0, 2).map((asset, i) => (
                <div key={i} className="flex justify-between items-center bg-white px-2 py-1 rounded border border-purple-100">
                  <span className="text-slate-800 font-medium truncate max-w-[180px]">{asset.assetName}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    asset.operationalStatus === 'OPERATIONAL' ? 'bg-emerald-100 text-emerald-800' :
                    asset.operationalStatus === 'DEGRADED' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {asset.operationalStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-purple-100 text-[10px] text-slate-500 italic">
        {isSynthetic ? 'Synthetic demo data — Prototype benchmark proxy. Not an official government infrastructure index.' : 'Verified public infrastructure dataset.'}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: Panel D — Public Investment Evidence
// ---------------------------------------------------------------------------
const PublicInvestmentPanel: React.FC<{ 
  evidence?: InvestmentEvidence;
  fallback?: boolean;
  matchedLevel?: string;
}> = ({ evidence, fallback, matchedLevel }) => {
  if (!evidence || !evidence.data) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                <Coins className="w-4 h-4" />
              </div>
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                D. Public Investment Evidence
              </h5>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
              UNAVAILABLE
            </span>
          </div>
          <div className="p-6 text-center text-xs text-slate-500">
            Not available for this geography
          </div>
        </div>
        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400">
          No public investment records mapped to this locality or district.
        </div>
      </div>
    );
  }

  const { data, dataSource } = evidence;
  const isSynthetic = dataSource === 'synthetic_demo';

  return (
    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 flex flex-col justify-between space-y-3">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                D. Public Investment Evidence
              </h5>
              <span className="text-[10px] text-amber-800 font-medium">Sanctioned Schemes & Utilization</span>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
            isSynthetic ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {isSynthetic ? 'SYNTHETIC DEMO' : 'PUBLIC DATASET'}
          </span>
        </div>

        {/* Fallback Notice */}
        {fallback && (
          <div className="mb-2 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            {matchedLevel === 'district' ? 'District-level fallback' : 'State-level fallback'}
          </div>
        )}

        {/* Investment Numbers */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <div className="p-2 rounded-lg bg-white border border-amber-100">
            <span className="text-[10px] text-slate-500 block">Sanctioned Budget</span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              ₹{data.totalSanctionedInrLakhs ? data.totalSanctionedInrLakhs.toLocaleString() : 0} L
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-amber-100">
            <span className="text-[10px] text-slate-500 block">Expenditure</span>
            <span className="text-xs font-bold text-slate-900 font-mono">
              ₹{data.totalExpenditureInrLakhs ? data.totalExpenditureInrLakhs.toLocaleString() : 0} L
            </span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-amber-100">
            <span className="text-[10px] text-slate-500 block">Utilization</span>
            <span className="text-xs font-bold text-emerald-700 font-mono">
              {data.overallUtilizationPercent !== undefined ? `${data.overallUtilizationPercent}%` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Active Schemes */}
        {data.activeSchemes && data.activeSchemes.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Sanctioned Schemes:</span>
            <div className="space-y-1 text-[11px]">
              {data.activeSchemes.slice(0, 2).map((scheme, i) => (
                <div key={i} className="flex justify-between items-center bg-white px-2 py-1 rounded border border-amber-100">
                  <span className="text-slate-800 font-medium truncate max-w-[180px]">{scheme.schemeName}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    scheme.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                    scheme.status === 'IN_EXECUTION' ? 'bg-blue-100 text-blue-800' :
                    scheme.status === 'STALLED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {scheme.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-amber-100 text-[10px] text-slate-500 italic">
        {isSynthetic ? 'Synthetic demo data — Prototype investment benchmark. Not an official government financial audit.' : 'Verified public investment dataset.'}
      </div>
    </div>
  );
};
