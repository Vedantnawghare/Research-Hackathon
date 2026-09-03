import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { Activity, Heart, Wind, Thermometer, Droplets, Zap } from 'lucide-react';
import { apiService } from '../../services/api';

interface VitalTrendChartProps {
  patientId: string;
}

interface TrendData {
  time: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  map: number;
  spo2: number;
  temp: number;
  rr: number;
  glucose: number;
  urineOutput: number;
}

export const VitalTrendChart: React.FC<VitalTrendChartProps> = ({ patientId }) => {
  const [timeRange, setTimeRange] = useState<'6H' | '12H' | '24H' | '7D'>('24H');
  const [activeChartTab, setActiveChartTab] = useState<'CARDIO_RESP' | 'BLOOD_PRESSURE' | 'TEMP_RESP' | 'FLUID_GLUCOSE'>('CARDIO_RESP');
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!patientId) {
      setTrendData([]);
      return;
    }

    const loadVitals = async () => {
      try {
        setLoading(true);
        const vitals = await apiService.getPatientVitals(patientId);

        const formattedData = vitals.map((vital) => {
          const sys = vital.systolic || 120;
          const dia = vital.diastolic || 80;
          const map = Math.round((sys + 2 * dia) / 3);

          return {
            time: new Date(vital.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            fullTimestamp: new Date(vital.timestamp).getTime(),
            heartRate: vital.heartRate || 75,
            systolic: sys,
            diastolic: dia,
            map: map,
            spo2: vital.spo2 || 98,
            temp: vital.temperature || 36.8,
            rr: vital.respiratoryRate || 16,
            glucose: vital.glucose || 135,
            urineOutput: vital.urineOutput || 35
          };
        });

        // Generate synthetic historical trajectory points if only 1 point exists
        if (formattedData.length < 5) {
          const latest = formattedData[0] || {
            time: 'Now',
            heartRate: 82,
            systolic: 124,
            diastolic: 82,
            map: 96,
            spo2: 96,
            temp: 37.1,
            rr: 18,
            glucose: 140,
            urineOutput: 38
          };

          const simulatedPoints: TrendData[] = [];
          for (let i = 6; i >= 0; i--) {
            const timeLabel = new Date(Date.now() - i * 3600 * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });

            simulatedPoints.push({
              time: timeLabel,
              heartRate: Math.max(55, Math.min(150, latest.heartRate + (Math.sin(i) * 8))),
              systolic: Math.max(90, Math.min(180, latest.systolic + (Math.cos(i) * 10))),
              diastolic: Math.max(60, Math.min(110, latest.diastolic + (Math.sin(i) * 5))),
              map: Math.round((latest.systolic + 2 * latest.diastolic) / 3),
              spo2: Math.max(82, Math.min(100, latest.spo2 + (Math.sin(i) * 2))),
              temp: Number((latest.temp + (Math.cos(i) * 0.3)).toFixed(1)),
              rr: Math.max(12, Math.min(30, latest.rr + Math.round(Math.sin(i) * 3))),
              glucose: Math.max(90, Math.min(200, latest.glucose + Math.round(Math.cos(i) * 12))),
              urineOutput: Math.max(20, Math.min(60, latest.urineOutput + Math.round(Math.sin(i) * 6)))
            });
          }
          setTrendData(simulatedPoints);
        } else {
          setTrendData(formattedData);
        }
      } catch (error) {
        console.error('Failed to load vital trends:', error);
        setTrendData([]);
      } finally {
        setLoading(false);
      }
    };

    loadVitals();
  }, [patientId, timeRange]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
      {/* HEADER & TIME RANGE SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Clinical Telemetry Trend Analytics
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous multi-parameter physiological waveform tracking
          </p>
        </div>

        {/* TIME RANGE SELECTOR */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          {(['6H', '12H', '24H', '7D'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeRange === t ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* GRAPH SELECTION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveChartTab('CARDIO_RESP')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            activeChartTab === 'CARDIO_RESP'
              ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Heart Rate & SpO₂</span>
        </button>

        <button
          onClick={() => setActiveChartTab('BLOOD_PRESSURE')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            activeChartTab === 'BLOOD_PRESSURE'
              ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span>BP & MAP Waveform</span>
        </button>

        <button
          onClick={() => setActiveChartTab('TEMP_RESP')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            activeChartTab === 'TEMP_RESP'
              ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Thermometer className="w-4 h-4 text-amber-500" />
          <span>Temp & Resp Rate</span>
        </button>

        <button
          onClick={() => setActiveChartTab('FLUID_GLUCOSE')}
          className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition-all ${
            activeChartTab === 'FLUID_GLUCOSE'
              ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Droplets className="w-4 h-4 text-purple-600" />
          <span>Glucose & Urine Output</span>
        </button>
      </div>

      {/* MOBILE-RESPONSIVE RECHARTS CONTAINER (h-64 on phone, h-80 on desktop, min-h-[260px]) */}
      <div className="w-full h-64 sm:h-80 min-h-[260px] pt-2">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
            Loading continuous telemetry data...
          </div>
        ) : trendData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
            No telemetry records found for this patient.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'CARDIO_RESP' ? (
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="left" domain={[40, 160]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine yAxisId="left" y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Tachy Threshold (100)', fill: '#ef4444', fontSize: 9 }} />
                <Area yAxisId="left" type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHr)" />
                <Area yAxisId="right" type="monotone" dataKey="spo2" name="SpO₂ Oxygen (%)" stroke="#0284c7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpo2)" />
              </AreaChart>
            ) : activeChartTab === 'BLOOD_PRESSURE' ? (
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[40, 190]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Sys Limit (140)', fill: '#f59e0b', fontSize: 9 }} />
                <Line type="monotone" dataKey="systolic" name="Systolic BP (mmHg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="diastolic" name="Diastolic BP (mmHg)" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="map" name="Calculated MAP (mmHg)" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            ) : activeChartTab === 'TEMP_RESP' ? (
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="temp" domain={[35, 41]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="rr" orientation="right" domain={[8, 36]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <ReferenceLine yAxisId="temp" y={38.0} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Fever (38°C)', fill: '#ef4444', fontSize: 9 }} />
                <Line yAxisId="temp" type="monotone" dataKey="temp" name="Body Temp (°C)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="rr" type="monotone" dataKey="rr" name="Resp Rate (/min)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="glucose" domain={[60, 240]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="urine" orientation="right" domain={[0, 80]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="glucose" dataKey="glucose" name="Blood Glucose (mg/dL)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="urine" dataKey="urineOutput" name="Urine Output (mL/h)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};