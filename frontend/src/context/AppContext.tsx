import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  UserRole,
  User,
  Patient,
  Alert,
  ObservationTask,
  AuditLog,
} from '../types';

import {
  MOCK_USERS,
} from '../data/mockData';

import {
  apiService,
} from '../services/api';

/* =========================================================
   CONTEXT TYPE
========================================================= */

interface AppContextType {
  role: UserRole;

  setRole: (
    role: UserRole
  ) => void;

  currentUser: User;

  activePage: string;

  setActivePage: (
    page: string
  ) => void;

  selectedPatientId: string | null;

  setSelectedPatientId: (
    id: string | null
  ) => void;

  navigateToPatientProfile: (
    patientId: string
  ) => void;

  navigateToRecordVitals: (
    patientId?: string
  ) => void;

  patients: Patient[];

  alerts: Alert[];

  tasks: ObservationTask[];

  auditLogs: AuditLog[];

  searchQuery: string;

  setSearchQuery: (
    q: string
  ) => void;

  acknowledgeAlert: (
    alertId: string
  ) => Promise<void>;

  resolveAlert: (
    alertId: string
  ) => Promise<void>;

  addNewPatient: (
    patient: Omit<
      Patient,
      | 'id'
      | 'patientCode'
      | 'status'
      | 'lastObservationTime'
      | 'nextObservationDue'
      | 'latestVitals'
    >
  ) => Promise<void>;

  addVitalRecord: (
    patientId: string,
    record: any
  ) => Promise<void>;

  completeTask: (
    taskId: string
  ) => Promise<void>;

  refreshTasks: () => Promise<void>;

  sidebarCollapsed: boolean;

  setSidebarCollapsed: (
    collapsed: boolean
  ) => void;

  users: User[];

  addUser: (userData: any) => Promise<void>;

  toggleUserStatus: (userId: string, isActive: boolean) => Promise<void>;

  loginUser: (email: string, password?: string, role?: UserRole) => Promise<void>;

  unreadAlertCount: number;

  loading: boolean;

  refreshData: () => Promise<void>;
}

/* =========================================================
   CONTEXT
========================================================= */

const AppContext =
  createContext<
    AppContextType | undefined
  >(undefined);

/* =========================================================
   APP PROVIDER
========================================================= */

