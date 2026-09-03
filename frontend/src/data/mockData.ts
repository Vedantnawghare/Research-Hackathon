import {
  Patient,
  Alert,
  ObservationTask,
  AuditLog,
  User,
  MonitoringPlan
} from '../types';


// =========================================================
// MOCK USERS
// =========================================================

export const MOCK_USERS: Record<string, User> = {
  ADMIN: {
    id: 'USR-001',
    name: 'Vedant Nawghare',
    email: 'admin@shreedha.com',
    role: 'ADMIN',
    department: 'Hospital Operations Command',
    avatarUrl:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'
  },

  DOCTOR: {
    id: 'USR-002',
    name: 'Dr. Shravani Sadawarte',
    email: 'shravani@shreedha.com',
    role: 'DOCTOR',
    specialty: 'Senior Intensivist / Cardiology',
    department: 'Intensive Care Unit (ICU)',
    avatarUrl:
      'https://images.unsplash.com/photo-1594824813570-789880292261?auto=format&fit=crop&q=80&w=200'
  },

  NURSE: {
    id: 'USR-003',
    name: 'Nurse Ananya Marghade',
    email: 'ananya@shreedha.com',
    role: 'NURSE',
    department: 'ICU Shift Leader',
    shift: 'Morning Shift (07:00 - 15:00)',
    avatarUrl:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
  }
};


