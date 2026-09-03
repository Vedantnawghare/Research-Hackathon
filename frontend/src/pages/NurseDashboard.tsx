import React, {
  useMemo,
  useState,
} from 'react';

import {
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Activity,
  UserRound,
  BedDouble,
  CalendarClock,
  ClipboardCheck,
  RefreshCw,
  ArrowRight,
  HeartPulse,
  Thermometer,
  Droplets,
  Wind,
} from 'lucide-react';

import {
  useApp,
} from '../context/AppContext';

import {
  ObservationTask,
} from '../types';

import { SmartWearableSensor } from '../components/icu/SmartWearableSensor';
import { formatISTDate, formatISTTime, formatDynamicTaskTime } from '../utils/dateUtils';

// =========================================================
// HELPERS (IST ENFORCED & DYNAMIC TASK SCHEDULES)
// =========================================================

function formatTime(value?: string, status?: string): string {
  return formatDynamicTaskTime(value, status);
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return formatISTDate(value);
}


function getTaskStatusLabel(
  status: string
): string {
  switch (status) {
    case 'DUE':
    case 'DUE_NOW':
      return 'Due Now';

    case 'UPCOMING':
      return 'Upcoming';

    case 'OVERDUE':
      return 'Overdue';

    case 'COMPLETED':
      return 'Completed';

    case 'MISSED':
      return 'Missed';

    default:
      return status;
  }
}


