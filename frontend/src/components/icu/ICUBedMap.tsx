import React from 'react';
import { motion } from 'framer-motion';
import { Patient } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { Bed, Heart, Wind, Droplets, Clock, ArrowRight } from 'lucide-react';

interface ICUBedMapProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
}

export const ICUBedMap: React.FC<ICUBedMapProps> = ({ patients, onSelectPatient }) => {
  // Generate 12 ICU Bed slots
  const icuBeds = Array.from({ length: 12 }, (_, i) => {
    const bedId = `ICU-${(i + 1).toString().padStart(2, '0')}`;
    const occupant = patients.find(p => p.bed === bedId);
    return { bedId, occupant };
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bed className="w-5 h-5 text-cyan-600" />
            Live ICU Bed Occupancy Map
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time status monitoring for Intensive Care Units 01–12</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 pulse-critical" /> Critical</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High Risk</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Attention</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Stable</span>
        </div>
      </div>

      {/* Grid Layout 3 cols x 4 rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {icuBeds.map(({ bedId, occupant }) => {
          if (!occupant) {
            return (
              <div
                key={bedId}
                className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center min-h-[160px] text-slate-400"
              >
                <Bed className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-xs font-bold text-slate-500">{bedId}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                  Vacant / Cleaned
                </span>
              </div>
            );
          }

          const v = occupant.latestVitals;

          const borderColors = {
            CRITICAL: 'border-rose-400 bg-rose-50/30 hover:border-rose-600',
            HIGH_RISK: 'border-orange-300 bg-orange-50/20 hover:border-orange-500',
            ATTENTION: 'border-amber-300 bg-amber-50/20 hover:border-amber-500',
            STABLE: 'border-slate-200 bg-white hover:border-cyan-500'
          };

          return (
            <motion.div
              key={bedId}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectPatient(occupant.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-lg flex flex-col justify-between ${
                borderColors[occupant.status]
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[11px] tracking-wider">
                    {bedId}
                  </span>
                  <StatusBadge status={occupant.status} size="sm" />
                </div>

                <h4 className="text-sm font-bold text-slate-900 truncate">{occupant.name}</h4>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{occupant.primaryDiagnosis}</p>
              </div>

              {/* Vitals Quick Strip */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-3 gap-1 text-center bg-slate-100/60 rounded-lg p-2">
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase flex items-center justify-center gap-0.5">
                    <Heart className="w-2.5 h-2.5 text-rose-500" /> HR
                  </span>
                  <span className={`text-xs font-bold ${v.heartRate > 110 || v.heartRate < 55 ? 'text-rose-700 font-black' : 'text-slate-800'}`}>
                    {v.heartRate}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase flex items-center justify-center gap-0.5">
                    <Droplets className="w-2.5 h-2.5 text-cyan-600" /> SpO2
                  </span>
                  <span className={`text-xs font-bold ${v.spo2 < 92 ? 'text-rose-700 font-black' : 'text-slate-800'}`}>
                    {v.spo2}%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase flex items-center justify-center gap-0.5">
                    <Wind className="w-2.5 h-2.5 text-blue-500" /> BP
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {v.systolic}/{v.diastolic}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" /> {occupant.lastObservationTime}
                </span>
                <span className="text-cyan-700 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Inspect <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
