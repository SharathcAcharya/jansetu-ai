'use client';

import React, { useState, useEffect } from 'react';
import { CategoryMetric } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Layers } from 'lucide-react';

interface CategoryChartProps {
  data: CategoryMetric[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategoryMetric;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700">
          <p className="font-bold mb-1">{item.name}</p>
          <p className="text-slate-300">
            Total Requests: <span className="font-semibold text-white">{item.count.toLocaleString()}</span>
          </p>
          <p className="text-slate-300">
            Share: <span className="font-semibold text-orange-400">{item.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="gov-card p-6 bg-white border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Issue Category Distribution</h3>
              <p className="text-xs text-slate-500">Volume breakdown across major civic infrastructure sectors</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Live Aggregation
          </span>
        </div>

        <div className="h-64 w-full">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
              Loading visualization...
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="truncate text-slate-600">{item.name}</span>
            <span className="font-semibold text-slate-800 ml-auto">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