export const AppProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children,
}) => {
  /* =======================================================
     BASIC STATE
  ======================================================= */

  const [
    role,
    setRoleState,
  ] = useState<UserRole>(
    'DOCTOR'
  );

  const [
    activePage,
    setActivePage,
  ] = useState<string>(
    'login'
  );

  const [
    selectedPatientId,
    setSelectedPatientId,
  ] = useState<string | null>(
    '1'
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState<string>('');

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState<boolean>(
    false
  );

  /* =======================================================
     DATA STATE
  ======================================================= */

  const [
    patients,
    setPatients,
  ] = useState<Patient[]>([]);

  const [
    alerts,
    setAlerts,
  ] = useState<Alert[]>([]);

  const [
    tasks,
    setTasks,
  ] = useState<ObservationTask[]>([]);

  /*
   * Backend audit retrieval is not currently exposed.
   * These logs therefore represent actions from the
   * current frontend session.
   */
  const [
    auditLogs,
    setAuditLogs,
  ] = useState<AuditLog[]>([]);

  const [
    loading,
    setLoading,
  ] = useState<boolean>(
    true
  );

  const [
    users,
    setUsers,
  ] = useState<User[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<User>(MOCK_USERS.DOCTOR);

  /* =======================================================
     AUDIT HELPER
  ======================================================= */

  const addAuditLog = (
    action: string,
    details: string,
    patientId?: string,
    patientName?: string
  ) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`,

      timestamp:
        new Date().toISOString(),

      user:
        currentUser.name,

      role,

      action,

      patientName,

      patientId,

      details,
    };

    setAuditLogs(
      (previousLogs) => [
        newLog,
        ...previousLogs,
      ]
    );
  };

  /* =======================================================
     REFRESH TASKS
  ======================================================= */

  const refreshTasks =
    async (): Promise<void> => {
      try {
        const backendTasks =
          await apiService.getTasks(
            undefined,
            patients
          );

        setTasks(
          backendTasks
        );
      } catch (error) {
        console.error(
          'Failed to load tasks:',
          error
        );

        /*
         * Preserve currently loaded tasks
         * instead of clearing them on a
         * temporary request failure.
         */
      }
    };

  /* =======================================================
     LOAD ALL BACKEND DATA
  ======================================================= */

  const refreshData =
    async (): Promise<void> => {
      try {
        setLoading(true);

        /*
         * Patients are loaded first because
         * alerts/tasks require patient data
         * for display mapping.
         */
        const backendPatients =
          await apiService.getPatients();

        setPatients(
          backendPatients
        );

        /*
         * Keep current selection valid.
         */
        setSelectedPatientId(
          (currentSelectedId) => {
            if (
              currentSelectedId &&
              backendPatients.some(
                (patient) =>
                  patient.id ===
                  currentSelectedId
              )
            ) {
              return currentSelectedId;
            }

            return (
              backendPatients[0]
                ?.id || null
            );
          }
        );

        /*
         * Fetch dependent resources
         * in parallel.
         */
        const [
          backendAlerts,
          backendTasks,
          backendUsers,
          backendAuditLogs,
        ] =
          await Promise.all([
            apiService.getAlerts(
              undefined,
              backendPatients
            ),

            apiService.getTasks(
              undefined,
              backendPatients
            ),

            apiService.getUsers(),

            apiService.getAuditLogs(),
          ]);

        setAlerts(
          backendAlerts
        );

        setTasks(
          backendTasks
        );

        setUsers(
          backendUsers
        );

        if (backendAuditLogs && backendAuditLogs.length > 0) {
          setAuditLogs(backendAuditLogs);
        }
      } catch (error) {
        console.error(
          'Failed to load backend data:',
          error
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void refreshData();
  }, []);

  /* =======================================================
     ROLE SWITCH
  ======================================================= */

  const setRole =
    (
      newRole: UserRole
    ): void => {
      setRoleState(
        newRole
      );

      /*
       * Only redirect when currently
       * viewing a role dashboard.
       */
      if (
        activePage.includes(
          'dashboard'
        )
      ) {
        switch (newRole) {
          case 'ADMIN':
            setActivePage(
              'admin-dashboard'
            );
            break;

          case 'DOCTOR':
            setActivePage(
              'doctor-dashboard'
            );
            break;

          case 'NURSE':
            setActivePage(
              'nurse-dashboard'
            );
            break;
        }
      }
    };

  /* =======================================================
     NAVIGATION
  ======================================================= */

  const navigateToPatientProfile =
    (
      patientId: string
    ): void => {
      setSelectedPatientId(
        patientId
      );

      setActivePage(
        'patient-profile'
      );
    };

  const navigateToRecordVitals =
    (
      patientId?: string
    ): void => {
      if (patientId) {
        setSelectedPatientId(
          patientId
        );
      }

      setActivePage(
        'record-vitals'
      );
    };

  /* =======================================================
     ACKNOWLEDGE ALERT
  ======================================================= */

  const acknowledgeAlert =
    async (
      alertId: string
    ): Promise<void> => {
      try {
        const numericUserId =
          Number(
            currentUser.id
          );

        const updatedAlert =
          await apiService.acknowledgeAlert(
            alertId,
            Number.isFinite(
              numericUserId
            )
              ? numericUserId
              : undefined
          );

        setAlerts(
          (previousAlerts) =>
            previousAlerts.map(
              (currentAlert) =>
                currentAlert.id ===
                alertId
                  ? updatedAlert
                  : currentAlert
            )
        );

        addAuditLog(
          'ALERT_ACKNOWLEDGED',
          `Acknowledged alert ${alertId}`,
          updatedAlert.patientId,
          updatedAlert.patientName
        );
      } catch (error) {
        console.error(
          'Failed to acknowledge alert:',
          error
        );

        throw error;
      }
    };

  /* =======================================================
     RESOLVE ALERT
  ======================================================= */

  const resolveAlert =
    async (
      alertId: string
    ): Promise<void> => {
      try {
        const updatedAlert =
          await apiService.resolveAlert(
            alertId
          );

        setAlerts(
          (previousAlerts) =>
            previousAlerts.map(
              (currentAlert) =>
                currentAlert.id ===
                alertId
                  ? updatedAlert
                  : currentAlert
            )
        );

        addAuditLog(
          'ALERT_RESOLVED',
          `Resolved alert ${alertId}`,
          updatedAlert.patientId,
          updatedAlert.patientName
        );
      } catch (error) {
        console.error(
          'Failed to resolve alert:',
          error
        );

        throw error;
      }
    };

  /* =======================================================
     ADD PATIENT
  ======================================================= */

  const addNewPatient =
    async (
      newPatient: Omit<
        Patient,
        | 'id'
        | 'patientCode'
        | 'status'
        | 'lastObservationTime'
        | 'nextObservationDue'
        | 'latestVitals'
      >
    ): Promise<void> => {
      try {
        const createdPatient =
          await apiService.createPatient(
            newPatient
          );

        /*
         * Optimistic local insertion after
         * confirmed backend creation.
         */
        setPatients(
          (previousPatients) => [
            createdPatient,
            ...previousPatients,
          ]
        );

        /*
         * Select newly admitted patient.
         */
        setSelectedPatientId(
          createdPatient.id
        );

        addAuditLog(
          'PATIENT_ADMITTED',
          `Admitted ${createdPatient.name} to ${createdPatient.ward} / ${createdPatient.bed}`,
          createdPatient.id,
          createdPatient.name
        );
      } catch (error) {
        console.error(
          'Failed to admit patient:',
          error
        );

        /*
         * Re-throw so the page can
         * correctly keep the modal open
         * and display the failure.
         */
        throw error;
      }
    };

  /* =======================================================
     RECORD VITALS
  ======================================================= */

  const addVitalRecord =
    async (
      patientId: string,
      vitals: any
    ): Promise<void> => {
      const hr = Number(vitals.heartRate);
    const sys = Number(vitals.systolic);
    const dia = Number(vitals.diastolic);
    const temp = Number(vitals.temperature);
    const rr = Number(vitals.respiratoryRate);
    const spo2 = Number(vitals.spo2);
    const glu =
      vitals.glucose !== '' && vitals.glucose !== null && vitals.glucose !== undefined
        ? Number(vitals.glucose)
        : undefined;
    const urine =
      vitals.urineOutput !== '' && vitals.urineOutput !== null && vitals.urineOutput !== undefined
        ? Number(vitals.urineOutput)
        : undefined;

    // 1. Evaluate Patient Status
    let newStatus: PatientStatus = 'STABLE';
    if (hr >= 130 || hr <= 50 || spo2 <= 90 || sys >= 160 || sys < 90 || temp >= 39.0) {
      newStatus = 'CRITICAL';
    } else if (hr > 100 || hr < 60 || spo2 < 94 || sys >= 140 || temp >= 38.0) {
      newStatus = 'HIGH_RISK';
    } else if (temp > 37.5 || sys > 130) {
      newStatus = 'ATTENTION';
    }

    const timestampStr = new Date().toISOString();
    const newVitalRecord: VitalRecord = {
      id: `VIT-${Date.now()}`,
      patientId,
      timestamp: timestampStr,
      heartRate: hr,
      systolic: sys,
      diastolic: dia,
      temperature: temp,
      respiratoryRate: rr,
      spo2,
      glucose: glu,
      urineOutput: urine,
      recordedBy: currentUser.name,
      notes: vitals.notes,
    };

    // 2. Generate Alerts if abnormal
    const generatedAlerts: Alert[] = [];
    const targetPatient = patients.find((p) => p.id === patientId);
    const patientName = targetPatient?.name || `Patient ${patientId}`;
    const bed = targetPatient?.bed || 'ICU-Bed';

    if (spo2 <= 90) {
      generatedAlerts.push({
        id: `ALT-${Date.now()}-1`,
        patientId,
        patientName,
        bed,
        severity: 'CRITICAL',
        status: 'ACTIVE',
        parameter: 'Oxygen Saturation (SpO2)',
        currentValue: `${spo2}%`,
        thresholdExceeded: 'Critical Low (< 90%)',
        timestamp: timestampStr,
        notes: `Bedside Observation: SpO2 desaturation to ${spo2}%`,
      });
    } else if (spo2 < 94) {
      generatedAlerts.push({
        id: `ALT-${Date.now()}-1`,
        patientId,
        patientName,
        bed,
        severity: 'WARNING',
        status: 'ACTIVE',
        parameter: 'Oxygen Saturation (SpO2)',
        currentValue: `${spo2}%`,
        thresholdExceeded: 'Warning Low (< 94%)',
        timestamp: timestampStr,
        notes: `Bedside Observation: SpO2 dropped to ${spo2}%`,
      });
    }

    if (hr >= 130 || hr <= 50) {
      generatedAlerts.push({
        id: `ALT-${Date.now()}-2`,
        patientId,
        patientName,
        bed,
        severity: 'CRITICAL',
        status: 'ACTIVE',
        parameter: 'Heart Rate',
        currentValue: `${hr} bpm`,
        thresholdExceeded: hr >= 130 ? 'Critical High (≥ 130 bpm)' : 'Critical Low (≤ 50 bpm)',
        timestamp: timestampStr,
        notes: `Bedside Observation: Heart rate at ${hr} bpm`,
      });
    } else if (hr > 100) {
      generatedAlerts.push({
        id: `ALT-${Date.now()}-2`,
        patientId,
        patientName,
        bed,
        severity: 'WARNING',
        status: 'ACTIVE',
        parameter: 'Heart Rate',
        currentValue: `${hr} bpm`,
        thresholdExceeded: 'Warning High (> 100 bpm)',
        timestamp: timestampStr,
        notes: `Bedside Observation: Heart rate elevated at ${hr} bpm`,
      });
    }

    if (sys >= 160) {
      generatedAlerts.push({
        id: `ALT-${Date.now()}-3`,
        patientId,
        patientName,
        bed,
        severity: 'CRITICAL',
        status: 'ACTIVE',
        parameter: 'Systolic BP',
        currentValue: `${sys} mmHg`,
        thresholdExceeded: 'Critical High (≥ 160 mmHg)',
        timestamp: timestampStr,
        notes: `Bedside Observation: Severe Hypertension ${sys}/${dia} mmHg`,
      });
    } else if (sys >= 140) {
      generatedAlerts.push({
        id: `ALT-${Date.now()}-3`,
        patientId,
        patientName,
        bed,
        severity: 'WARNING',
        status: 'ACTIVE',
        parameter: 'Systolic BP',
        currentValue: `${sys} mmHg`,
        thresholdExceeded: 'Warning High (≥ 140 mmHg)',
        timestamp: timestampStr,
        notes: `Bedside Observation: Elevated Blood Pressure ${sys}/${dia} mmHg`,
      });
    }

    // 3. Optimistic local update
    setPatients((prevPatients) =>
      prevPatients.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            status: newStatus,
            latestVitals: newVitalRecord,
            lastObservationTime: 'Just now',
          };
        }
        return p;
      })
    );

    if (generatedAlerts.length > 0) {
      setAlerts((prevAlerts) => [...generatedAlerts, ...prevAlerts]);
    }

    addAuditLog(
      'RECORD_VITALS',
      `Recorded bedside vitals: HR ${hr} bpm, BP ${sys}/${dia} mmHg, SpO2 ${spo2}%, Status: ${newStatus}`,
      patientId,
      patientName
    );

    // 4. Send to backend if available
    try {
      await apiService.recordVitals({
        patientId,
        heartRate: hr,
        systolic: sys,
        diastolic: dia,
        temperature: temp,
        respiratoryRate: rr,
        spo2,
        glucose: glu,
        urineOutput: urine,
        recordedBy: currentUser.name,
        notes: vitals.notes,
      });

      const updatedPatients = await apiService.getPatients();
      if (updatedPatients && updatedPatients.length > 0) {
        setPatients(updatedPatients);
        const [updatedAlerts, updatedTasks] = await Promise.all([
          apiService.getAlerts(undefined, updatedPatients),
          apiService.getTasks(undefined, updatedPatients),
        ]);
        if (updatedAlerts) setAlerts(updatedAlerts);
        if (updatedTasks) setTasks(updatedTasks);
      }
    } catch (backendErr) {
      console.warn('Backend recordVitals sync failed, maintained optimistic local state update:', backendErr);
    }
  };

  /* =======================================================
     COMPLETE OBSERVATION TASK
  ======================================================= */

  const completeTask =
    async (
      taskId: string
    ): Promise<void> => {
      try {
        const updatedTask =
          await apiService.completeTask(
            taskId,
            patients
          );

        /*
         * Immediate UI update.
         */
        setTasks(
          (previousTasks) =>
            previousTasks.map(
              (currentTask) =>
                currentTask.id ===
                taskId
                  ? updatedTask
                  : currentTask
            )
        );

        addAuditLog(
          'TASK_COMPLETED',
          `Completed ${
            updatedTask.taskName ||
            updatedTask.vitalName ||
            'observation task'
          }`,
          updatedTask.patientId,
          updatedTask.patientName
        );

        /*
         * Read back task state from backend.
         */
        const refreshedTasks =
          await apiService.getTasks(
            undefined,
            patients
          );

        setTasks(
          refreshedTasks
        );
      } catch (error) {
        console.error(
          'Failed to complete task:',
          error
        );

        throw error;
      }
    };

  /* =======================================================
     USER MANAGEMENT (ADMIN)
  ======================================================= */

  const addUser = async (userData: any): Promise<void> => {
    try {
      const createdUser = await apiService.createUser(userData);
      setUsers(prev => [createdUser, ...prev]);
      addAuditLog(
        'USER_CREATED',
        `Admin created new ${createdUser.role}: ${createdUser.name} (${createdUser.email})`
      );
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
    try {
      await apiService.updateUserStatus(userId, isActive);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
      addAuditLog(
        'USER_STATUS_CHANGED',
        `Admin ${isActive ? 'activated' : 'deactivated'} user #${userId}`
      );
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      throw error;
    }
  };

  const loginUser = async (email: string, password?: string, newRole?: UserRole): Promise<void> => {
    try {
      const authResult = await apiService.login(email, password, newRole);
      setRoleState(authResult.user.role);
      setCurrentUser({
        id: authResult.user.id,
        name: authResult.user.name,
        email: authResult.user.email,
        role: authResult.user.role,
        department: authResult.user.department,
        specialty: authResult.user.specialty,
        shift: authResult.user.shift,
      });

      addAuditLog('USER_LOGIN', `User ${authResult.user.name} logged in`);

      if (authResult.user.role === 'ADMIN') {
        setActivePage('admin-dashboard');
      } else if (authResult.user.role === 'NURSE') {
        setActivePage('nurse-dashboard');
      } else {
        setActivePage('doctor-dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  /* =======================================================
     UNREAD ALERT COUNT
  ======================================================= */

  const unreadAlertCount =
    useMemo(
      () =>
        alerts.filter(
          (currentAlert) =>
            currentAlert.status ===
            'ACTIVE'
        ).length,
      [alerts]
    );

  /* =======================================================
     PROVIDER
  ======================================================= */

  return (
    <AppContext.Provider
      value={{
        role,

        setRole,

        currentUser,

        activePage,

        setActivePage,

        selectedPatientId,

        setSelectedPatientId,

        navigateToPatientProfile,

        navigateToRecordVitals,

        patients,

        alerts,

        tasks,

        auditLogs,

        users,

        addUser,

        toggleUserStatus,

        loginUser,

        searchQuery,

        setSearchQuery,

        acknowledgeAlert,

        resolveAlert,

        addNewPatient,

        addVitalRecord,

        completeTask,

        refreshTasks,

        sidebarCollapsed,

        setSidebarCollapsed,

        unreadAlertCount,

        loading,

        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* =========================================================
   CUSTOM HOOK
========================================================= */

export const useApp =
  () => {
    const context =
      useContext(
        AppContext
      );

    if (!context) {
      throw new Error(
        'useApp must be used within an AppProvider'
      );
    }

    return context;
  };