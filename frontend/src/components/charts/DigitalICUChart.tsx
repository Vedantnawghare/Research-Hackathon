import React, { useEffect, useState } from 'react';
import { Patient, VitalRecord } from '../../types';
import { FileSpreadsheet, Printer, Download, Clock, AlertTriangle, CheckCircle2, Activity, Plus } from 'lucide-react';
import { apiService } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { formatISTDate } from '../../utils/dateUtils';

interface DigitalICUChartProps {
  patient: Patient;
}

export const DigitalICUChart: React.FC<DigitalICUChartProps> = ({ patient }) => {
  const { navigateToRecordVitals } = useApp();
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRealVitals = async () => {
      try {
        setLoading(true);
        const data = await apiService.getPatientVitals(patient.id);
        // Sort chronologically ascending for flowsheet matrix
        const sorted = [...data].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        setVitalsHistory(sorted);
      } catch (err) {
        console.error('Failed to load dynamic patient flowsheet:', err);
      } finally {
        setLoading(false);
      }
    };

    if (patient?.id) {
      fetchRealVitals();
    }
  }, [patient?.id, patient?.latestVitals?.timestamp]);

  // Calculate Q2H (2 Hour) Notification Status
  const latestVital = vitalsHistory[vitalsHistory.length - 1] || patient.latestVitals;
  const lastRecordedTime = latestVital?.timestamp ? new Date(latestVital.timestamp).getTime() : 0;
  const now = Date.now();
  const hoursSinceLastCheck = lastRecordedTime ? (now - lastRecordedTime) / (1000 * 60 * 60) : 999;
  const isQ2HDue = hoursSinceLastCheck >= 2;

  // Format Dynamic Time Headers (IST)
  const timeHeaders = vitalsHistory.map((v) => {
    return new Date(v.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  });

  const getValClass = (param: string, value: number | string | undefined) => {
    if (value === undefined || value === null || value === '' || value === 0) return 'text-slate-300';
    const num = typeof value === 'number' ? value : parseFloat(String(value));

    if (param === 'HR' && (num > 120 || num < 50)) return 'text-rose-700 font-black bg-rose-100/90';
    if (param === 'SPO2' && num < 90) return 'text-rose-700 font-black bg-rose-100/90';
    if (param === 'TEMP' && num >= 38.5) return 'text-amber-800 font-black bg-amber-100/90';
    if (param === 'SYS' && (num >= 160 || num <= 90)) return 'text-rose-700 font-black bg-rose-100/90';
    return 'text-slate-900 font-bold';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden space-y-5">
      {/* Q2H VITAL CHECK NOTIFICATION BANNER */}
      {isQ2HDue ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white animate-bounce">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 flex items-center gap-2">
                🚨 Q2H Bedside Vital Observation Due!
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-200 text-rose-900">
                  Last Recorded &gt; 2 Hours Ago
                </span>
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Patient {patient.name} ({patient.bed}) requires bedside vital check. Tap button to open Voice AI Auto-Fill.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateToRecordVitals(patient.id)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Record Vitals Now (Voice)
          </button>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>
              Q2H Bedside Schedule Active • Next Check Due in{' '}
              <strong className="text-cyan-300">
                {Math.max(1, Math.round((2 - hoursSinceLastCheck) * 60))} mins
              </strong>
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Target Protocol: Every 2 Hours</span>
        </div>
      )}

      {/* MATRIX HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-700" />
            <h3 className="text-base font-extrabold text-slate-900">
              Dynamic Digital ICU Flowsheet (IST Matrix)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 text-white uppercase">
              {patient.bed}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Patient: <strong className="text-slate-800">{patient.name}</strong> ({patient.id}) • Actual Bedside Observation Logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateToRecordVitals(patient.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Record Observation
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>
      </div>

      {/* DYNAMIC HOURLY FLOW TABLE (DERIVED FROM ACTUAL RECORDED ENTRIES ONLY) */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400">
            Loading dynamic observation records...
          </div>
        ) : vitalsHistory.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs font-bold text-slate-500">No bedside observations recorded yet for {patient.name}.</p>
            <button
              onClick={() => navigateToRecordVitals(patient.id)}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
            >
              Record First Bedside Observation
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 font-bold border-b border-slate-800 min-w-[180px]">Parameter</th>
                <th className="p-3 font-bold border-b border-slate-800 min-w-[110px] text-slate-300">Target Range</th>
                {timeHeaders.map((t, idx) => (
                  <th key={idx} className="p-3 font-bold border-b border-slate-800 text-center min-w-[90px] text-cyan-300">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {/* Heart Rate */}
              <tr className="bg-white">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Heart Rate (bpm)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">60 – 100</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className={`p-3 text-center border-r border-slate-100 ${getValClass('HR', v.heartRate)}`}>
                    {v.heartRate || '—'}
                  </td>
                ))}
              </tr>

              {/* Blood Pressure */}
              <tr className="bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Blood Pressure (mmHg)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">90–120 / 60–80</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className={`p-3 text-center border-r border-slate-100 ${getValClass('SYS', v.systolic)}`}>
                    {v.systolic && v.diastolic ? `${v.systolic}/${v.diastolic}` : '—'}
                  </td>
                ))}
              </tr>

              {/* SpO2 */}
              <tr className="bg-white">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">SpO₂ Oxygen (%)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">95 – 100%</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className={`p-3 text-center border-r border-slate-100 ${getValClass('SPO2', v.spo2)}`}>
                    {v.spo2 ? `${v.spo2}%` : '—'}
                  </td>
                ))}
              </tr>

              {/* Temperature */}
              <tr className="bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Temperature (°C)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">36.5 – 37.5</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className={`p-3 text-center border-r border-slate-100 ${getValClass('TEMP', v.temperature)}`}>
                    {v.temperature ? `${v.temperature}°C` : '—'}
                  </td>
                ))}
              </tr>

              {/* Respiratory Rate */}
              <tr className="bg-white">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Resp Rate (/min)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">12 – 20</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className="p-3 text-center font-bold text-slate-800 border-r border-slate-100">
                    {v.respiratoryRate || '—'}
                  </td>
                ))}
              </tr>

              {/* Urine Output */}
              <tr className="bg-slate-50/60">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Urine Output (mL/h)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">&gt; 30 mL/h</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className="p-3 text-center font-bold text-slate-800 border-r border-slate-100">
                    {v.urineOutput ? `${v.urineOutput} mL` : '—'}
                  </td>
                ))}
              </tr>

              {/* Blood Glucose */}
              <tr className="bg-white">
                <td className="p-3 font-bold text-slate-900 border-r border-slate-200">Blood Glucose (mg/dL)</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">70 – 140</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className="p-3 text-center font-bold text-slate-800 border-r border-slate-100">
                    {v.glucose ? `${v.glucose} mg/dL` : '—'}
                  </td>
                ))}
              </tr>

              {/* Nurse Log Notes */}
              <tr className="bg-cyan-50/40">
                <td className="p-3 font-bold text-cyan-900 border-r border-slate-200">Nurse Dictation Note</td>
                <td className="p-3 text-slate-500 font-medium border-r border-slate-200">Voice / Bedside</td>
                {vitalsHistory.map((v, i) => (
                  <td key={i} className="p-3 text-center text-[10px] font-medium text-slate-600 border-r border-slate-100 max-w-[140px] truncate" title={v.notes}>
                    {v.notes || 'Recorded'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
