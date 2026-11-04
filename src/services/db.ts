import Dexie, { type Table } from 'dexie';
import { type Patient, type Visit, type ShiftType, type VisitAmount, type PaymentMode } from '../types';
export { getLocalDateKey } from '../utils/dateUtils';
export { formatWhatsAppNumber } from '../utils/phoneUtils';

export class DwarkaClinicDB extends Dexie {
  patients!: Table<Patient, string>;
  visits!: Table<Visit, string>;

  constructor() {
    super('DwarkaClinicDB');
    this.version(1).stores({
      patients: 'id, phone, name, city, createdAt, lastVisitDate',
      visits: 'id, patientId, phone, date, shift, mode, amount',
    });
  }
}

export const db = new DwarkaClinicDB();

export interface VisitFeeResult {
  amount: VisitAmount;
  fee: number;
  isFollowUp: boolean;
  daysPassed: number | null;
  daysRemaining: number;
  reason: string;
}

/**
 * Strict Calendar-Day Expiry Engine (P0-1)
 * Compares against local calendar midnight boundaries instead of elapsed hours.
 * Rule: <= 30 calendar days from lastVisitDate is ₹100. Over 30 days or new patient is ₹200.
 */
export function calculateVisitFee(patientOrDate?: Patient | string | Date | null): VisitFeeResult {
  const lastVisitDate = (patientOrDate && typeof patientOrDate === 'object' && 'lastVisitDate' in patientOrDate)
    ? (patientOrDate as Patient).lastVisitDate
    : (patientOrDate as string | Date | null | undefined);

  if (!lastVisitDate) {
    return {
      amount: 200,
      fee: 200,
      isFollowUp: false,
      daysPassed: null,
      daysRemaining: 0,
      reason: 'Regular Rate (₹200)'
    };
  }

  const now = new Date();
  const last = new Date(lastVisitDate);
  if (isNaN(last.getTime())) {
    return {
      amount: 200,
      fee: 200,
      isFollowUp: false,
      daysPassed: null,
      daysRemaining: 0,
      reason: 'Regular Rate (₹200)'
    };
  }

  // Strict local calendar midnight boundary comparison
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDateOnly = new Date(last.getFullYear(), last.getMonth(), last.getDate());

  const diffTime = nowDateOnly.getTime() - lastDateOnly.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 0 && diffDays <= 30) {
    return {
      amount: 100,
      fee: 100,
      isFollowUp: true,
      daysPassed: diffDays,
      daysRemaining: 30 - diffDays,
      reason: 'Follow-up Rate (₹100)'
    };
  }

  return {
    amount: 200,
    fee: 200,
    isFollowUp: false,
    daysPassed: diffDays,
    daysRemaining: 0,
    reason: 'Regular Rate (₹200)'
  };
}

export interface ShiftInfo {
  shift: ShiftType;
  label: string;
  hoursText: string;
  isActive: boolean;
}

/**
 * Automatic shift determination based on clinic hours (P2 Defect - End-Exclusive):
 * Morning Shift Window: Strictly [11:00, 14:00) -> 660 <= mins < 840
 * Evening Shift Window: Strictly [17:00, 20:30) -> 1020 <= mins < 1230
 * Outside hours:
 * - Before 11:00 AM: Next: Morning Shift (11:00 AM)
 * - Between 2:00 PM & 5:00 PM: Next: Evening Shift (5:00 PM)
 * - After 8:30 PM: Next: Morning Shift (11:00 AM)
 */
export function getAutomaticShiftInfo(date: Date = new Date()): ShiftInfo {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 11:00 AM = 660 mins, 2:00 PM = 840 mins (End-exclusive: 14:00:00 is off-hours)
  if (timeInMinutes >= 660 && timeInMinutes < 840) {
    return {
      shift: 'Morning',
      label: 'Morning Shift',
      hoursText: '11:00 AM – 2:00 PM',
      isActive: true
    };
  }

  // 5:00 PM = 1020 mins, 8:30 PM = 1230 mins (End-exclusive: 20:30:00 is off-hours)
  if (timeInMinutes >= 1020 && timeInMinutes < 1230) {
    return {
      shift: 'Evening',
      label: 'Evening Shift',
      hoursText: '5:00 PM – 8:30 PM',
      isActive: true
    };
  }

  // Outside active hours:
  if (timeInMinutes < 660) {
    return {
      shift: 'Morning',
      label: 'Next: Morning Shift (11:00 AM)',
      hoursText: '11:00 AM – 2:00 PM',
      isActive: false
    };
  } else if (timeInMinutes < 1020) {
    return {
      shift: 'Evening',
      label: 'Next: Evening Shift (5:00 PM)',
      hoursText: '5:00 PM – 8:30 PM',
      isActive: false
    };
  } else {
    return {
      shift: 'Morning',
      label: 'Next: Morning Shift (11:00 AM)',
      hoursText: '11:00 AM – 2:00 PM',
      isActive: false
    };
  }
}

/**
 * Automatic shift detection based on current local clock.
 */
export function detectCurrentShift(date: Date = new Date()): ShiftType {
  return getAutomaticShiftInfo(date).shift;
}

/**
 * Generates next sequential patient ID (e.g. DC-0004)
 */
