import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ClipboardCheck, CheckCircle2, AlertTriangle, UserCheck, Save, Clock, ArrowRight, User } from 'lucide-react';
import { getCurrentShiftIST, formatISTTime } from '../utils/dateUtils';

export const ShiftHandoverPage: React.FC = () => {
  const { patients, alerts, navigateToPatientProfile } = useApp();
  const currentShift = getCurrentShiftIST();

  const [handoverNotes, setHandoverNotes] = useState(
    `Shift Handover Summary (${currentShift.shiftName} SHIFT - ${currentShift.shiftTiming}):\n\n` +
    `1. Rajesh Kumar (ICU-01): Severe ARDS / Septic Shock. SpO2 desaturated to 88% at bedside. Placed on high-flow nasal cannula (HFNC 45L/min). Attending: Dr. Shravani Sadawarte & Dr. Rajesh Kumar.\n` +
    `2. Vedant Nawghare (ICU-02): Acute Myocardial Infarction. BP 145/95 mmHg. Titrating IV Nitroglycerin. Re-evaluate MAP & ECG at 03:00 PM IST.\n` +
    `3. Suresh Deshmukh (ICU-03): Hypertensive Crisis. Core Temp 38.2°C. Antipyretic administered by Nurse Ananya. Monitor Urine Output (>30 mL/h).`
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const criticalPatients = patients.filter(p => p.status === 'CRITICAL' || p.status === 'HIGH_RISK');

  const handleSaveNotes = async () => {
    try {
      await apiService.saveShiftHandover({
        shift_date: new Date().toISOString().slice(0, 10),
        shift_type: `${currentShift.shiftName} SHIFT (${currentShift.shiftTiming})`,
        outgoing_nurse_name: currentShift.onDutyNurse,
        incoming_nurse_name: 'Nurse Shweta Kadam (Senior Staff Nurse)',
        total_completed_observations: 14,
        pending_observations: 2,
        missed_observations: 0,
        active_alerts_count: alerts.filter(a => a.status === 'ACTIVE').length,
        handover_notes: handoverNotes,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save shift handover:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-blue-950 p-6 rounded-2xl text-white shadow-md border border-cyan-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Shift Transition Operations • {currentShift.shiftName} SHIFT
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                {currentShift.shiftTiming}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-cyan-400" /> Intelligent Nurse Shift Handover Summary
            </h1>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span>Outgoing Shift Lead: <strong className="text-white">{currentShift.onDutyNurse}</strong></span>
              <span>→</span>
              <span>Incoming Shift Lead: <strong className="text-cyan-300">Nurse Shweta Kadam (Senior Staff Nurse)</strong></span>
            </p>
          </div>

          <button
            onClick={handleSaveNotes}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer self-start md:self-auto"
          >
            <Save className="w-4 h-4" /> Save & Broadcast Handover
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Shift handover notes signed and saved! Broadcasted to incoming shift leader terminal.
        </div>
      )}

      {/* Shift Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Completed Observations</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">14 Passed</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% On-time compliance</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Next Shift Transition</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{currentShift.nextHandoverIST}</h3>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Handover countdown active</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-rose-600">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">Active Critical Alerts</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{alerts.filter(a => a.status === 'ACTIVE').length} Alarms</h3>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">Requires immediate follow-up</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm border-l-4 border-l-cyan-600">
          <span className="text-[10px] font-extrabold uppercase text-slate-500">High Risk Handover Patients</span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{criticalPatients.length} Patients</h3>
          <p className="text-[11px] text-cyan-700 font-semibold mt-1">Multi-Doctor Attending</p>
        </div>
      </div>

      {/* Main Grid: Patients Requiring Handover Attention Left, Handover Notes Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients Requiring Handover Attention */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Patients Requiring Handover Attention</h3>
              <p className="text-xs text-slate-500 mt-0.5">High-priority ICU patients needing close shift transition monitoring</p>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 uppercase">
              {criticalPatients.length} High Priority
            </span>
          </div>

          <div className="space-y-3">
            {criticalPatients.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[10px]">
                      {p.bed}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                    <StatusBadge status={p.status} size="sm" />
                  </div>
                  <button
                    onClick={() => navigateToPatientProfile(p.id)}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                  >
                    Inspect Profile <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2 text-xs space-y-1">
                  <p className="text-slate-700"><strong>Primary Diagnosis:</strong> {p.primaryDiagnosis}</p>
                  <p className="text-slate-700">
                    <strong>Care Team Doctors:</strong> {p.assignedDoctor} (Primary) • Dr. Rajesh Kumar (Consulting)
                  </p>
                  <p className="text-slate-700">
                    <strong>Latest Vitals:</strong> HR {p.latestVitals.heartRate} bpm, SpO2 {p.latestVitals.spo2}%, BP {p.latestVitals.systolic}/{p.latestVitals.diastolic} mmHg
                  </p>
                  
                  {/* NURSE ATTRIBUTION BADGE */}
                  <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500 font-semibold border-t border-slate-200 mt-2">
                    <User className="w-3 h-3 text-cyan-600" />
                    <span>Bedside Observation Logged By: <strong className="text-slate-800">{currentShift.onDutyNurse}</strong></span>
                    <span>•</span>
                    <span className="font-mono text-cyan-700">{formatISTTime(p.latestVitals.timestamp || new Date())}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Handover Notes & Shift Sign-off */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">Shift Handover Log & Sign-Off</h3>
            <p className="text-xs text-slate-500 mt-0.5">Enter clinical notes for incoming shift lead</p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Clinical Observations & Directives
            </label>
            <textarea
              rows={12}
              value={handoverNotes}
              onChange={e => setHandoverNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 text-xs font-mono text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              placeholder="Enter handover notes..."
            />
          </div>

          <button
            onClick={handleSaveNotes}
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-cyan-400" /> Sign & Transmit Handover Notes
          </button>
        </div>
      </div>
    </div>
  );
};
