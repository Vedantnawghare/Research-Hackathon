import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { ICUBedMap } from '../components/icu/ICUBedMap';
import {
  Users,
  AlertTriangle,
  Clock,
  Activity,
  Building2,
  UserPlus,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Stethoscope,
  HeartPulse,
  UserCheck,
  UserX,
  X,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '../types';

export const AdminDashboard: React.FC = () => {
  const {
    patients,
    alerts,
    auditLogs,
    tasks,
    users,
    addUser,
    toggleUserStatus,
    addNewPatient,
    setActivePage,
    navigateToPatientProfile,
    refreshData,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'patients'>('overview');

  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  // Add User Form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('DOCTOR');
  const [newUserDept, setNewUserDept] = useState('Critical Care & ICU');
  const [newUserSpecialty, setNewUserSpecialty] = useState('Cardiology');
  const [newUserShift, setNewUserShift] = useState('Day Shift (08:00 - 20:00)');
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Add Patient Form state
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState(45);
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientContact, setPatientContact] = useState('');
  const [patientWard, setPatientWard] = useState('ICU Ward A');
  const [patientBed, setPatientBed] = useState('ICU-06');
  const [patientDoctorId, setPatientDoctorId] = useState<string>('2');
  const [submittingPatient, setSubmittingPatient] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);

  /* KPI Data */
  const activePatients = useMemo(() => patients, [patients]);
  const criticalCount = useMemo(
    () => activePatients.filter((p) => p.status === 'CRITICAL').length,
    [activePatients]
  );
  const activeAlertsCount = useMemo(
    () => alerts.filter((a) => a.status === 'ACTIVE').length,
    [alerts]
  );
  const observationsDueCount = useMemo(
    () =>
      tasks.filter((t) => {
        const s = String(t.status).toUpperCase();
        return s === 'DUE' || s === 'DUE_NOW' || s === 'OVERDUE';
      }).length,
    [tasks]
  );

  const doctorCount = useMemo(
    () => users.filter((u) => u.role === 'DOCTOR').length,
    [users]
  );
  const nurseCount = useMemo(
    () => users.filter((u) => u.role === 'NURSE').length,
    [users]
  );

  /* Wards Occupancy */
  const wardCapacities: Record<string, number> = {
    'ICU Ward A': 10,
    'ICU Ward B': 10,
    'Cardiology SCU': 15,
    'Neurology ICU': 12,
  };

  const wards = useMemo(() => {
    const map = new Map<string, number>();
    activePatients.forEach((p) => {
      const w = p.ward || 'Unassigned Ward';
      map.set(w, (map.get(w) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, occupied]) => {
      const capacity = wardCapacities[name] || Math.max(occupied, 8);
      const percent = Math.min(100, Math.round((occupied / capacity) * 100));
      const critical = activePatients.filter(
        (p) => p.ward === name && p.status === 'CRITICAL'
      ).length;
      return { name, occupied, capacity, percent, critical };
    });
  }, [activePatients]);

  const recentAuditLogs = useMemo(
    () =>
      [...auditLogs]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5),
    [auditLogs]
  );

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      setUserError('Please fill in all required fields');
      return;
    }
    setUserError(null);
    setSubmittingUser(true);

    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        department: newUserDept,
        specialty: newUserSpecialty,
        shift: newUserShift,
      });

      setShowAddUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (err: any) {
      setUserError(err?.message || 'Failed to register user');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleCreatePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientBed) {
      setPatientError('Please provide patient name and bed allocation');
      return;
    }
    setPatientError(null);
    setSubmittingPatient(true);

    try {
      const selectedDoc = users.find(u => u.id === patientDoctorId);
      const docName = selectedDoc ? selectedDoc.name : patientDoctorId ? `Doctor #${patientDoctorId}` : 'Not Assigned';

      await addNewPatient({
        name: patientName,
        age: Number(patientAge),
        gender: patientGender,
        contact: patientContact,
        ward: patientWard,
        bed: patientBed,
        assignedDoctor: docName,
        primaryDiagnosis: 'Acute ICU Care Telemetry',
        admissionDate: new Date().toISOString(),
      });

      setShowAddPatientModal(false);
      setPatientName('');
      setPatientContact('');
    } catch (err: any) {
      setPatientError(err?.message || 'Failed to admit patient');
    } finally {
      setSubmittingPatient(false);
    }
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '—';
    const date = new Date(ts);
    return Number.isNaN(date.getTime()) ? ts : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-2xl text-white shadow-md border border-slate-800">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Smart ICU Hospital Command Center
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-2">
            Hospital Administration & Staff Operations
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Full governance over Doctors, Nurses, ICU Patients, Bed Allocation, and System Audit Trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>

          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Add Doctor / Nurse
          </button>

          <button
            onClick={() => setShowAddPatientModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Admit Patient
          </button>
        </div>
      </div>

      {/* ADMIN CONTROL NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          ICU Operations Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Staff & User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'patients'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Patient & Bed Registry ({patients.length})
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active ICU Patients"
          value={activePatients.length}
          subtitle="Currently admitted census"
          icon={Users}
          variant="cyan"
          onClick={() => setActivePage('patients')}
        />
        <MetricCard
          title="Medical Doctors"
          value={doctorCount}
          subtitle="Assigned consultants & specialists"
          icon={Stethoscope}
          variant="slate"
        />
        <MetricCard
          title="Nursing Staff"
          value={nurseCount}
          subtitle="ICU observation staff"
          icon={HeartPulse}
          variant="amber"
        />
        <MetricCard
          title="Critical Alerts"
          value={activeAlertsCount}
          subtitle="Requires immediate doctor action"
          icon={AlertTriangle}
          variant="rose"
          onClick={() => setActivePage('alert-center')}
        />
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ICUBedMap patients={patients} onSelectPatient={navigateToPatientProfile} />
            </div>

            {/* WARD OCCUPANCY */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-600" />
                    Ward Occupancy
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">Live capacity tracking</p>
                </div>
                <span className="px-2 py-1 rounded-lg bg-slate-100 text-[9px] font-black text-slate-600">
                  {wards.length} WARDS
                </span>
              </div>

              <div className="space-y-4">
                {wards.map((w) => (
                  <div key={w.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-800 font-semibold truncate">{w.name}</span>
                      <span className="font-mono font-black text-slate-700">
                        {w.occupied}/{w.capacity}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          w.percent >= 90 ? 'bg-rose-600' : w.percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${w.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AUDIT & ALERTS SNAPSHOT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ALERTS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-600" />
                  Active Unresolved Alerts
                </h3>
                <button
                  onClick={() => setActivePage('alert-center')}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                >
                  View All Alerts <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {alerts.filter(a => a.status === 'ACTIVE').length === 0 ? (
                <div className="py-8 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-800 mt-2">All ICU Patients Stable</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alerts.filter(a => a.status === 'ACTIVE').slice(0, 4).map(alert => (
                    <div key={alert.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black text-white ${alert.severity === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-500'}`}>
                          {alert.severity}
                        </span>
                        <p className="text-xs font-bold text-slate-800 mt-1">{alert.parameter} - {alert.patientName}</p>
                        <p className="text-[10px] text-slate-500">{alert.currentValue}</p>
                      </div>
                      <button onClick={() => navigateToPatientProfile(alert.patientId)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100">
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AUDIT ACTIVITY */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-600" />
                  Live Audit Trail
                </h3>
                <button onClick={() => setActivePage('audit-logs')} className="text-xs font-bold text-cyan-700 flex items-center gap-1">
                  Full Audit Log <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {recentAuditLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-800">{log.user} ({log.role})</span>
                      <span className="text-[9px] text-slate-400">{formatTimestamp(log.timestamp)}</span>
                    </div>
                    <p className="text-xs font-extrabold text-cyan-800 mt-1">{log.action}</p>
                    <p className="text-[10px] text-slate-500 truncate">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB CONTENT: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hospital Staff & User Registry</h2>
              <p className="text-xs text-slate-500">Manage Doctors, Nurses, and Admin Accounts</p>
            </div>
            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
            >
              <UserPlus className="w-4 h-4" />
              Add Doctor / Nurse
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold">
                  <th className="p-3">User Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Specialty / Shift</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'DOCTOR' ? 'bg-cyan-100 text-cyan-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.department || 'General'}</td>
                    <td className="p-3 text-slate-600">{u.specialty || u.shift || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {u.isActive !== false ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleUserStatus(u.id, u.isActive === false)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          u.isActive !== false ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PATIENT REGISTRY */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Patient Census & Bed Directory</h2>
              <p className="text-xs text-slate-500">Active ICU Admitted Patients</p>
            </div>
            <button
              onClick={() => setShowAddPatientModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              <Plus className="w-4 h-4" />
              Admit New Patient
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold">
                  <th className="p-3">Patient Code & Name</th>
                  <th className="p-3">Age / Gender</th>
                  <th className="p-3">Ward & Bed</th>
                  <th className="p-3">Assigned Doctor</th>
                  <th className="p-3">Clinical Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.patientCode}</div>
                    </td>
                    <td className="p-3 text-slate-600">{p.age} yrs • {p.gender}</td>
                    <td className="p-3">
                      <span className="font-bold text-slate-800">{p.ward}</span>
                      <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-cyan-700 font-mono font-bold">{p.bed}</span>
                    </td>
                    <td className="p-3 text-slate-600">{p.assignedDoctor || 'Dr. Ananya Sharma'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                        p.status === 'CRITICAL' ? 'bg-rose-600 text-white' : p.status === 'HIGH_RISK' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigateToPatientProfile(p.id)}
                        className="px-3 py-1 rounded-lg bg-cyan-50 text-cyan-700 font-bold hover:bg-cyan-100 text-[11px]"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCTOR / NURSE */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-600" />
                Register New Hospital Staff
              </h3>
              <button onClick={() => setShowAddUserModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {userError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {userError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role Type</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="DOCTOR">Medical Doctor / Consultant</option>
                  <option value="NURSE">ICU Staff Nurse</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="ramesh@vitalcare.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={newUserDept}
                    onChange={(e) => setNewUserDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Specialty / Shift</label>
                  <input
                    type="text"
                    value={newUserSpecialty}
                    onChange={(e) => setNewUserSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold disabled:opacity-50"
                >
                  {submittingUser ? 'Saving...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIT PATIENT */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Admit New ICU Patient
              </h3>
              <button onClick={() => setShowAddPatientModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {patientError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {patientError}
              </div>
            )}

            <form onSubmit={handleCreatePatientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Mahindra"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ICU Ward</label>
                  <select
                    value={patientWard}
                    onChange={(e) => setPatientWard(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="ICU Ward A">ICU Ward A</option>
                    <option value="ICU Ward B">ICU Ward B</option>
                    <option value="Cardiology SCU">Cardiology SCU</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bed Number</label>
                  <input
                    type="text"
                    placeholder="ICU-06"
                    value={patientBed}
                    onChange={(e) => setPatientBed(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Physician / Doctor</label>
                <select
                  value={patientDoctorId}
                  onChange={(e) => setPatientDoctorId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="">Unassigned (Triggers Alert)</option>
                  {users.filter(u => u.role === 'DOCTOR').map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.specialty || doc.department || 'Attending'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Contact</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={patientContact}
                  onChange={(e) => setPatientContact(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPatient}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50"
                >
                  {submittingPatient ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};