/**
 * VitalCare AI - FastAPI Service Client
 * Connects React frontend to FastAPI backend.
 *
 * This file is the single frontend <-> backend mapping layer.
 */

import {
  Patient,
  VitalRecord,
  Alert,
  MonitoringPlan,
  AuditLog,
  ObservationTask,
  UserRole,
  PatientStatus,
  TaskStatus,
  TaskPriority,
} from '../types';

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, '');

// =========================================================
// BACKEND TYPES
// =========================================================

interface BackendVital {
  id: number;
  patient_id: number;
  recorded_by_id: number | null;

  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  temperature: number | null;
  respiratory_rate: number | null;
  spo2: number | null;
  blood_glucose: number | null;
  urine_output: number | null;

  notes: string | null;
  recorded_at: string;
}

interface BackendPatient {
  id: number;

  patient_code: string;
  full_name: string;

  age: number;
  gender: string;

  contact: string | null;

  ward: string;
  bed_number: string;

  admission_date: string;

  assigned_doctor_id: number | null;

  current_status: PatientStatus;

  primary_diagnosis?: string | null;

  is_active: boolean;

  created_at: string;
}

interface BackendAlert {
  id: number;

  patient_id: number;
  vital_record_id: number | null;

  vital_name: string;

  current_value: number | null;
  threshold_value: number | null;

  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED';

  message: string;

  acknowledged_by_id: number | null;
  acknowledged_at: string | null;

  resolved_at: string | null;

  created_at: string;
}

interface BackendMonitoringPlan {
  id: number;
  patient_id: number;

  vital_name: string;

  is_enabled: boolean;

  frequency_minutes: number;

  warning_low: number | null;
  warning_high: number | null;

  critical_low: number | null;
  critical_high: number | null;

  created_at: string;
}

interface BackendTask {
  id: number;
  patient_id: number;

  vital_name: string;

  scheduled_time: string;
  completed_at: string | null;

  status: TaskStatus;

  assigned_nurse_id: number | null;
}

// =========================================================
// COMMON HELPERS
// =========================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;

    try {
      const error = await response.json();

      errorMessage =
        error?.detail ||
        error?.message ||
        (typeof error === 'string'
          ? error
          : JSON.stringify(error));
    } catch {
      // Ignore invalid JSON error body.
    }

    throw new Error(errorMessage);
  }

  // Some DELETE endpoints may return an empty response.
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return response.json();
}

function safeNumber(value: number | null | undefined): number | undefined {
  return value == null ? undefined : value;
}

