import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  FileText,
  User,
  Clock,
  Activity,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const {
    auditLogs,
    refreshData,
  } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  /*
   * =========================================================
   * ACTION OPTIONS
   * =========================================================
   */

  const actionOptions = useMemo(() => {
    const actions = auditLogs
      .map((log) => log.action)
      .filter(Boolean);

    return ['ALL', ...Array.from(new Set(actions))];
  }, [auditLogs]);

  /*
   * =========================================================
   * FILTER LOGS
   * =========================================================
   */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const matchesSearch =
        query === '' ||
        String(log.user || '')
          .toLowerCase()
          .includes(query) ||
        String(log.action || '')
          .toLowerCase()
          .includes(query) ||
        String(log.details || '')
          .toLowerCase()
          .includes(query) ||
        String(log.patientName || '')
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === 'ALL' ||
        log.role === roleFilter;

      const matchesAction =
        actionFilter === 'ALL' ||
        log.action === actionFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesAction
      );
    });
  }, [
    auditLogs,
    search,
    roleFilter,
    actionFilter,
  ]);

  /*
   * =========================================================
   * SUMMARY
   * =========================================================
   */

  const summary = useMemo(() => {
    return {
      total: auditLogs.length,

      admins: auditLogs.filter(
        (log) => log.role === 'ADMIN'
      ).length,

      doctors: auditLogs.filter(
        (log) => log.role === 'DOCTOR'
      ).length,

      nurses: auditLogs.filter(
        (log) => log.role === 'NURSE'
      ).length,
    };
  }, [auditLogs]);

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
        'Failed to refresh audit data:',
        error
      );
    } finally {
      setRefreshing(false);
    }
  };

  /*
   * =========================================================
   * CSV EXPORT
   * =========================================================
   */

  const handleExport = () => {
    if (filtered.length === 0) {
      return;
    }

    const headers = [
      'Timestamp',
      'User',
      'Role',
      'Action',
      'Patient',
      'Details',
    ];

    const rows = filtered.map((log) => [
      log.timestamp || '',
      log.user || '',
      log.role || '',
      log.action || '',
      log.patientName || 'N/A',
      log.details || '',
    ]);

    const escapeCSV = (value: string) =>
      `"${String(value)
        .replace(/"/g, '""')
        .replace(/\n/g, ' ')}"`;

    const csv = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) =>
        row.map(escapeCSV).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `vitalcare-audit-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * =========================================================
   * FORMAT TIMESTAMP
   * =========================================================
   */

  const formatTimestamp = (
    timestamp?: string
  ) => {
    if (!timestamp) return '—';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  /*
   * =========================================================
   * MAIN UI
   * =========================================================
   */

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-900 text-white">
              System Audit
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-100 text-cyan-800">
              Admin View
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-cyan-700" />

            Clinical Action Audit Logs
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Review recorded clinical and system actions
            by user, role, patient, and event type.
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
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />

            Export CSV
          </button>
        </div>
      </div>

      {/* =====================================================
         SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Total Events
            </span>

            <FileText className="w-4 h-4 text-cyan-600" />
          </div>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary.total}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Admin
            </span>

            <User className="w-4 h-4 text-slate-600" />
          </div>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary.admins}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Doctors
            </span>

            <Activity className="w-4 h-4 text-cyan-600" />
          </div>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary.doctors}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Nurses
            </span>

            <Clock className="w-4 h-4 text-emerald-600" />
          </div>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary.nurses}
          </p>
        </div>
      </div>

      {/* =====================================================
         FILTER BAR
      ===================================================== */}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search user, action, patient or details..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          {/* Role */}
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value)
            }
            className="px-3 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none"
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="ADMIN">
              Admin
            </option>

            <option value="DOCTOR">
              Doctor
            </option>

            <option value="NURSE">
              Nurse
            </option>
          </select>

          {/* Action */}
          <select
            value={actionFilter}
            onChange={(e) =>
              setActionFilter(e.target.value)
            }
            className="px-3 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none max-w-[220px]"
          >
            {actionOptions.map(
              (action) => (
                <option
                  key={action}
                  value={action}
                >
                  {action === 'ALL'
                    ? 'All Actions'
                    : action}
                </option>
              )
            )}
          </select>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-slate-500 font-semibold">
            Showing {filtered.length} of{' '}
            {auditLogs.length} events
          </p>

          {(search ||
            roleFilter !== 'ALL' ||
            actionFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setRoleFilter('ALL');
                setActionFilter('ALL');
              }}
              className="text-[10px] font-extrabold text-cyan-700 hover:text-cyan-900"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
         LOG TABLE
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">
              System Event Timeline
            </h2>

            <p className="text-[10px] text-slate-500 mt-0.5">
              Clinical actions recorded by the application.
            </p>
          </div>

          <span className="text-[10px] font-black uppercase text-slate-400">
            {filtered.length} Records
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />

            <h3 className="text-sm font-black text-slate-800 mt-3">
              No audit events found
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No events match the current search and
              filter selection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="p-4">
                    Timestamp
                  </th>

                  <th className="p-4">
                    User
                  </th>

                  <th className="p-4">
                    Role
                  </th>

                  <th className="p-4">
                    Action
                  </th>

                  <th className="p-4">
                    Patient
                  </th>

                  <th className="p-4">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />

                        <span className="font-mono font-bold text-slate-800">
                          {formatTimestamp(
                            log.timestamp
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                        </div>

                        <span className="font-bold text-slate-900">
                          {log.user || 'Unknown User'}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-md text-[9px] font-black border ${
                          log.role === 'ADMIN'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : log.role === 'DOCTOR'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {log.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-100 text-[10px] font-black">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {log.patientName || 'N/A'}
                    </td>

                    <td className="p-4 text-slate-600 min-w-[260px] max-w-[420px]">
                      <p
                        className="truncate"
                        title={log.details || ''}
                      >
                        {log.details || 'No details recorded'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
         SECURITY NOTE
      ===================================================== */}

      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">
            Audit Security & Traceability:
          </strong>{' '}
          All clinical activities, user logins, threshold modifications, and vital recordings are permanently saved in the backend SQLite database with tamper-proof timestamps.
        </p>
      </div>
    </div>
  );
};