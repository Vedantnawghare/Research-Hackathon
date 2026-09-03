# 🏥 VitalCare AI
## Smart Patient Vital Monitoring & Clinical Dashboard System

> A full-stack hospital automation solution designed to digitalize ICU patient monitoring, automate scheduled observations, detect abnormal vital signs, generate alerts, and provide role-based clinical dashboards.

<p align="center">
  <a href="https://research-hackathon.vercel.app/">🌐 Live Demo</a> •
  <a href="https://github.com/Vedantnawghare/Research-Hackathon">💻 Repository</a>
</p>

----------

## 📌 Problem Statement

In conventional ICU workflows, nurses often record patient vital signs manually at scheduled intervals using paper charts. Doctors later review these records to make clinical decisions. This process can lead to:

- Delays in accessing patient information
- Missed or overdue observations
- Increased paperwork
- Difficulty in tracking historical trends
- Delayed identification of abnormal vital signs
- Communication gaps between nurses and doctors

**VitalCare AI** addresses this problem through a centralized digital patient monitoring system.

The system enables healthcare staff to:

- Digitally record patient vital signs
- Configure patient-specific monitoring plans
- Automatically generate scheduled observation tasks
- Detect abnormal values using configurable thresholds
- Generate warning and critical alerts
- Escalate unattended critical alerts
- Monitor missed and overdue observations
- Provide separate dashboards for Admins, Doctors, and Nurses
- Maintain audit logs
- Generate digital ICU charts
- Support shift handover records

> ⚠️ **Important:** This project is a hackathon/prototype hospital automation system and is **not intended for direct clinical deployment or medical decision-making without proper validation, security hardening, regulatory compliance, and clinical approval**.

---

# 🎯 Project Objectives

## Primary Objectives

- Automate the manual patient vital monitoring workflow
- Digitally record patient vital signs
- Provide scheduled observation reminders
- Detect abnormal vital signs
- Generate warning and critical alerts
- Maintain electronic patient monitoring records
- Provide real-time clinical dashboards
- Generate digital ICU charts and monitoring reports

## Secondary Objectives

- Reduce manual paperwork
- Minimize missed observations
- Improve doctor–nurse coordination
- Enable faster access to patient information
- Improve monitoring accuracy and data availability
- Maintain an audit trail of important system actions

---

# ✨ Key Features

## 👤 Role-Based User Management

The application supports multiple hospital roles:

### 🛡️ Admin
- Manage users
- Monitor hospital-level activity
- Access administrative dashboards
- Review audit information

### 👨‍⚕️ Doctor
- Monitor assigned patients
- Review patient status and vital history
- Configure monitoring plans
- Review alerts
- Access digital ICU charts

### 👩‍⚕️ Nurse
- View assigned monitoring tasks
- Record patient vital signs
- Track due and overdue observations
- Participate in shift handovers

---

## 🧑‍🦽 Patient Management

The system maintains centralized patient information including:

- Patient code
- Full name
- Age and gender
- Ward and bed number
- Assigned doctor
- Admission information
- Current monitoring status

Patient records can be viewed through dedicated patient pages and profiles.

---

## ❤️ Digital Vital Sign Monitoring

The application supports recording and tracking of:

- Heart Rate
- Systolic Blood Pressure
- Diastolic Blood Pressure
- Temperature
- Respiratory Rate
- SpO₂
- Blood Glucose
- Urine Output
- Clinical Notes

Each vital entry is stored with its timestamp and patient association.

---

## 📋 Doctor-Configured Monitoring Plans

Doctors can configure monitoring plans for individual patients.

Each plan contains:

- Vital parameter
- Monitoring frequency
- Warning lower threshold
- Warning upper threshold
- Critical lower threshold
- Critical upper threshold
- Enable/disable status

This allows monitoring rules to be configured dynamically instead of being completely hardcoded into the application logic.

---

## ⏰ Automated Observation Scheduler

A background scheduler runs periodically and performs automated monitoring operations.

It:

1. Reads active monitoring plans
2. Generates upcoming observation tasks
3. Marks observations as due
4. Detects overdue observations
5. Marks severely delayed observations as missed
6. Generates alerts for missed/overdue observations
7. Escalates unattended critical alerts
8. Performs operational monitoring checks

---

## 🚨 Intelligent Alert Management

When recorded vital signs exceed configured thresholds, the system generates alerts.

### Alert Levels

