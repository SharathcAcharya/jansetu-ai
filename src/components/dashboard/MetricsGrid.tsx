'use client';

import React from 'react';
import { 
  Users, 
  MapPin, 
  AlertTriangle, 
  Flame,
  Loader2
} from 'lucide-react';

interface MetricsGridProps {
  totalRequests?: number;
  geographicallyMappedRequests?: number;
  unmappedRequests?: number;
  hotspotsCount?: number;
  loading?: boolean;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ 
  totalRequests = 0,
  geographicallyMappedRequests = 0,
  unmappedRequests = 0,
  hotspotsCount = 0,
  loading = false,
}) => {
  const mappedPercentage = totalRequests > 0 
    ? Math.round((geographicallyMappedRequests / totalRequests) * 100) 
    : 0;

  const cards = [
    {
      title: 'Total Citizen Requests',
      value: totalRequests.toLocaleString(),
      change: 'Firestore live count',
      isPositive: true,
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200',
      description: 'Aggregated citizen complaints',
    },
    {
      title: 'Geographically Mapped Requests',
      value: geographicallyMappedRequests.toLocaleString(),
      change: `${mappedPercentage}% mapped`,
      isPositive: true,
      icon: MapPin,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200',
      description: 'Citizen-provided geographic location',
    },
    {
      title: 'Unmapped Requests',
      value: unmappedRequests.toLocaleString(),
      change: 'No location given',
      isPositive: false,
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200',
      description: 'Excluded from geographic hotspots',
    },
    {
      title: 'Number of Demand Hotspots',
      value: hotspotsCount.toLocaleString(),
      change: 'Active clusters',
      isPositive: true,
      icon: Flame,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-200',
      description: 'Grouped by locality/district/state',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="gov-card p-5 sm:p-6 bg-white border border-slate-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} border flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                ) : (
                  card.value
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">{card.description}</span>
              <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {card.change}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

