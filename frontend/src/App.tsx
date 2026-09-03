import React from 'react';

import { AppProvider, useApp } from './context/AppContext';

import { Sidebar } from './components/common/Sidebar';
import { Topbar } from './components/common/Topbar';
import { MobileNavbar } from './components/common/MobileNavbar';

import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { NurseDashboard } from './pages/NurseDashboard';
import { PatientsPage } from './pages/PatientsPage';
import { PatientProfilePage } from './pages/PatientProfilePage';
import { RecordVitalsPage } from './pages/RecordVitalsPage';
import { AlertCenterPage } from './pages/AlertCenterPage';
import { MonitoringPlanPage } from './pages/MonitoringPlanPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ShiftHandoverPage } from './pages/ShiftHandoverPage';


const AppLayout: React.FC = () => {
  const { activePage, role } = useApp();

  if (activePage === 'login') {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'admin-dashboard':
        return <AdminDashboard />;

      case 'doctor-dashboard':
        return <DoctorDashboard />;

      case 'nurse-dashboard':
        return <NurseDashboard />;

      case 'patients':
        return <PatientsPage />;

      case 'patient-profile':
        return <PatientProfilePage />;

      case 'record-vitals':
        return <RecordVitalsPage />;

      case 'alert-center':
        return <AlertCenterPage />;

      case 'monitoring-plan':
        return <MonitoringPlanPage />;

      case 'audit-logs':
        return <AuditLogsPage />;

      case 'reports':
        return <ReportsPage />;

      case 'shift-handover':
        return <ShiftHandoverPage />;

      default:
        if (role === 'ADMIN') {
          return <AdminDashboard />;
        }

        if (role === 'NURSE') {
          return <NurseDashboard />;
        }

        return <DoctorDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar />

        <main className="min-w-0 flex-1 p-3 sm:p-5 md:p-6 pb-24 md:pb-6">
          {renderPage()}
        </main>

      </div>

      <MobileNavbar />

    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
};


export default App;