// =========================================================
// MOCK PATIENTS
// =========================================================

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'PAT-1001',
    name: 'Robert Sterling',
    age: 64,
    gender: 'Male',
    contact: '+1 (555) 234-8901',
    ward: 'ICU',
    bed: 'ICU-01',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'CRITICAL',
    primaryDiagnosis:
      'Acute Respiratory Distress Syndrome (ARDS) & Sepsis',
    admissionDate: '2026-08-30',
    lastObservationTime: '10 mins ago',
    nextObservationDue: 'OVERDUE (5 mins ago)',
    latestVitals: {
      id: 'VIT-9901',
      patientId: 'PAT-1001',
      timestamp: '2026-09-02T18:05:00Z',
      heartRate: 124,
      systolic: 92,
      diastolic: 58,
      temperature: 39.1,
      respiratoryRate: 28,
      spo2: 88,
      glucose: 185,
      urineOutput: 25,
      recordedBy: 'Marcus Chen, RN',
      notes:
        'Patient exhibiting tachycardia and desaturation despite high-flow O2.'
    }
  },

  {
    id: 'PAT-1002',
    name: 'Elena Rostova',
    age: 58,
    gender: 'Female',
    contact: '+1 (555) 456-7890',
    ward: 'ICU',
    bed: 'ICU-02',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'HIGH_RISK',
    primaryDiagnosis:
      'Post-CABG Surgeries / Hemodynamic Instability',
    admissionDate: '2026-08-31',
    lastObservationTime: '20 mins ago',
    nextObservationDue: 'Due in 10 mins',
    latestVitals: {
      id: 'VIT-9902',
      patientId: 'PAT-1002',
      timestamp: '2026-09-02T17:55:00Z',
      heartRate: 108,
      systolic: 145,
      diastolic: 94,
      temperature: 37.8,
      respiratoryRate: 22,
      spo2: 93,
      glucose: 142,
      urineOutput: 40,
      recordedBy: 'Sarah Jenkins, RN'
    }
  },

  {
    id: 'PAT-1003',
    name: 'David K. Miller',
    age: 72,
    gender: 'Male',
    contact: '+1 (555) 890-1234',
    ward: 'ICU',
    bed: 'ICU-03',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'CRITICAL',
    primaryDiagnosis:
      'Septic Shock & Acute Kidney Injury',
    admissionDate: '2026-09-01',
    lastObservationTime: '15 mins ago',
    nextObservationDue: 'Due Now',
    latestVitals: {
      id: 'VIT-9903',
      patientId: 'PAT-1003',
      timestamp: '2026-09-02T18:00:00Z',
      heartRate: 132,
      systolic: 84,
      diastolic: 50,
      temperature: 38.6,
      respiratoryRate: 30,
      spo2: 89,
      glucose: 210,
      urineOutput: 15,
      recordedBy: 'Marcus Chen, RN',
      notes:
        'Anuria observed over past 2 hours. Norepinephrine infusion increased.'
    }
  },

  {
    id: 'PAT-1004',
    name: 'Sophia Martinez',
    age: 42,
    gender: 'Female',
    contact: '+1 (555) 678-9012',
    ward: 'ICU',
    bed: 'ICU-04',
    assignedDoctor: 'Dr. Vikram Patel',
    status: 'STABLE',
    primaryDiagnosis:
      'Severe Asthma Exacerbation (Improving)',
    admissionDate: '2026-09-01',
    lastObservationTime: '45 mins ago',
    nextObservationDue: 'Due in 15 mins',
    latestVitals: {
      id: 'VIT-9904',
      patientId: 'PAT-1004',
      timestamp: '2026-09-02T17:30:00Z',
      heartRate: 78,
      systolic: 118,
      diastolic: 76,
      temperature: 36.8,
      respiratoryRate: 16,
      spo2: 98,
      glucose: 105,
      urineOutput: 60,
      recordedBy: 'Marcus Chen, RN'
    }
  },

  {
    id: 'PAT-1005',
    name: "James L. O'Connor",
    age: 81,
    gender: 'Male',
    contact: '+1 (555) 321-6549',
    ward: 'ICU',
    bed: 'ICU-05',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'ATTENTION',
    primaryDiagnosis:
      'Congestive Heart Failure Exacerbation',
    admissionDate: '2026-08-29',
    lastObservationTime: '30 mins ago',
    nextObservationDue: 'Due in 30 mins',
    latestVitals: {
      id: 'VIT-9905',
      patientId: 'PAT-1005',
      timestamp: '2026-09-02T17:45:00Z',
      heartRate: 94,
      systolic: 138,
      diastolic: 86,
      temperature: 37.1,
      respiratoryRate: 20,
      spo2: 94,
      glucose: 128,
      urineOutput: 45,
      recordedBy: 'Sarah Jenkins, RN'
    }
  },

  {
    id: 'PAT-1006',
    name: 'Mei Lin Wang',
    age: 51,
    gender: 'Female',
    contact: '+1 (555) 987-6543',
    ward: 'ICU',
    bed: 'ICU-06',
    assignedDoctor: 'Dr. Vikram Patel',
    status: 'STABLE',
    primaryDiagnosis:
      'Post Intracerebral Hemorrhage Evacuation',
    admissionDate: '2026-08-28',
    lastObservationTime: '1 hour ago',
    nextObservationDue: 'Due in 1 hour',
    latestVitals: {
      id: 'VIT-9906',
      patientId: 'PAT-1006',
      timestamp: '2026-09-02T17:15:00Z',
      heartRate: 72,
      systolic: 122,
      diastolic: 78,
      temperature: 36.9,
      respiratoryRate: 14,
      spo2: 99,
      glucose: 110,
      urineOutput: 55,
      recordedBy: 'Marcus Chen, RN'
    }
  },

  {
    id: 'PAT-1007',
    name: 'Arthur Pendelton',
    age: 69,
    gender: 'Male',
    contact: '+1 (555) 765-4321',
    ward: 'ICU',
    bed: 'ICU-07',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'HIGH_RISK',
    primaryDiagnosis:
      'Massive Pulmonary Embolism (Post-Thrombolysis)',
    admissionDate: '2026-09-01',
    lastObservationTime: '25 mins ago',
    nextObservationDue: 'Due in 5 mins',
    latestVitals: {
      id: 'VIT-9907',
      patientId: 'PAT-1007',
      timestamp: '2026-09-02T17:50:00Z',
      heartRate: 112,
      systolic: 104,
      diastolic: 66,
      temperature: 37.4,
      respiratoryRate: 24,
      spo2: 91,
      glucose: 135,
      urineOutput: 35,
      recordedBy: 'Marcus Chen, RN'
    }
  },

  {
    id: 'PAT-1008',
    name: 'Aisha Al-Mansoor',
    age: 36,
    gender: 'Female',
    contact: '+1 (555) 543-2109',
    ward: 'ICU',
    bed: 'ICU-08',
    assignedDoctor: 'Dr. Vikram Patel',
    status: 'STABLE',
    primaryDiagnosis:
      'Polytrauma / Post-Operative Splenectomy',
    admissionDate: '2026-08-30',
    lastObservationTime: '40 mins ago',
    nextObservationDue: 'Due in 20 mins',
    latestVitals: {
      id: 'VIT-9908',
      patientId: 'PAT-1008',
      timestamp: '2026-09-02T17:35:00Z',
      heartRate: 82,
      systolic: 116,
      diastolic: 74,
      temperature: 37.0,
      respiratoryRate: 16,
      spo2: 97,
      glucose: 98,
      urineOutput: 70,
      recordedBy: 'Sarah Jenkins, RN'
    }
  },

  {
    id: 'PAT-1009',
    name: 'George Washington Carver',
    age: 77,
    gender: 'Male',
    contact: '+1 (555) 876-5432',
    ward: 'ICU',
    bed: 'ICU-09',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'ATTENTION',
    primaryDiagnosis:
      'Diabetic Ketoacidosis & Hyperkalemia',
    admissionDate: '2026-09-02',
    lastObservationTime: '15 mins ago',
    nextObservationDue: 'Due in 45 mins',
    latestVitals: {
      id: 'VIT-9909',
      patientId: 'PAT-1009',
      timestamp: '2026-09-02T18:00:00Z',
      heartRate: 98,
      systolic: 130,
      diastolic: 82,
      temperature: 37.2,
      respiratoryRate: 22,
      spo2: 96,
      glucose: 265,
      urineOutput: 50,
      recordedBy: 'Marcus Chen, RN'
    }
  },

  {
    id: 'PAT-1010',
    name: 'Clara Oswald',
    age: 29,
    gender: 'Female',
    contact: '+1 (555) 432-1098',
    ward: 'ICU',
    bed: 'ICU-10',
    assignedDoctor: 'Dr. Vikram Patel',
    status: 'STABLE',
    primaryDiagnosis:
      'Guillain-Barré Syndrome (Monitoring)',
    admissionDate: '2026-08-27',
    lastObservationTime: '50 mins ago',
    nextObservationDue: 'Due in 10 mins',
    latestVitals: {
      id: 'VIT-9910',
      patientId: 'PAT-1010',
      timestamp: '2026-09-02T17:25:00Z',
      heartRate: 76,
      systolic: 114,
      diastolic: 72,
      temperature: 36.7,
      respiratoryRate: 15,
      spo2: 98,
      glucose: 102,
      urineOutput: 65,
      recordedBy: 'Sarah Jenkins, RN'
    }
  },

  {
    id: 'PAT-1011',
    name: 'Benjamin Harrison',
    age: 67,
    gender: 'Male',
    contact: '+1 (555) 210-9876',
    ward: 'Cardiology',
    bed: 'CARD-102',
    assignedDoctor: 'Dr. Ananya Sharma',
    status: 'HIGH_RISK',
    primaryDiagnosis:
      'Non-ST Elevation Myocardial Infarction (NSTEMI)',
    admissionDate: '2026-09-01',
    lastObservationTime: '35 mins ago',
    nextObservationDue: 'Due in 25 mins',
    latestVitals: {
      id: 'VIT-9911',
      patientId: 'PAT-1011',
      timestamp: '2026-09-02T17:40:00Z',
      heartRate: 105,
      systolic: 162,
      diastolic: 98,
      temperature: 37.3,
      respiratoryRate: 21,
      spo2: 94,
      glucose: 155,
      urineOutput: 40,
      recordedBy: 'Marcus Chen, RN'
    }
  },

  {
    id: 'PAT-1012',
    name: 'Hannah Abbott',
    age: 53,
    gender: 'Female',
    contact: '+1 (555) 109-8765',
    ward: 'Neurology',
    bed: 'NEURO-304',
    assignedDoctor: 'Dr. Vikram Patel',
    status: 'STABLE',
    primaryDiagnosis:
      'Acute Ischemic Stroke (Post-TPA)',
    admissionDate: '2026-08-31',
    lastObservationTime: '1 hour ago',
    nextObservationDue: 'Due in 1 hour',
    latestVitals: {
      id: 'VIT-9912',
      patientId: 'PAT-1012',
      timestamp: '2026-09-02T17:15:00Z',
      heartRate: 70,
      systolic: 125,
      diastolic: 80,
      temperature: 36.8,
      respiratoryRate: 16,
      spo2: 99,
      glucose: 115,
      urineOutput: 50,
      recordedBy: 'Sarah Jenkins, RN'
    }
  }
];


