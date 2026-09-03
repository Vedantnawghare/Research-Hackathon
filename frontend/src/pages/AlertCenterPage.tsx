import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  Bell,
  RefreshCw,
  Clock,
  UserCheck,
  Activity,
} from 'lucide-react';

type AlertTab =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESOLVED';

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

const severityClasses = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return {
        badge: 'bg-rose-600 text-white',
        card: 'bg-rose-50/50 border-rose-200',
        text: 'text-rose-800',
        icon: 'text-rose-600',
      };

    case 'WARNING':
      return {
        badge: 'bg-amber-500 text-white',
        card: 'bg-amber-50/40 border-amber-200',
        text: 'text-amber-800',
        icon: 'text-amber-600',
      };

    default:
      return {
        badge: 'bg-cyan-700 text-white',
        card: 'bg-slate-50 border-slate-200',
        text: 'text-slate-800',
        icon: 'text-cyan-600',
      };
  }
};

export const AlertCenterPage: React.FC = () => {
  const {
    alerts,
    acknowledgeAlert,
    resolveAlert,
    navigateToPatientProfile,
    refreshData,
    loading,
  } = useApp();

  const [activeTab, setActiveTab] =
    useState<AlertTab>('ACTIVE');

  const [refreshing, setRefreshing] = useState(false);

  /* =========================================================
     FILTERED ALERTS
  ========================================================= */

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => alert.status === activeTab)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [alerts, activeTab]);

  /* =========================================================
     CRITICAL ACTIVE ALERTS
  ========================================================= */

  const criticalActiveAlerts = useMemo(() => {
    return alerts
      .filter(
        (alert) =>
          alert.severity === 'CRITICAL' &&
          alert.status === 'ACTIVE'
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime()
      );
  }, [alerts]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = useMemo(
    () => ({
      ACTIVE: alerts.filter(
        (alert) => alert.status === 'ACTIVE'
      ).length,

      ACKNOWLEDGED: alerts.filter(
        (alert) =>
          alert.status === 'ACKNOWLEDGED'
      ).length,

      RESOLVED: alerts.filter(
        (alert) => alert.status === 'RESOLVED'
      ).length,
    }),
    [alerts]
  );

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (refreshing) return;

    try {
      setRefreshing(true);
      await refreshData();
    } catch (error) {
      console.error(
        'Failed to refresh alert center:',
        error
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =========================================================
     EMPTY STATE TEXT
  ========================================================= */

  const emptyStateContent = {
    ACTIVE: {
      title: 'No Active Alerts',
      text:
        'There are currently no active clinical alerts requiring action.',
    },

    ACKNOWLEDGED: {
      title: 'No Acknowledged Alerts',
      text:
        'No alerts are currently waiting in the acknowledged state.',
    },

    RESOLVED: {
      title: 'No Resolved Alerts',
      text:
        'No resolved clinical alerts are available yet.',
    },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="bg-slate-950 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-600 text-white">
              Clinical Safety Operations
            </span>

            {loading && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight mt-1 flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-rose-500" />
            Clinical Alert Management Center
          </h1>

          <p className="text-xs text-slate-300 mt-1">
            Threshold breaches, telemetry alarms, and clinical
            acknowledgment tracking.
          </p>
        </div>

        {/* Header Metrics */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900 px-4 py-3 rounded-xl border border-slate-800 min-w-[155px]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />

              <span className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">
                Active
              </span>
            </div>

            <p className="text-xl font-black text-white mt-1">
              {counts.ACTIVE}
            </p>
          </div>

          <div className="bg-rose-950/60 px-4 py-3 rounded-xl border border-rose-900/60 min-w-[155px]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />

              <span className="text-[10px] uppercase tracking-wide text-rose-300 font-bold">
                Critical
              </span>
            </div>

            <p className="text-xl font-black text-rose-300 mt-1">
              {criticalActiveAlerts.length}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* =====================================================
         CRITICAL ALERT BANNER
      ===================================================== */}

      {criticalActiveAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />

              CRITICAL ACTIVE ALARM DETECTED
            </div>

            <span className="px-2.5 py-1 rounded bg-rose-600 text-white text-[10px] font-black uppercase">
              Immediate Review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {criticalActiveAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-white border border-rose-200 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      {alert.patientName}
                    </h4>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-extrabold">
                        {alert.bed}
                      </span>

                      <span className="text-[10px] text-slate-400 font-semibold">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                    CRITICAL
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-rose-50">
                  <p className="text-xs font-black text-rose-800">
                    {alert.parameter}
                  </p>

                  <p className="text-lg font-black text-rose-700 mt-0.5">
                    {alert.currentValue}
                  </p>

                  <p className="text-[11px] text-slate-600 mt-1">
                    {alert.thresholdExceeded}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() =>
                      acknowledgeAlert(alert.id)
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-colors"
                  >
                    Acknowledge Now
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      navigateToPatientProfile(
                        alert.patientId
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    Patient →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================
         ALERT LIST
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Tabs */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                {
                  id: 'ACTIVE',
                  label: 'Active Alerts',
                },
                {
                  id: 'ACKNOWLEDGED',
                  label: 'Acknowledged',
                },
                {
                  id: 'RESOLVED',
                  label: 'Resolved',
                },
              ] as Array<{
                id: AlertTab;
                label: string;
              }>
            ).map((tab) => {
              const isActive =
                activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        <div className="p-6">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-xl">
              {activeTab === 'ACTIVE' ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              ) : (
                <Activity className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              )}

              <h4 className="text-sm font-bold text-slate-800">
                {emptyStateContent[activeTab].title}
              </h4>

              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {emptyStateContent[activeTab].text}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => {
                const styles =
                  severityClasses(alert.severity);

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border transition-all ${styles.card}`}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                      {/* Alert Information */}
                      <div className="flex items-start gap-4 min-w-0">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-black uppercase shrink-0 ${styles.badge}`}
                        >
                          {alert.severity}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">
                              {alert.patientName}
                            </h4>

                            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[10px]">
                              {alert.bed}
                            </span>

                            <span className="text-[10px] text-slate-400 font-semibold">
                              {formatDateTime(
                                alert.timestamp
                              )}
                            </span>
                          </div>

                          {/* Parameter */}
                          <p
                            className={`text-xs font-bold mt-2 ${styles.text}`}
                          >
                            {alert.parameter}:{' '}
                            <strong>
                              {alert.currentValue}
                            </strong>
                          </p>

                          {/* Threshold */}
                          <p className="text-[11px] text-slate-600 mt-1">
                            {alert.thresholdExceeded}
                          </p>

                          {/* Message */}
                          {alert.notes && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              {alert.notes}
                            </p>
                          )}

                          {/* Acknowledgment */}
                          {alert.acknowledgedBy && (
                            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-600" />

                              <span>
                                Acknowledged by{' '}
                                <strong className="text-slate-700">
                                  {alert.acknowledgedBy}
                                </strong>
                              </span>

                              {alert.acknowledgedAt && (
                                <span>
                                  •{' '}
                                  {formatDateTime(
                                    alert.acknowledgedAt
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 xl:justify-end shrink-0">
                        {alert.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() =>
                              acknowledgeAlert(
                                alert.id
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-xs transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Acknowledge
                          </button>
                        )}

                        {alert.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() =>
                              resolveAlert(
                                alert.id
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolve
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            navigateToPatientProfile(
                              alert.patientId
                            )
                          }
                          className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                        >
                          View Patient →
                        </button>
                      </div>
                    </div>

                    {/* Status Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />

                        <span className="text-[10px] text-slate-500 font-semibold">
                          Created:{' '}
                          {formatDateTime(
                            alert.timestamp
                          )}
                        </span>
                      </div>

                      <StatusBadge
                        status={
                          alert.status === 'ACTIVE'
                            ? 'CRITICAL'
                            : 'STABLE'
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};