| Severity | Meaning |
|---|---|
| 🟡 WARNING | Value is outside the configured warning range |
| 🔴 CRITICAL | Value is outside the configured critical range |
| 🟢 INFO | Informational system event where applicable |

### Alert Lifecycle

```text
ACTIVE
   │
   ├── Acknowledged by staff
   │
   ├── Resolved
   │
   └── Escalated when a critical alert remains unattended
```

The scheduler also performs operational checks such as:

- Critical patient without an assigned doctor
- Device/sensor telemetry inactivity

---

## 📊 Role-Based Clinical Dashboards

The frontend provides dedicated interfaces for:

- Admin Dashboard
- Doctor Dashboard
- Nurse Dashboard

Additional pages include:

- Patients
- Patient Profile
- Record Vitals
- Alert Center
- Monitoring Plans
- Audit Logs
- Reports
- Shift Handover

---

## 📈 Digital ICU Chart

The reporting module can generate a structured digital ICU chart containing:

- Patient information
- Selected monitoring timeframe
- Vital sign history
- Timestamped observations
- Blood pressure values
- Recent alerts
- Total records

This replaces the concept of manually maintained ICU observation charts with a centralized digital representation.

---

## 🔍 Audit Trail

Important system activities are recorded for traceability.

Examples include:

- Vital signs recorded
- Monitoring plans created
- Monitoring plans deleted
- Missed observation alerts generated
- Critical alerts escalated
- Shift handovers submitted

---

## 🔄 Shift Handover

The system supports recording shift handover information such as:

- Shift date
- Shift type
- Outgoing nurse
- Incoming nurse
- Completed observations
- Pending observations
- Missed observations
- Active alerts
- Handover notes

This improves continuity between nursing shifts.

---

# 🔄 Complete System Flow

The following flow represents the end-to-end workflow of the project.

```text
                              ┌───────────────┐
                              │     START     │
                              └───────┬───────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  Patient Registration  │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │   Patient Admission    │
                         │   Bed / Ward Details   │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Doctor Creates a       │
                         │ Monitoring Plan        │
                         │ • Vital Parameter      │
                         │ • Frequency            │
                         │ • Thresholds           │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Nurse Assignment /     │
                         │ Observation Workflow   │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Automated Scheduler    │
                         │ Generates Tasks        │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Nurse Records Vitals   │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Vital Evaluation Engine│
                         │ Compares Values with   │
                         │ Patient-Specific Rules │
                         └───────────┬────────────┘
                                     │
                                     ▼
                              ┌───────────────┐
                              │ Vitals Normal?│
                              └───────┬───────┘
                                  YES │ NO
                         ┌────────────┘ └─────────────┐
                         ▼                            ▼
               ┌───────────────────┐      ┌─────────────────────┐
               │ Save Vital Record │      │ Generate Alert      │
               │ Update Dashboard  │      │ WARNING / CRITICAL  │
               └─────────┬─────────┘      └──────────┬──────────┘
                         │                           │
                         └──────────────┬────────────┘
                                        ▼
                         ┌────────────────────────┐
                         │ Update Patient Status  │
                         │ STABLE / HIGH RISK /   │
                         │ CRITICAL               │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Critical Alert Still   │
                         │ Unacknowledged?        │
                         └───────────┬────────────┘
                                 YES │ NO
                         ┌───────────┘ └───────────┐
                         ▼                         ▼
              ┌──────────────────────┐   ┌──────────────────────┐
              │ Escalate Alert       │   │ Continue Monitoring   │
              │ Doctor Notification  │   └───────────┬──────────┘
              └──────────┬───────────┘               │
                         └──────────────┬────────────┘
                                        ▼
                         ┌────────────────────────┐
                         │ Update Dashboards      │
                         │ Trends • Alerts • Tasks│
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Doctor Reviews Status  │
                         │ and Takes Decisions    │
                         └───────────┬────────────┘
                                     │
                                     ▼
                         ┌────────────────────────┐
                         │ Generate Reports &     │
                         │ Digital ICU Chart      │
                         └───────────┬────────────┘
                                     │
                                     ▼
                              ┌───────────────┐
                              │      END      │
                              └───────────────┘
```

---

# 🧠 Detailed Backend Flow

## 1. Monitoring Plan Creation

```text
Doctor
   │
   ▼
Create Monitoring Plan
   │
   ▼
Select Vital Parameter
   │
   ▼
Set Frequency + Thresholds
   │
   ▼
Save to Database
   │
   ▼
Audit Log Created
   │
   ▼
Scheduler Uses Active Plan
```

