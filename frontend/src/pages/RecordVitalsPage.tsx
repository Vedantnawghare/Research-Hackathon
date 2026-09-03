import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { VoiceVitalsAssistant, ParsedVitals } from '../components/common/VoiceVitalsAssistant';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  ArrowLeft,
  Heart,
  Droplets,
  Wind,
  Thermometer,
} from 'lucide-react';

type ValidationResult = {
  status: 'CRITICAL' | 'WARNING' | 'NORMAL';
  text: string;
  color: string;
};

type VitalsForm = {
  heartRate: number;
  systolic: number;
  diastolic: number;
  temperature: number;
  respiratoryRate: number;
  spo2: number;
  glucose: number;
  urineOutput: number;
  notes: string;
};

export const RecordVitalsPage: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    addVitalRecord,
    setActivePage,
  } = useApp();

  const patient =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  const [form, setForm] = useState<VitalsForm>({
    heartRate: patient?.latestVitals?.heartRate || 75,
    systolic: patient?.latestVitals?.systolic || 120,
    diastolic: patient?.latestVitals?.diastolic || 80,
    temperature: patient?.latestVitals?.temperature || 36.8,
    respiratoryRate: patient?.latestVitals?.respiratoryRate || 16,
    spo2: patient?.latestVitals?.spo2 || 98,
    glucose: 140,
    urineOutput: 35,
    notes: 'Bedside observation recorded. Patient comfortable.',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync form when selected patient changes
  React.useEffect(() => {
    if (patient && patient.latestVitals) {
      setForm({
        heartRate: patient.latestVitals.heartRate || 75,
        systolic: patient.latestVitals.systolic || 120,
        diastolic: patient.latestVitals.diastolic || 80,
        temperature: patient.latestVitals.temperature || 36.8,
        respiratoryRate: patient.latestVitals.respiratoryRate || 16,
        spo2: patient.latestVitals.spo2 || 98,
        glucose: 140,
        urineOutput: 35,
        notes: 'Bedside observation recorded. Patient comfortable.',
      });
    }
  }, [patient?.id]);

  const handleVoiceParsed = (parsed: ParsedVitals, transcriptText: string) => {
    setForm((prev) => ({
      ...prev,
      ...(parsed.heartRate !== undefined ? { heartRate: parsed.heartRate } : {}),
      ...(parsed.systolic !== undefined ? { systolic: parsed.systolic } : {}),
      ...(parsed.diastolic !== undefined ? { diastolic: parsed.diastolic } : {}),
      ...(parsed.spo2 !== undefined ? { spo2: parsed.spo2 } : {}),
      ...(parsed.glucose !== undefined ? { glucose: parsed.glucose } : {}),
      ...(parsed.temperature !== undefined ? { temperature: parsed.temperature } : {}),
      ...(parsed.respiratoryRate !== undefined ? { respiratoryRate: parsed.respiratoryRate } : {}),
      ...(parsed.urineOutput !== undefined ? { urineOutput: parsed.urineOutput } : {}),
      notes: `Voice Dictated Observation: "${transcriptText}"`
    }));
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const getValidation = (
    param: keyof Pick<
      VitalsForm,
      'heartRate' | 'spo2' | 'systolic' | 'temperature'
    >,
    value: number
  ): ValidationResult => {
    switch (param) {
      case 'heartRate':
        if (value > 120 || value < 50) {
          return {
            status: 'CRITICAL',
            text: 'Critical Tachy/Bradycardia',
            color:
              'text-rose-600 border-rose-300 bg-rose-50',
          };
        }

        if (value > 100 || value < 60) {
          return {
            status: 'WARNING',
            text: 'Elevated Heart Rate',
            color:
              'text-amber-700 border-amber-300 bg-amber-50',
          };
        }

        return {
          status: 'NORMAL',
          text: 'Normal Range (60-100)',
          color:
            'text-emerald-700 border-emerald-200 bg-emerald-50',
        };

      case 'spo2':
        if (value < 90) {
          return {
            status: 'CRITICAL',
            text: 'Critical Desaturation (<90%)',
            color:
              'text-rose-600 border-rose-300 bg-rose-50',
          };
        }

        if (value < 94) {
          return {
            status: 'WARNING',
            text: 'Low SpO2 (90-93%)',
            color:
              'text-amber-700 border-amber-300 bg-amber-50',
          };
        }

        return {
          status: 'NORMAL',
          text: 'Normal Range (94-100%)',
          color:
            'text-emerald-700 border-emerald-200 bg-emerald-50',
        };

      case 'systolic':
        if (value < 90 || value > 160) {
          return {
            status: 'CRITICAL',
            text: 'Critical Blood Pressure',
            color:
              'text-rose-600 border-rose-300 bg-rose-50',
          };
        }

        if (value > 140 || value < 100) {
          return {
            status: 'WARNING',
            text: 'Elevated Systolic BP',
            color:
              'text-amber-700 border-amber-300 bg-amber-50',
          };
        }

        return {
          status: 'NORMAL',
          text: 'Normal Range (90-140)',
          color:
            'text-emerald-700 border-emerald-200 bg-emerald-50',
        };

      case 'temperature':
        if (value >= 39.0) {
          return {
            status: 'CRITICAL',
            text: 'High Fever (≥39°C)',
            color:
              'text-rose-600 border-rose-300 bg-rose-50',
          };
        }

        if (value >= 38.0) {
          return {
            status: 'WARNING',
            text: 'Fever (38-38.9°C)',
            color:
              'text-amber-700 border-amber-300 bg-amber-50',
          };
        }

        return {
          status: 'NORMAL',
          text: 'Normal Temp (36.5-37.5)',
          color:
            'text-emerald-700 border-emerald-200 bg-emerald-50',
        };

      default:
        return {
          status: 'NORMAL',
          text: 'Normal Range',
          color:
            'text-emerald-700 border-emerald-200 bg-emerald-50',
        };
    }
  };

  const validationSummary = useMemo(() => {
    const values = [
      getValidation('heartRate', form.heartRate),
      getValidation('spo2', form.spo2),
      getValidation('systolic', form.systolic),
      getValidation('temperature', form.temperature),
    ];

    if (values.some((item) => item.status === 'CRITICAL')) {
      return {
        status: 'CRITICAL' as const,
        text: 'Critical values detected — verify before saving.',
      };
    }

    if (values.some((item) => item.status === 'WARNING')) {
      return {
        status: 'WARNING' as const,
        text: 'Abnormal values detected — review before saving.',
      };
    }

    return {
      status: 'NORMAL' as const,
      text: 'All entered parameters are within the displayed reference range.',
    };
  }, [form]);

  /* =========================================================
     FORM HELPERS
  ========================================================= */

  const updateField = <K extends keyof VitalsForm>(
    field: K,
    value: VitalsForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validateForm = (): string | null => {
    if (!patient) {
      return 'No patient is selected.';
    }

    const requiredNumericFields: Array<
      [keyof VitalsForm, number, string]
    > = [
      ['heartRate', form.heartRate, 'Heart rate'],
      ['systolic', form.systolic, 'Systolic blood pressure'],
      ['diastolic', form.diastolic, 'Diastolic blood pressure'],
      ['temperature', form.temperature, 'Temperature'],
      ['respiratoryRate', form.respiratoryRate, 'Respiratory rate'],
      ['spo2', form.spo2, 'SpO2'],
      ['glucose', form.glucose, 'Blood glucose'],
      ['urineOutput', form.urineOutput, 'Urine output'],
    ];

    for (const [, value, label] of requiredNumericFields) {
      if (!Number.isFinite(value)) {
        return `${label} must be a valid number.`;
      }
    }

    if (form.heartRate <= 0) {
      return 'Heart rate must be greater than 0.';
    }

    if (form.systolic <= 0 || form.diastolic <= 0) {
      return 'Blood pressure values must be greater than 0.';
    }

    if (form.temperature <= 0) {
      return 'Temperature must be a valid positive value.';
    }

    if (form.respiratoryRate <= 0) {
      return 'Respiratory rate must be greater than 0.';
    }

    if (form.spo2 <= 0 || form.spo2 > 100) {
      return 'SpO2 must be between 1 and 100%.';
    }

    if (form.glucose < 0) {
      return 'Blood glucose cannot be negative.';
    }

    if (form.urineOutput < 0) {
      return 'Urine output cannot be negative.';
    }

    return null;
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving || !patient) {
      return;
    }

    setErrorMessage('');
    setSaveSuccess(false);

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsSaving(true);

      await addVitalRecord(patient.id, {
        heartRate: form.heartRate,
        systolic: form.systolic,
        diastolic: form.diastolic,
        temperature: form.temperature,
        respiratoryRate: form.respiratoryRate,
        spo2: form.spo2,
        glucose: form.glucose,
        urineOutput: form.urineOutput,
        notes: form.notes.trim(),
      });

      setSaveSuccess(true);

      window.setTimeout(() => {
        setActivePage('patient-profile');
      }, 1200);
    } catch (error) {
      console.error('Failed to save bedside observation:', error);

      setErrorMessage(
        'Unable to save the observation. Please check the backend connection and try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />

          <h2 className="text-lg font-black text-slate-900">
            No Patient Selected
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Select a patient before recording bedside observations.
          </p>

          <button
            type="button"
            onClick={() => setActivePage('patients')}
            className="mt-5 px-5 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold"
          >
            Open Patients
          </button>
        </div>
      </div>
    );
  }

  const lastVitals = patient.latestVitals;

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================
         TOP PATIENT BANNER
      ===================================================== */}

      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-600 text-white font-extrabold text-xs">
              Bedside Observation Entry
            </span>

            <span className="text-xs text-slate-400 font-semibold">
              • {new Date().toLocaleTimeString()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <h1 className="text-2xl font-black">{patient.name}</h1>

            <span className="px-2.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold text-xs">
              {patient.bed} ({patient.ward})
            </span>

            <StatusBadge
              status={patient.status}
              size="sm"
            />
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Diagnosis: {patient.primaryDiagnosis} • Doctor:{' '}
            {patient.assignedDoctor}
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">
            Switch Patient:
          </span>

          <select
            value={patient.id}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 text-xs font-bold text-cyan-300 border border-slate-700 focus:outline-none focus:border-cyan-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.bed} - {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================================
         SUCCESS
      ===================================================== */}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />

          <div>
            <p>Observation saved successfully.</p>
            <p className="text-[11px] font-medium mt-0.5 text-emerald-700">
              Clinical priority and active alerts have been recalculated.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
         ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 font-bold text-xs flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />

          <div>
            <p className="font-extrabold">Unable to save observation</p>
            <p className="font-medium mt-0.5">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
         LIVE STATUS
      ===================================================== */}

      <div
        className={`rounded-2xl border p-4 flex items-center gap-3 ${
          validationSummary.status === 'CRITICAL'
            ? 'bg-rose-50 border-rose-200'
            : validationSummary.status === 'WARNING'
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        {validationSummary.status === 'CRITICAL' ? (
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        ) : validationSummary.status === 'WARNING' ? (
          <Clock className="w-5 h-5 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        )}

        <div>
          <p
            className={`text-xs font-extrabold ${
              validationSummary.status === 'CRITICAL'
                ? 'text-rose-700'
                : validationSummary.status === 'WARNING'
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            Live Parameter Assessment
          </p>

          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
            {validationSummary.text}
          </p>
        </div>
      </div>

      {/* =====================================================
         MAIN GRID
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===================================================
           FORM & VOICE ASSISTANT
        =================================================== */}

        <div className="lg:col-span-2 space-y-6">
          <VoiceVitalsAssistant onVitalsParsed={handleVoiceParsed} />

          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6"
          >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-700" />
              Clinical Observation Parameters
            </h3>

            <span className="text-[10px] text-slate-400 font-bold uppercase">
              All values in current observation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Heart Rate */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 uppercase">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Heart Rate (bpm)
              </label>

              <input
                type="number"
                min="1"
                required
                value={form.heartRate}
                onChange={(e) =>
                  updateField(
                    'heartRate',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              {(() => {
                const value = getValidation(
                  'heartRate',
                  form.heartRate
                );

                return (
                  <p
                    className={`text-[11px] font-bold px-2 py-1 rounded border mt-1 ${value.color}`}
                  >
                    {value.text}
                  </p>
                );
              })()}
            </div>

            {/* SpO2 */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 uppercase">
                <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                Oxygen Saturation (SpO2 %)
              </label>

              <input
                type="number"
                min="1"
                max="100"
                required
                value={form.spo2}
                onChange={(e) =>
                  updateField(
                    'spo2',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              {(() => {
                const value = getValidation(
                  'spo2',
                  form.spo2
                );

                return (
                  <p
                    className={`text-[11px] font-bold px-2 py-1 rounded border mt-1 ${value.color}`}
                  >
                    {value.text}
                  </p>
                );
              })()}
            </div>

            {/* Systolic */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-slate-700 uppercase">
                Systolic BP (mmHg)
              </label>

              <input
                type="number"
                min="1"
                required
                value={form.systolic}
                onChange={(e) =>
                  updateField(
                    'systolic',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              {(() => {
                const value = getValidation(
                  'systolic',
                  form.systolic
                );

                return (
                  <p
                    className={`text-[11px] font-bold px-2 py-1 rounded border mt-1 ${value.color}`}
                  >
                    {value.text}
                  </p>
                );
              })()}
            </div>

            {/* Diastolic */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-slate-700 uppercase">
                Diastolic BP (mmHg)
              </label>

              <input
                type="number"
                min="1"
                required
                value={form.diastolic}
                onChange={(e) =>
                  updateField(
                    'diastolic',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Reference Range: 60 - 80 mmHg
              </p>
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 uppercase">
                <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                Body Temp (°C)
              </label>

              <input
                type="number"
                min="1"
                step="0.1"
                required
                value={form.temperature}
                onChange={(e) =>
                  updateField(
                    'temperature',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              {(() => {
                const value = getValidation(
                  'temperature',
                  form.temperature
                );

                return (
                  <p
                    className={`text-[11px] font-bold px-2 py-1 rounded border mt-1 ${value.color}`}
                  >
                    {value.text}
                  </p>
                );
              })()}
            </div>

            {/* Respiratory Rate */}
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 uppercase">
                <Wind className="w-3.5 h-3.5 text-sky-600" />
                Resp Rate (/min)
              </label>

              <input
                type="number"
                min="1"
                required
                value={form.respiratoryRate}
                onChange={(e) =>
                  updateField(
                    'respiratoryRate',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Reference Range: 12 - 20 breaths/min
              </p>
            </div>

            {/* Glucose */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-slate-700 uppercase">
                Blood Glucose (mg/dL)
              </label>

              <input
                type="number"
                min="0"
                required
                value={form.glucose}
                onChange={(e) =>
                  updateField(
                    'glucose',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Urine */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-slate-700 uppercase">
                Urine Output (mL/h)
              </label>

              <input
                type="number"
                min="0"
                required
                value={form.urineOutput}
                onChange={(e) =>
                  updateField(
                    'urineOutput',
                    Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 font-bold text-base border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* =================================================
             NOTES
          ================================================= */}

          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase mb-1">
              Nurse Observation Notes
            </label>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) =>
                updateField('notes', e.target.value)
              }
              placeholder="Enter relevant bedside observations..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-xs font-medium text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none resize-none"
            />

            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              Keep notes concise and clinically relevant.
            </p>
          </div>

          {/* =================================================
             ACTIONS
          ================================================= */}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActivePage('patient-profile')}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-800 hover:to-blue-800 text-white font-extrabold text-xs shadow-lg shadow-cyan-900/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Clock className="w-4 h-4 animate-pulse" />
                  Saving Observation...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Bedside Observation
                </>
              )}
            </button>
          </div>
        </form>
      </div>

        {/* ===================================================
           RIGHT SIDEBAR
        =================================================== */}

        <div className="space-y-6">
          {/* Previous Observation */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
              Previous Observation Reference
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Last Recorded
                </span>

                <p className="font-extrabold text-slate-900 mt-1">
                  {patient.lastObservationTime ||
                    'No previous observation'}
                </p>

                {lastVitals ? (
                  <div className="mt-3 space-y-2 text-slate-700 font-semibold">
                    <p>
                      • HR:{' '}
                      <strong className="text-slate-900">
                        {lastVitals.heartRate} bpm
                      </strong>
                    </p>

                    <p>
                      • SpO2:{' '}
                      <strong className="text-slate-900">
                        {lastVitals.spo2}%
                      </strong>
                    </p>

                    <p>
                      • BP:{' '}
                      <strong className="text-slate-900">
                        {lastVitals.systolic}/
                        {lastVitals.diastolic} mmHg
                      </strong>
                    </p>

                    <p>
                      • Temp:{' '}
                      <strong className="text-slate-900">
                        {lastVitals.temperature}°C
                      </strong>
                    </p>

                    <p>
                      • RR:{' '}
                      <strong className="text-slate-900">
                        {lastVitals.respiratoryRate}/min
                      </strong>
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-[11px] text-slate-500 font-medium">
                    No previous vital record is available for this patient.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Current Entry Snapshot */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
              Current Entry Snapshot
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  HR
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">
                  {form.heartRate}
                  <span className="text-[10px] text-slate-500 ml-1">
                    bpm
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  SpO2
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">
                  {form.spo2}
                  <span className="text-[10px] text-slate-500 ml-1">
                    %
                  </span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  BP
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">
                  {form.systolic}/{form.diastolic}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  Temp
                </span>
                <p className="text-sm font-black text-slate-900 mt-1">
                  {form.temperature}°C
                </p>
              </div>
            </div>
          </div>

          {/* Backend Flow */}
          <div className="bg-slate-900 p-5 rounded-2xl shadow-sm text-white">
            <p className="text-[10px] text-cyan-300 font-extrabold uppercase tracking-wider">
              Clinical Workflow
            </p>

            <div className="mt-3 space-y-2 text-[11px] text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Validate observation
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Persist to clinical record
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Evaluate monitoring thresholds
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                Refresh patient status & alerts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};