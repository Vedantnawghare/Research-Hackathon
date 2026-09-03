import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Plus,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Patient } from '../../types';
import { getCurrentShiftIST, formatISTDate } from '../../utils/dateUtils';

interface ClinicalScheduleCalendarProps {
  patients: Patient[];
  onSelectPatient?: (patientId: string) => void;
}

interface AppointmentItem {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  type: 'DOCTOR_ROUNDS' | 'VITAL_CHECK' | 'DISCHARGE_PLANNED' | 'LAB_SCAN' | 'MEDICATION';
  title: string;
  scheduledTimeIST: string;
  assignedStaff: string;
  status: 'PENDING' | 'COMPLETED';
}

export const ClinicalScheduleCalendar: React.FC<ClinicalScheduleCalendarProps> = ({
  patients,
  onSelectPatient
}) => {
  const currentShift = getCurrentShiftIST();

  const [appointments, setAppointments] = useState<AppointmentItem[]>([
    {
      id: 'apt-1',
      patientId: patients[0]?.id || 'PAT-1001',
      patientName: patients[0]?.name || 'Rajesh Kumar',
      bed: patients[0]?.bed || 'ICU-01',
      type: 'VITAL_CHECK',
      title: 'Bedside Vital Sign Recording (Q2H)',
      scheduledTimeIST: '11:45 AM IST',
      assignedStaff: 'Nurse Ananya Marghade',
      status: 'PENDING'
    },
    {
      id: 'apt-2',
      patientId: patients[0]?.id || 'PAT-1001',
      patientName: patients[0]?.name || 'Rajesh Kumar',
      bed: patients[0]?.bed || 'ICU-01',
      type: 'DOCTOR_ROUNDS',
      title: 'Dr. Shravani Specialty Rounds & Cardiac Evaluation',
      scheduledTimeIST: '02:30 PM IST',
      assignedStaff: 'Dr. Shravani Sadawarte',
      status: 'PENDING'
    },
    {
      id: 'apt-3',
      patientId: patients[1]?.id || 'PAT-1002',
      patientName: patients[1]?.name || 'Priya Sharma',
      bed: patients[1]?.bed || 'ICU-02',
      type: 'LAB_SCAN',
      title: 'High-Resolution Chest CT & Blood Gas Analysis',
      scheduledTimeIST: '04:00 PM IST',
      assignedStaff: 'Radiology Team',
      status: 'PENDING'
    },
    {
      id: 'apt-4',
      patientId: patients[2]?.id || 'PAT-1003',
      patientName: patients[2]?.name || 'Amitabh Patel',
      bed: patients[2]?.bed || 'ICU-03',
      type: 'DISCHARGE_PLANNED',
      title: 'Planned Step-down Ward Transfer & Discharge Summary',
      scheduledTimeIST: '05:30 PM IST',
      assignedStaff: 'Dr. Rajesh Kumar',
      status: 'PENDING'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('03:00 PM IST');
  const [newType, setNewType] = useState<AppointmentItem['type']>('VITAL_CHECK');
  const [selectedPatient, setSelectedPatient] = useState<string>(patients[0]?.id || '');

  const toggleStatus = (id: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === id
          ? { ...apt, status: apt.status === 'PENDING' ? 'COMPLETED' : 'PENDING' }
          : apt
      )
    );
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const p = patients.find((pat) => pat.id === selectedPatient) || patients[0];

    const newItem: AppointmentItem = {
      id: `apt-${Date.now()}`,
      patientId: p.id,
      patientName: p.name,
      bed: p.bed,
      type: newType,
      title: newTitle.trim(),
      scheduledTimeIST: newTime,
      assignedStaff: 'Nurse Ananya Marghade',
      status: 'PENDING'
    };

    setAppointments((prev) => [...prev, newItem]);
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* SHIFT ROSTER & CALENDAR HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 border border-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-600" /> Indian Standard Time (IST)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              Shift: {currentShift.shiftName} ({currentShift.shiftTiming})
            </span>
          </div>

          <h3 className="text-lg font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            Clinical Schedule, Appointments & Nurse Duty Roster
          </h3>
        </div>

        {/* SCHEDULE APPOINTMENT BUTTON */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all self-start lg:self-auto"
        >
          <Plus className="w-4 h-4 text-cyan-400" /> Add Clinical Schedule / Appointment
        </button>
      </div>

      {/* ACTIVE NURSE ON DUTY & HANDOVER BANNER */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-cyan-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center font-black text-cyan-300">
            <UserCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-300">Active Nurse On Duty (ICU Ward)</div>
            <div className="text-sm font-black text-white">{currentShift.onDutyNurse}</div>
          </div>
        </div>

        <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Shift Handover</span>
          <span className="text-xs font-mono font-black text-cyan-300">{currentShift.nextHandoverIST}</span>
        </div>
      </div>

      {/* APPOINTMENT & VITAL CHECK SCHEDULE LIST */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider flex items-center justify-between">
          <span>Upcoming Patient Appointments & Vital Checks Today:</span>
          <span className="text-cyan-600 font-mono">{appointments.filter(a => a.status === 'PENDING').length} Pending</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {appointments.map((apt) => (
            <motion.div
              key={apt.id}
              whileHover={{ scale: 1.01 }}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                apt.status === 'COMPLETED'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : apt.type === 'DISCHARGE_PLANNED'
                  ? 'bg-purple-50/60 border-purple-200'
                  : apt.type === 'DOCTOR_ROUNDS'
                  ? 'bg-blue-50/60 border-blue-200'
                  : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                    apt.type === 'DISCHARGE_PLANNED'
                      ? 'bg-purple-600 text-white'
                      : apt.type === 'DOCTOR_ROUNDS'
                      ? 'bg-blue-600 text-white'
                      : apt.type === 'LAB_SCAN'
                      ? 'bg-amber-600 text-white'
                      : 'bg-cyan-600 text-white'
                  }`}>
                    {apt.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {apt.scheduledTimeIST}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">{apt.title}</div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-bold text-slate-700">{apt.patientName} ({apt.bed})</span>
                  <span>•</span>
                  <span>{apt.assignedStaff}</span>
                </div>
              </div>

              {/* ACTION TOGGLE */}
              <button
                type="button"
                onClick={() => toggleStatus(apt.id)}
                className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                  apt.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-200'
                }`}
                title={apt.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Completed'}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ADD APPOINTMENT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-cyan-600" />
                  Schedule Clinical Appointment
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAddAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Patient</label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.name} ({pat.bed} - {pat.ward})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Appointment / Schedule Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  >
                    <option value="VITAL_CHECK">Bedside Vital Check (Q2H)</option>
                    <option value="DOCTOR_ROUNDS">Doctor Specialty Rounds</option>
                    <option value="DISCHARGE_PLANNED">Planned Patient Discharge</option>
                    <option value="LAB_SCAN">Lab Test / Radiology Scan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Schedule Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Echocardiogram Scan & Cardiology Review"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Scheduled Time (IST)</label>
                  <input
                    type="text"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="e.g. 03:30 PM IST"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-slate-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                  >
                    Save Appointment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