// =========================================================
// MOCK ALERTS
// =========================================================

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-8001',
    patientId: 'PAT-1001',
    patientName: 'Robert Sterling',
    bed: 'ICU-01',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    parameter: 'Oxygen Saturation (SpO2)',
    currentValue: '88%',
    thresholdExceeded: 'Critical Low (< 90%)',
    timestamp: '2026-09-02T18:05:12Z'
  },

  {
    id: 'ALT-8002',
    patientId: 'PAT-1003',
    patientName: 'David K. Miller',
    bed: 'ICU-03',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    parameter: 'Blood Pressure (MAP)',
    currentValue: '84/50 mmHg (MAP 61)',
    thresholdExceeded:
      'Critical Low MAP (< 65 mmHg)',
    timestamp: '2026-09-02T18:01:05Z'
  },

  {
    id: 'ALT-8003',
    patientId: 'PAT-1001',
    patientName: 'Robert Sterling',
    bed: 'ICU-01',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    parameter: 'Heart Rate',
    currentValue: '124 bpm',
    thresholdExceeded:
      'High Warning (> 110 bpm)',
    timestamp: '2026-09-02T17:50:00Z',
    acknowledgedBy: 'Dr. Ananya Sharma',
    acknowledgedAt: '2026-09-02T17:52:10Z'
  },

  {
    id: 'ALT-8004',
    patientId: 'PAT-1007',
    patientName: 'Arthur Pendelton',
    bed: 'ICU-07',
    severity: 'WARNING',
    status: 'ACTIVE',
    parameter: 'Respiratory Rate',
    currentValue: '24 breaths/min',
    thresholdExceeded:
      'Warning High (> 22 /min)',
    timestamp: '2026-09-02T17:51:30Z'
  },

  {
    id: 'ALT-8005',
    patientId: 'PAT-1011',
    patientName: 'Benjamin Harrison',
    bed: 'CARD-102',
    severity: 'WARNING',
    status: 'ACKNOWLEDGED',
    parameter: 'Systolic Blood Pressure',
    currentValue: '162 mmHg',
    thresholdExceeded:
      'Warning High (> 150 mmHg)',
    timestamp: '2026-09-02T17:41:00Z',
    acknowledgedBy: 'Marcus Chen, RN',
    acknowledgedAt: '2026-09-02T17:43:15Z'
  },

  {
    id: 'ALT-8006',
    patientId: 'PAT-1002',
    patientName: 'Elena Rostova',
    bed: 'ICU-02',
    severity: 'INFO',
    status: 'RESOLVED',
    parameter: 'Glucose Level',
    currentValue: '142 mg/dL',
    thresholdExceeded:
      'Threshold Normalized',
    timestamp: '2026-09-02T16:30:00Z',
    acknowledgedBy: 'Sarah Jenkins, RN',
    acknowledgedAt: '2026-09-02T16:35:00Z'
  }
];


