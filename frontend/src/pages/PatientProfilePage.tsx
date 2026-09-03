import React, { useEffect, useState } from 'react';

import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';

import { StatusBadge } from '../components/common/StatusBadge';
import { VitalCard } from '../components/common/VitalCard';
import { VitalTrendChart } from '../components/charts/VitalTrendChart';
import { ClinicalTimeline } from '../components/timeline/ClinicalTimeline';
import { DigitalICUChart } from '../components/charts/DigitalICUChart';
import { Body3DVisualization } from '../components/icu/Body3DVisualization';
import { QRCodePatientId } from '../components/common/QRCodePatientId';

import {
  Heart,
  Droplets,
  Wind,
  Thermometer,
  Activity,
  Sliders,
  AlertTriangle,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';

import {
  MonitoringPlan,
  VitalRecord,
} from '../types';


type TabKey =
  | 'overview'
  | 'trends'
  | 'history'
  | 'alerts'
  | 'timeline'
  | 'plan';


export const PatientProfilePage: React.FC = () => {

  const {
    role,
    patients,
    selectedPatientId,
    setActivePage,
    navigateToRecordVitals,
    alerts,
    acknowledgeAlert,
    updatePatientDiagnosis,
  } = useApp();

  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [diagnosisInputValue, setDiagnosisInputValue] = useState('');
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);


  const [
    activeTab,
    setActiveTab,
  ] = useState<TabKey>('overview');


  const [
    monitoringPlans,
    setMonitoringPlans,
  ] = useState<MonitoringPlan[]>([]);


  const [
    plansLoading,
    setPlansLoading,
  ] = useState<boolean>(false);


  const [
    planError,
    setPlanError,
  ] = useState<string>('');


  const patient =
    patients.find(
      (p) =>
        p.id === selectedPatientId
    ) || patients[0];


  /*
   * Guard against empty patient state.
   */
  if (!patient) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700">
            No patient selected
          </p>

          <button
            type="button"
            onClick={() =>
              setActivePage('patients')
            }
            className="mt-4 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800"
          >
            Back to Patient Directory
          </button>
        </div>
      </div>
    );
  }


  const [liveVitals, setLiveVitals] = useState<VitalRecord>(patient.latestVitals);

  useEffect(() => {
    setLiveVitals(patient.latestVitals);
  }, [patient.id, patient.latestVitals]);

  const handleVitalsChange = (updated: Partial<VitalRecord>) => {
    setLiveVitals((prev: VitalRecord) => ({ ...prev, ...updated }));
  };

  const v = liveVitals;


  const patientAlerts =
    alerts.filter(
      (alert) =>
        String(alert.patientId) === String(patient.id) &&
        alert.status !== 'RESOLVED'
    );


  /*
   * Load monitoring plans from backend.
   *
   * IMPORTANT:
   * apiService.getMonitoringPlans()
   * already returns frontend MonitoringPlan[].
   */
  const loadMonitoringPlans =
    async (): Promise<void> => {

      try {

        setPlansLoading(true);
        setPlanError('');

        const plans =
          await apiService.getMonitoringPlans(
            patient.id
          );

        setMonitoringPlans(plans);

      } catch (error) {

        console.error(
          'Failed to load monitoring plans:',
          error
        );

        setPlanError(
          'Unable to load monitoring plans.'
        );

        setMonitoringPlans([]);

      } finally {

        setPlansLoading(false);

      }
    };


  useEffect(() => {

    void loadMonitoringPlans();

  }, [patient.id]);


  const handleDeletePlan =
    async (
      planId: string
    ): Promise<void> => {

      try {

        await apiService.deleteMonitoringPlan(
          planId
        );

        await loadMonitoringPlans();

      } catch (error) {

        console.error(
          'Failed to delete monitoring plan:',
          error
        );

        setPlanError(
          'Unable to delete monitoring plan.'
        );

      }
    };


  const getFrequencyLabel =
    (
      minutes: number
    ): string => {

      if (minutes <= 15) {
        return 'Every 15 mins';
      }

      if (minutes <= 30) {
        return 'Every 30 mins';
      }

      if (minutes <= 60) {
        return 'Hourly';
      }

      return `Every ${Math.round(
        minutes / 60
      )} hours`;
    };


  const formatVitalName =
    (
      vitalName: string
    ): string => {

      switch (vitalName) {

        case 'heart_rate':
          return 'Heart Rate';

        case 'systolic_bp':
          return 'Blood Pressure';

        case 'spo2':
          return 'Oxygen Saturation';

        case 'temperature':
          return 'Body Temperature';

        case 'respiratory_rate':
          return 'Respiratory Rate';

        case 'blood_glucose':
          return 'Blood Glucose';

        case 'urine_output':
          return 'Urine Output';

        default:
          return vitalName
            .replace(/_/g, ' ')
            .replace(
              /\b\w/g,
              (char) =>
                char.toUpperCase()
            );

      }
    };


  return (
    <div className="space-y-6 pb-12">

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        type="button"
        onClick={() =>
          setActivePage('patients')
        }
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Patient Directory
      </button>


      {/* =====================================================
          PATIENT HEADER
      ===================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 text-white shadow-xl">

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

          <div className="flex items-start gap-4">

            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-2xl font-black text-white shadow-lg">
              {patient.name.charAt(0)}
            </div>


            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-black tracking-tight">
                  {patient.name}
                </h1>

                <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-extrabold text-cyan-300">
                  {patient.id}
                </span>

                <StatusBadge
                  status={patient.status}
                  size="md"
                />

              </div>


              <p className="mt-1 text-xs font-medium text-slate-300">
                {patient.age} y/o{' '}
                {patient.gender}
                {' • '}
                Admitted:{' '}
                <strong className="text-slate-100">
                  {patient.admissionDate}
                </strong>
              </p>


              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">

                <span>
                  <span className="text-slate-400">
                    Ward:
                  </span>{' '}
                  <strong className="text-white">
                    {patient.ward}
                  </strong>
                </span>


                <span>
                  <span className="text-slate-400">
                    Bed:
                  </span>{' '}
                  <strong className="font-black text-cyan-400">
                    {patient.bed}
                  </strong>
                </span>


                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5 text-cyan-400" />

                  <span className="text-slate-400">
                    Care Team:
                  </span>{' '}

                  <strong className="text-white">
                    {patient.assignedDoctor} (Primary) • Dr. Rajesh Kumar (Consulting)
                  </strong>
                </span>

              </div>

            </div>

          </div>


          <div className="flex flex-wrap items-center gap-4">
            <QRCodePatientId patient={patient} size={95} />

            <button
              type="button"
              onClick={() =>
                navigateToRecordVitals(
                  patient.id
                )
              }
              className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg transition-all hover:bg-cyan-500"
            >
              <Activity className="h-4 w-4" />
              Bedside Record Vitals
            </button>


            <button
              type="button"
              onClick={() =>
                setActivePage(
                  'monitoring-plan'
                )
              }
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700"
            >
              <Sliders className="h-4 w-4" />
              Edit Monitoring Plan
            </button>

          </div>

        </div>


        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-300">

          <div className="w-full">
            <div className="flex items-center justify-between gap-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Primary Diagnosis
              </span>

              {role === 'DOCTOR' && !isEditingDiagnosis && (
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosisInputValue(patient.primaryDiagnosis || '');
                    setIsEditingDiagnosis(true);
                  }}
                  className="flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="h-3 w-3" />
                  Edit Diagnosis
                </button>
              )}
            </div>

            {isEditingDiagnosis ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={diagnosisInputValue}
                  onChange={(e) => setDiagnosisInputValue(e.target.value)}
                  placeholder="Enter clinical diagnosis..."
                  className="w-full rounded-lg border border-cyan-500 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={savingDiagnosis}
                  onClick={async () => {
                    if (!diagnosisInputValue.trim()) return;
                    try {
                      setSavingDiagnosis(true);
                      await updatePatientDiagnosis(patient.id, diagnosisInputValue.trim());
                      setIsEditingDiagnosis(false);
                    } catch (err) {
                      console.error('Failed to save diagnosis:', err);
                    } finally {
                      setSavingDiagnosis(false);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {savingDiagnosis ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingDiagnosis(false)}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <span className="text-sm font-bold text-white mt-1 block">
                {patient.primaryDiagnosis || 'Clinical diagnosis not recorded'}
              </span>
            )}
          </div>

        </div>

      </div>


      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="flex items-center gap-2 overflow-x-auto rounded-xl border-b border-slate-200 bg-white px-4 shadow-xs">

        {[
          {
            id: 'overview',
            label: '1. Clinical Overview',
          },
          {
            id: 'trends',
            label: '2. Vital Trends',
          },
          {
            id: 'history',
            label: '3. Observation History',
          },
          {
            id: 'alerts',
            label: `4. Alerts (${patientAlerts.length})`,
          },
          {
            id: 'timeline',
            label: '5. Timeline',
          },
          {
            id: 'plan',
            label: '6. Monitoring Plan',
          },
        ].map((tab) => (

          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveTab(
                tab.id as TabKey
              )
            }
            className={`whitespace-nowrap border-b-2 px-4 py-3.5 text-xs font-extrabold transition-all ${
              activeTab === tab.id
                ? 'border-cyan-700 bg-cyan-50/50 text-cyan-800'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>

        ))}

      </div>


      {/* =====================================================
          OVERVIEW
      ===================================================== */}

      {activeTab === 'overview' && (

        <div className="space-y-6">

          {/* 3D BIO-TELEMETRY HOLOGRAM CANAL & ORGAN HOTSPOTS */}
          <Body3DVisualization
            patientName={patient.name}
            patientStatus={patient.status}
            vitals={v}
            onVitalsChange={handleVitalsChange}
          />

          <div className="space-y-3">

            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
              Latest Bedside Vital Signs
            </h3>


            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <VitalCard
                label="Heart Rate"
                value={v.heartRate}
                unit="bpm"
                normalRange="60 - 100 bpm"
                status={
                  v.heartRate >= 130 || v.heartRate <= 50
                    ? 'CRITICAL'
                    : v.heartRate > 100 || v.heartRate < 60
                      ? 'WARNING'
                      : 'NORMAL'
                }
                trend={v.heartRate > 100 ? 'UP' : 'STABLE'}
                icon={Heart}
                lastUpdated={
                  patient.lastObservationTime
                }
              />


              <VitalCard
                label="Oxygen Saturation (SpO2)"
                value={v.spo2}
                unit="%"
                normalRange="95 - 100%"
                status={
                  v.spo2 <= 90
                    ? 'CRITICAL'
                    : v.spo2 < 95
                      ? 'WARNING'
                      : 'NORMAL'
                }
                trend={
                  v.spo2 < 94
                    ? 'DOWN'
                    : 'STABLE'
                }
                icon={Droplets}
                lastUpdated={
                  patient.lastObservationTime
                }
              />


              <VitalCard
                label="Blood Pressure"
                value={`${v.systolic}/${v.diastolic}`}
                unit="mmHg"
                normalRange="120/80 mmHg"
                status={
                  v.systolic >= 160 || v.diastolic >= 100
                    ? 'CRITICAL'
                    : v.systolic >= 140 || v.diastolic >= 90 || v.systolic < 90
                      ? 'WARNING'
                      : 'NORMAL'
                }
                trend={v.systolic >= 140 ? 'UP' : 'STABLE'}
                icon={Wind}
                lastUpdated={
                  patient.lastObservationTime
                }
              />


              <VitalCard
                label="Body Temperature"
                value={v.temperature}
                unit="°C"
                normalRange="36.5 - 37.5 °C"
                status={
                  v.temperature >= 38.5 || v.temperature <= 35.0
                    ? 'CRITICAL'
                    : v.temperature > 37.5 || v.temperature < 36.0
                      ? 'WARNING'
                      : 'NORMAL'
                }
                trend={v.temperature > 37.5 ? 'UP' : 'STABLE'}
                icon={Thermometer}
                lastUpdated={
                  patient.lastObservationTime
                }
              />

            </div>

          </div>


          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* ALERTS */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Active Clinical Alerts
              </h3>


              {patientAlerts.length === 0 ? (

                <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
                  No active alerts recorded for this patient.
                </div>

              ) : (

                <div className="space-y-3">

                  {patientAlerts.map(
                    (alert) => (

                      <div
                        key={alert.id}
                        className="rounded-xl border border-rose-200 bg-rose-50/50 p-4"
                      >

                        <div className="flex items-center justify-between">

                          <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                            {alert.severity}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-500">
                            {alert.timestamp}
                          </span>

                        </div>


                        <p className="mt-2 text-xs font-bold text-rose-900">
                          {alert.parameter}:{' '}
                          {alert.currentValue}
                        </p>


                        <p className="mt-0.5 text-[11px] text-slate-600">
                          {alert.thresholdExceeded}
                        </p>


                        {alert.status ===
                          'ACTIVE' && (

                          <button
                            type="button"
                            onClick={() =>
                              acknowledgeAlert(
                                alert.id
                              )
                            }
                            className="mt-3 rounded bg-cyan-700 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-800"
                          >
                            Acknowledge Alert
                          </button>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            {/* SUMMARY */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

              <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
                <Stethoscope className="h-5 w-5 text-cyan-600" />
                Clinical Assessment Summary
              </h3>


              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">

                <p>
                  <strong>
                    Current Status:
                  </strong>{' '}
                  Patient currently categorized as{' '}
                  <strong>
                    {patient.status}
                  </strong>{' '}
                  based on latest recorded observations.
                </p>


                <p>
                  <strong>
                    Latest Vitals:
                  </strong>{' '}
                  HR {v.heartRate} bpm,
                  BP {v.systolic}/
                  {v.diastolic} mmHg,
                  SpO2 {v.spo2}%,
                  Temperature{' '}
                  {v.temperature}°C.
                </p>


                <p className="border-t border-slate-200 pt-2 text-[11px] font-bold text-slate-500">
                  Last Observation:{' '}
                  {patient.lastObservationTime}
                </p>

              </div>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          TRENDS
      ===================================================== */}

      {activeTab === 'trends' && (

        <div className="space-y-6">

          <VitalTrendChart
            patientId={patient.id}
          />

          <DigitalICUChart
            patient={patient}
          />

        </div>

      )}


      {/* =====================================================
          HISTORY
      ===================================================== */}

      {activeTab === 'history' && (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="mb-4 text-base font-bold text-slate-900">
            Observation History Records
          </h3>


          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left text-xs">

              <thead>

                <tr className="bg-slate-900 font-bold text-white">

                  <th className="p-3">
                    Timestamp
                  </th>

                  <th className="p-3">
                    Heart Rate
                  </th>

                  <th className="p-3">
                    Blood Pressure
                  </th>

                  <th className="p-3">
                    SpO2
                  </th>

                  <th className="p-3">
                    Temp
                  </th>

                  <th className="p-3">
                    Resp Rate
                  </th>

                  <th className="p-3">
                    Recorded By
                  </th>

                  <th className="p-3">
                    Notes
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-200 font-medium">

                <tr className="bg-slate-50">

                  <td className="p-3 font-bold">
                    {v.timestamp || '--'}
                  </td>

                  <td className="p-3 font-black">
                    {v.heartRate} bpm
                  </td>

                  <td className="p-3">
                    {v.systolic}/
                    {v.diastolic} mmHg
                  </td>

                  <td className="p-3 font-black">
                    {v.spo2}%
                  </td>

                  <td className="p-3">
                    {v.temperature}°C
                  </td>

                  <td className="p-3">
                    {v.respiratoryRate}/min
                  </td>

                  <td className="p-3">
                    {v.recordedBy}
                  </td>

                  <td className="p-3 text-slate-600">
                    {v.notes || '—'}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =====================================================
          ALERTS
      ===================================================== */}

      {activeTab === 'alerts' && (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="mb-4 text-base font-bold text-slate-900">
            Patient Telemetry Alert Log
          </h3>


          {patientAlerts.length === 0 ? (

            <div className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">
              No alerts for this patient.
            </div>

          ) : (

            <div className="space-y-3">

              {patientAlerts.map(
                (alert) => (

                  <div
                    key={alert.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <div>

                      <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        {alert.severity}
                      </span>

                      <h4 className="mt-1 text-sm font-bold text-slate-900">
                        {alert.parameter} —{' '}
                        {alert.currentValue}
                      </h4>

                      <p className="text-xs text-slate-500">
                        {alert.thresholdExceeded}
                      </p>

                    </div>


                    {alert.status ===
                      'ACTIVE' && (

                      <button
                        type="button"
                        onClick={() =>
                          acknowledgeAlert(
                            alert.id
                          )
                        }
                        className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-800"
                      >
                        Acknowledge
                      </button>

                    )}

                  </div>

                )
              )}

            </div>

          )}

        </div>

      )}


      {/* =====================================================
          TIMELINE
      ===================================================== */}

      {activeTab === 'timeline' && (

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h3 className="mb-6 text-base font-bold text-slate-900">
            Clinical Event Sequence
          </h3>

          <ClinicalTimeline />

        </div>

      )}


      {/* =====================================================
          MONITORING PLAN
      ===================================================== */}

      {activeTab === 'plan' && (

        <div className="space-y-6">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <h3 className="text-base font-bold text-slate-900">
                  Active Doctor Monitoring Protocol
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Backend-persisted monitoring plans
                  for this patient.
                </p>

              </div>


              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() =>
                    void loadMonitoringPlans()
                  }
                  disabled={plansLoading}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      plansLoading
                        ? 'animate-spin'
                        : ''
                    }`}
                  />

                  Refresh
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActivePage(
                      'monitoring-plan'
                    )
                  }
                  className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-800"
                >
                  Modify Plan →
                </button>

              </div>

            </div>


            {planError && (

              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {planError}
              </div>

            )}


            {plansLoading ? (

              <div className="flex items-center justify-center py-10">

                <RefreshCw className="h-6 w-6 animate-spin text-cyan-600" />

              </div>

            ) : monitoringPlans.length === 0 ? (

              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">

                <Sliders className="mx-auto h-7 w-7 text-slate-300" />

                <p className="mt-2 text-sm font-bold text-slate-700">
                  No monitoring plans configured
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Configure a monitoring plan for
                  this patient.
                </p>

              </div>

            ) : (

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                {monitoringPlans.map(
                  (plan) => (

                    <div
                      key={plan.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <p className="text-sm font-black text-slate-900">
                            {formatVitalName(
                              plan.vitalName
                            )}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-cyan-700">
                            {getFrequencyLabel(
                              plan.frequencyMinutes
                            )}
                          </p>

                        </div>


                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-black ${
                            plan.isEnabled
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {plan.isEnabled
                            ? 'ENABLED'
                            : 'DISABLED'}
                        </span>

                      </div>


                      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">

                        <div className="rounded-lg bg-white p-2">

                          <p className="font-bold text-slate-500">
                            Warning Low
                          </p>

                          <p className="mt-0.5 font-black text-slate-900">
                            {plan.warningLow ??
                              '—'}
                          </p>

                        </div>


                        <div className="rounded-lg bg-white p-2">

                          <p className="font-bold text-slate-500">
                            Warning High
                          </p>

                          <p className="mt-0.5 font-black text-slate-900">
                            {plan.warningHigh ??
                              '—'}
                          </p>

                        </div>


                        <div className="rounded-lg bg-white p-2">

                          <p className="font-bold text-slate-500">
                            Critical Low
                          </p>

                          <p className="mt-0.5 font-black text-rose-700">
                            {plan.criticalLow ??
                              '—'}
                          </p>

                        </div>


                        <div className="rounded-lg bg-white p-2">

                          <p className="font-bold text-slate-500">
                            Critical High
                          </p>

                          <p className="mt-0.5 font-black text-rose-700">
                            {plan.criticalHigh ??
                              '—'}
                          </p>

                        </div>

                      </div>


                      <div className="mt-4 flex items-center justify-between">

                        <p className="text-[10px] text-slate-400">
                          Created:{' '}
                          {plan.createdAt
                            ? new Date(
                                plan.createdAt
                              ).toLocaleString()
                            : '—'}
                        </p>


                        <button
                          type="button"
                          onClick={() =>
                            void handleDeletePlan(
                              plan.id
                            )
                          }
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
};