---

## 2. Vital Recording and Evaluation Flow

```text
Nurse Records Vitals
        │
        ▼
FastAPI Receives Request
        │
        ▼
Validate Patient
        │
        ▼
Save Vital Record
        │
        ▼
Fetch Active Monitoring Plans
        │
        ▼
Evaluate Each Configured Vital
        │
        ▼
┌─────────────────────────────────┐
│ Is the value outside thresholds?│
└───────────────┬─────────────────┘
        NO      │       YES
        │       ▼
        │   Create Alert
        │   WARNING / CRITICAL
        │       │
        └───────┼───────────────┐
                ▼               │
        Update Patient Status   │
                │               │
                ▼               │
          Create Audit Log ◄────┘
                │
                ▼
          Commit to Database
                │
                ▼
        Updated Data Returned
                │
                ▼
         Frontend Refreshes
```

---

## 3. Scheduler and Escalation Flow

```text
Background Scheduler
        │
        │ Runs periodically
        ▼
Read Active Monitoring Plans
        │
        ▼
Generate Observation Tasks
        │
        ▼
Check Task Time
        │
        ├── Upcoming
        ├── Due
        ├── Overdue
        └── Missed
        │
        ▼
Generate Overdue/Missed Alerts
        │
        ▼
Check Critical Active Alerts
        │
        ▼
Unacknowledged for Escalation Window?
        │
   YES  ▼
        Escalate Alert
        │
        ▼
Record Audit Event
        │
        ▼
Operational Checks
        ├── Critical patient without assigned doctor
        └── No recent telemetry transmission
        │
        ▼
      Commit Changes
```

---

# 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────┐
│                    USER INTERFACE                    │
│                                                      │
│  Admin │ Doctor │ Nurse                              │
└─────────────────────────┬────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│              REACT + TYPESCRIPT FRONTEND             │
│                                                      │
│  Dashboards │ Patients │ Alerts │ Reports            │
│  Monitoring Plans │ Shift Handover │ Audit Logs      │
└─────────────────────────┬────────────────────────────┘
                          │
                          │ HTTP / REST API
                          ▼
┌──────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND                   │
│                                                      │
│  Auth Router                                         │
│  Patients Router                                     │
│  Monitoring Router                                   │
│  Vitals Router                                       │
│  Alerts Router                                       │
│  Tasks Router                                        │
│  Audit Router                                        │
│  Reports Router                                      │
└─────────────────────────┬────────────────────────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
     ┌────────────┐ ┌────────────┐ ┌────────────┐
     │ Vital      │ │ Background │ │ Audit      │
     │ Evaluation │ │ Scheduler  │ │ Service    │
     │ Engine     │ │ APScheduler│ │            │
     └──────┬─────┘ └──────┬─────┘ └──────┬─────┘
            └──────────────┼──────────────┘
                           ▼
                  ┌─────────────────┐
                  │ SQLite Database │
                  │   vitalcare.db  │
                  └─────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

| Technology | Usage |
|---|---|
| React 18 | Component-based UI |
| TypeScript | Type safety |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| Framer Motion | UI animations |
| Lucide React | Icons |
| Recharts | Data visualization |
| Axios / Fetch | API communication |
| Three.js | 3D/visual capabilities included in dependencies |

## Backend

| Technology | Usage |
|---|---|
| Python 3.11 | Backend runtime |
| FastAPI | REST API framework |
| SQLAlchemy | ORM and database interaction |
| Pydantic | Request/response validation |
| APScheduler | Background monitoring scheduler |
| Python-JOSE | JWT-related authentication support |
| Passlib / BCrypt | Password/security dependencies |
| ReportLab | Report generation dependency |
| Uvicorn | ASGI server |

## Database

| Technology | Usage |
|---|---|
| SQLite | Local persistent database |

## DevOps / Deployment

| Technology | Usage |
|---|---|
| Docker | Containerization |
| Docker Compose | Multi-service orchestration |
| Nginx | Frontend production container |
| Vercel | Live frontend deployment |

---

# 📁 Project Structure

