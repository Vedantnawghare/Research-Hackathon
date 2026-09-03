import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useApp } from '../context/AppContext';
import { DigitalICUChart } from '../components/charts/DigitalICUChart';
import { apiService } from '../services/api';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  RefreshCw,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

type ReportType =
  | 'icu-chart'
  | 'daily-vitals'
  | 'alert-summary'
  | 'handover-summary';

type DateRange =
  | 'today'
  | '24h'
  | '7d';

const formatDateTime = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatTime = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRangeStart = (
  range: DateRange
) => {
  const now = new Date();

  if (range === '24h') {
    return new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );
  }

  if (range === '7d') {
    return new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );
  }

  // "today"
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  return start;
};

const formatFrequencyLabel = (
  range: DateRange
) => {
  switch (range) {
    case 'today':
      return 'Today';

    case '24h':
      return 'Past 24 Hours';

    case '7d':
      return 'Past 7 Days';

    default:
      return range;
  }
};

const getVitalStatus = (
  type: string,
  value: number
) => {
  switch (type) {
    case 'heart_rate':
      if (value < 50 || value > 120) return 'CRITICAL';
      if (value < 60 || value > 100) return 'WARNING';
      return 'NORMAL';

    case 'spo2':
      if (value < 90) return 'CRITICAL';
      if (value < 94) return 'WARNING';
      return 'NORMAL';

    case 'systolic_bp':
      if (value < 90 || value > 160) return 'CRITICAL';
      if (value < 100 || value > 140) return 'WARNING';
      return 'NORMAL';

    case 'temperature':
      if (value >= 39) return 'CRITICAL';
      if (value >= 38) return 'WARNING';
      return 'NORMAL';

    case 'respiratory_rate':
      if (value < 8 || value > 30) return 'CRITICAL';
      if (value < 12 || value > 20) return 'WARNING';
      return 'NORMAL';

    default:
      return 'NORMAL';
  }
};

const getStatusTextClass = (
  status: string
) => {
  switch (status) {
    case 'CRITICAL':
      return 'text-rose-700 font-black';

    case 'WARNING':
      return 'text-amber-700 font-bold';

    default:
      return 'text-slate-800';
  }
};

