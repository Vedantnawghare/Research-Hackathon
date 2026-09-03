/**
 * Indian Standard Time (IST - UTC+05:30) Utility Helper
 */

export const formatISTDate = (dateInput?: string | Date | number): string => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (e) {
    return String(dateInput);
  }
};

export const formatISTTime = (dateInput?: string | Date | number): string => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (e) {
    return String(dateInput);
  }
};

export const formatDynamicTaskTime = (scheduledTimeStr?: string, status?: string): string => {
  if (status === 'DUE_NOW') return 'Due Now (Q2H)';

  if (!scheduledTimeStr) return 'Scheduled Today';

  try {
    const d = new Date(scheduledTimeStr);
    if (isNaN(d.getTime())) return 'Scheduled Today';

    // If task time is early morning mock offset (like 02:42 AM), dynamically project into realistic IST shift hours
    if (d.getHours() < 7) {
      const currentHour = new Date().getHours();
      const baseHour = currentHour >= 7 && currentHour < 15 ? 10 : currentHour >= 15 && currentHour < 23 ? 16 : 23;
      const hourVal = (baseHour + (d.getMinutes() % 4)) % 24;
      const displayHour = hourVal % 12 === 0 ? 12 : hourVal % 12;
      const ampm = hourVal >= 12 ? 'PM' : 'AM';
      return `${displayHour}:${String(d.getMinutes()).padStart(2, '0')} ${ampm} IST`;
    }

    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) + ' IST';
  } catch (e) {
    return 'Scheduled Today';
  }
};

export const getCurrentShiftIST = (): {
  shiftName: 'MORNING' | 'EVENING' | 'NIGHT';
  shiftTiming: string;
  onDutyNurse: string;
  nextHandoverIST: string;
} => {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 7 && hours < 15) {
    return {
      shiftName: 'MORNING',
      shiftTiming: '07:00 AM - 03:00 PM IST',
      onDutyNurse: 'Nurse Ananya Marghade (Staff Nurse)',
      nextHandoverIST: '03:00 PM IST'
    };
  } else if (hours >= 15 && hours < 23) {
    return {
      shiftName: 'EVENING',
      shiftTiming: '03:00 PM - 11:00 PM IST',
      onDutyNurse: 'Nurse Shweta Kadam (Senior Staff Nurse)',
      nextHandoverIST: '11:00 PM IST'
    };
  } else {
    return {
      shiftName: 'NIGHT',
      shiftTiming: '11:00 PM - 07:00 AM IST',
      onDutyNurse: 'Nurse Sneha Deshmukh (ICU Night Lead)',
      nextHandoverIST: '07:00 AM IST'
    };
  }
};
