import React, { useState, useEffect } from 'react';
import { Wifi, BatteryCharging, Radio, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Patient } from '../../types';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { formatISTTime } from '../../utils/dateUtils';

interface SmartWearableSensorProps {
  patient: Patient;
  onWearableSync?: () => void;
}

export const SmartWearableSensor: React.FC<SmartWearableSensorProps> = ({ patient, onWearableSync }) => {
  const { addVitalRecord, refreshData } = useApp();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncIST, setLastSyncIST] = useState<string>(
    patient.latestVitals?.timestamp ? formatISTTime(patient.latestVitals.timestamp) : formatISTTime(new Date())
  );
  const [batteryLevel, setBatteryLevel] = useState<number>(96);

  // Auto-record telemetry at 2-hour interval simulation
  useEffect(() => {
    if (!autoSyncEnabled) return;

    // Simulate automatic wearable telemetry sync every 2 minutes (simulating 2-hour clinical cycle)
    const interval = setInterval(() => {
      handleSimulateWearableAutoSync();
    }, 120000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, patient.id]);

  const handleSimulateWearableAutoSync = async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);

      // Generate realistic wearable telemetry variation around baseline
      const baseVitals = patient.latestVitals || {
        heartRate: 78,
        systolic: 122,
        diastolic: 80,
        spo2: 97,
        temperature: 36.8,
        respiratoryRate: 16
      };

      const newHr = Math.max(60, Math.min(130, baseVitals.heartRate + Math.floor((Math.random() - 0.4) * 6)));
      const newSpo2 = Math.max(90, Math.min(100, baseVitals.spo2 + Math.floor((Math.random() - 0.3) * 2)));
      const newSys = Math.max(100, Math.min(150, baseVitals.systolic + Math.floor((Math.random() - 0.4) * 8)));

      await addVitalRecord(patient.id, {
        heartRate: newHr,
        systolic: newSys,
        diastolic: baseVitals.diastolic,
        spo2: newSpo2,
        temperature: baseVitals.temperature,
        respiratoryRate: baseVitals.respiratoryRate,
        notes: `📡 Automated Q2H Wearable IoT Sensor Telemetry Sync (BioPatch #${patient.id.replace('PAT-', 'WP-')})`
      });

      setLastSyncIST(formatISTTime(new Date()));
      setBatteryLevel((prev) => Math.max(15, prev - 1));
      if (onWearableSync) onWearableSync();
    } catch (e) {
      console.error('Failed wearable telemetry auto-sync:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* WEARABLE SENSOR IDENTITY & SIGNAL */}
      <div className="flex items-center gap-3">
        <div className="relative p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
          <Radio className="w-6 h-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900 animate-ping" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 tracking-wider">
              SHREEDHA IoT BioPatch #{patient.id.replace('PAT-', 'WP-')}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-emerald-400" /> 5G Telemetry Online
            </span>
          </div>

          <h4 className="text-sm font-black tracking-tight text-white mt-1">
            Automated Q2H Wearable Vital Telemetry Stream — <span className="text-cyan-400">{patient.name} ({patient.bed})</span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Continuous biosensor streaming replaces manual paper checks • Last Auto-Sync: <strong className="text-cyan-300 font-mono">{lastSyncIST}</strong>
          </p>
        </div>
      </div>

      {/* CONTROLS & BATTERY LEVEL */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span>Battery: {batteryLevel}%</span>
        </div>

        <button
          type="button"
          onClick={handleSimulateWearableAutoSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing Telemetry...' : 'Trigger 2-Hour Wearable Sync Now'}
        </button>
      </div>
    </div>
  );
};