// =========================================================
// MOCK TASKS
// =========================================================

export const MOCK_TASKS: ObservationTask[] = [
  {
    id: 'TSK-501',
    patientId: 'PAT-1001',
    patientName: 'Robert Sterling',
    bed: 'ICU-01',
    ward: 'ICU',
    taskName: 'q15m Vital Signs & ABG Check',
    vitalName: 'Full Vitals',
    scheduledTime: '18:10 (Overdue)',
    status: 'OVERDUE',
    priority: 'CRITICAL'
  },

  {
    id: 'TSK-502',
    patientId: 'PAT-1003',
    patientName: 'David K. Miller',
    bed: 'ICU-03',
    ward: 'ICU',
    taskName: 'q30m Blood Pressure & Urine Output',
    vitalName: 'Blood Pressure',
    scheduledTime: '18:15 (Due Now)',
    status: 'DUE_NOW',
    priority: 'CRITICAL'
  },

  {
    id: 'TSK-503',
    patientId: 'PAT-1007',
    patientName: 'Arthur Pendelton',
    bed: 'ICU-07',
    ward: 'ICU',
    taskName: 'q30m SpO2 & Respiratory Monitoring',
    vitalName: 'SpO2',
    scheduledTime: '18:20',
    status: 'UPCOMING',
    priority: 'HIGH_RISK'
  },

  {
    id: 'TSK-504',
    patientId: 'PAT-1002',
    patientName: 'Elena Rostova',
    bed: 'ICU-02',
    ward: 'ICU',
    taskName: 'q1h Full Bedside Vital Checks',
    vitalName: 'Full Vitals',
    scheduledTime: '18:25',
    status: 'UPCOMING',
    priority: 'HIGH_RISK'
  },

  {
    id: 'TSK-505',
    patientId: 'PAT-1005',
    patientName: "James L. O'Connor",
    bed: 'ICU-05',
    ward: 'ICU',
    taskName: 'q1h Vital Signs Observation',
    vitalName: 'Full Vitals',
    scheduledTime: '18:30',
    status: 'UPCOMING',
    priority: 'ATTENTION'
  },

  {
    id: 'TSK-506',
    patientId: 'PAT-1004',
    patientName: 'Sophia Martinez',
    bed: 'ICU-04',
    ward: 'ICU',
    taskName: 'q2h Routine Observation',
    vitalName: 'Routine Vitals',
    scheduledTime: '17:30',
    status: 'COMPLETED',
    priority: 'STABLE',
    completedAt: '17:30'
  }
];


