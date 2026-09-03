import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import { useApp } from '../context/AppContext';

import { MetricCard } from '../components/common/MetricCard';
import { ICUBedMap } from '../components/icu/ICUBedMap';
import { StatusBadge } from '../components/common/StatusBadge';
import { VitalTrendChart } from '../components/charts/VitalTrendChart';
import { ClinicalScheduleCalendar } from '../components/clinical/ClinicalScheduleCalendar';

import {
  Stethoscope,
  Users,
  AlertTriangle,
  Activity,
  Clock,
  Heart,
  Droplets,
  Wind,
  Thermometer,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const {
    patients,
    alerts,
    tasks,
    setActivePage,
    navigateToPatientProfile,
    navigateToRecordVitals,
    acknowledgeAlert,
    refreshData,
  } = useApp();

  const [refreshing, setRefreshing] =
    useState(false);

  const [selectedTrendPatientId, setSelectedTrendPatientId] =
    useState<string>(
      patients[0]?.id || ''
    );

  /*
   * =========================================================
   * PATIENT GROUPS
   * =========================================================
   */

  const doctorPatients = useMemo(
    () => patients,
    [patients]
  );

  const criticalList = useMemo(
    () =>
      doctorPatients.filter(
        (patient) =>
          patient.status === 'CRITICAL'
      ),
    [doctorPatients]
  );

  const highRiskList = useMemo(
    () =>
      doctorPatients.filter(
        (patient) =>
          patient.status === 'HIGH_RISK'
      ),
    [doctorPatients]
  );

  const attentionList = useMemo(
    () =>
      doctorPatients.filter(
        (patient) =>
          patient.status === 'ATTENTION'
      ),
    [doctorPatients]
  );

  const stableList = useMemo(
    () =>
      doctorPatients.filter(
        (patient) =>
          patient.status === 'STABLE'
      ),
    [doctorPatients]
  );

  /*
   * =========================================================
   * ALERTS
   * =========================================================
   */

  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          alert.status === 'ACTIVE'
      ),
    [alerts]
  );

  const criticalAlerts = useMemo(
    () =>
      activeAlerts
        .filter(
          (alert) =>
            alert.severity ===
            'CRITICAL'
        )
        .sort(
          (a, b) =>
            new Date(
              b.timestamp
            ).getTime() -
            new Date(
              a.timestamp
            ).getTime()
        ),
    [activeAlerts]
  );

  /*
   * =========================================================
   * TASKS
   * =========================================================
   */

  const overdueTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const status =
          String(
            task.status
          ).toUpperCase();

        return (
          status === 'OVERDUE' ||
          status === 'MISSED'
        );
      }),
    [tasks]
  );

  const dueTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const status =
          String(
            task.status
          ).toUpperCase();

        return (
          status === 'DUE' ||
          status === 'DUE_NOW'
        );
      }),
    [tasks]
  );

  /*
   * =========================================================
   * TREND PATIENT
   * =========================================================
   */

  const trendPatient =
    doctorPatients.find(
      (patient) =>
        patient.id ===
        selectedTrendPatientId
    ) ||
    doctorPatients[0];

  /*
   * =========================================================
   * DASHBOARD STATUS
   * =========================================================
   */

  const overallRisk = useMemo(() => {
    if (criticalList.length > 0) {
      return 'CRITICAL';
    }

    if (highRiskList.length > 0) {
      return 'HIGH_RISK';
    }

    if (attentionList.length > 0) {
      return 'ATTENTION';
    }

    return 'STABLE';
  }, [
    criticalList,
    highRiskList,
    attentionList,
  ]);

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshData();
    } catch (error) {
      console.error(
        'Failed to refresh doctor dashboard:',
        error
      );
    } finally {
      setRefreshing(false);
    }
  };

  /*
   * =========================================================
   * ACKNOWLEDGE ALERT
   * =========================================================
   */

  const handleAcknowledge = async (
    alertId: string
  ) => {
    try {
      await acknowledgeAlert(
        alertId
      );
    } catch (error) {
      console.error(
        'Failed to acknowledge alert:',
        error
      );
    }
  };

  /*
   * =========================================================
   * DATE / TIME HELPER
   * =========================================================
   */

  const formatTimestamp = (
    value?: string
  ) => {
    if (!value) return '—';

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  /*
   * =========================================================
   * PATIENT PRIORITY CARD
   * =========================================================
   */

  const PatientPriorityCard: React.FC<{
    patient: any;
  }> = ({ patient }) => {
    const vitals =
      patient.latestVitals || {};

    const hasHeartRate =
      Number(vitals.heartRate) > 0;

    const hasSpo2 =
      Number(vitals.spo2) > 0;

    const hasBP =
      Number(vitals.systolic) > 0 ||
      Number(vitals.diastolic) > 0;

    const hasTemperature =
      Number(vitals.temperature) > 0;

    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-md transition-all">
        {/* Patient header */}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[10px]">
                {patient.bed}
              </span>

              <span className="text-[10px] text-slate-400 font-mono">
                {patient.patientCode ||
                  patient.id}
              </span>

              <StatusBadge
                status={patient.status}
                size="sm"
              />
            </div>

            <button
              onClick={() =>
                navigateToPatientProfile(
                  patient.id
                )
              }
              className="text-sm font-bold text-slate-900 mt-1 hover:text-cyan-700 text-left"
            >
              {patient.name}
            </button>

            <p className="text-xs text-slate-500 mt-0.5">
              {patient.age}y/o{' '}
              {patient.gender}
            </p>

            <p className="text-[11px] font-medium text-slate-600 mt-1 truncate max-w-[260px]">
              {patient.primaryDiagnosis ||
                'Clinical diagnosis not recorded'}
            </p>
          </div>
        </div>

        {/* Vitals */}

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-slate-200/80">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" />

              <span className="text-[8px] font-bold text-slate-400 uppercase">
                HR
              </span>
            </div>

            <p
              className={`text-xs font-extrabold mt-0.5 ${
                hasHeartRate &&
                (vitals.heartRate <
                  50 ||
                  vitals.heartRate >
                    130)
                  ? 'text-rose-600'
                  : 'text-slate-800'
              }`}
            >
              {hasHeartRate
                ? `${vitals.heartRate} bpm`
                : '—'}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-500" />

              <span className="text-[8px] font-bold text-slate-400 uppercase">
                SpO₂
              </span>
            </div>

            <p
              className={`text-xs font-extrabold mt-0.5 ${
                hasSpo2 &&
                vitals.spo2 < 90
                  ? 'text-rose-600'
                  : 'text-slate-800'
              }`}
            >
              {hasSpo2
                ? `${vitals.spo2}%`
                : '—'}
            </p>
          </div>

          <div className="text-center">
            <span className="text-[8px] font-bold text-slate-400 uppercase">
              BP
            </span>

            <p className="text-xs font-extrabold text-slate-800 mt-0.5">
              {hasBP
                ? `${vitals.systolic}/${vitals.diastolic}`
                : '—'}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Thermometer className="w-3 h-3 text-orange-500" />

              <span className="text-[8px] font-bold text-slate-400 uppercase">
                Temp
              </span>
            </div>

            <p className="text-xs font-extrabold text-slate-800 mt-0.5">
              {hasTemperature
                ? `${vitals.temperature}°C`
                : '—'}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500 font-medium">
            Last observation:{' '}
            {patient.lastObservationTime ||
              'No observation'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                navigateToRecordVitals(
                  patient.id
                )
              }
              className="px-2.5 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-[10px] font-semibold"
            >
              Record Vitals
            </button>

            <button
              onClick={() =>
                navigateToPatientProfile(
                  patient.id
                )
              }
              className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-[10px] font-bold shadow-sm"
            >
              Full Profile
            </button>
          </div>
        </div>
      </div>
    );
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-6 pb-12"
    >
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-100 text-cyan-800">
              Senior Clinical Command
            </span>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                overallRisk ===
                'CRITICAL'
                  ? 'bg-rose-100 text-rose-700'
                  : overallRisk ===
                    'HIGH_RISK'
                  ? 'bg-orange-100 text-orange-700'
                  : overallRisk ===
                    'ATTENTION'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              Overall Risk: {overallRisk}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            Doctor Clinical Dashboard
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            {criticalList.length > 0 ? (
              <>
                <strong className="text-rose-700">
                  {criticalList.length}
                </strong>{' '}
                critical patient
                {criticalList.length !==
                1
                  ? 's'
                  : ''}{' '}
                require immediate clinical review.
              </>
            ) : (
              <>
                No critical patients
                are currently present.
                Continue reviewing active
                alerts and observation trends.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </button>

          <button
            onClick={() =>
              setActivePage(
                'monitoring-plan'
              )
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md"
          >
            <Stethoscope className="w-4 h-4" />

            Monitoring Plans
          </button>
        </div>
      </div>

      {/* =====================================================
         KPI CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Patients Under Review"
          value={doctorPatients.length}
          subtitle="Active clinical census"
          icon={Users}
          variant="cyan"
          onClick={() =>
            setActivePage('patients')
          }
        />

        <MetricCard
          title="Critical Patients"
          value={criticalList.length}
          subtitle="Immediate clinical priority"
          icon={AlertTriangle}
          variant="rose"
          onClick={() =>
            setActivePage(
              'alert-center'
            )
          }
        />

        <MetricCard
          title="Active Telemetry Alerts"
          value={activeAlerts.length}
          subtitle={`${criticalAlerts.length} critical alerts`}
          icon={Activity}
          variant="amber"
          onClick={() =>
            setActivePage(
              'alert-center'
            )
          }
        />

        <MetricCard
          title="Overdue Observations"
          value={overdueTasks.length}
          subtitle={`${dueTasks.length} due now`}
          icon={Clock}
          variant="slate"
          onClick={() =>
            setActivePage(
              'nurse-dashboard'
            )
          }
        />
      </div>

      {/* =====================================================
         CRITICAL ALERT STRIP
      ===================================================== */}

      {criticalAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-rose-800">
                    Critical Telemetry Alerts
                  </p>

                  <p className="text-[11px] text-rose-700 mt-0.5">
                    {criticalAlerts.length}{' '}
                    active critical alert
                    {criticalAlerts.length !==
                    1
                      ? 's'
                      : ''}{' '}
                    require clinical review.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setActivePage(
                      'alert-center'
                    )
                  }
                  className="text-[10px] font-black text-rose-700 hover:text-rose-900 flex items-center gap-1"
                >
                  View Alerts
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {criticalAlerts
                  .slice(0, 3)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="bg-white rounded-xl border border-rose-200 px-3 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900">
                          {alert.patientName}{' '}
                          •{' '}
                          {alert.parameter}
                        </p>

                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Value:{' '}
                          {
                            alert.currentValue
                          }{' '}
                          •{' '}
                          {alert.thresholdExceeded}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400">
                          {formatTimestamp(
                            alert.timestamp
                          )}
                        </span>

                        <button
                          onClick={() =>
                            handleAcknowledge(
                              alert.id
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
         PATIENT PRIORITY QUEUE
      ===================================================== */}

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Clinical Patient Priority Queue
            </h3>

            <p className="text-xs text-slate-500 mt-0.5">
              Patients grouped by current physiological
              risk classification.
            </p>
          </div>

          <button
            onClick={() =>
              setActivePage('patients')
            }
            className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
          >
            View All ({doctorPatients.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-7">
          {/* CRITICAL */}

          {criticalList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />

                <h4 className="text-xs font-black uppercase tracking-wider text-rose-700">
                  Critical — Immediate Attention (
                  {criticalList.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {criticalList.map(
                  (patient) => (
                    <PatientPriorityCard
                      key={patient.id}
                      patient={patient}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* HIGH RISK */}

          {highRiskList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-orange-500" />

                <h4 className="text-xs font-black uppercase tracking-wider text-orange-700">
                  High Risk — Doctor Review (
                  {highRiskList.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {highRiskList.map(
                  (patient) => (
                    <PatientPriorityCard
                      key={patient.id}
                      patient={patient}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* ATTENTION */}

          {attentionList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-amber-500" />

                <h4 className="text-xs font-black uppercase tracking-wider text-amber-700">
                  Attention — Close Monitoring (
                  {attentionList.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {attentionList.map(
                  (patient) => (
                    <PatientPriorityCard
                      key={patient.id}
                      patient={patient}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* STABLE */}

          {stableList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />

                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Stable Patients (
                  {stableList.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {stableList
                  .slice(0, 4)
                  .map((patient) => (
                    <PatientPriorityCard
                      key={patient.id}
                      patient={patient}
                    />
                  ))}
              </div>

              {stableList.length > 4 && (
                <button
                  onClick={() =>
                    setActivePage(
                      'patients'
                    )
                  }
                  className="mt-3 text-[10px] font-bold text-cyan-700 hover:text-cyan-900"
                >
                  + {stableList.length - 4}{' '}
                  more stable patients
                </button>
              )}
            </div>
          )}

          {/* EMPTY */}

          {doctorPatients.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />

              <p className="text-sm font-black text-slate-700 mt-3">
                No active patients
              </p>

              <p className="text-xs text-slate-400 mt-1">
                The clinical patient queue is currently empty.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
         ICU BED MAP
      ===================================================== */}

      <ICUBedMap
        patients={doctorPatients}
        onSelectPatient={
          navigateToPatientProfile
        }
      />

      {/* =====================================================
         VITAL TREND ANALYTICS
      ===================================================== */}

      {doctorPatients.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Patient Vital Trend Analytics
              </h3>

              <p className="text-xs text-slate-500 mt-0.5">
                Select a patient to inspect historical vital trends.
              </p>
            </div>

            <select
              value={
                trendPatient?.id || ''
              }
              onChange={(event) =>
                setSelectedTrendPatientId(
                  event.target.value
                )
              }
              className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
            >
              {doctorPatients.map(
                (patient) => (
                  <option
                    key={patient.id}
                    value={patient.id}
                  >
                    {patient.bed} —{' '}
                    {patient.name}
                  </option>
                )
              )}
            </select>
          </div>

          {trendPatient ? (
            <VitalTrendChart
              patientId={
                trendPatient.id
              }
            />
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              No patient selected.
            </div>
          )}
        </div>
      )}

      {/* =====================================================
         CLINICAL SCHEDULE, APPOINTMENTS & SHIFT ROSTER
      ===================================================== */}
      <ClinicalScheduleCalendar patients={patients} onSelectPatient={navigateToPatientProfile} />

      {/* =====================================================
         CLINICAL WORKLOAD FOOTER
      ===================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() =>
            setActivePage(
              'nurse-dashboard'
            )
          }
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left hover:border-cyan-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Bedside Workload
              </p>

              <p className="text-lg font-black text-slate-900 mt-1">
                {dueTasks.length +
                  overdueTasks.length}
              </p>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Due or overdue observations
              </p>
            </div>

            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </button>

        <button
          onClick={() =>
            setActivePage(
              'alert-center'
            )
          }
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left hover:border-cyan-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Alert Queue
              </p>

              <p className="text-lg font-black text-slate-900 mt-1">
                {activeAlerts.length}
              </p>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Active telemetry alerts
              </p>
            </div>

            <Activity className="w-5 h-5 text-rose-500" />
          </div>
        </button>

        <button
          onClick={() =>
            setActivePage('reports')
          }
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-left hover:border-cyan-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Clinical Reporting
              </p>

              <p className="text-sm font-black text-slate-900 mt-1">
                Review Reports
              </p>

              <p className="text-[10px] text-slate-500 mt-0.5">
                Vitals, alerts and handover summaries
              </p>
            </div>

            <CheckCircle2 className="w-5 h-5 text-cyan-600" />
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default DoctorDashboard;