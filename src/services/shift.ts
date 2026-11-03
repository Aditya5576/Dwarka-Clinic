import { type ShiftType } from '../types';

export interface ShiftStatus {
  shift: ShiftType;
  isActive: boolean;
  label: string;
  timeRange: string;
}

/**
 * Real-time dynamic shift evaluator based on device clock.
 * Morning Shift: 11:00 AM to 2:00 PM (11:00 - 14:00)
 * Evening Shift: 5:00 PM to 8:30 PM (17:00 - 20:30)
 * Outside Hours:
 *   - After 2:00 PM and before 5:00 PM -> "Upcoming: Evening Shift (5:00 PM – 8:30 PM)"
 *   - After 8:30 PM or before 11:00 AM -> "Upcoming: Morning Shift (11:00 AM – 2:00 PM)"
 */
export function evaluateShiftStatus(date: Date = new Date()): ShiftStatus {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const morningStart = 11 * 60; // 11:00 AM = 660 mins
  const morningEnd = 14 * 60;   // 2:00 PM = 840 mins

  const eveningStart = 17 * 60;       // 5:00 PM = 1020 mins
  const eveningEnd = 20 * 60 + 30;    // 8:30 PM = 1230 mins

  // Currently in Morning Shift
  if (timeInMinutes >= morningStart && timeInMinutes <= morningEnd) {
    return {
      shift: 'Morning',
      isActive: true,
      label: 'Active Session: Morning Shift (11:00 AM – 2:00 PM)',
      timeRange: '11:00 AM – 2:00 PM'
    };
  }

  // Currently in Evening Shift
  if (timeInMinutes >= eveningStart && timeInMinutes <= eveningEnd) {
    return {
      shift: 'Evening',
      isActive: true,
      label: 'Active Session: Evening Shift (5:00 PM – 8:30 PM)',
      timeRange: '5:00 PM – 8:30 PM'
    };
  }

  // Outside Hours: Afternoon transition (2:00 PM - 5:00 PM)
  if (timeInMinutes > morningEnd && timeInMinutes < eveningStart) {
    return {
      shift: 'Evening',
      isActive: false,
      label: 'Upcoming: Evening Shift (5:00 PM – 8:30 PM)',
      timeRange: '5:00 PM – 8:30 PM'
    };
  }

  // Outside Hours: Night or early morning (before 11:00 AM or after 8:30 PM)
  return {
    shift: 'Morning',
    isActive: false,
    label: 'Upcoming: Morning Shift (11:00 AM – 2:00 PM)',
    timeRange: '11:00 AM – 2:00 PM'
  };
}

/**
 * Automatically tags a recorded visit with 'Morning' or 'Evening' based on exact timestamp.
 */
export function detectVisitShift(date: Date = new Date()): ShiftType {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Before 3:00 PM (15:00) tags to Morning shift, otherwise Evening shift
  return timeInMinutes < 15 * 60 ? 'Morning' : 'Evening';
}
