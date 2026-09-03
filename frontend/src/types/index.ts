// =========================================================
// ENUM / UNION TYPES
// =========================================================

export type UserRole =
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE';


export type PatientStatus =
  | 'STABLE'
  | 'ATTENTION'
  | 'HIGH_RISK'
  | 'CRITICAL';


export type TaskStatus =
  | 'DUE_NOW'
  | 'UPCOMING'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'MISSED';


export type TaskPriority =
  | 'STABLE'
  | 'ATTENTION'
  | 'HIGH_RISK'
  | 'CRITICAL';


export type AlertSeverity =
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL';


export type AlertStatus =
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'ESCALATED';



// =========================================================
// USER
// =========================================================

export interface User {
  id: string;

  name: string;

  email: string;

  role: UserRole;

  department?: string;

  specialty?: string;

  shift?: string;

  avatar?: string;

  avatarUrl?: string;

  isActive?: boolean;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  specialty?: string;
  shift?: string;
}



// =========================================================
// VITAL RECORD
// =========================================================

export interface VitalRecord {
  id: string;

  patientId: string;

  timestamp: string;

  heartRate: number;

  systolic: number;

  diastolic: number;

  temperature: number;

  respiratoryRate: number;

  spo2: number;

  glucose?: number;

  urineOutput?: number;

  recordedBy?: string;

  notes?: string;
}



// =========================================================
// PATIENT
// =========================================================

export interface Patient {
  id: string;

  patientCode?: string;

  name: string;

  age: number;

  gender:
    | 'Male'
    | 'Female'
    | 'Other';

  contact?: string;

  ward: string;

  bed: string;

  assignedDoctor: string;

  consultingDoctors?: string[];

  qrCodeData?: string;

  status: PatientStatus;

  primaryDiagnosis: string;

  admissionDate: string;

  lastObservationTime: string;

  nextObservationDue: string;

  latestVitals: VitalRecord;
}



// =========================================================
// PATIENT CREATE
// =========================================================

export interface PatientCreate {
  name: string;

  age: number;

  gender:
    | 'Male'
    | 'Female'
    | 'Other';

  contact?: string;

  ward: string;

  bed: string;

  assignedDoctor?: string;

  primaryDiagnosis?: string;
}



// =========================================================
// MONITORING PLAN PARAMETER
// =========================================================

export interface MonitoringParameter {
  enabled: boolean;

  frequency: string;

  warningLow?: number;

  warningHigh?: number;

  criticalLow?: number;

  criticalHigh?: number;
}



// =========================================================
// MONITORING PLAN
// =========================================================

export interface MonitoringPlan {
  id: string;
  patientId: string;
  vitalName: string;
  isEnabled: boolean;
  frequencyMinutes: number;

  warningLow: number | null;
  warningHigh: number | null;

  criticalLow: number | null;
  criticalHigh: number | null;

  createdAt: string;
}



// =========================================================
// ALERT
// =========================================================

export interface Alert {
  id: string;

  patientId: string;

  patientName: string;

  bed: string;

  severity: AlertSeverity;

  status: AlertStatus;

  parameter: string;

  currentValue: string;

  thresholdExceeded: string;

  timestamp: string;

  acknowledgedBy?: string;

  acknowledgedAt?: string;

  notes?: string;
}



// =========================================================
// OBSERVATION TASK
// =========================================================

export interface ObservationTask {
  id: string;

  patientId: string;

  patientName: string;

  bed: string;

  ward: string;

  taskName: string;

  vitalName?: string;

  scheduledTime: string;

  completedAt?: string;

  status: TaskStatus;

  priority: TaskPriority;

  assignedNurseId?: string;
}



// =========================================================
// AUDIT LOG
// =========================================================

export interface AuditLog {
  id: string;

  timestamp: string;

  user: string;

  role: UserRole;

  action: string;

  patientName?: string;

  patientId?: string;

  details?: string;
}



// =========================================================
// SHIFT HANDOVER
// =========================================================

export interface ShiftHandover {
  shiftDate: string;

  shiftType:
    | 'Day Shift (07:00 - 15:00)'
    | 'Evening Shift (15:00 - 23:00)'
    | 'Night Shift (23:00 - 07:00)';

  outgoingNurse: string;

  incomingNurse: string;

  totalCompletedObservations: number;

  pendingObservations: number;

  missedObservations: number;

  activeAlertsCount: number;

  criticalPatients: Array<{
    patientId: string;

    patientName: string;

    bedNumber: string;

    issue: string;

    latestStatus: PatientStatus;

    recommendedAction: string;
  }>;

  handoverNotes: string;
}