export async function getNextPatientId(): Promise<string> {
  const allPatients = await db.patients.toArray();
  if (allPatients.length === 0) {
    return 'DC-0001';
  }

  const ids = allPatients
    .map(p => {
      const match = p.id.match(/^DC-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const maxId = ids.length > 0 ? Math.max(...ids) : 0;
  const nextNum = maxId + 1;
  return `DC-${nextNum.toString().padStart(4, '0')}`;
}

export interface CheckInPayload {
  selectedPatient: Patient | null;
  patientName: string;
  phoneNumber: string;
  city: string;
  amount: VisitAmount;
  paymentMode: PaymentMode;
  shift: ShiftType;
}

export interface CheckInResult {
  patient: Patient;
  visit: Visit;
}

/**
 * Task 1: Atomic Check-In Transaction (P0-2)
 * Executes both patient intake (creation/update) and visit logging
 * inside a single atomic Dexie read-write transaction boundary.
 * Eliminates race conditions in ID generation and prevents orphan patient records.
 * Task 4: Collision-Proof Visit IDs (P1 Defect)
 */
export async function processCheckInTransaction(payload: CheckInPayload): Promise<CheckInResult> {
  const now = new Date().toISOString();

  return await db.transaction('rw', [db.patients, db.visits], async () => {
    let patientRecord: Patient;

    if (payload.selectedPatient) {
      patientRecord = {
        ...payload.selectedPatient,
        name: payload.patientName.trim(),
        city: payload.city,
        lastVisitDate: now
      };
      await db.patients.put(patientRecord);
    } else {
      // Calculate next sequential patient ID inside the transaction boundary
      const allPatients = await db.patients.toArray();
      let nextId = 'DC-0001';
      if (allPatients.length > 0) {
        const ids = allPatients
          .map(p => {
            const match = p.id.match(/^DC-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(n => !isNaN(n));
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        nextId = `DC-${(maxId + 1).toString().padStart(4, '0')}`;
      }

      patientRecord = {
        id: nextId,
        name: payload.patientName.trim(),
        phone: payload.phoneNumber,
        city: payload.city,
        createdAt: now,
        lastVisitDate: now
      };
      await db.patients.add(patientRecord);
    }

    const visitId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? `visit-${crypto.randomUUID()}`
      : `visit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newVisit: Visit = {
      id: visitId,
      patientId: patientRecord.id,
      patientName: patientRecord.name,
      phone: patientRecord.phone,
      date: now,
      amount: payload.amount,
      mode: payload.paymentMode,
      shift: payload.shift
    };

    await db.visits.add(newVisit);

    return { patient: patientRecord, visit: newVisit };
  });
}

/**
 * Pre-seed 3 realistic test patients for immediate verification:
 * - DC-0001: 10 days ago (eligible for ₹100 follow-up)
 * - DC-0002: 27 days ago (due for reminder, eligible for ₹100)
 * - DC-0003: 45 days ago (follow-up expired, requires ₹200 fee)
 */
export async function seedInitialDataIfNeeded(): Promise<void> {
  const count = await db.patients.count();
  if (count > 0) return;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const date10DaysAgo = new Date(now - 10 * dayMs).toISOString();
  const date27DaysAgo = new Date(now - 27 * dayMs).toISOString();
  const date45DaysAgo = new Date(now - 45 * dayMs).toISOString();

  const seedPatients: Patient[] = [
    {
      id: 'DC-0001',
      name: 'Ramesh Balasaheb Patil',
      phone: '9822012345',
      city: 'Jaysingpur',
      createdAt: date10DaysAgo,
      lastVisitDate: date10DaysAgo
    },
    {
      id: 'DC-0002',
      name: 'Sunita Ananda Khot',
      phone: '9421198765',
      city: 'Shirol',
      createdAt: date27DaysAgo,
      lastVisitDate: date27DaysAgo
    },
    {
      id: 'DC-0003',
      name: 'Vijay Prakash Chougule',
      phone: '9890045678',
      city: 'Purtiwadi',
      createdAt: date45DaysAgo,
      lastVisitDate: date45DaysAgo
    }
  ];

  const seedVisits: Visit[] = [
    {
      id: 'visit-seed-001',
      patientId: 'DC-0001',
      patientName: 'Ramesh Balasaheb Patil',
      phone: '9822012345',
      date: date10DaysAgo,
      amount: 200,
      mode: 'Cash',
      shift: 'Morning'
    },
    {
      id: 'visit-seed-002',
      patientId: 'DC-0002',
      patientName: 'Sunita Ananda Khot',
      phone: '9421198765',
      date: date27DaysAgo,
      amount: 200,
      mode: 'UPI',
      shift: 'Evening'
    },
    {
      id: 'visit-seed-003',
      patientId: 'DC-0003',
      patientName: 'Vijay Prakash Chougule',
      phone: '9890045678',
      date: date45DaysAgo,
      amount: 200,
      mode: 'Cash',
      shift: 'Morning'
    }
  ];

  await db.transaction('rw', db.patients, db.visits, async () => {
    await db.patients.bulkAdd(seedPatients);
    await db.visits.bulkAdd(seedVisits);
  });
}

