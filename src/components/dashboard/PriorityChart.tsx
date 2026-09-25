'use client';

import React from 'react';
import { PriorityMetric } from '@/types';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface PriorityChartProps {
  data: PriorityMetric[];
}

export const PriorityChart: React.FC<PriorityChartProps> = ({ data }) => {
  return (
    <div className="gov-card p-6 bg-white border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-700">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Urgency & Priority Distribution</h3>
              <p className="text-xs text-slate-500">Classified by Gemini AI based on public safety risk</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
            Automated Tiering
          </span>
        </div>

        {/* Priority Stacked Bar representation */}
        <div className="space-y-4 pt-2">
          {data.map((item) => (
            <div key={item.level} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-slate-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-mono">
                  <span>{item.count.toLocaleString()} cases</span>
                  <span className="font-bold text-slate-900">({item.percentage}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-xl flex items-start gap-2 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
        <span>
          <strong>Threshold logic:</strong> Critical & High urgency demands trigger automated alerts to ward engineers and District Collector dashboards.
        </span>
      </div>
    </div>
  );
};
