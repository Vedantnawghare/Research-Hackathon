import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Sliders,
  Save,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';

import { useApp } from '../context/AppContext';
import { apiService } from '../services/api';
import { MonitoringPlan } from '../types';

/* =========================================================
   TYPES
========================================================= */

type FrequencyOption =
  | 'q15m'
  | 'q30m'
  | 'q1h'
  | 'q4h';

type ParameterKey =
  | 'heartRate'
  | 'bloodPressure'
  | 'spo2'
  | 'temperature'
  | 'respiratoryRate';

interface MonitoringParameter {
  enabled: boolean;
  frequency: FrequencyOption;
  warningLow: number;
  warningHigh: number;
  criticalLow: number;
  criticalHigh: number;
}

type MonitoringParams = Record<
  ParameterKey,
  MonitoringParameter
>;

/* =========================================================
   DEFAULT CONFIG
========================================================= */

const DEFAULT_PARAMS: MonitoringParams = {
  heartRate: {
    enabled: true,
    frequency: 'q15m',
    warningLow: 60,
    warningHigh: 110,
    criticalLow: 50,
    criticalHigh: 130,
  },

  bloodPressure: {
    enabled: true,
    frequency: 'q15m',
    warningLow: 95,
    warningHigh: 140,
    criticalLow: 85,
    criticalHigh: 160,
  },

  spo2: {
    enabled: true,
    frequency: 'q15m',
    warningLow: 93,
    warningHigh: 100,
    criticalLow: 90,
    criticalHigh: 100,
  },

  temperature: {
    enabled: true,
    frequency: 'q1h',
    warningLow: 36,
    warningHigh: 38,
    criticalLow: 35,
    criticalHigh: 39,
  },

  respiratoryRate: {
    enabled: true,
    frequency: 'q30m',
    warningLow: 12,
    warningHigh: 22,
    criticalLow: 10,
    criticalHigh: 26,
  },
};

/* =========================================================
   HELPERS
========================================================= */

function cloneDefaultParams(): MonitoringParams {
  return {
    heartRate: {
      ...DEFAULT_PARAMS.heartRate,
    },
    bloodPressure: {
      ...DEFAULT_PARAMS.bloodPressure,
    },
    spo2: {
      ...DEFAULT_PARAMS.spo2,
    },
    temperature: {
      ...DEFAULT_PARAMS.temperature,
    },
    respiratoryRate: {
      ...DEFAULT_PARAMS.respiratoryRate,
    },
  };
}

function frequencyToMinutes(
  frequency: FrequencyOption
): number {
  switch (frequency) {
    case 'q15m':
      return 15;

    case 'q30m':
      return 30;

    case 'q1h':
      return 60;

    case 'q4h':
      return 240;

    default:
      return 15;
  }
}

function minutesToFrequency(
  minutes: number
): FrequencyOption {
  if (minutes <= 15) {
    return 'q15m';
  }

  if (minutes <= 30) {
    return 'q30m';
  }

  if (minutes <= 60) {
    return 'q1h';
  }

  return 'q4h';
}

function formatVitalName(
  vitalName: string
): ParameterKey | null {
  switch (vitalName) {
    case 'heart_rate':
      return 'heartRate';

    case 'systolic_bp':
      return 'bloodPressure';

    case 'spo2':
      return 'spo2';

    case 'temperature':
      return 'temperature';

    case 'respiratory_rate':
      return 'respiratoryRate';

    default:
      return null;
  }
}

function getVitalLabel(
  key: ParameterKey
): string {
  switch (key) {
    case 'heartRate':
      return 'Heart Rate (bpm)';

    case 'bloodPressure':
      return 'Blood Pressure (mmHg)';

    case 'spo2':
      return 'Oxygen Saturation (SpO₂ %)';

    case 'temperature':
      return 'Body Temperature (°C)';

    case 'respiratoryRate':
      return 'Respiratory Rate (/min)';

    default:
      return key;
  }
}