export const ReportsPage: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
  } = useApp();

  const [reportType, setReportType] =
    useState<ReportType>('icu-chart');

  const [dateRange, setDateRange] =
    useState<DateRange>('today');

  const [vitalsHistory, setVitalsHistory] =
    useState<any[]>([]);

  const [patientAlerts, setPatientAlerts] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const patient =
    patients.find(
      (p) => p.id === selectedPatientId
    ) || patients[0];

  /* =========================================================
     LOAD REPORT DATA
  ========================================================= */

  const loadReportData = async () => {
    if (!patient) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const [
        vitals,
        alerts,
      ] = await Promise.all([
        apiService.getPatientVitals(
          patient.id
        ),

        apiService.getAlerts(
          undefined,
          patients
        ),
      ]);

      setVitalsHistory(
        [...vitals].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() -
            new Date(a.timestamp).getTime()
        )
      );

      setPatientAlerts(
        alerts
          .filter(
            (alert) =>
              alert.patientId === patient.id
          )
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
              new Date(a.timestamp).getTime()
          )
      );
    } catch (error) {
      console.error(
        'Failed to load report data:',
        error
      );

      setErrorMessage(
        'Unable to load report data from the backend.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  /* =========================================================
     DATE FILTERING
  ========================================================= */

  const rangeStart = useMemo(
    () => getRangeStart(dateRange),
    [dateRange]
  );

  const filteredVitals = useMemo(() => {
    return vitalsHistory.filter(
      (record) =>
        new Date(record.timestamp).getTime() >=
        rangeStart.getTime()
    );
  }, [vitalsHistory, rangeStart]);

  const filteredAlerts = useMemo(() => {
    return patientAlerts.filter(
      (alert) =>
        new Date(alert.timestamp).getTime() >=
        rangeStart.getTime()
    );
  }, [patientAlerts, rangeStart]);

  /* =========================================================
     REPORT METRICS
  ========================================================= */

  const reportMetrics = useMemo(() => {
    const criticalAlerts =
      filteredAlerts.filter(
        (alert) =>
          alert.severity === 'CRITICAL'
      ).length;

    const warningAlerts =
      filteredAlerts.filter(
        (alert) =>
          alert.severity === 'WARNING'
      ).length;

    const activeAlerts =
      filteredAlerts.filter(
        (alert) =>
          alert.status === 'ACTIVE'
      ).length;

    return {
      observations: filteredVitals.length,
      alerts: filteredAlerts.length,
      criticalAlerts,
      warningAlerts,
      activeAlerts,
    };
  }, [filteredVitals, filteredAlerts]);

  /* =========================================================
     PRINT / PDF
  ========================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =========================================================
     REPORT TITLE
  ========================================================= */

  const reportTitle = useMemo(() => {
    switch (reportType) {
      case 'icu-chart':
        return 'Digital ICU Flow Sheet';

      case 'daily-vitals':
        return 'Daily Vital Report';

      case 'alert-summary':
        return 'Clinical Alert Summary';

      case 'handover-summary':
        return 'Shift Handover Summary';

      default:
        return 'Clinical Report';
    }
  }, [reportType]);

  /* =========================================================
     NO PATIENT
  ========================================================= */

  if (!patient) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md">
          <FileSpreadsheet className="w-10 h-10 text-cyan-600 mx-auto" />

          <h2 className="text-lg font-black text-slate-900 mt-3">
            No Patient Selected
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Select a patient to generate a clinical
            report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:border-0 print:shadow-none">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-cyan-700" />

            Clinical Reporting & Digital ICU Charts
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Structured physiological records, alert
            summaries, and shift-ready clinical reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReportData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />

            Refresh
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md"
          >
            <Printer className="w-4 h-4" />

            Print / Save PDF
          </button>
        </div>
      </div>

      {/* =====================================================
         ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />

          <div>
            <p className="text-xs font-extrabold">
              Report data unavailable
            </p>

            <p className="text-[11px] mt-1 font-medium">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* =====================================================
         FILTERS
      ===================================================== */}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              id: 'icu-chart',
              label: 'Digital ICU Flow Sheet',
            },
            {
              id: 'daily-vitals',
              label: 'Daily Vital Report',
            },
            {
              id: 'alert-summary',
              label: 'Alert Summary',
            },
            {
              id: 'handover-summary',
              label: 'Shift Handover Summary',
            },
          ].map((report) => (
            <button
              key={report.id}
              onClick={() =>
                setReportType(
                  report.id as ReportType
                )
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                reportType === report.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {report.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={patient.id}
            onChange={(e) =>
              setSelectedPatientId(
                e.target.value
              )
            }
            className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 focus:outline-none"
          >
            {patients.map((p) => (
              <option
                key={p.id}
                value={p.id}
              >
                {p.bed} - {p.name} (
                {p.status})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />

            <select
              value={dateRange}
              onChange={(e) =>
                setDateRange(
                  e.target.value as DateRange
                )
              }
              className="px-3 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 focus:outline-none"
            >
              <option value="today">
                Today
              </option>

              <option value="24h">
                Past 24 Hours
              </option>

              <option value="7d">
                Past 7 Days
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================
         REPORT HEADER / PRINT HEADER
      ===================================================== */}

      <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl print:bg-white print:text-black print:border print:border-slate-300 print:shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-cyan-300 print:text-slate-500">
              VitalCare AI Clinical OS
            </p>

            <h2 className="text-xl font-black mt-1">
              {reportTitle}
            </h2>

            <p className="text-xs text-slate-300 mt-2 print:text-slate-600">
              Patient: {patient.name} • ID:{' '}
              {patient.id} • Bed: {patient.bed} • Ward:{' '}
              {patient.ward}
            </p>

            <p className="text-[11px] text-slate-400 mt-1 print:text-slate-500">
              Report Range:{' '}
              {formatFrequencyLabel(dateRange)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold print:text-slate-500">
              Generated
            </p>

            <p className="text-xs font-bold mt-1">
              {new Date().toLocaleString()}
            </p>

            <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-emerald-300 print:text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Backend Record
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
         SUMMARY METRICS
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">
            Observations
          </p>

          <p className="text-2xl font-black text-slate-900 mt-1">
            {reportMetrics.observations}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400">
            Total Alerts
          </p>

          <p className="text-2xl font-black text-slate-900 mt-1">
            {reportMetrics.alerts}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-rose-500">
            Critical
          </p>

          <p className="text-2xl font-black text-rose-700 mt-1">
            {reportMetrics.criticalAlerts}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-amber-500">
            Warning
          </p>

          <p className="text-2xl font-black text-amber-700 mt-1">
            {reportMetrics.warningAlerts}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-cyan-600">
            Active
          </p>

          <p className="text-2xl font-black text-cyan-700 mt-1">
            {reportMetrics.activeAlerts}
          </p>
        </div>
      </div>

      {/* =====================================================
         ICU CHART
      ===================================================== */}

      {reportType === 'icu-chart' && (
        <div className="space-y-6">
          <DigitalICUChart
            patient={patient}
          />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-cyan-700" />

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Observation Snapshot
                </h3>

                <p className="text-[11px] text-slate-500">
                  Most recent backend-recorded observations.
                </p>
              </div>
            </div>

            {filteredVitals.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl">
                <p className="text-xs font-bold text-slate-700">
                  No observations in selected range.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-3">
                        Time
                      </th>
                      <th className="p-3">
                        HR
                      </th>
                      <th className="p-3">
                        BP
                      </th>
                      <th className="p-3">
                        SpO2
                      </th>
                      <th className="p-3">
                        Temp
                      </th>
                      <th className="p-3">
                        RR
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredVitals
                      .slice(0, 8)
                      .map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="p-3 font-bold">
                            {formatTime(
                              record.timestamp
                            )}
                          </td>

                          <td
                            className={`p-3 ${getStatusTextClass(
                              getVitalStatus(
                                'heart_rate',
                                Number(
                                  record.heartRate
                                )
                              )
                            )}`}
                          >
                            {record.heartRate}
                          </td>

                          <td
                            className={`p-3 ${getStatusTextClass(
                              getVitalStatus(
                                'systolic_bp',
                                Number(
                                  record.systolic
                                )
                              )
                            )}`}
                          >
                            {record.systolic}/
                            {record.diastolic}
                          </td>

                          <td
                            className={`p-3 ${getStatusTextClass(
                              getVitalStatus(
                                'spo2',
                                Number(
                                  record.spo2
                                )
                              )
                            )}`}
                          >
                            {record.spo2}%
                          </td>

                          <td className="p-3">
                            {record.temperature}°C
                          </td>

                          <td className="p-3">
                            {record.respiratoryRate}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
         DAILY VITAL REPORT
      ===================================================== */}

      {reportType === 'daily-vitals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Daily Vital Report
            </h3>

            <p className="text-[11px] text-slate-500 mt-1">
              Backend-recorded physiological observations for{' '}
              {formatFrequencyLabel(
                dateRange
              ).toLowerCase()}.
            </p>
          </div>

          {filteredVitals.length === 0 ? (
            <div className="p-10 text-center">
              <Clock className="w-8 h-8 text-slate-300 mx-auto" />

              <p className="text-xs font-bold text-slate-700 mt-2">
                No observations in this period
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-3">
                      Timestamp
                    </th>
                    <th className="p-3">
                      HR
                    </th>
                    <th className="p-3">
                      BP
                    </th>
                    <th className="p-3">
                      SpO2
                    </th>
                    <th className="p-3">
                      Temp
                    </th>
                    <th className="p-3">
                      RR
                    </th>
                    <th className="p-3">
                      Glucose
                    </th>
                    <th className="p-3">
                      Urine
                    </th>
                    <th className="p-3">
                      Recorded By
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredVitals.map(
                    (record) => (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="p-3 font-bold whitespace-nowrap">
                          {formatDateTime(
                            record.timestamp
                          )}
                        </td>

                        <td
                          className={`p-3 ${getStatusTextClass(
                            getVitalStatus(
                              'heart_rate',
                              Number(
                                record.heartRate
                              )
                            )
                          )}`}
                        >
                          {record.heartRate}
                        </td>

                        <td
                          className={`p-3 ${getStatusTextClass(
                            getVitalStatus(
                              'systolic_bp',
                              Number(
                                record.systolic
                              )
                            )
                          )}`}
                        >
                          {record.systolic}/
                          {record.diastolic}
                        </td>

                        <td
                          className={`p-3 ${getStatusTextClass(
                            getVitalStatus(
                              'spo2',
                              Number(
                                record.spo2
                              )
                            )
                          )}`}
                        >
                          {record.spo2}%
                        </td>

                        <td className="p-3">
                          {record.temperature}°C
                        </td>

                        <td className="p-3">
                          {record.respiratoryRate}
                          /min
                        </td>

                        <td className="p-3">
                          {record.glucose ??
                            '—'}
                        </td>

                        <td className="p-3">
                          {record.urineOutput ??
                            '—'}
                        </td>

                        <td className="p-3 font-semibold">
                          {record.recordedBy ||
                            'Clinical User'}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
         ALERT SUMMARY
      ===================================================== */}

      {reportType === 'alert-summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-rose-600" />

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Clinical Alert Summary
              </h3>

              <p className="text-[11px] text-slate-500">
                Alerts generated for this patient during
                the selected reporting period.
              </p>
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />

              <p className="text-xs font-bold text-slate-700 mt-2">
                No alerts in selected range
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(
                (alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${
                      alert.severity ===
                      'CRITICAL'
                        ? 'bg-rose-50 border-rose-200'
                        : alert.severity ===
                          'WARNING'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-black text-white ${
                              alert.severity ===
                              'CRITICAL'
                                ? 'bg-rose-600'
                                : alert.severity ===
                                  'WARNING'
                                ? 'bg-amber-500'
                                : 'bg-cyan-700'
                            }`}
                          >
                            {alert.severity}
                          </span>

                          <span className="text-[10px] font-bold text-slate-500">
                            {formatDateTime(
                              alert.timestamp
                            )}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-900 mt-2">
                          {alert.parameter}
                        </h4>

                        <p className="text-xs font-bold text-slate-700 mt-1">
                          Current Value:{' '}
                          {alert.currentValue}
                        </p>

                        <p className="text-[11px] text-slate-500 mt-1">
                          {alert.thresholdExceeded}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase">
                          {alert.status}
                        </span>

                        {alert.acknowledgedBy && (
                          <p className="text-[10px] text-slate-500 mt-2">
                            Ack by:{' '}
                            <strong>
                              {alert.acknowledgedBy}
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
         HANDOVER SUMMARY
      ===================================================== */}

      {reportType ===
        'handover-summary' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900">
              Shift Handover Summary
            </h3>

            <p className="text-[11px] text-slate-500 mt-1">
              Structured clinical snapshot prepared from
              current patient, observation, and alert data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Patient
                </span>

                <p className="text-sm font-black text-slate-900 mt-1">
                  {patient.name}
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  {patient.bed} •{' '}
                  {patient.ward}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Current Status
                </span>

                <p className="text-sm font-black text-slate-900 mt-1">
                  {patient.status}
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  Last observation:{' '}
                  {patient.lastObservationTime}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Active Alerts
                </span>

                <p className="text-2xl font-black text-rose-700 mt-1">
                  {
                    filteredAlerts.filter(
                      (a) =>
                        a.status ===
                        'ACTIVE'
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Latest Vitals */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Latest Clinical Observations
            </h3>

            {filteredVitals[0] ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    HR
                  </span>

                  <p className="text-lg font-black mt-1">
                    {filteredVitals[0].heartRate}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    BP
                  </span>

                  <p className="text-lg font-black mt-1">
                    {filteredVitals[0].systolic}/
                    {filteredVitals[0].diastolic}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    SpO2
                  </span>

                  <p className="text-lg font-black mt-1">
                    {filteredVitals[0].spo2}%
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    Temp
                  </span>

                  <p className="text-lg font-black mt-1">
                    {filteredVitals[0].temperature}
                    °C
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400">
                    RR
                  </span>

                  <p className="text-lg font-black mt-1">
                    {
                      filteredVitals[0]
                        .respiratoryRate
                    }
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3">
                No recent observations available.
              </p>
            )}
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Handover Alerts
            </h3>

            <div className="space-y-2 mt-4">
              {filteredAlerts
                .filter(
                  (alert) =>
                    alert.status !==
                    'RESOLVED'
                )
                .slice(0, 5)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {alert.parameter}
                      </p>

                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {alert.currentValue} •{' '}
                        {alert.thresholdExceeded}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-[9px] font-black text-white ${
                        alert.severity ===
                        'CRITICAL'
                          ? 'bg-rose-600'
                          : 'bg-amber-500'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                ))}

              {filteredAlerts.filter(
                (alert) =>
                  alert.status !==
                  'RESOLVED'
              ).length === 0 && (
                <div className="p-5 text-center bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />

                  <p className="text-xs font-bold text-emerald-800 mt-1">
                    No unresolved alerts for this period.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Latest Notes */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">
              Latest Nursing Notes
            </h3>

            {filteredVitals[0]?.notes ? (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-700 leading-relaxed">
                  {filteredVitals[0].notes}
                </p>

                <p className="text-[10px] text-slate-400 mt-2">
                  Recorded:{' '}
                  {formatDateTime(
                    filteredVitals[0].timestamp
                  )}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-3">
                No nursing notes available in the selected period.
              </p>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
         PRINT FOOTER
      ===================================================== */}

      <div className="hidden print:block pt-6 border-t border-slate-300">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>
            VitalCare AI Clinical OS
          </span>

          <span>
            {patient.name} •{' '}
            {patient.id}
          </span>

          <span>
            Generated{' '}
            {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};