function getTaskStatusClass(
  status: string
): string {
  switch (status) {
    case 'DUE':
    case 'DUE_NOW':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'OVERDUE':
    case 'MISSED':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'UPCOMING':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}


function getPriorityClass(
  priority?: string
): string {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-50 text-red-700 border-red-200';

    case 'HIGH_RISK':
      return 'bg-orange-50 text-orange-700 border-orange-200';

    case 'ATTENTION':
      return 'bg-amber-50 text-amber-700 border-amber-200';

    case 'STABLE':
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
}


function getPriorityLabel(
  priority?: string
): string {
  switch (priority) {
    case 'CRITICAL':
      return 'Critical';

    case 'HIGH_RISK':
      return 'High Risk';

    case 'ATTENTION':
      return 'Attention';

    case 'STABLE':
      return 'Stable';

    default:
      return 'Stable';
  }
}


function getVitalIcon(
  vitalName?: string
) {
  const name =
    (vitalName || '').toLowerCase();

  if (
    name.includes('heart')
  ) {
    return (
      <HeartPulse
        className="h-4 w-4"
      />
    );
  }

  if (
    name.includes('temperature')
  ) {
    return (
      <Thermometer
        className="h-4 w-4"
      />
    );
  }

  if (
    name.includes('spo2')
  ) {
    return (
      <Wind
        className="h-4 w-4"
      />
    );
  }

  if (
    name.includes('urine')
  ) {
    return (
      <Droplets
        className="h-4 w-4"
      />
    );
  }

  return (
    <Activity
      className="h-4 w-4"
    />
  );
}


// =========================================================
// TASK CARD
// =========================================================

interface TaskCardProps {
  task: ObservationTask;

  onRecordVitals: (
    patientId: string
  ) => void;

  onProfile: (
    patientId: string
  ) => void;

  onComplete: (
    taskId: string
  ) => Promise<void>;
}


const TaskCard:
  React.FC<TaskCardProps> = ({
    task,
    onRecordVitals,
    onProfile,
    onComplete,
  }) => {

  const [
    completing,
    setCompleting,
  ] =
    useState(false);


  const isCompleted =
    task.status ===
    'COMPLETED';


  const handleComplete =
    async () => {

      if (
        isCompleted ||
        completing
      ) {
        return;
      }

      try {

        setCompleting(
          true
        );

        await onComplete(
          task.id
        );

      } finally {

        setCompleting(
          false
        );

      }
    };


  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition
        hover:shadow-md
      "
    >

      {/* HEADER */}
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >

        <div
          className="
            flex
            min-w-0
            items-start
            gap-3
          "
        >

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-slate-100
              text-slate-700
            "
          >
            {getVitalIcon(
              task.vitalName
            )}
          </div>

          <div
            className="min-w-0"
          >
            <p
              className="
                truncate
                text-sm
                font-semibold
                text-slate-900
              "
            >
              {task.patientName ||
                `Patient ${task.patientId}`}
            </p>

            <p
              className="
                mt-0.5
                text-xs
                text-slate-500
              "
            >
              {task.taskName ||
                `${task.vitalName || 'Observation'} Observation`}
            </p>
          </div>

        </div>


        <span
          className={`
            shrink-0
            rounded-full
            border
            px-2.5
            py-1
            text-[11px]
            font-semibold
            ${getTaskStatusClass(
              task.status
            )}
          `}
        >
          {getTaskStatusLabel(
            task.status
          )}
        </span>

      </div>


      {/* INFO */}
      <div
        className="
          mt-5
          grid
          grid-cols-2
          gap-3
        "
      >

        <div
          className="
            rounded-xl
            bg-slate-50
            p-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-500
            "
          >
            <Clock3
              className="h-3.5 w-3.5"
            />

            Scheduled
          </div>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              text-slate-800
            "
          >
            {formatTime(
              task.scheduledTime,
              task.status
            )}
          </p>

        </div>


        <div
          className="
            rounded-xl
            bg-slate-50
            p-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-500
            "
          >
            <BedDouble
              className="h-3.5 w-3.5"
            />

            Bed
          </div>

          <p
            className="
              mt-1
              text-sm
              font-semibold
              text-slate-800
            "
          >
            {task.bed ||
              '—'}
          </p>

        </div>

      </div>


      {/* PRIORITY */}
      <div
        className="
          mt-4
          flex
          items-center
          justify-between
        "
      >

        <span
          className={`
            inline-flex
            items-center
            rounded-full
            border
            px-2.5
            py-1
            text-[11px]
            font-semibold
            ${getPriorityClass(
              task.priority
            )}
          `}
        >
          {getPriorityLabel(
            task.priority
          )}
        </span>


        <span
          className="
            text-xs
            text-slate-500
          "
        >
          {task.ward ||
            'Ward not assigned'}
        </span>

      </div>


      {/* ACTIONS */}
      <div
        className="
          mt-5
          flex
          gap-2
        "
      >

        {!isCompleted && (
          <button
            type="button"
            onClick={() =>
              onRecordVitals(
                task.patientId
              )
            }
            className="
              flex
              flex-1
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
            "
          >
            <Activity
              className="h-4 w-4"
            />

            Record Vitals
          </button>
        )}


        {!isCompleted && (
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            className="
              flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-2.5
              text-sm
              font-semibold
              text-emerald-700
              transition
              hover:bg-emerald-100
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {completing ? (
              <RefreshCw
                className="
                  h-4
                  w-4
                  animate-spin
                "
              />
            ) : (
              <CheckCircle2
                className="h-4 w-4"
              />
            )}

            Complete
          </button>
        )}


        <button
          type="button"
          onClick={() =>
            onProfile(
              task.patientId
            )
          }
          className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
          "
          title="Open patient profile"
        >
          <UserRound
            className="h-4 w-4"
          />

          <span className="hidden xl:inline">
            Profile
          </span>
        </button>

      </div>

    </div>
  );
};


// =========================================================
// MAIN DASHBOARD
// =========================================================