```text
Research-Hackathon/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── Database models
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── monitoring.py
│   │   │   ├── vitals.py
│   │   │   ├── alerts.py
│   │   │   ├── tasks.py
│   │   │   ├── audit.py
│   │   │   └── reports.py
│   │   │
│   │   ├── schemas/
│   │   │   └── Request and response schemas
│   │   │
│   │   ├── services/
│   │   │   ├── scheduler.py
│   │   │   ├── vital_engine.py
│   │   │   └── audit.py
│   │   │
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── seed_db.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── vitalcare.db
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# ⚙️ How to Run Locally

## Prerequisites

Make sure the following are installed:

- Python 3.11 or compatible Python environment
- Node.js 20+ recommended
- npm
- Git

---

# 🚀 Method 1: Run Without Docker

## Step 1: Clone the Repository

```bash
git clone https://github.com/Vedantnawghare/Research-Hackathon.git
cd Research-Hackathon
```

---

## Step 2: Run the Backend

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS / Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Seed the database:

```bash
python seed_db.py
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will run on:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET /health
```

---

## Step 3: Run the Frontend

Open a **new terminal** and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display the local frontend address in the terminal.

By default, the frontend API client uses:

```text
http://127.0.0.1:8000
```

You can override this using:

```text
VITE_API_BASE_URL
```

Example:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

---

# 🐳 Method 2: Run With Docker

From the project root:

```bash
docker-compose up --build
```

This starts:

- Backend on port `8000`
- Frontend on port `5173`

The compose configuration mounts the SQLite database file for backend persistence.

To stop the containers:

```bash
docker-compose down
```

---

# 🗃️ Database Initialization

The project includes:

```text
backend/seed_db.py
```

The seeding script initializes the database with sample hospital data including:

- Admin account
- Doctors
- Nurses
- Patients
- Monitoring plans
- Vital records
- Alerts
- Observation tasks
- Audit logs

The script skips reseeding when user data already exists.

---

# 🔐 Demo Credentials

The seeded development database includes demo accounts.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@shreedha.com` | `admin123` |
| Doctor | `shravani@shreedha.com` | `doc123` |
| Doctor | `rajesh@shreedha.com` | `doc123` |
| Nurse | `ananya@shreedha.com` | `nurse123` |
| Nurse | `sunita@shreedha.com` | `nurse123` |

> ⚠️ These are **development/demo credentials only** and must never be used in a production system.

---

# 🔌 API Overview

## Health

```text
GET /health
```

Checks backend service availability.

---

## Authentication

```text
POST /auth/login
POST /auth/register
GET  /auth/users
PATCH /auth/users/{user_id}
```

---

## Patients

The backend includes dedicated patient management routes for patient retrieval and management.

Typical frontend operations include:

- Fetch patients
- Filter by ward
- Filter by status
- Search patients
- Access patient profiles

---

## Monitoring Plans

```text
POST   /monitoring-plans/
GET    /monitoring-plans/patient/{patient_id}
DELETE /monitoring-plans/{plan_id}
```

---

## Vitals

### Record Vital Signs

```text
POST /vitals/
```

### Get Patient Vital History

```text
GET /vitals/patient/{patient_id}
```

### Get Latest Vital Record

```text
GET /vitals/patient/{patient_id}/latest
```

---

## Scheduler

The monitoring scheduler can also be triggered manually:

```text
POST /scheduler/run
```

The application additionally starts a background scheduler that periodically runs monitoring and escalation logic.

---

## Reports

### Digital ICU Chart

```text
GET /reports/icu-chart/{patient_id}
```

Optional query:

```text
?hours=24
```

### Shift Handover

```text
POST /reports/shift-handover
GET  /reports/shift-handover
```

---

# 🧬 Vital Evaluation Logic

Vital values are evaluated against thresholds configured in the patient's monitoring plan.

```text
Input Vital Value
       │
       ▼
Is Monitoring Enabled?
       │
       ├── No → No Evaluation
       │
       └── Yes
              │
              ▼
       Check Critical Range
              │
       ┌──────┴──────┐
       YES           NO
        │             │
        ▼             ▼
    CRITICAL      Check Warning Range
    ALERT             │
                 ┌────┴────┐
                YES        NO
                 │          │
                 ▼          ▼
              WARNING     NORMAL
               ALERT
```

The evaluation order prioritizes:

1. Critical low threshold
2. Critical high threshold
3. Warning low threshold
4. Warning high threshold

This ensures that the most severe applicable condition is identified.

---

# 📊 Supported Vital Parameters

| Parameter | Typical Unit |
|---|---|
| Heart Rate | bpm |
| SpO₂ | % |
| Temperature | °C |
| Respiratory Rate | breaths/min |
| Systolic Blood Pressure | mmHg |
| Diastolic Blood Pressure | mmHg |
| Blood Glucose | mg/dL |
| Urine Output | mL/h |

