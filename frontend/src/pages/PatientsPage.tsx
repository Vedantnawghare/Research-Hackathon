import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  RefreshCw,
  Stethoscope,
  Bed,
  Activity,
} from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const {
    patients,
    searchQuery,
    setSearchQuery,
    addNewPatient,
    navigateToPatientProfile,
    navigateToRecordVitals,
    refreshData,
  } = useApp();

  const [wardFilter, setWardFilter] =
    useState('ALL');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [doctorFilter, setDoctorFilter] =
    useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: 50,
    gender:
      'Male' as 'Male' | 'Female' | 'Other',
    contact: '',
    ward: 'ICU',
    bed: '',
    assignedDoctor: 'Dr. Ananya Sharma',
    primaryDiagnosis: '',
    admissionDate: new Date()
      .toISOString()
      .split('T')[0],
  });

  /*
   * =========================================================
   * DYNAMIC FILTER OPTIONS
   * =========================================================
   */

  const wardOptions = useMemo(() => {
    return Array.from(
      new Set(
        patients
          .map((patient) => patient.ward)
          .filter(Boolean)
      )
    ).sort();
  }, [patients]);

  const doctorOptions = useMemo(() => {
    return Array.from(
      new Set(
        patients
          .map(
            (patient) =>
              patient.assignedDoctor
          )
          .filter(Boolean)
      )
    ).sort();
  }, [patients]);

  /*
   * =========================================================
   * FILTER PATIENTS
   * =========================================================
   */

  const filteredPatients = useMemo(() => {
    const search =
      searchQuery.toLowerCase().trim();

    return patients.filter((patient) => {
      const matchesSearch =
        search === '' ||
        String(patient.name || '')
          .toLowerCase()
          .includes(search) ||
        String(patient.id || '')
          .toLowerCase()
          .includes(search) ||
        String(
          patient.patientCode || ''
        )
          .toLowerCase()
          .includes(search) ||
        String(patient.bed || '')
          .toLowerCase()
          .includes(search) ||
        String(patient.ward || '')
          .toLowerCase()
          .includes(search);

      const matchesWard =
        wardFilter === 'ALL' ||
        patient.ward === wardFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        patient.status === statusFilter;

      const matchesDoctor =
        doctorFilter === 'ALL' ||
        patient.assignedDoctor ===
          doctorFilter;

      return (
        matchesSearch &&
        matchesWard &&
        matchesStatus &&
        matchesDoctor
      );
    });
  }, [
    patients,
    searchQuery,
    wardFilter,
    statusFilter,
    doctorFilter,
  ]);

  /*
   * =========================================================
   * PATIENT SUMMARY
   * =========================================================
   */

  const summary = useMemo(() => {
    return {
      total: patients.length,

      critical: patients.filter(
        (patient) =>
          patient.status === 'CRITICAL'
      ).length,

      attention: patients.filter(
        (patient) =>
          patient.status ===
          'ATTENTION'
      ).length,

      withVitals: patients.filter(
        (patient) =>
          patient.latestVitals &&
          (patient.latestVitals.heartRate >
            0 ||
            patient.latestVitals.spo2 > 0)
      ).length,
    };
  }, [patients]);

  /*
   * =========================================================
   * FORM RESET
   * =========================================================
   */

  const resetForm = () => {
    setFormData({
      name: '',
      age: 50,
      gender: 'Male',
      contact: '',
      ward: wardOptions.includes('ICU')
        ? 'ICU'
        : wardOptions[0] || 'ICU',
      bed: '',
      assignedDoctor:
        doctorOptions[0] ||
        'Dr. Ananya Sharma',
      primaryDiagnosis: '',
      admissionDate: new Date()
        .toISOString()
        .split('T')[0],
    });

    setErrorMessage('');
  };

  /*
   * =========================================================
   * OPEN MODAL
   * =========================================================
   */

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  /*
   * =========================================================
   * ADD PATIENT
   * =========================================================
   */

  const handleAddSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage('');

    const name = formData.name.trim();
    const bed = formData.bed
      .trim()
      .toUpperCase();

    /*
     * Basic validation
     */

    if (!name) {
      setErrorMessage(
        'Please enter the patient name.'
      );
      return;
    }

    if (
      formData.age < 0 ||
      formData.age > 150
    ) {
      setErrorMessage(
        'Please enter a valid age between 0 and 150.'
      );
      return;
    }

    if (!bed) {
      setErrorMessage(
        'Please enter a bed number.'
      );
      return;
    }

    /*
     * Client-side active bed check
     */

    const bedAlreadyOccupied =
      patients.some(
        (patient) =>
          String(patient.bed || '')
            .trim()
            .toUpperCase() === bed
      );

    if (bedAlreadyOccupied) {
      setErrorMessage(
        `Bed ${bed} is already occupied by another active patient.`
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await addNewPatient({
        name,
        age: Number(formData.age),
        gender: formData.gender,
        contact:
          formData.contact.trim(),
        ward: formData.ward,
        bed,
        assignedDoctor:
          formData.assignedDoctor,
        primaryDiagnosis:
          formData.primaryDiagnosis.trim(),
        admissionDate:
          formData.admissionDate,
      });

      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error(
        'Failed to admit patient:',
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to admit patient. Please check the backend connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  const handleRefresh = async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error(
        'Failed to refresh patients:',
        error
      );
    }
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="space-y-6 pb-12">
      {/* =====================================================
         HEADER
      ===================================================== */}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-900 text-white">
              Clinical Census
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-100 text-cyan-800">
              Live Data
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" />
            Patient Directory & Management
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Manage active patients, ward assignments,
            clinical status and bedside access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            Admit New Patient
          </button>
        </div>
      </div>

      {/* =====================================================
         SUMMARY CARDS
      ===================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-slate-400">
              Active Patients
            </span>

            <Users className="w-4 h-4 text-cyan-600" />
          </div>

          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary.total}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-rose-500">
              Critical
            </span>

            <Activity className="w-4 h-4 text-rose-600" />
          </div>

          <p className="text-2xl font-black text-rose-700 mt-2">
            {summary.critical}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-amber-500">
              Attention
            </span>

            <Stethoscope className="w-4 h-4 text-amber-600" />
          </div>

          <p className="text-2xl font-black text-amber-700 mt-2">
            {summary.attention}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-600">
              With Vitals
            </span>

            <Bed className="w-4 h-4 text-emerald-600" />
          </div>

          <p className="text-2xl font-black text-emerald-700 mt-2">
            {summary.withVitals}
          </p>
        </div>
      </div>

      {/* =====================================================
         FILTER BAR
      ===================================================== */}

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search by name, ID, bed or ward..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5 text-cyan-600" />
              Filters
            </div>

            {/* Ward */}
            <select
              value={wardFilter}
              onChange={(event) =>
                setWardFilter(
                  event.target.value
                )
              }
              className="px-3 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none"
            >
              <option value="ALL">
                All Wards
              </option>

              {wardOptions.map(
                (ward) => (
                  <option
                    key={ward}
                    value={ward}
                  >
                    {ward}
                  </option>
                )
              )}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="px-3 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none"
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="CRITICAL">
                Critical
              </option>

              <option value="HIGH_RISK">
                High Risk
              </option>

              <option value="ATTENTION">
                Attention
              </option>

              <option value="STABLE">
                Stable
              </option>
            </select>

            {/* Doctor */}
            <select
              value={doctorFilter}
              onChange={(event) =>
                setDoctorFilter(
                  event.target.value
                )
              }
              className="px-3 py-2.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 focus:outline-none"
            >
              <option value="ALL">
                All Doctors
              </option>

              {doctorOptions.map(
                (doctor) => (
                  <option
                    key={doctor}
                    value={doctor}
                  >
                    {doctor}
                  </option>
                )
              )}

              <option value="">
                Not Assigned
              </option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-[10px] text-slate-500 font-semibold">
            Showing{' '}
            <span className="text-slate-800 font-black">
              {filteredPatients.length}
            </span>{' '}
            of {patients.length} patients
          </p>

          {(searchQuery ||
            wardFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            doctorFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setWardFilter('ALL');
                setStatusFilter('ALL');
                setDoctorFilter('ALL');
              }}
              className="text-[10px] font-extrabold text-cyan-700 hover:text-cyan-900"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
         PATIENT TABLE
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="p-4">
                  Patient ID
                </th>

                <th className="p-4">
                  Patient
                </th>

                <th className="p-4">
                  Age / Gender
                </th>

                <th className="p-4">
                  Ward / Bed
                </th>

                <th className="p-4">
                  Assigned Doctor
                </th>

                <th className="p-4">
                  Status
                </th>

                <th className="p-4">
                  Latest Vitals
                </th>

                <th className="p-4">
                  Last Observation
                </th>

                <th className="p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center"
                  >
                    <Users className="w-9 h-9 text-slate-300 mx-auto" />

                    <p className="text-sm font-black text-slate-700 mt-3">
                      No patients found
                    </p>

                    <p className="text-xs text-slate-400 mt-1">
                      Try changing the search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(
                  (patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* ID */}
                      <td className="p-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {patient.patientCode ||
                          patient.id}
                      </td>

                      {/* NAME */}
                      <td className="p-4">
                        <button
                          onClick={() =>
                            navigateToPatientProfile(
                              patient.id
                            )
                          }
                          className="font-bold text-slate-900 hover:text-cyan-700 text-left"
                        >
                          {patient.name}
                        </button>

                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-[170px] truncate">
                          {patient.primaryDiagnosis ||
                            'No diagnosis recorded'}
                        </p>
                      </td>

                      {/* AGE */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800">
                          {patient.age}y
                        </span>

                        <span className="text-slate-400">
                          {' / '}
                        </span>

                        <span>
                          {patient.gender}
                        </span>
                      </td>

                      {/* WARD / BED */}
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {patient.bed}
                        </span>

                        <span className="text-[10px] text-slate-400 block mt-1">
                          {patient.ward}
                        </span>
                      </td>

                      {/* DOCTOR */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />

                          <span className="font-semibold text-slate-800">
                            {patient.assignedDoctor ||
                              'Not Assigned'}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="p-4">
                        <StatusBadge
                          status={
                            patient.status
                          }
                          size="sm"
                        />
                      </td>

                      {/* VITALS */}
                      <td className="p-4">
                        {patient.latestVitals &&
                        (patient.latestVitals
                          .spo2 > 0 ||
                          patient.latestVitals
                            .heartRate > 0) ? (
                          <>
                            <span
                              className={`font-bold ${
                                patient.latestVitals
                                  .spo2 < 90
                                  ? 'text-rose-600'
                                  : 'text-slate-800'
                              }`}
                            >
                              SpO2{' '}
                              {
                                patient
                                  .latestVitals
                                  .spo2
                              }
                              %
                            </span>

                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              HR{' '}
                              {
                                patient
                                  .latestVitals
                                  .heartRate
                              }{' '}
                              bpm
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-semibold">
                            No data
                          </span>
                        )}
                      </td>

                      {/* LAST OBSERVATION */}
                      <td className="p-4 text-slate-500 whitespace-nowrap">
                        {patient.lastObservationTime ||
                          'No observation'}
                      </td>

                      {/* ACTIONS */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigateToRecordVitals(
                                patient.id
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px]"
                          >
                            Record Vitals
                          </button>

                          <button
                            onClick={() =>
                              navigateToPatientProfile(
                                patient.id
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[10px] shadow-sm"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
         ADD PATIENT MODAL
      ===================================================== */}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() =>
          !isSubmitting &&
          setIsAddModalOpen(false)
        }
        title="Admit New Patient"
        subtitle="Register a patient into the VitalCare clinical monitoring system."
        maxWidth="xl"
      >
        <form
          onSubmit={handleAddSubmit}
          className="space-y-4"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              <p className="text-xs font-bold">
                Admission failed
              </p>

              <p className="text-[11px] mt-1">
                {errorMessage}
              </p>
            </div>
          )}

          {/* NAME + AGE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Name *
              </label>

              <input
                type="text"
                required
                disabled={isSubmitting}
                value={formData.name}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    name: event.target.value,
                  })
                }
                placeholder="e.g. John Smith"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Age *
              </label>

              <input
                type="number"
                required
                min="0"
                max="150"
                disabled={isSubmitting}
                value={formData.age}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    age: Number(
                      event.target.value
                    ),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* GENDER + CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Gender
              </label>

              <select
                disabled={isSubmitting}
                value={formData.gender}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    gender:
                      event.target
                        .value as
                        | 'Male'
                        | 'Female'
                        | 'Other',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone
              </label>

              <input
                type="text"
                disabled={isSubmitting}
                value={formData.contact}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    contact:
                      event.target.value,
                  })
                }
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* WARD + BED */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ward *
              </label>

              <select
                disabled={isSubmitting}
                value={formData.ward}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    ward: event.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              >
                {wardOptions.length ===
                0 ? (
                  <>
                    <option value="ICU">
                      ICU
                    </option>

                    <option value="Cardiology">
                      Cardiology
                    </option>

                    <option value="Neurology">
                      Neurology
                    </option>
                  </>
                ) : (
                  wardOptions.map(
                    (ward) => (
                      <option
                        key={ward}
                        value={ward}
                      >
                        {ward}
                      </option>
                    )
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Bed Number *
              </label>

              <input
                type="text"
                required
                disabled={isSubmitting}
                value={formData.bed}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    bed: event.target.value,
                  })
                }
                placeholder="e.g. ICU-11"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 uppercase focus:bg-white focus:border-cyan-500 focus:outline-none"
              />

              <p className="text-[9px] text-slate-400 mt-1">
                Must be unique among active patients.
              </p>
            </div>
          </div>

          {/* DOCTOR & CARE TEAM */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Primary Attending Physician *
              </label>

              <select
                disabled={isSubmitting}
                value={formData.assignedDoctor}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    assignedDoctor: event.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Dr. Shravani Sadawarte">Dr. Shravani Sadawarte (Senior Intensivist)</option>
                <option value="Dr. Rajesh Kumar">Dr. Rajesh Kumar (Cardiologist)</option>
                <option value="Dr. Vedant Nawghare">Dr. Vedant Nawghare (Pulmonologist)</option>
                <option value="Dr. Ananya Sharma">Dr. Ananya Sharma (General Physician)</option>
              </select>
            </div>

            {/* MULTI-DOCTOR CONSULTING TEAM */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1.5">
                Additional Consulting Doctors (Multi-Doctor Dashboard Visibility)
              </label>
              <p className="text-[10px] text-slate-500 mb-2">
                Patient will automatically appear on all selected doctors' dashboards for shared care monitoring.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {['Dr. Shravani Sadawarte', 'Dr. Rajesh Kumar', 'Dr. Vedant Nawghare', 'Dr. Ananya Sharma'].map((doc) => (
                  <label key={doc} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors">
                    <input
                      type="checkbox"
                      defaultChecked={doc === formData.assignedDoctor || doc === 'Dr. Rajesh Kumar'}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="font-semibold text-slate-800">{doc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* DIAGNOSIS */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Primary Clinical Diagnosis
            </label>

            <input
              type="text"
              disabled={isSubmitting}
              value={
                formData.primaryDiagnosis
              }
              onChange={(event) =>
                setFormData({
                  ...formData,
                  primaryDiagnosis:
                    event.target.value,
                })
              }
              placeholder="e.g. Pneumonia"
              className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />

            <p className="text-[9px] text-slate-400 mt-1">
              Display field; backend persistence depends on
              the current patient schema.
            </p>
          </div>

          {/* ADMISSION DATE */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Admission Date
            </label>

            <input
              type="date"
              disabled={isSubmitting}
              value={
                formData.admissionDate
              }
              onChange={(event) =>
                setFormData({
                  ...formData,
                  admissionDate:
                    event.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-300 focus:bg-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* ACTIONS */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                setIsAddModalOpen(false)
              }
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-cyan-700 text-white text-xs font-bold hover:bg-cyan-800 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? 'Admitting...'
                : 'Admit Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};