function getFrequencyLabel(
  frequency: FrequencyOption
): string {
  switch (frequency) {
    case 'q15m':
      return 'Every 15 mins';

    case 'q30m':
      return 'Every 30 mins';

    case 'q1h':
      return 'Hourly';

    case 'q4h':
      return 'Every 4 hours';

    default:
      return frequency;
  }
}

function applyBackendPlans(
  plans: MonitoringPlan[]
): MonitoringParams {
  const next = cloneDefaultParams();

  plans.forEach((plan) => {
    const key = formatVitalName(
      plan.vitalName
    );

    if (!key) {
      return;
    }

    next[key] = {
      enabled: plan.isEnabled,

      frequency: minutesToFrequency(
        plan.frequencyMinutes
      ),

      warningLow:
        plan.warningLow ??
        next[key].warningLow,

      warningHigh:
        plan.warningHigh ??
        next[key].warningHigh,

      criticalLow:
        plan.criticalLow ??
        next[key].criticalLow,

      criticalHigh:
        plan.criticalHigh ??
        next[key].criticalHigh,
    };
  });

  return next;
}

/* =========================================================
   VALIDATION
========================================================= */

function validateParameter(
  label: string,
  parameter: MonitoringParameter
): string | null {
  if (!parameter.enabled) {
    return null;
  }

  const values = [
    parameter.warningLow,
    parameter.warningHigh,
    parameter.criticalLow,
    parameter.criticalHigh,
  ];

  if (
    values.some(
      (value) =>
        !Number.isFinite(value)
    )
  ) {
    return `${label}: all threshold values must be valid numbers.`;
  }

  if (
    parameter.warningLow >=
    parameter.warningHigh
  ) {
    return `${label}: Warning Low must be lower than Warning High.`;
  }

  if (
    parameter.criticalLow >=
    parameter.criticalHigh
  ) {
    return `${label}: Critical Low must be lower than Critical High.`;
  }

  if (
    parameter.criticalLow >=
    parameter.warningLow
  ) {
    return `${label}: Critical Low must be lower than Warning Low.`;
  }

  if (
    parameter.criticalHigh <=
    parameter.warningHigh
  ) {
    return `${label}: Critical High must be higher than Warning High.`;
  }

  return null;
}

/* =========================================================
   PAGE
========================================================= */

