import Dexie, { type Table } from 'dexie';
import {
  type Patient,
  type Visit,
  type ShiftType,
  type VisitAmount,
  type PaymentMode,
  type ClinicalPrescription,
  type CustomMedication,
  type ClinicalProcedure,
  type FollowUpDefaulter
} from '../types';
import { INDIAN_DERMA_MEDICATIONS } from '../data/indianMedications';
import { CLINIC_MASTER_PROCEDURES } from '../data/clinicProcedures';
import { getTodayIST } from '../utils/dateUtils';
export { getLocalDateKey, getTodayIST } from '../utils/dateUtils';
export { formatWhatsAppNumber } from '../utils/phoneUtils';

export class DwarkaClinicDB extends Dexie {
  patients!: Table<Patient, string>;
  visits!: Table<Visit, string>;
  prescriptions!: Table<ClinicalPrescription, string>;
  customMedications!: Table<CustomMedication, number>;
  customProcedures!: Table<ClinicalProcedure, number>;

  constructor() {
    super('DwarkaClinicDB');
    this.version(1).stores({
      patients: 'id, phone, name, city, createdAt, lastVisitDate',
      visits: 'id, patientId, phone, date, shift, mode, amount',
    });
    this.version(3).stores({
      patients: 'id, phone, name, city, createdAt, lastVisitDate',
      visits: 'id, patientId, phone, date, shift, mode, amount',
      prescriptions: 'id, visitId, patientId, consultationDate, nextFollowUpDate',
      customMedications: '++id, name, type',
    });
    this.version(4).stores({
      patients: 'id, phone, name, city, createdAt, lastVisitDate',
      visits: 'id, patientId, phone, date, shift, mode, amount',
      prescriptions: 'id, visitId, patientId, consultationDate, nextFollowUpDate',
      customMedications: '++id, name, type',
      customProcedures: '++id, name, category',
    });
    this.version(5).stores({
      patients: 'id, phone, name, city, createdAt, lastVisitDate, nextFollowUpDate',
      visits: 'id, patientId, phone, date, shift, mode, amount, expectedFollowUpDate',
      prescriptions: 'id, visitId, patientId, consultationDate, nextFollowUpDate',
      customMedications: '++id, name, type',
      customProcedures: '++id, name, category',
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
 * Task 1 (Milestone 2): Save Custom Medication
 * Persists newly typed medicines into Dexie customMedications table.
 */
export async function saveCustomMedication(med: Omit<CustomMedication, 'id'>): Promise<CustomMedication> {
  const trimmedName = med.name.trim();
  const existing = await db.customMedications
    .filter(m => m.name.toLowerCase() === trimmedName.toLowerCase())
    .first();

  if (existing) {
    return existing;
  }

  const id = await db.customMedications.add({
    name: trimmedName,
    type: med.type || 'Tablet',
    defaultDosage: med.defaultDosage || '',
    defaultTiming: med.defaultTiming || '',
    category: med.category || 'Custom'
  });

  return {
    id,
    name: trimmedName,
    type: med.type || 'Tablet',
    defaultDosage: med.defaultDosage || '',
    defaultTiming: med.defaultTiming || '',
    category: med.category || 'Custom'
  };
}

/**
 * Task 1 (Milestone 2): Atomic Clinical Prescription Save
 * Saves prescription, updates visit amount if overridden by doctor or includes procedures,
 * and updates patient lastVisitDate & custom nextFollowUpDate.
 */
export async function saveClinicalPrescription(prescription: ClinicalPrescription): Promise<ClinicalPrescription> {
  const id = prescription.id || (typeof crypto !== 'undefined' && crypto.randomUUID
    ? `rx-${crypto.randomUUID()}`
    : `rx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const procedureTotal = prescription.procedureFeeTotal ?? (
    prescription.procedures ? prescription.procedures.reduce((acc, p) => acc + (Number(p.fee) || 0), 0) : 0
  );

  const fullPrescription: ClinicalPrescription = {
    ...prescription,
    id,
    procedureFeeTotal: procedureTotal,
    createdAt: prescription.createdAt || new Date().toISOString()
  };

  const totalBilled = fullPrescription.doctorFee + procedureTotal;

  return await db.transaction('rw', [db.prescriptions, db.visits, db.patients], async () => {
    // 1. Save prescription
    await db.prescriptions.put(fullPrescription);

    // 2. Update visit amount with doctorFee + procedure fees and expectedFollowUpDate
    const visit = await db.visits.get(fullPrescription.visitId);
    if (visit) {
      await db.visits.update(visit.id, {
        amount: totalBilled,
        expectedFollowUpDate: fullPrescription.nextFollowUpDate
      });
    }

    // 3. Update patient's lastVisitDate and custom nextFollowUpDate
    const patient = await db.patients.get(fullPrescription.patientId);
    if (patient) {
      await db.patients.update(patient.id, {
        lastVisitDate: fullPrescription.createdAt,
        nextFollowUpDate: fullPrescription.nextFollowUpDate
      });
    }

    return fullPrescription;
  });
}

/**
 * Save user custom in-clinic procedure into Dexie catalog
 */
export async function saveCustomProcedure(proc: Omit<ClinicalProcedure, 'id'>): Promise<ClinicalProcedure> {
  const trimmedName = proc.name.trim();
  const id = await db.customProcedures.add({
    name: trimmedName,
    category: proc.category || 'Other',
    fee: Number(proc.fee) || 0,
    notes: proc.notes || ''
  });

  return {
    id,
    name: trimmedName,
    category: proc.category || 'Other',
    fee: Number(proc.fee) || 0,
    notes: proc.notes || ''
  };
}

/**
 * Retrieve unified procedure catalog (Dr. Baldawa Master + Saved Custom Procedures)
 */
export async function getAllProcedureCatalog(): Promise<ClinicalProcedure[]> {
  const customs = await db.customProcedures.toArray();
  const map = new Map<string, ClinicalProcedure>();

  for (const p of CLINIC_MASTER_PROCEDURES) {
    map.set(p.name.toLowerCase(), p);
  }
  for (const c of customs) {
    map.set(c.name.toLowerCase(), c);
  }

  return Array.from(map.values());
}

/**
 * Helper to fetch prescription associated with a visit
 */
export async function getPrescriptionByVisitId(visitId: string): Promise<ClinicalPrescription | undefined> {
  return await db.prescriptions.where('visitId').equals(visitId).first();
}

/**
 * Helper to fetch all past prescriptions for a patient
 */
export async function getPatientPrescriptions(patientId: string): Promise<ClinicalPrescription[]> {
  const all = await db.prescriptions.where('patientId').equals(patientId).toArray();
  return all.sort((a, b) => new Date(b.consultationDate).getTime() - new Date(a.consultationDate).getTime());
}

/**
 * Helper to retrieve unified medication catalog (Built-in Derma Master + User Custom Drugs)
 */
export async function getAllMedicationCatalog(): Promise<CustomMedication[]> {
  const customs = await db.customMedications.toArray();
  const map = new Map<string, CustomMedication>();

  for (const m of INDIAN_DERMA_MEDICATIONS) {
    map.set(m.name.toLowerCase(), m);
  }
  for (const c of customs) {
    map.set(c.name.toLowerCase(), c);
  }

  return Array.from(map.values());
}

/**
 * Task 1 (Milestone 3): Follow-Up Defaulter Query Engine
 * 
 * Retrieves patients whose latest visit had an expectedFollowUpDate that has passed
 * (e.g., 1 to 30 days overdue) and who have not checked in since.
 * 
 * Returns: patientId, patientName, phone, city, lastVisitDate, expectedFollowUpDate,
 * overdueDays, doctorNotes, hasProcedures, procedureNames, lastVisitAmount, lastVisitShift.
 */
export async function getFollowUpDefaulters(
  referenceDate: string = getTodayIST(),
  maxOverdueDays: number = 30
): Promise<FollowUpDefaulter[]> {
  const allPatients = await db.patients.toArray();
  const allVisits = await db.visits.toArray();
  const allPrescriptions = await db.prescriptions.toArray();

  const visitsByPatient = new Map<string, Visit[]>();
  for (const v of allVisits) {
    const list = visitsByPatient.get(v.patientId) || [];
    list.push(v);
    visitsByPatient.set(v.patientId, list);
  }

  const rxByVisitId = new Map<string, ClinicalPrescription>();
  for (const rx of allPrescriptions) {
    if (rx.visitId) {
      rxByVisitId.set(rx.visitId, rx);
    }
  }

  const ref = new Date(referenceDate);
  const refOnly = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());

  const defaulters: FollowUpDefaulter[] = [];

  for (const patient of allPatients) {
    const patientVisits = visitsByPatient.get(patient.id) || [];
    if (patientVisits.length === 0) continue;

    // Find latest visit
    patientVisits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestVisit = patientVisits[0];

    // Determine expected follow up date for this latest visit
    const visitRx = rxByVisitId.get(latestVisit.id);
    const expectedDateStr = latestVisit.expectedFollowUpDate
      || visitRx?.nextFollowUpDate
      || patient.nextFollowUpDate;

    if (!expectedDateStr) continue;

    const expectedDate = new Date(expectedDateStr);
    if (isNaN(expectedDate.getTime())) continue;

    const expectedDateOnly = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());

    // Calculate overdue calendar days
    const overdueDays = Math.round((refOnly.getTime() - expectedDateOnly.getTime()) / (1000 * 60 * 60 * 24));

    // Must be at least 1 day overdue, and within maxOverdueDays
    if (overdueDays >= 1 && overdueDays <= maxOverdueDays) {
      const latestVisitDate = new Date(latestVisit.date);
      const latestVisitDateOnly = new Date(latestVisitDate.getFullYear(), latestVisitDate.getMonth(), latestVisitDate.getDate());

      // If latest visit occurred on or after the expected follow-up date, the patient already returned
      if (latestVisitDateOnly.getTime() >= expectedDateOnly.getTime()) {
        continue;
      }

      defaulters.push({
        patientId: patient.id,
        patientName: patient.name,
        phone: patient.phone,
        city: patient.city,
        lastVisitDate: latestVisit.date,
        expectedFollowUpDate: expectedDateStr,
        overdueDays,
        doctorNotes: visitRx?.diagnosisNotes,
        hasProcedures: !!(visitRx?.procedures && visitRx.procedures.length > 0),
        procedureNames: visitRx?.procedures?.map(p => p.name) || [],
        lastVisitAmount: latestVisit.amount,
        lastVisitShift: latestVisit.shift
      });
    }
  }

  // Sort by highest overdue days first (most overdue first)
  defaulters.sort((a, b) => b.overdueDays - a.overdueDays);
  return defaulters;
}

/**
 * Helper to seed sample overdue patients for testing recall workflows
 * Specifically for phone numbers 8208064879 and 7019905146.
 */
export async function seedSampleRecallPatients(): Promise<void> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Patient 1: Mahesh Patil (Test) - 8208064879
  // Last Visit: 18 days ago (Morning Shift)
  // Expected Follow-Up: 6 days ago (Status: Due This Week, 6 days overdue)
  // Follow-up Interval: 7 Days (Chemical Peel Follow-up)
  const p1VisitDate = new Date(now - 18 * dayMs).toISOString();
  const p1ExpectedFollowUp = new Date(now - 6 * dayMs).toISOString().slice(0, 10);

  const patient1: Patient = {
    id: 'DC-8208',
    name: 'Mahesh Patil (Test)',
    phone: '8208064879',
    city: 'Jaysingpur',
    createdAt: p1VisitDate,
    lastVisitDate: p1VisitDate,
    nextFollowUpDate: p1ExpectedFollowUp
  };

  const visit1: Visit = {
    id: 'VST-RECALL-8208',
    patientId: 'DC-8208',
    patientName: 'Mahesh Patil (Test)',
    phone: '8208064879',
    date: p1VisitDate,
    shift: 'Morning',
    amount: 200,
    mode: 'Cash',
    expectedFollowUpDate: p1ExpectedFollowUp
  };

  const rx1: ClinicalPrescription = {
    id: 'RX-RECALL-8208',
    visitId: 'VST-RECALL-8208',
    patientId: 'DC-8208',
    patientName: 'Mahesh Patil (Test)',
    patientPhone: '8208064879',
    patientCity: 'Jaysingpur',
    consultationDate: p1VisitDate.slice(0, 10),
    shift: 'Morning',
    doctorFee: 200,
    diagnosisNotes: 'Chemical Peel Follow-up',
    medications: [
      {
        name: 'Clindamycin Gel (1%)',
        type: 'Gel',
        dosage: '1 Application',
        timing: 'Morning',
        duration: '15 Days'
      }
    ],
    procedures: [
      {
        name: 'Salicylic Acid Peel (20%)',
        category: 'Chemical Peel',
        fee: 500,
        notes: 'Session 1 completed'
      }
    ],
    procedureFeeTotal: 500,
    followUpDays: 7,
    nextFollowUpDate: p1ExpectedFollowUp,
    createdAt: p1VisitDate
  };

  // Patient 2: Sunil Sharma (Test) - 7019905146
  // Last Visit: 35 days ago (Evening Shift)
  // Expected Follow-Up: 20 days ago (Status: Overdue 20 days, >7d filter)
  // Follow-up Interval: 15 Days (Acne Treatment Follow-up)
  const p2VisitDate = new Date(now - 35 * dayMs).toISOString();
  const p2ExpectedFollowUp = new Date(now - 20 * dayMs).toISOString().slice(0, 10);

  const patient2: Patient = {
    id: 'DC-7019',
    name: 'Sunil Sharma (Test)',
    phone: '7019905146',
    city: 'Shirol',
    createdAt: p2VisitDate,
    lastVisitDate: p2VisitDate,
    nextFollowUpDate: p2ExpectedFollowUp
  };

  const visit2: Visit = {
    id: 'VST-RECALL-7019',
    patientId: 'DC-7019',
    patientName: 'Sunil Sharma (Test)',
    phone: '7019905146',
    date: p2VisitDate,
    shift: 'Evening',
    amount: 200,
    mode: 'UPI',
    expectedFollowUpDate: p2ExpectedFollowUp
  };

  const rx2: ClinicalPrescription = {
    id: 'RX-RECALL-7019',
    visitId: 'VST-RECALL-7019',
    patientId: 'DC-7019',
    patientName: 'Sunil Sharma (Test)',
    patientPhone: '7019905146',
    patientCity: 'Shirol',
    consultationDate: p2VisitDate.slice(0, 10),
    shift: 'Evening',
    doctorFee: 200,
    diagnosisNotes: 'Acne Treatment Follow-up',
    medications: [
      {
        name: 'Doxycycline 100mg',
        type: 'Capsule',
        dosage: '1 Cap',
        timing: 'After Food (Night)',
        duration: '15 Days'
      }
    ],
    procedures: [],
    procedureFeeTotal: 0,
    followUpDays: 15,
    nextFollowUpDate: p2ExpectedFollowUp,
    createdAt: p2VisitDate
  };

  await db.transaction('rw', db.patients, db.visits, db.prescriptions, async () => {
    await db.patients.put(patient1);
    await db.patients.put(patient2);
    await db.visits.put(visit1);
    await db.visits.put(visit2);
    await db.prescriptions.put(rx1);
    await db.prescriptions.put(rx2);
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

  await seedSampleRecallPatients();
}
