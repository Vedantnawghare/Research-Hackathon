import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  ShieldCheck,
  HeartPulse,
  Eye,
  EyeOff,
  Lock,
  UserRound,
  AlertCircle,
  Stethoscope,
  ShieldAlert,
} from 'lucide-react';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { loginUser } = useApp();

  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DOCTOR');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleDemoSelect = (role: UserRole, email: string, pw: string) => {
    setSelectedRole(role);
    setUserId(email);
    setPassword(pw);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!userId || !password) {
      setError('Please enter your email and password');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await loginUser(userId.trim(), password, selectedRole);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Invalid credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3">
      <div className="w-full max-w-[1420px] min-h-[820px] overflow-hidden rounded-[28px] bg-white shadow-2xl border border-slate-200 grid lg:grid-cols-2">
        {/* BRAND PANEL */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#05283b] via-[#031426] to-[#020817] text-white p-10 lg:p-12 flex flex-col justify-between">
          <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -left-20 bottom-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-950/40">
                <HeartPulse className="w-8 h-8 text-white" />
              </div>

              <div>
                <div className="text-2xl font-black tracking-tight">
                  Smart ICU <span className="text-cyan-400">VitalCare</span>
                </div>
                <div className="text-xs text-cyan-300 font-bold tracking-[0.22em] uppercase">
                  Hospital Automation OS
                </div>
              </div>
            </div>

            <div className="mt-16 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
              <span className="text-xs font-black tracking-wider text-cyan-300 uppercase">
                Secure Clinical Access Control
              </span>
            </div>

            <div className="mt-7 max-w-xl">
              <h1 className="text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight">
                Smart Patient Vital Monitoring &{' '}
                <span className="text-cyan-400">Clinical Dashboard System</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
                Centralized automation solution for Doctors, Nurses, and Hospital Admins. Replaces manual paper ICU charts with real-time vital telemetry, dynamic risk thresholds, and automated shift handovers.
              </p>
            </div>

            {/* QUICK DEMO SELECTOR */}
            <div className="mt-10 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Quick One-Click Role Sign In:
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('DOCTOR', 'shravani@shreedha.com', 'doc123')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'DOCTOR' ? 'bg-cyan-950/80 border-cyan-400 text-white' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <Stethoscope className="w-5 h-5 text-cyan-400 mb-1" />
                  <div className="text-xs font-bold">Doctor Login</div>
                  <div className="text-[10px] text-slate-400">Dr. Shravani Sadawarte</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('NURSE', 'ananya@shreedha.com', 'nurse123')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'NURSE' ? 'bg-cyan-950/80 border-cyan-400 text-white' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <HeartPulse className="w-5 h-5 text-emerald-400 mb-1" />
                  <div className="text-xs font-bold">Nurse Login</div>
                  <div className="text-[10px] text-slate-400">Nurse Ananya Marghade</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSelect('ADMIN', 'admin@shreedha.com', 'admin123')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedRole === 'ADMIN' ? 'bg-cyan-950/80 border-cyan-400 text-white' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5 text-purple-400 mb-1" />
                  <div className="text-xs font-bold">Admin Control</div>
                  <div className="text-[10px] text-slate-400">Vedant Nawghare</div>
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-400 mt-8">
            Smart ICU Monitoring System • SIT Nagpur Hospital Automation Solution
          </div>
        </div>

        {/* LOGIN FORM */}
        <div className="bg-white flex items-center justify-center px-8 py-12 lg:px-20">
          <div className="w-full max-w-[560px]">
            <div className="text-xs font-black tracking-[0.25em] text-cyan-600 uppercase">
              Authorized System Access
            </div>

            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-900">
              Hospital Login
            </h2>

            <p className="mt-3 text-sm text-slate-500">
              Enter your clinical email and password to access your role workspace.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <p className="text-xs font-semibold text-rose-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">

              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-500 mb-2">
                  Email Address / User ID
                </label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={userId}
                    onChange={(event) => {
                      setUserId(event.target.value);
                      setError('');
                    }}
                    placeholder="e.g. doctor@vitalcare.com"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-4 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-500 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError('');
                    }}
                    placeholder="Enter password"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 pr-14 py-4 text-sm font-semibold text-slate-900 outline-none focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white py-4 text-sm font-black shadow-lg shadow-cyan-600/20 transition disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <Activity className="w-5 h-5 animate-pulse" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Sign In to {selectedRole} Workspace
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-cyan-600 shrink-0" />
              <p className="text-xs text-slate-500">
                Restricted Hospital Automation System. All activities are recorded in the system audit log.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};