const NurseDashboard:
  React.FC = () => {

  const {
    patients,
    alerts,
    tasks,
    currentUser,
    navigateToPatientProfile,
    navigateToRecordVitals,
    completeTask,
    refreshTasks,
  } = useApp();


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  // =======================================================
  // DERIVED TASKS
  // =======================================================

  const overdueTasks =
    useMemo(
      () =>
        tasks.filter(
          task =>
            task.status ===
              'OVERDUE' ||
            task.status ===
              'MISSED'
        ),
      [tasks]
    );


  const dueTasks =
    useMemo(
      () =>
        tasks.filter(
          task =>
            task.status ===
              'DUE_NOW'
        ),
      [tasks]
    );


  const upcomingTasks =
    useMemo(
      () =>
        tasks.filter(
          task =>
            task.status ===
            'UPCOMING'
        ),
      [tasks]
    );


  const completedTasks =
    useMemo(
      () =>
        tasks.filter(
          task =>
            task.status ===
            'COMPLETED'
        ),
      [tasks]
    );


  const activeAlerts =
    useMemo(
      () =>
        alerts.filter(
          alert =>
            alert.status ===
              'ACTIVE' ||
            alert.status ===
              'ESCALATED'
        ),
      [alerts]
    );


  const criticalAlerts =
    useMemo(
      () =>
        activeAlerts.filter(
          alert =>
            alert.severity ===
              'CRITICAL'
        ),
      [activeAlerts]
    );


  const attentionPatients =
    useMemo(
      () =>
        patients.filter(
          patient =>
            patient.status ===
              'ATTENTION' ||
            patient.status ===
              'HIGH_RISK' ||
            patient.status ===
              'CRITICAL'
        ),
      [patients]
    );


  const totalTasks =
    tasks.length;


  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh =
    async () => {

      if (refreshing) {
        return;
      }

      try {

        setRefreshing(
          true
        );

        await refreshTasks();

      } finally {

        setRefreshing(
          false
        );

      }
    };


  // =======================================================
  // COMPLETE TASK WRAPPER
  // =======================================================

  const handleCompleteTask =
    async (
      taskId: string
    ) => {

      await completeTask(
        taskId
      );

    };


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div
      className="
        min-h-full
        bg-slate-50
        p-4
        sm:p-6
      "
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        className="
          mb-6
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <h1
              className="
                text-2xl
                font-bold
                tracking-tight
                text-slate-900
              "
            >
              My Shift Overview
            </h1>

            <span
              className="
                rounded-full
                bg-emerald-100
                px-2.5
                py-1
                text-[11px]
                font-semibold
                text-emerald-700
              "
            >
              NURSE
            </span>
          </div>


          <p
            className="
              mt-1
              text-sm
              text-slate-500
            "
          >
            Welcome back,{' '}
            <span
              className="
                font-medium
                text-slate-700
              "
            >
              {currentUser.name}
            </span>
            . Here is your current observation workload.
          </p>

        </div>


        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          <RefreshCw
            className={`
              h-4
              w-4
              ${refreshing
                ? 'animate-spin'
                : ''}
            `}
          />

          Refresh Tasks

        </button>

      </div>

      {/* SMART WEARABLE IOT SENSOR STREAM */}
      {patients[0] && (
        <div className="mb-6">
          <SmartWearableSensor patient={patients[0]} />
        </div>
      )}


      {/* ===================================================
          SHIFT SUMMARY
      =================================================== */}

      <div
        className="
          mb-6
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        {/* DUE */}
        <div
          className="
            rounded-2xl
            border
            border-amber-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-500
                "
              >
                Due Now
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                {dueTasks.length}
              </p>

            </div>


            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-amber-50
                text-amber-600
              "
            >
              <Clock3
                className="h-5 w-5"
              />
            </div>

          </div>

          <p
            className="
              mt-3
              text-xs
              text-slate-500
            "
          >
            Observations requiring attention now
          </p>

        </div>


        {/* OVERDUE */}
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-500
                "
              >
                Overdue
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                {overdueTasks.length}
              </p>

            </div>


            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-red-50
                text-red-600
              "
            >
              <AlertTriangle
                className="h-5 w-5"
              />
            </div>

          </div>

          <p
            className="
              mt-3
              text-xs
              text-slate-500
            "
          >
            Missed or delayed observations
          </p>

        </div>


        {/* COMPLETED */}
        <div
          className="
            rounded-2xl
            border
            border-emerald-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-500
                "
              >
                Completed
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                {completedTasks.length}
              </p>

            </div>


            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-emerald-50
                text-emerald-600
              "
            >
              <CheckCircle2
                className="h-5 w-5"
              />
            </div>

          </div>

          <p
            className="
              mt-3
              text-xs
              text-slate-500
            "
          >
            Observation tasks completed
          </p>

        </div>


        {/* ALERTS */}
        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-start
              justify-between
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-500
                "
              >
                Active Alerts
              </p>

              <p
                className="
                  mt-2
                  text-3xl
                  font-bold
                  text-slate-900
                "
              >
                {activeAlerts.length}
              </p>

            </div>


            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-slate-100
                text-slate-700
              "
            >
              <AlertTriangle
                className="h-5 w-5"
              />
            </div>

          </div>

          <p
            className="
              mt-3
              text-xs
              text-slate-500
            "
          >
            {criticalAlerts.length}{' '}
            critical alert
            {criticalAlerts.length !== 1
              ? 's'
              : ''}
          </p>

        </div>

      </div>


      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div
        className="
          grid
          grid-cols-1
          gap-6
          xl:grid-cols-[minmax(0,1fr)_340px]
        "
      >

        {/* =================================================
            TASKS
        ================================================= */}

        <section>

          <div
            className="
              mb-4
              flex
              flex-col
              gap-2
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <ClipboardCheck
                  className="
                    h-5
                    w-5
                    text-slate-700
                  "
                />

                <h2
                  className="
                    text-lg
                    font-bold
                    text-slate-900
                  "
                >
                  Observation Tasks
                </h2>

              </div>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                "
              >
                {totalTasks}{' '}
                total task
                {totalTasks !== 1
                  ? 's'
                  : ''}{' '}
                assigned
              </p>

            </div>

          </div>


          {tasks.length === 0 ? (

            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                px-6
                py-14
                text-center
              "
            >

              <ClipboardCheck
                className="
                  mx-auto
                  h-10
                  w-10
                  text-slate-300
                "
              />

              <h3
                className="
                  mt-4
                  text-base
                  font-semibold
                  text-slate-800
                "
              >
                No observation tasks
              </h3>

              <p
                className="
                  mx-auto
                  mt-1
                  max-w-md
                  text-sm
                  text-slate-500
                "
              >
                No tasks are currently available from the backend.
                New observation tasks will appear here when assigned.
              </p>

            </div>

          ) : (

            <div
              className="
                grid
                grid-cols-1
                gap-4
                lg:grid-cols-2
              "
            >

              {[
                ...overdueTasks,
                ...dueTasks,
                ...upcomingTasks,
                ...completedTasks,
              ].map(
                task => (

                  <TaskCard
                    key={task.id}
                    task={task}
                    onRecordVitals={
                      navigateToRecordVitals
                    }
                    onProfile={
                      navigateToPatientProfile
                    }
                    onComplete={
                      handleCompleteTask
                    }
                  />

                )
              )}

            </div>

          )}

        </section>


        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside
          className="
            space-y-6
          "
        >

          {/* =================================================
              PATIENTS NEEDING ATTENTION
          ================================================= */}

          <section
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div>

                <h2
                  className="
                    text-base
                    font-bold
                    text-slate-900
                  "
                >
                  Patients to Watch
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500
                  "
                >
                  Patients requiring closer attention
                </p>

              </div>


              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-2
                  py-1
                  text-xs
                  font-semibold
                  text-slate-700
                "
              >
                {attentionPatients.length}
              </span>

            </div>


            <div
              className="
                mt-4
                space-y-3
              "
            >

              {attentionPatients.length === 0 ? (

                <div
                  className="
                    rounded-xl
                    bg-emerald-50
                    p-4
                    text-center
                  "
                >

                  <CheckCircle2
                    className="
                      mx-auto
                      h-6
                      w-6
                      text-emerald-600
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-sm
                      font-medium
                      text-emerald-800
                    "
                  >
                    No high-priority patients
                  </p>

                </div>

              ) : (

                attentionPatients
                  .slice(0, 6)
                  .map(
                    patient => (

                      <button
                        key={patient.id}
                        type="button"
                        onClick={() =>
                          navigateToPatientProfile(
                            patient.id
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-100
                          bg-slate-50
                          p-3
                          text-left
                          transition
                          hover:border-slate-200
                          hover:bg-white
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                          "
                        >

                          <div
                            className="
                              min-w-0
                            "
                          >

                            <p
                              className="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-800
                              "
                            >
                              {patient.name}
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-xs
                                text-slate-500
                              "
                            >
                              Bed {patient.bed}
                              {' • '}
                              {patient.ward}
                            </p>

                          </div>


                          <span
                            className={`
                              shrink-0
                              rounded-full
                              px-2
                              py-1
                              text-[10px]
                              font-bold
                              ${
                                patient.status ===
                                'CRITICAL'
                                  ? 'bg-red-100 text-red-700'
                                  : patient.status ===
                                    'HIGH_RISK'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-amber-100 text-amber-700'
                              }
                            `}
                          >
                            {patient.status
                              .replace(
                                '_',
                                ' '
                              )}
                          </span>

                        </div>

                      </button>

                    )
                  )

              )}

            </div>

          </section>


          {/* =================================================
              UPCOMING
          ================================================= */}

          <section
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <CalendarClock
                className="
                  h-5
                  w-5
                  text-slate-700
                "
              />

              <h2
                className="
                  text-base
                  font-bold
                  text-slate-900
                "
              >
                Upcoming Observations
              </h2>

            </div>


            <div
              className="
                mt-4
                space-y-3
              "
            >

              {upcomingTasks.length === 0 ? (

                <p
                  className="
                    rounded-xl
                    bg-slate-50
                    px-4
                    py-5
                    text-center
                    text-sm
                    text-slate-500
                  "
                >
                  No upcoming observations.
                </p>

              ) : (

                upcomingTasks
                  .slice(0, 5)
                  .map(
                    task => (

                      <button
                        key={task.id}
                        type="button"
                        onClick={() =>
                          navigateToPatientProfile(
                            task.patientId
                          )
                        }
                        className="
                          w-full
                          rounded-xl
                          border
                          border-slate-100
                          bg-slate-50
                          p-3
                          text-left
                          transition
                          hover:bg-white
                        "
                      >

                        <div
                          className="
                            flex
                            items-start
                            justify-between
                            gap-3
                          "
                        >

                          <div
                            className="
                              min-w-0
                            "
                          >

                            <p
                              className="
                                truncate
                                text-sm
                                font-semibold
                                text-slate-800
                              "
                            >
                              {task.patientName}
                            </p>

                            <p
                              className="
                                mt-0.5
                                truncate
                                text-xs
                                text-slate-500
                              "
                            >
                              {task.taskName}
                            </p>

                          </div>


                          <div
                            className="
                              shrink-0
                              text-right
                            "
                          >

                            <p
                              className="
                                text-sm
                                font-semibold
                                text-slate-800
                              "
                            >
                              {formatTime(
                                task.scheduledTime
                              )}
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[11px]
                                text-slate-400
                              "
                            >
                              {formatDate(
                                task.scheduledTime
                              )}
                            </p>

                          </div>

                        </div>

                      </button>

                    )
                  )

              )}

            </div>

          </section>


          {/* =================================================
              ALERT SUMMARY
          ================================================= */}

          <section
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <AlertTriangle
                  className="
                    h-5
                    w-5
                    text-slate-700
                  "
                />

                <h2
                  className="
                    text-base
                    font-bold
                    text-slate-900
                  "
                >
                  Alert Summary
                </h2>

              </div>


              <span
                className="
                  text-xs
                  text-slate-400
                "
              >
                Live
              </span>

            </div>


            <div
              className="
                mt-4
                space-y-2
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-slate-50
                  px-3
                  py-2.5
                "
              >

                <span
                  className="
                    text-sm
                    text-slate-600
                  "
                >
                  Active
                </span>

                <span
                  className="
                    text-sm
                    font-bold
                    text-slate-900
                  "
                >
                  {activeAlerts.length}
                </span>

              </div>


              <div
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-red-50
                  px-3
                  py-2.5
                "
              >

                <span
                  className="
                    text-sm
                    text-red-700
                  "
                >
                  Critical
                </span>

                <span
                  className="
                    text-sm
                    font-bold
                    text-red-700
                  "
                >
                  {criticalAlerts.length}
                </span>

              </div>

            </div>

          </section>

        </aside>

      </div>


      {/* ===================================================
          BOTTOM QUICK ACTIONS
      =================================================== */}

      <section
        className="
          mt-6
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-5
          shadow-sm
        "
      >

        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-center
            lg:justify-between
          "
        >

          <div>

            <h2
              className="
                text-base
                font-bold
                text-slate-900
              "
            >
              Quick Actions
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Access common nursing workflows quickly.
            </p>

          </div>


          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >

            <button
              type="button"
              onClick={() =>
                navigateToRecordVitals()
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-slate-900
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
              "
            >

              <Activity
                className="h-4 w-4"
              />

              Record Vitals

            </button>


            <button
              type="button"
              onClick={() => {

                const firstPatient =
                  patients[0];

                if (
                  firstPatient
                ) {
                  navigateToPatientProfile(
                    firstPatient.id
                  );
                }

              }}
              disabled={
                patients.length === 0
              }
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <UserRound
                className="h-4 w-4"
              />

              View Patients

              <ArrowRight
                className="h-4 w-4"
              />

            </button>

          </div>

        </div>

      </section>

    </div>

  );
};


export { NurseDashboard };
export default NurseDashboard;