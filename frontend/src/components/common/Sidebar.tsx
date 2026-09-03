import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  Activity,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
  ClipboardCheck,
  Stethoscope,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Lock,
  BedDouble
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { role, activePage, setActivePage, sidebarCollapsed, setSidebarCollapsed, currentUser } = useApp();

  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patient Directory', icon: Users },
          { id: 'icu-bed-map', label: 'ICU Beds & Wards', icon: BedDouble },
          { id: 'alert-center', label: 'Alert Center', icon: AlertOctagon },
          { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert },
          { id: 'reports', label: 'Reports & Analytics', icon: FileText }
        ];

      case 'DOCTOR':
        return [
          { id: 'doctor-dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patient Management', icon: Users },
          { id: 'alert-center', label: 'Alert Center', icon: AlertOctagon },
          { id: 'monitoring-plan', label: 'Monitoring Plans', icon: SlidersHorizontal },
          { id: 'reports', label: 'Digital ICU Charts', icon: FileText },
          { id: 'audit-logs', label: 'Audit Logs', icon: ShieldAlert }
        ];

      case 'NURSE':
        return [
          { id: 'nurse-dashboard', label: 'My Shift Overview', icon: LayoutDashboard },
          { id: 'record-vitals', label: 'Record Vitals', icon: Activity, badge: 'Bedside' },
          { id: 'patients', label: 'Patients Under Care', icon: Users },
          { id: 'alert-center', label: 'Alert Center', icon: AlertOctagon },
          { id: 'shift-handover', label: 'Shift Handover', icon: ClipboardCheck },
          { id: 'reports', label: 'Reports', icon: FileText }
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
      <aside
        className={`hidden md:flex relative bg-slate-950 text-white flex-col transition-all duration-300 z-30 shadow-2xl border-r border-slate-800 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 flex-shrink-0">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                SHREEDHA<span className="text-cyan-400 font-bold ml-0.5">ICU</span>
              </span>
              <span className="text-[10px] text-cyan-200/70 font-semibold tracking-wider uppercase mt-1">
                Hospital Automation
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Hospital Unit Indicator */}
      {!sidebarCollapsed && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">SHREEDHA Hospital</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">Smart Patient Vital Monitoring</p>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <p className={`text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-2 ${sidebarCollapsed ? 'text-center' : 'px-2'}`}>
          {sidebarCollapsed ? 'Nav' : 'Main Menu'}
        </p>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90'
              }`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!sidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {!sidebarCollapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Footer & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-9 h-9 rounded-full object-cover border-2 border-cyan-500/40 flex-shrink-0"
          />
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">{role}</p>
            </div>
          )}
          <button
            onClick={() => setActivePage('login')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Sign Out / Change Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