export const MonitoringPlanPage: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
  } = useApp();

  const patient =
    patients.find(
      (p) =>
        p.id === selectedPatientId
    ) || patients[0];

  const [
    params,
    setParams,
  ] = useState<MonitoringParams>(
    cloneDefaultParams()
  );

  const [
    existingPlans,
    setExistingPlans,
  ] = useState<MonitoringPlan[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  /* =========================================================
     LOAD PLANS
  ========================================================= */

  const loadPlans = async (
    patientId: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSaved(false);

      const plans =
        await apiService.getMonitoringPlans(
          patientId
        );

      setExistingPlans(plans);

      setParams(
        applyBackendPlans(plans)
      );
    } catch (loadError) {
      console.error(
        'Failed to load monitoring plans:',
        loadError
      );

      setExistingPlans([]);
      setParams(
        cloneDefaultParams()
      );

      setError(
        'Could not load the current monitoring plan.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PATIENT CHANGE
  ========================================================= */

  useEffect(() => {
    if (!patient) {
      return;
    }

    void loadPlans(patient.id);
  }, [patient?.id]);

  /* =========================================================
     UPDATE PARAMETER
  ========================================================= */

  const updateParameter = (
    key: ParameterKey,
    field: keyof MonitoringParameter,
    value:
      | boolean
      | string
      | number
  ) => {
    setParams((previous) => ({
      ...previous,

      [key]: {
        ...previous[key],
        [field]: value,
      },
    }));

    setSaved(false);
    setError(null);
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!patient) {
      setError(
        'Please select a patient first.'
      );
      return;
    }

    /* -------------------------------
       Validate all enabled parameters
    -------------------------------- */

    const validations = [
      {
        label: 'Heart Rate',
        parameter: params.heartRate,
      },
      {
        label: 'Blood Pressure',
        parameter: params.bloodPressure,
      },
      {
        label: 'SpO₂',
        parameter: params.spo2,
      },
      {
        label: 'Temperature',
        parameter: params.temperature,
      },
      {
        label: 'Respiratory Rate',
        parameter:
          params.respiratoryRate,
      },
    ];

    for (const item of validations) {
      const validationError =
        validateParameter(
          item.label,
          item.parameter
        );

      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      setSaving(true);
      setSaved(false);
      setError(null);

      /* --------------------------------
         Delete existing plans
      -------------------------------- */

      for (const plan of existingPlans) {
        await apiService.deleteMonitoringPlan(
          plan.id
        );
      }

      /* --------------------------------
         Build new plans
      -------------------------------- */

      const planRequests = [
        {
          vitalName: 'heart_rate',
          parameter: params.heartRate,
        },
        {
          vitalName: 'systolic_bp',
          parameter: params.bloodPressure,
        },
        {
          vitalName: 'spo2',
          parameter: params.spo2,
        },
        {
          vitalName: 'temperature',
          parameter: params.temperature,
        },
        {
          vitalName: 'respiratory_rate',
          parameter:
            params.respiratoryRate,
        },
      ];

      /* --------------------------------
         Recreate plans
      -------------------------------- */

      const createdPlans: MonitoringPlan[] =
        [];

      for (const item of planRequests) {
        const created =
          await apiService.createMonitoringPlan(
            {
              patientId: patient.id,

              vitalName:
                item.vitalName,

              frequencyMinutes:
                frequencyToMinutes(
                  item.parameter.frequency
                ),

              warningLow:
                item.parameter.warningLow,

              warningHigh:
                item.parameter.warningHigh,

              criticalLow:
                item.parameter.criticalLow,

              criticalHigh:
                item.parameter.criticalHigh,

              isEnabled:
                item.parameter.enabled,
            }
          );

        createdPlans.push(created);
      }

      setExistingPlans(
        createdPlans
      );

      /* --------------------------------
         Read back from backend
      -------------------------------- */

      const refreshedPlans =
        await apiService.getMonitoringPlans(
          patient.id
        );

      setExistingPlans(
        refreshedPlans
      );

      setParams(
        applyBackendPlans(
          refreshedPlans
        )
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (saveError) {
      console.error(
        'Failed to save monitoring plan:',
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save monitoring plan.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     RESET / RELOAD
  ========================================================= */

  const handleReset = async () => {
    if (!patient) {
      return;
    }

    await loadPlans(
      patient.id
    );
  };

  /* =========================================================
     COUNTS
  ========================================================= */

  const activePlanCount =
    useMemo(
      () =>
        existingPlans.filter(
          (plan) =>
            plan.isEnabled
        ).length,
      [existingPlans]
    );

  /* =========================================================
     PARAMETER ROWS
  ========================================================= */

  const parameterRows: Array<{
    key: ParameterKey;
    label: string;
  }> = [
    {
      key: 'heartRate',
      label: getVitalLabel(
        'heartRate'
      ),
    },
    {
      key: 'spo2',
      label: getVitalLabel(
        'spo2'
      ),
    },
    {
      key: 'bloodPressure',
      label: getVitalLabel(
        'bloodPressure'
      ),
    },
    {
      key: 'temperature',
      label: getVitalLabel(
        'temperature'
      ),
    },
    {
      key: 'respiratoryRate',
      label: getVitalLabel(
        'respiratoryRate'
      ),
    },
  ];

  /* =========================================================
     NO PATIENT
  ========================================================= */

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            No patient selected
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select a patient before configuring
            a monitoring plan.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-extrabold uppercase text-cyan-800">
            Intensivist Protocol Builder
          </span>

          <h1 className="mt-2 flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            <Sliders className="h-6 w-6 text-cyan-700" />

            Patient Monitoring Protocol Configurator
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Configure telemetry frequencies and
            threshold-based alert triggers for{' '}
            <strong className="text-slate-800">
              {patient.name}
            </strong>{' '}
            ({patient.bed})
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={patient.id}
            onChange={(event) =>
              setSelectedPatientId(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white outline-none"
          >
            {patients.map(
              (currentPatient) => (
                <option
                  key={
                    currentPatient.id
                  }
                  value={
                    currentPatient.id
                  }
                >
                  {currentPatient.bed} -{' '}
                  {currentPatient.name}{' '}
                  (
                  {
                    currentPatient.status
                  }
                  )
                </option>
              )
            )}
          </select>

          <button
            type="button"
            onClick={handleReset}
            disabled={
              loading || saving
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Reload
          </button>
        </div>
      </div>

      {/* =====================================================
         ERROR
      ===================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="font-bold text-sm">
              Monitoring plan error
            </p>

            <p className="mt-0.5 text-xs">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
         SUCCESS
      ===================================================== */}

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />

          Monitoring plan saved successfully
          to the backend.
        </div>
      )}

      {/* =====================================================
         SUMMARY
      ===================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Existing Plans
          </p>

          <p className="mt-1 text-2xl font-black text-slate-900">
            {existingPlans.length}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Enabled Plans
          </p>

          <p className="mt-1 text-2xl font-black text-emerald-700">
            {activePlanCount}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Patient
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-900">
            {patient.name}
          </p>

          <p className="text-[10px] text-slate-500 mt-1">
            {patient.bed} •{' '}
            {patient.status}
          </p>
        </div>
      </div>

      {/* =====================================================
         MAIN GRID
      ===================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===================================================
           BUILDER
        =================================================== */}

        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2"
        >
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Vital Parameter Threshold Limits
              & Frequencies
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Configure monitoring frequency and
              warning/critical limits for this patient.
            </p>
          </div>

          {parameterRows.map(
            (item) => {
              const parameter =
                params[item.key];

              return (
                <div
                  key={item.key}
                  className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  {/* HEADER */}
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={
                          parameter.enabled
                        }
                        onChange={(event) =>
                          updateParameter(
                            item.key,
                            'enabled',
                            event.target
                              .checked
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />

                      <span className="text-sm font-extrabold text-slate-900">
                        {item.label}
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />

                      <span className="text-xs font-semibold text-slate-500">
                        Frequency
                      </span>

                      <select
                        value={
                          parameter.frequency
                        }
                        onChange={(event) =>
                          updateParameter(
                            item.key,
                            'frequency',
                            event.target
                              .value as FrequencyOption
                          )
                        }
                        disabled={
                          !parameter.enabled
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none disabled:opacity-50"
                      >
                        <option value="q15m">
                          Every 15 mins
                        </option>

                        <option value="q30m">
                          Every 30 mins
                        </option>

                        <option value="q1h">
                          Hourly
                        </option>

                        <option value="q4h">
                          Every 4 hours
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* THRESHOLDS */}
                  <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Warning Low
                      </label>

                      <input
                        type="number"
                        step="any"
                        value={
                          parameter.warningLow
                        }
                        disabled={
                          !parameter.enabled
                        }
                        onChange={(event) =>
                          updateParameter(
                            item.key,
                            'warningLow',
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-2 text-xs font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Warning High
                      </label>

                      <input
                        type="number"
                        step="any"
                        value={
                          parameter.warningHigh
                        }
                        disabled={
                          !parameter.enabled
                        }
                        onChange={(event) =>
                          updateParameter(
                            item.key,
                            'warningHigh',
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-2 text-xs font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Critical Low
                      </label>

                      <input
                        type="number"
                        step="any"
                        value={
                          parameter.criticalLow
                        }
                        disabled={
                          !parameter.enabled
                        }
                        onChange={(event) =>
                          updateParameter(
                            item.key,
                            'criticalLow',
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-rose-300 bg-white px-2.5 py-2 text-xs font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                        Critical High
                      </label>

                      <input
                        type="number"
                        step="any"
                        value={
                          parameter.criticalHigh
                        }
                        disabled={
                          !parameter.enabled
                        }
                        onChange={(event) =>
                          updateParameter(
                            item.key,
                            'criticalHigh',
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className="w-full rounded-lg border border-rose-300 bg-white px-2.5 py-2 text-xs font-bold text-rose-700 outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              );
            }
          )}

          {/* SAVE */}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">
                Saving replaces the patient's
                current monitoring protocol.
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                Disabled parameters are stored as
                inactive monitoring plans.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                saving || loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-6 py-3 text-xs font-extrabold text-white shadow-md transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? 'Saving...'
                : 'Save Monitoring Plan'}
            </button>
          </div>
        </form>

        {/* ===================================================
           RIGHT SIDE
        =================================================== */}

        <div className="space-y-6">
          {/* =================================================
             CURRENT BACKEND PLANS
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />

              Persisted Monitoring Plans
            </h3>

            {loading ? (
              <div className="mt-5 flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : existingPlans.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <Sliders className="mx-auto h-7 w-7 text-slate-300" />

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  No saved plans
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Save the configuration to create
                  monitoring plans for this patient.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {existingPlans.map(
                  (plan) => (
                    <div
                      key={plan.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold capitalize text-slate-800">
                            {plan.vitalName.replace(
                              /_/g,
                              ' '
                            )}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-500">
                            Every{' '}
                            {
                              plan.frequencyMinutes
                            }{' '}
                            minutes
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${
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

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <span className="rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] font-semibold text-amber-700">
                          W:{' '}
                          {plan.warningLow ??
                            '—'}{' '}
                          /{' '}
                          {plan.warningHigh ??
                            '—'}
                        </span>

                        <span className="rounded-lg bg-rose-50 px-2 py-1.5 text-[10px] font-semibold text-rose-700">
                          C:{' '}
                          {plan.criticalLow ??
                            '—'}{' '}
                          /{' '}
                          {plan.criticalHigh ??
                            '—'}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* =================================================
             SCHEDULE PREVIEW
          ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold tracking-tight text-slate-900">
              <Calendar className="h-5 w-5 text-cyan-600" />

              Automated Schedule Preview
            </h3>

            <div className="space-y-2">
              {parameterRows
                .filter(
                  (item) =>
                    params[item.key]
                      .enabled
                )
                .sort(
                  (a, b) =>
                    frequencyToMinutes(
                      params[a.key]
                        .frequency
                    ) -
                    frequencyToMinutes(
                      params[b.key]
                        .frequency
                    )
                )
                .map((item) => {
                  const frequency =
                    params[item.key]
                      .frequency;

                  return (
                    <div
                      key={item.key}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {getVitalLabel(
                              item.key
                            )}
                          </p>

                          <p className="mt-1 text-[10px] text-slate-500">
                            {getFrequencyLabel(
                              frequency
                            )}
                          </p>
                        </div>

                        <span className="rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-bold text-cyan-300">
                          {frequency}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {parameterRows.filter(
                (item) =>
                  params[item.key]
                    .enabled
              ).length === 0 && (
                <div className="rounded-xl bg-slate-50 p-5 text-center">
                  <p className="text-xs font-bold text-slate-600">
                    No parameters enabled.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* =================================================
             INFO
          ================================================= */}

          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />

              <div>
                <p className="text-xs font-bold text-cyan-900">
                  Protocol behavior
                </p>

                <p className="mt-1 text-[11px] leading-5 text-cyan-800">
                  Each enabled parameter stores its
                  monitoring frequency and warning/
                  critical limits. Saving this page
                  replaces the selected patient's
                  existing configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPlanPage;