import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'slate';
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'cyan',
  onClick
}) => {
  const variantStyles = {
    cyan: 'border-l-4 border-l-cyan-600 bg-white hover:border-l-cyan-700',
    rose: 'border-l-4 border-l-rose-600 bg-rose-50/30 hover:border-l-rose-700',
    amber: 'border-l-4 border-l-amber-500 bg-amber-50/20 hover:border-l-amber-600',
    emerald: 'border-l-4 border-l-emerald-600 bg-emerald-50/20 hover:border-l-emerald-700',
    slate: 'border-l-4 border-l-slate-400 bg-white hover:border-l-slate-600'
  };

  const iconStyles = {
    cyan: 'bg-cyan-50 text-cyan-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-slate-200/80 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${variantStyles[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold flex items-center gap-1 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
