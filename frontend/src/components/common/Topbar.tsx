import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  UserCheck,
  ShieldCheck,
  Stethoscope,
  HeartPulse
} from 'lucide-react';

import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const Topbar: React.FC = () => {
  const {
    role,
    setRole,
    currentUser,
    unreadAlertCount,
    searchQuery,
    setSearchQuery,
    setActivePage,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleChange = (newRole: UserRole): void => {
    if (role !== 'ADMIN') return;
    setRole(newRole);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleNotificationClick = (): void => {
    setActivePage('alert-center');
  };

  const handleLogout = (): void => {
    setShowUserDropdown(false);
    setActivePage('login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center gap-4 px-5 lg:px-6">
        {/* SEARCH */}
        <div className="relative min-w-0 flex-1 max-w-[450px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search patient by name, ID (e.g. PAT-1001), or bed..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* WARD STATUS */}
        <div className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 whitespace-nowrap">
          <Building2 className="h-4 w-4 text-cyan-600" />
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700">ICU Ward 4</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-slate-600">Bed Occupancy 92%</span>
          </div>
        </div>

        {/* ACTIVE ROLE BADGE */}
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Active Role:
          </span>
          <span className="text-xs font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
            {role}
          </span>
        </div>

        {/* NOTIFICATIONS */}
        <button
          type="button"
          onClick={handleNotificationClick}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Open alerts"
        >
          <Bell className="h-5 w-5" />
          {unreadAlertCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
              {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
            </span>
          )}
        </button>

        <div className="hidden h-9 w-px bg-slate-200 sm:block" />

        {/* CURRENT USER DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowUserDropdown((prev) => !prev)}
            className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="hidden min-w-0 lg:block">
              <p className="max-w-[170px] truncate text-xs font-extrabold text-slate-800">
                {currentUser.name}
              </p>
              <p className="max-w-[170px] truncate text-[10px] font-medium text-slate-500">
                {role === 'ADMIN' ? 'System Administrator' : role === 'DOCTOR' ? 'Attending Physician' : 'ICU Staff Nurse'}
              </p>
            </div>

            <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
          </button>

          {/* USER DROPDOWN MENU */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{currentUser.email || 'user@shreedha.com'}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-100 text-cyan-800">
                  {role} Workspace
                </span>
              </div>

              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    if (role === 'ADMIN') setActivePage('admin-dashboard');
                    else if (role === 'DOCTOR') setActivePage('doctor-dashboard');
                    else setActivePage('nurse-dashboard');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4 text-cyan-600" />
                  View My Dashboard
                </button>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setActivePage('patients');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  Patient Directory
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  Sign Out / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;