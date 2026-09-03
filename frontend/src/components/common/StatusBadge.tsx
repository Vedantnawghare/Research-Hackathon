import React from 'react';
import { PatientStatus } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';

interface StatusBadgeProps {
  status: PatientStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const configs = {
    STABLE: {
      label: 'Stable',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      dotColor: 'bg-emerald-500'
    },
    ATTENTION: {
      label: 'Attention Required',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle,
      dotColor: 'bg-amber-500'
    },
    HIGH_RISK: {
      label: 'High Risk',
      bgColor: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertOctagon,
      dotColor: 'bg-orange-500'
    },
    CRITICAL: {
      label: 'CRITICAL',
      bgColor: 'bg-rose-50 text-rose-700 border-rose-300 pulse-critical font-bold',
      icon: Flame,
      dotColor: 'bg-rose-600'
    }
  };

  const config = configs[status] || configs.STABLE;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-bold'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${config.bgColor} ${sizeClasses[size]}`}>
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {!showIcon && <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />}
      <span>{config.label}</span>
    </span>
  );
};
