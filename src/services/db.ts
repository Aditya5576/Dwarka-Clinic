import Dexie, { type Table } from 'dexie';
import { type Patient, type Visit, type VisitAmount } from '../types';
import { evaluateShiftStatus, detectVisitShift } from './shift';

export { evaluateShiftStatus, detectVisitShift };
export const detectCurrentShift = detectVisitShift;

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

/**
 * Calculates whether a patient qualifies for ₹100 follow-up or ₹200 new/renewal fee.
 * Rule: <= 30 days from lastVisitDate is ₹100. Over 30 days or new patient is ₹200.
 */
export function calculateVisitFee(patient: Patient | null): {
  amount: VisitAmount;
  daysPassed: number | null;
  reason: string;
} {
  if (!patient || !patient.lastVisitDate) {
    return {
      amount: 200,
      daysPassed: null,
      reason: 'New Patient Registration'
    };
  }

  const lastVisit = new Date(patient.lastVisitDate).getTime();
  const now = Date.now();
  const diffDays = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return {
      amount: 100,
      daysPassed: diffDays,
      reason: 'Follow-up Consultation (Within 30 Days)'
    };
  }

  return {
    amount: 200,
    daysPassed: diffDays,
    reason: 'Regular / Renewal Consultation'
  };
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

