import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  Activity,
  ClipboardCheck,
  SlidersHorizontal,
  FileText
} from 'lucide-react';

export const MobileNavbar: React.FC = () => {
  const { role, activePage, setActivePage, alerts } = useApp();
  const activeAlertCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const getNavItems = () => {
    switch (role) {
      case 'NURSE':
        return [
          { id: 'nurse-dashboard', label: 'Shift Overview', icon: LayoutDashboard },
          { id: 'record-vitals', label: 'Record Vitals', icon: Activity, isHighlight: true },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'alert-center', label: 'Alerts', icon: AlertOctagon, badge: activeAlertCount > 0 ? activeAlertCount : undefined },
          { id: 'shift-handover', label: 'Handover', icon: ClipboardCheck },
        ];

      case 'DOCTOR':
        return [
          { id: 'doctor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'alert-center', label: 'Alerts', icon: AlertOctagon, badge: activeAlertCount > 0 ? activeAlertCount : undefined },
          { id: 'monitoring-plan', label: 'Plans', icon: SlidersHorizontal },
        ];

      default: // ADMIN
        return [
          { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'patients', label: 'Patients', icon: Users },
          { id: 'alert-center', label: 'Alerts', icon: AlertOctagon, badge: activeAlertCount > 0 ? activeAlertCount : undefined },
          { id: 'reports', label: 'Reports', icon: FileText },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 backdrop-blur-xl px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-cyan-400 bg-cyan-950/60 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.badge !== undefined && (
                <span className="absolute -top-1 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white animate-pulse">
                  {item.badge}
                </span>
              )}

              <div className={`p-1 rounded-lg ${item.isHighlight ? 'bg-cyan-600 text-white shadow-lg' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>

              <span className="text-[10px] font-bold mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
