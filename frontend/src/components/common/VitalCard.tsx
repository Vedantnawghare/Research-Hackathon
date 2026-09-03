import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VitalCardProps {
  label: string;
  value: string | number;
  unit: string;
  normalRange: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  trend?: 'UP' | 'DOWN' | 'STABLE';
  icon: LucideIcon;
  lastUpdated?: string;
}

export const VitalCard: React.FC<VitalCardProps> = ({
  label,
  value,
  unit,
  normalRange,
  status,
  trend = 'STABLE',
  icon: Icon,
  lastUpdated
}) => {
  const statusStyles = {
    NORMAL: {
      card: 'bg-white border-slate-200 text-slate-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-cyan-50 text-cyan-700',
      valueColor: 'text-slate-900'
    },
    WARNING: {
      card: 'bg-amber-50/40 border-amber-300 text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      iconBg: 'bg-amber-100 text-amber-700',
      valueColor: 'text-amber-900 font-extrabold'
    },
    CRITICAL: {
      card: 'bg-rose-50 border-rose-300 text-rose-950 pulse-critical',
      badge: 'bg-rose-600 text-white font-extrabold tracking-wider',
      iconBg: 'bg-rose-100 text-rose-700',
      valueColor: 'text-rose-700 font-black'
    }
  };

  const currentStyle = statusStyles[status];

  return (
    <div className={`p-4 rounded-xl border shadow-sm transition-all duration-200 ${currentStyle.card}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${currentStyle.iconBg}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</h4>
            {lastUpdated && <span className="text-[10px] text-slate-400">{lastUpdated}</span>}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase border ${currentStyle.badge}`}>
          {status}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl tracking-tight ${currentStyle.valueColor}`}>{value}</span>
          <span className="text-xs font-medium text-slate-500">{unit}</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          {trend === 'UP' && <TrendingUp className="w-3.5 h-3.5 text-rose-500" />}
          {trend === 'DOWN' && <TrendingDown className="w-3.5 h-3.5 text-cyan-600" />}
          {trend === 'STABLE' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>Target Range:</span>
        <span className="font-semibold text-slate-700">{normalRange}</span>
      </div>
    </div>
  );
};
