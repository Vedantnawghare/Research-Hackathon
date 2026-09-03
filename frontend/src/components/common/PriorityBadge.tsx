import React from 'react';
import { PatientStatus } from '../../types';

interface PriorityBadgeProps {
  priority: PatientStatus;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const styles = {
    CRITICAL: 'bg-rose-600 text-white shadow-rose-200 shadow-sm animate-pulse',
    HIGH_RISK: 'bg-orange-500 text-white shadow-orange-100',
    ATTENTION: 'bg-amber-500 text-white shadow-amber-100',
    STABLE: 'bg-slate-200 text-slate-700'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${styles[priority]}`}>
      {priority.replace('_', ' ')}
    </span>
  );
};