function formatVitalName(vitalName: string): string {
  return vitalName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getAlertUnit(vitalName: string): string {
  const units: Record<string, string> = {
    heart_rate: ' bpm',
    spo2: '%',
    temperature: ' °C',
    respiratory_rate: ' /min',
    systolic_bp: ' mmHg',
    diastolic_bp: ' mmHg',
    blood_glucose: ' mg/dL',
    urine_output: ' mL/h',
  };

  return units[vitalName] || '';
}

function patientStatusToTaskPriority(
  status: PatientStatus | undefined
): TaskPriority {
  switch (status) {
    case 'CRITICAL':
      return 'CRITICAL';

    case 'HIGH_RISK':
      return 'HIGH_RISK';

    case 'ATTENTION':
      return 'ATTENTION';

    default:
      return 'STABLE';
  }
}

// =========================================================
// DATA MAPPERS
// =========================================================

function mapVitalFromBackend(
  vital: BackendVital
): VitalRecord {
  return {
    id: String(vital.id),

    patientId: String(vital.patient_id),

    timestamp: vital.recorded_at,

    heartRate: vital.heart_rate ?? 0,
    systolic: vital.systolic_bp ?? 0,
    diastolic: vital.diastolic_bp ?? 0,

    temperature: vital.temperature ?? 0,

    respiratoryRate: vital.respiratory_rate ?? 0,

    spo2: vital.spo2 ?? 0,

    glucose: safeNumber(vital.blood_glucose),

    urineOutput: safeNumber(vital.urine_output),

    recordedBy: vital.recorded_by_id
      ? `User ${vital.recorded_by_id}`
      : 'System',

    notes: vital.notes ?? undefined,
  };
}

function createDefaultVitals(
  patientId: number
): VitalRecord {
  return {
    id: `TEMP-${patientId}`,

    patientId: String(patientId),

    timestamp: new Date().toISOString(),

    heartRate: 0,
    systolic: 0,
    diastolic: 0,

    temperature: 0,

    respiratoryRate: 0,

    spo2: 0,

    glucose: undefined,
    urineOutput: undefined,

    recordedBy: 'No record',

    notes: undefined,
  };
}

function mapPatientFromBackend(
  patient: BackendPatient
): Patient {
  const gender =
    patient.gender === 'Male' ||
    patient.gender === 'Female' ||
    patient.gender === 'Other'
      ? patient.gender
      : 'Other';

  return {
    id: String(patient.id),

    patientCode: patient.patient_code,

    name: patient.full_name,

    age: patient.age,

    gender,

    contact: patient.contact ?? '',

    ward: patient.ward,

    bed: patient.bed_number,

    assignedDoctor: (() => {
      if (!patient.assigned_doctor_id) return 'Not Assigned';
      const doctorMap: Record<number, string> = {
        2: 'Dr. Shravani Sadawarte',
        3: 'Dr. Rajesh Kumar',
      };
      return doctorMap[patient.assigned_doctor_id] || `Dr. Consultant #${patient.assigned_doctor_id}`;
    })(),

    status: patient.current_status,

    primaryDiagnosis: patient.primary_diagnosis || 'Not specified',

    admissionDate: patient.admission_date,

    lastObservationTime: 'No recent observation',

    nextObservationDue: 'Not scheduled',

    latestVitals: createDefaultVitals(patient.id),
  };
}

function mapAlertFromBackend(
  alert: BackendAlert,
  patient?: Patient
): Alert {
  const unit = getAlertUnit(alert.vital_name);

  const currentValue =
    alert.current_value !== null
      ? `${alert.current_value}${unit}`
      : 'N/A';

  return {
    id: String(alert.id),

    patientId: String(alert.patient_id),

    patientName:
      patient?.name ||
      `Patient ${alert.patient_id}`,

    bed:
      patient?.bed ||
      'Unknown',

    severity: alert.severity,

    status: alert.status,

    parameter: formatVitalName(alert.vital_name),

    currentValue,

    thresholdExceeded:
      alert.threshold_value !== null
        ? `Threshold: ${alert.threshold_value}${unit}`
        : 'Threshold exceeded',

    timestamp: alert.created_at,

    acknowledgedBy: alert.acknowledged_by_id
      ? `User ${alert.acknowledged_by_id}`
      : undefined,

    acknowledgedAt:
      alert.acknowledged_at ?? undefined,

    notes: alert.message,
  };
}

function mapMonitoringPlanFromBackend(
  plan: BackendMonitoringPlan
): MonitoringPlan {
  return {
    id: String(plan.id),

    patientId: String(plan.patient_id),

    vitalName: plan.vital_name,

    isEnabled: plan.is_enabled,

    frequencyMinutes: plan.frequency_minutes,

    warningLow: plan.warning_low,

    warningHigh: plan.warning_high,

    criticalLow: plan.critical_low,

    criticalHigh: plan.critical_high,

    createdAt: plan.created_at,
  };
}

function mapTaskFromBackend(
  task: BackendTask,
  patient?: Patient
): ObservationTask {
  return {
    id: String(task.id),

    patientId: String(task.patient_id),

    patientName:
      patient?.name ||
      `Patient ${task.patient_id}`,

    bed:
      patient?.bed ||
      'Unknown',

    ward:
      patient?.ward ||
      'Unknown',

    taskName:
      `${formatVitalName(task.vital_name)} Observation`,

    vitalName: task.vital_name,

    scheduledTime: task.scheduled_time,

    completedAt:
      task.completed_at ?? undefined,

    status: task.status,

    priority: patientStatusToTaskPriority(
      patient?.status
    ),

    assignedNurseId:
      task.assigned_nurse_id != null
        ? String(task.assigned_nurse_id)
        : undefined,
  };
}

// =========================================================
// API SERVICE
// =========================================================

class ApiService {
  // =======================================================
  // HEALTH
  // =======================================================

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/health`
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  // =======================================================
  // AUTH & USER MANAGEMENT
  // =======================================================

  async login(email: string, password?: string, role?: UserRole) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password || '';

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
    } catch (networkErr) {
      // Offline fallback: Validate strictly against registered accounts only
      const validAccounts: Record<string, { pw: string; name: string; role: UserRole }> = {
        'admin@shreedha.com': { pw: 'admin123', name: 'Vedant Nawghare', role: 'ADMIN' },
        'shravani@shreedha.com': { pw: 'doc123', name: 'Dr. Shravani Sadawarte', role: 'DOCTOR' },
        'rajesh@shreedha.com': { pw: 'doc123', name: 'Dr. Rajesh Kumar', role: 'DOCTOR' },
        'ananya@shreedha.com': { pw: 'nurse123', name: 'Nurse Ananya Marghade', role: 'NURSE' },
      };

      const account = validAccounts[cleanEmail];
      if (account && account.pw === cleanPassword) {
        return {
          token: `local-token-${Date.now()}`,
          user: {
            id: '1',
            name: account.name,
            email: cleanEmail,
            role: account.role,
          },
        };
      }
      throw new Error('Invalid email or password');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || 'Invalid email or password');
    }

    const data = await response.json();
    return {
      token: data.access_token,
      user: {
        id: String(data.user.id),
        name: data.user.full_name,
        email: data.user.email,
        role: data.user.role as UserRole,
        department: data.user.department || undefined,
        specialty: data.user.specialty || undefined,
        shift: data.user.shift || undefined,
      },
    };
  }

  async getUsers(role?: UserRole): Promise<any[]> {
    const url = role ? `${API_BASE_URL}/auth/users?role=${role}` : `${API_BASE_URL}/auth/users`;
    const response = await fetch(url);
    const backendUsers = await handleResponse<any[]>(response);
    return backendUsers.map(u => ({
      id: String(u.id),
      name: u.full_name,
      email: u.email,
      role: u.role,
      department: u.department,
      specialty: u.specialty,
      shift: u.shift,
      isActive: u.is_active,
    }));
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
    specialty?: string;
    shift?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        department: userData.department || null,
        specialty: userData.specialty || null,
        shift: userData.shift || null,
      }),
    });

    const u = await handleResponse<any>(response);
    return {
      id: String(u.id),
      name: u.full_name,
      email: u.email,
      role: u.role,
      department: u.department,
      specialty: u.specialty,
      shift: u.shift,
      isActive: u.is_active,
    };
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    });

    return handleResponse<any>(response);
  }

  // =======================================================
  // VITALS
  // =======================================================

  async getPatientVitals(
    patientId: string
  ): Promise<VitalRecord[]> {
    const response = await fetch(
      `${API_BASE_URL}/vitals/patient/${patientId}`
    );

    const backendVitals =
      await handleResponse<BackendVital[]>(
        response
      );

    return backendVitals.map(
      mapVitalFromBackend
    );
  }

  async getLatestVitals(
    patientId: string
  ): Promise<VitalRecord | undefined> {
    const response = await fetch(
      `${API_BASE_URL}/vitals/patient/${patientId}/latest`
    );

    if (response.status === 404) {
      return undefined;
    }

    const backendVital =
      await handleResponse<BackendVital>(
        response
      );

    return mapVitalFromBackend(
      backendVital
    );
  }

  async recordVitals(
    vitalsData:
      Omit<VitalRecord, 'id' | 'timestamp'>
  ): Promise<VitalRecord> {
    const numericPatientId =
      Number(vitalsData.patientId);

    if (
      !Number.isFinite(numericPatientId)
    ) {
      throw new Error(
        'Invalid patient ID'
      );
    }

    const payload = {
      patient_id:
        numericPatientId,

      recorded_by_id:
        null,

      heart_rate:
        vitalsData.heartRate,

      systolic_bp:
        vitalsData.systolic,

      diastolic_bp:
        vitalsData.diastolic,

      temperature:
        vitalsData.temperature,

      respiratory_rate:
        vitalsData.respiratoryRate,

      spo2:
        vitalsData.spo2,

      blood_glucose:
        vitalsData.glucose ?? null,

      urine_output:
        vitalsData.urineOutput ?? null,

      notes:
        vitalsData.notes ?? null,
    };

    const response =
      await fetch(
        `${API_BASE_URL}/vitals/`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(payload),
        }
      );

    const backendVital =
      await handleResponse<BackendVital>(
        response
      );

    return mapVitalFromBackend(
      backendVital
    );
  }

  // =======================================================
  // PATIENTS
  // =======================================================

  async getPatients(
    filters?: {
      ward?: string;
      status?: string;
      search?: string;
    }
  ): Promise<Patient[]> {
    const params =
      new URLSearchParams();

    if (filters?.search) {
      params.append(
        'search',
        filters.search
      );
    }

    if (
      filters?.status &&
      filters.status !== 'ALL'
    ) {
      params.append(
        'status',
        filters.status
      );
    }

    if (
      filters?.ward &&
      filters.ward !== 'ALL'
    ) {
      params.append(
        'ward',
        filters.ward
      );
    }

    const query =
      params.toString();

    const url =
      query
        ? `${API_BASE_URL}/patients/?${query}`
        : `${API_BASE_URL}/patients/`;

    const response =
      await fetch(url);

    const backendPatients =
      await handleResponse<BackendPatient[]>(
        response
      );

    const patients =
      await Promise.all(
        backendPatients.map(
          async backendPatient => {
            const patient =
              mapPatientFromBackend(
                backendPatient
              );

            try {
              const latestVitals =
                await this.getLatestVitals(
                  String(backendPatient.id)
                );

              if (latestVitals) {
                patient.latestVitals =
                  latestVitals;

                patient.lastObservationTime =
                  latestVitals.timestamp;
              }
            } catch (error) {
              console.warn(
                `Could not fetch latest vitals for patient ${backendPatient.id}`,
                error
              );
            }

            return patient;
          }
        )
      );

    return patients;
  }

  async getPatientById(
    id: string
  ): Promise<Patient | undefined> {
    const numericId = Number(id);

    if (!Number.isFinite(numericId)) {
      return undefined;
    }

    const response =
      await fetch(
        `${API_BASE_URL}/patients/${numericId}`
      );

    if (response.status === 404) {
      return undefined;
    }

    const backendPatient =
      await handleResponse<BackendPatient>(
        response
      );

    const patient =
      mapPatientFromBackend(
        backendPatient
      );

    try {
      const latestVitals =
        await this.getLatestVitals(
          String(backendPatient.id)
        );

      if (latestVitals) {
        patient.latestVitals =
          latestVitals;

        patient.lastObservationTime =
          latestVitals.timestamp;
      }
    } catch (error) {
      console.warn(
        'Could not fetch latest vitals',
        error
      );
    }

    return patient;
  }

  async createPatient(
    patientData:
      Omit<
        Patient,
        | 'id'
        | 'patientCode'
        | 'status'
        | 'lastObservationTime'
        | 'nextObservationDue'
        | 'latestVitals'
      >
  ): Promise<Patient> {
    const payload = {
      patient_code:
        `PAT-${Date.now()}`,

      full_name:
        patientData.name,

      age:
        patientData.age,

      gender:
        patientData.gender,

      contact:
        patientData.contact || null,

      ward:
        patientData.ward,

      bed_number:
        patientData.bed,

      assigned_doctor_id:
        null,
    };

    const response =
      await fetch(
        `${API_BASE_URL}/patients/`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(payload),
        }
      );

    const backendPatient =
      await handleResponse<BackendPatient>(
        response
      );

    return mapPatientFromBackend(
      backendPatient
    );
  }

  async updatePatient(
    patientId: string,
    data: {
      name?: string;
      age?: number;
      gender?: string;
      contact?: string;
      ward?: string;
      bed?: string;
      assignedDoctorId?: number | null;
      currentStatus?: PatientStatus;
      primaryDiagnosis?: string;
    }
  ): Promise<Patient> {
    const numericId =
      Number(patientId);

    if (!Number.isFinite(numericId)) {
      throw new Error(
        'Invalid patient ID'
      );
    }

    const payload: Record<
      string,
      unknown
    > = {};

    if (data.name !== undefined) {
      payload.full_name =
        data.name;
    }

    if (data.age !== undefined) {
      payload.age =
        data.age;
    }

    if (data.gender !== undefined) {
      payload.gender =
        data.gender;
    }

    if (data.contact !== undefined) {
      payload.contact =
        data.contact;
    }

    if (data.ward !== undefined) {
      payload.ward =
        data.ward;
    }

    if (data.bed !== undefined) {
      payload.bed_number =
        data.bed;
    }

    if (
      data.assignedDoctorId !==
      undefined
    ) {
      payload.assigned_doctor_id =
        data.assignedDoctorId;
    }

    if (
      data.primaryDiagnosis !==
      undefined
    ) {
      payload.primary_diagnosis =
        data.primaryDiagnosis;
    }

    if (
      data.currentStatus !==
      undefined
    ) {
      payload.current_status =
        data.currentStatus;
    }

    const response =
      await fetch(
        `${API_BASE_URL}/patients/${numericId}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(payload),
        }
      );

    const backendPatient =
      await handleResponse<BackendPatient>(
        response
      );

    const patient =
      mapPatientFromBackend(
        backendPatient
      );

    try {
      const latestVitals =
        await this.getLatestVitals(
          String(backendPatient.id)
        );

      if (latestVitals) {
        patient.latestVitals =
          latestVitals;

        patient.lastObservationTime =
          latestVitals.timestamp;
      }
    } catch {
      // Keep patient without latest vitals.
    }

    return patient;
  }

  // =======================================================
  // ALERTS
  // =======================================================

  async getAlerts(
    statusFilter?: string,
    existingPatients?: Patient[]
  ): Promise<Alert[]> {
    const params =
      new URLSearchParams();

    if (
      statusFilter &&
      statusFilter !== 'ALL'
    ) {
      params.append(
        'status',
        statusFilter
      );
    }

    const query =
      params.toString();

    const url =
      query
        ? `${API_BASE_URL}/alerts/?${query}`
        : `${API_BASE_URL}/alerts/`;

    const response =
      await fetch(url);

    const backendAlerts =
      await handleResponse<BackendAlert[]>(
        response
      );

    const patients =
      existingPatients ??
      (await this.getPatients());

    return backendAlerts.map(
      alert => {
        const patient =
          patients.find(
            p =>
              p.id ===
              String(alert.patient_id)
          );

        return mapAlertFromBackend(
          alert,
          patient
        );
      }
    );
  }

  async getAlertById(
    alertId: string
  ): Promise<Alert | undefined> {
    const response =
      await fetch(
        `${API_BASE_URL}/alerts/${alertId}`
      );

    if (response.status === 404) {
      return undefined;
    }

    const backendAlert =
      await handleResponse<BackendAlert>(
        response
      );

    const patient =
      await this.getPatientById(
        String(backendAlert.patient_id)
      );

    return mapAlertFromBackend(
      backendAlert,
      patient
    );
  }

  async acknowledgeAlert(
    alertId: string,
    userId?: number
  ): Promise<Alert> {
    const safeUserId =
      userId !== undefined &&
      Number.isFinite(userId)
        ? userId
        : null;

    const response =
      await fetch(
        `${API_BASE_URL}/alerts/${alertId}/acknowledge`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              user_id:
                safeUserId,
            }),
        }
      );

    const backendAlert =
      await handleResponse<BackendAlert>(
        response
      );

    const patient =
      await this.getPatientById(
        String(
          backendAlert.patient_id
        )
      );

    return mapAlertFromBackend(
      backendAlert,
      patient
    );
  }

  async resolveAlert(
    alertId: string
  ): Promise<Alert> {
    const response =
      await fetch(
        `${API_BASE_URL}/alerts/${alertId}/resolve`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({}),
        }
      );

    const backendAlert =
      await handleResponse<BackendAlert>(
        response
      );

    const patient =
      await this.getPatientById(
        String(
          backendAlert.patient_id
        )
      );

    return mapAlertFromBackend(
      backendAlert,
      patient
    );
  }

  // =======================================================
  // MONITORING PLANS
  // =======================================================

  async getMonitoringPlans(
    patientId: string
  ): Promise<MonitoringPlan[]> {
    const numericId =
      Number(patientId);

    if (!Number.isFinite(numericId)) {
      throw new Error(
        'Invalid patient ID'
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/monitoring-plans/patient/${numericId}`
      );

    const backendPlans =
      await handleResponse<BackendMonitoringPlan[]>(
        response
      );

    return backendPlans.map(
      mapMonitoringPlanFromBackend
    );
  }

  async createMonitoringPlan(
    data: {
      patientId: string;
      vitalName: string;

      frequencyMinutes: number;

      warningLow?: number | null;
      warningHigh?: number | null;

      criticalLow?: number | null;
      criticalHigh?: number | null;

      isEnabled?: boolean;
    }
  ): Promise<MonitoringPlan> {
    const patientId =
      Number(data.patientId);

    if (!Number.isFinite(patientId)) {
      throw new Error(
        'Invalid patient ID'
      );
    }

    const payload = {
      patient_id:
        patientId,

      vital_name:
        data.vitalName,

      frequency_minutes:
        Number(
          data.frequencyMinutes
        ),

      warning_low:
        data.warningLow ?? null,

      warning_high:
        data.warningHigh ?? null,

      critical_low:
        data.criticalLow ?? null,

      critical_high:
        data.criticalHigh ?? null,

      is_enabled:
        data.isEnabled ?? true,
    };

    const response =
      await fetch(
        `${API_BASE_URL}/monitoring-plans/`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(payload),
        }
      );

    const backendPlan =
      await handleResponse<BackendMonitoringPlan>(
        response
      );

    return mapMonitoringPlanFromBackend(
      backendPlan
    );
  }

  async deleteMonitoringPlan(
    planId: string
  ): Promise<boolean> {
    const response =
      await fetch(
        `${API_BASE_URL}/monitoring-plans/${planId}`,
        {
          method: 'DELETE',
        }
      );

    await handleResponse<unknown>(
      response
    );

    return true;
  }

  // =======================================================
  // OBSERVATION TASKS
  // =======================================================

  async getTasks(
    filters?: {
      patientId?: string;
      status?: TaskStatus;
    },
    existingPatients?: Patient[]
  ): Promise<ObservationTask[]> {
    const params =
      new URLSearchParams();

    if (filters?.patientId) {
      const numericId =
        Number(filters.patientId);

      if (Number.isFinite(numericId)) {
        params.append(
          'patient_id',
          String(numericId)
        );
      }
    }

    if (filters?.status) {
      params.append(
        'status',
        filters.status
      );
    }

    const query =
      params.toString();

    const url =
      query
        ? `${API_BASE_URL}/tasks/?${query}`
        : `${API_BASE_URL}/tasks/`;

    const response =
      await fetch(url);

    const backendTasks =
      await handleResponse<BackendTask[]>(
        response
      );

    const patients =
      existingPatients ??
      (await this.getPatients());

    return backendTasks.map(
      task => {
        const patient =
          patients.find(
            p =>
              p.id ===
              String(task.patient_id)
          );

        return mapTaskFromBackend(
          task,
          patient
        );
      }
    );
  }

  async getTaskById(
    taskId: string,
    existingPatients?: Patient[]
  ): Promise<
    ObservationTask | undefined
  > {
    const response =
      await fetch(
        `${API_BASE_URL}/tasks/${taskId}`
      );

    if (response.status === 404) {
      return undefined;
    }

    const backendTask =
      await handleResponse<BackendTask>(
        response
      );

    const patients =
      existingPatients ??
      (await this.getPatients());

    const patient =
      patients.find(
        p =>
          p.id ===
          String(
            backendTask.patient_id
          )
      );

    return mapTaskFromBackend(
      backendTask,
      patient
    );
  }

  async createTask(
    data: {
      patientId: string;
      vitalName: string;
      scheduledTime: string;
      assignedNurseId?: string | number;
    }
  ): Promise<ObservationTask> {
    const patientId =
      Number(data.patientId);

    if (!Number.isFinite(patientId)) {
      throw new Error(
        'Invalid patient ID'
      );
    }

    const nurseId =
      data.assignedNurseId !==
      undefined &&
      data.assignedNurseId !== ''
        ? Number(
            data.assignedNurseId
          )
        : null;

    const payload = {
      patient_id:
        patientId,

      vital_name:
        data.vitalName,

      scheduled_time:
        data.scheduledTime,

      assigned_nurse_id:
        nurseId !== null &&
        Number.isFinite(nurseId)
          ? nurseId
          : null,
    };

    const response =
      await fetch(
        `${API_BASE_URL}/tasks/`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(payload),
        }
      );

    const backendTask =
      await handleResponse<BackendTask>(
        response
      );

    return this.getTaskById(
      String(backendTask.id)
    ) as Promise<ObservationTask>;
  }

  async updateTask(
    taskId: string,
    data: {
      assignedNurseId?: string | number;
      status?: TaskStatus;
    },
    existingPatients?: Patient[]
  ): Promise<ObservationTask> {
    const payload: Record<
      string,
      unknown
    > = {};

    if (
      data.assignedNurseId !==
      undefined
    ) {
      const nurseId =
        Number(
          data.assignedNurseId
        );

      payload.assigned_nurse_id =
        Number.isFinite(nurseId)
          ? nurseId
          : null;
    }

    if (data.status !== undefined) {
      payload.status =
        data.status;
    }

    const response =
      await fetch(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(payload),
        }
      );

    const backendTask =
      await handleResponse<BackendTask>(
        response
      );

    const patients =
      existingPatients ??
      (await this.getPatients());

    const patient =
      patients.find(
        p =>
          p.id ===
          String(
            backendTask.patient_id
          )
      );

    return mapTaskFromBackend(
      backendTask,
      patient
    );
  }

  async completeTask(
    taskId: string,
    existingPatients?: Patient[]
  ): Promise<ObservationTask> {
    const response =
      await fetch(
        `${API_BASE_URL}/tasks/${taskId}/complete`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({}),
        }
      );

    const backendTask =
      await handleResponse<BackendTask>(
        response
      );

    const patients =
      existingPatients ??
      (await this.getPatients());

    const patient =
      patients.find(
        p =>
          p.id ===
          String(
            backendTask.patient_id
          )
      );

    return mapTaskFromBackend(
      backendTask,
      patient
    );
  }

  // =======================================================
  // AUDIT LOGS & REPORTS
  // =======================================================

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/audit-logs/`);
      const backendLogs = await handleResponse<any[]>(response);
      return backendLogs.map(log => ({
        id: String(log.id),
        timestamp: log.timestamp,
        user: log.user_id ? `User #${log.user_id}` : 'System Admin',
        role: 'ADMIN',
        action: log.action,
        details: log.details || undefined,
        patientId: log.patient_id ? String(log.patient_id) : undefined,
      }));
    } catch (error) {
      console.warn('Could not fetch audit logs from backend:', error);
      return [];
    }
  }

  async getICUChartData(patientId: string, hours = 24) {
    const response = await fetch(`${API_BASE_URL}/reports/icu-chart/${patientId}?hours=${hours}`);
    return handleResponse<any>(response);
  }

  async saveShiftHandover(handover: any) {
    const response = await fetch(`${API_BASE_URL}/reports/shift-handover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handover),
    });
    return handleResponse<any>(response);
  }
}

// =========================================================
// SINGLETON
// =========================================================

export const apiService =
  new ApiService();