> Thresholds are configured through monitoring plans and are not presented as universal clinical recommendations.

---

# 🔁 Data Flow

```text
USER ACTION
    │
    ▼
REACT FRONTEND
    │
    ▼
API SERVICE LAYER
    │
    ▼
FASTAPI ROUTER
    │
    ▼
VALIDATION + BUSINESS LOGIC
    │
    ├── Vital Evaluation Engine
    ├── Monitoring Scheduler
    └── Audit Service
    │
    ▼
SQLALCHEMY ORM
    │
    ▼
SQLITE DATABASE
    │
    ▼
UPDATED RESPONSE
    │
    ▼
FRONTEND DASHBOARD
```

---

# 🖥️ Frontend Pages

The frontend application includes the following primary pages:

| Page | Purpose |
|---|---|
| Login | Role-based authentication |
| Admin Dashboard | Administrative overview |
| Doctor Dashboard | Clinical patient monitoring |
| Nurse Dashboard | Observation and nursing workflow |
| Patients | Patient listing and filtering |
| Patient Profile | Detailed patient information |
| Record Vitals | Enter patient observations |
| Alert Center | Review and manage alerts |
| Monitoring Plans | Configure monitoring rules |
| Audit Logs | Review recorded system actions |
| Reports | View digital ICU chart/report data |
| Shift Handover | Transfer observation information between shifts |

---

# 🔒 Security and Production Considerations

This repository is a hackathon prototype.

Before production deployment, the following should be addressed:

- Replace development secret keys
- Use secure environment variables
- Use a production-grade database such as PostgreSQL
- Enable strict CORS policies
- Implement HTTPS
- Strengthen authentication and authorization checks
- Remove demo credentials
- Use strong password hashing consistently
- Add rate limiting
- Add database backups
- Add monitoring and observability
- Encrypt sensitive healthcare data where required
- Implement role-level access control at every protected endpoint
- Perform security testing
- Ensure applicable healthcare/privacy regulatory compliance

---

# ⚠️ Current Prototype Notes

## VitalCare AI Naming

The project uses the name **VitalCare AI**.

However, the current repository implementation is primarily based on:

- Rule-based threshold evaluation
- Automated scheduling
- Alert generation
- Dashboard analytics
- Hospital workflow automation

It does **not currently contain a trained machine-learning model for clinical prediction or diagnosis**.

Therefore, the system should not be represented as an AI diagnostic engine unless such functionality is added in the future.

---

# 🚧 Future Enhancements

Potential improvements include:

- IoT bedside sensor integration
- Real-time telemetry ingestion
- WebSocket-based live dashboard updates
- SMS/email/push notification integration
- PostgreSQL production database
- Redis/Celery for scalable background processing
- Advanced role-based permissions
- PDF report export
- Trend prediction and anomaly detection
- Machine learning-based early warning system
- EHR/EMR integration
- HL7/FHIR interoperability
- Multi-hospital deployment
- Advanced analytics and patient risk scoring

---

# 🎯 Expected Outcomes

The system is designed to contribute to:

- Improved patient monitoring workflows
- Timely vital sign observations
- Reduced missed observations
- Faster access to centralized patient information
- Improved nurse productivity
- Faster clinical decision support workflows
- Real-time alerts and notifications
- Digital ICU chart generation
- Reduced manual documentation
- Better doctor–nurse coordination
- Automated report generation
- Improved hospital workflow efficiency
- Improved traceability through audit logs

---

# 👨‍💻 Repository

**GitHub Repository**

https://github.com/Vedantnawghare/Research-Hackathon

---

# 🌐 Live Project

**Live Deployment**

https://research-hackathon.vercel.app/

---

# 🏥 Project Summary

**VitalCare AI** is a full-stack Smart Patient Vital Monitoring and Clinical Dashboard System built as a hospital automation solution.

It brings together:

```text
Patient Management
        +
Digital Vital Recording
        +
Monitoring Plans
        +
Automated Observation Scheduling
        +
Threshold-Based Vital Evaluation
        +
Alert Generation & Escalation
        +
Role-Based Dashboards
        +
Audit Logging
        +
Digital ICU Charts
        +
Shift Handover
```

to create a centralized prototype for modernizing ICU monitoring workflows.

---

## ⭐ If you found this project useful

Consider giving the repository a star!