// =========================================================
// MOCK AUDIT LOGS
// =========================================================

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-709',
    timestamp: '2026-09-02 18:05:15',
    user: 'Marcus Chen, RN',
    role: 'NURSE',
    action: 'RECORD_VITALS',
    patientName: 'Robert Sterling',
    patientId: 'PAT-1001',
    details:
      'Entered vital signs: HR 124 bpm, BP 92/58, SpO2 88%, Temp 39.1°C'
  },

  {
    id: 'AUD-708',
    timestamp: '2026-09-02 18:05:12',
    user: 'SYSTEM AI',
    role: 'ADMIN',
    action: 'ALERT_GENERATED',
    patientName: 'Robert Sterling',
    patientId: 'PAT-1001',
    details:
      'Generated CRITICAL alert ALT-8001: SpO2 88% below threshold (<90%)'
  },

  {
    id: 'AUD-707',
    timestamp: '2026-09-02 17:52:10',
    user: 'Dr. Ananya Sharma',
    role: 'DOCTOR',
    action: 'ALERT_ACKNOWLEDGED',
    patientName: 'Robert Sterling',
    patientId: 'PAT-1001',
    details:
      'Acknowledged alert ALT-8003 (Tachycardia). Increased O2 flow rate.'
  },

  {
    id: 'AUD-706',
    timestamp: '2026-09-02 17:40:00',
    user: 'Dr. Ananya Sharma',
    role: 'DOCTOR',
    action: 'MONITORING_PLAN_MODIFIED',
    patientName: 'David K. Miller',
    patientId: 'PAT-1003',
    details:
      'Escalated observation frequency to q15m for Blood Pressure and MAP.'
  },

  {
    id: 'AUD-705',
    timestamp: '2026-09-02 16:50:00',
    user: 'Dr. Evelyn Vance',
    role: 'ADMIN',
    action: 'USER_ROLE_UPDATED',
    details:
      'Granted Dr. Vikram Patel Lead Intensivist privileges for Ward ICU.'
  }
];


