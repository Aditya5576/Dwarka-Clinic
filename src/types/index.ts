export type ShiftType = 'Morning' | 'Evening';
export type PaymentMode = 'Cash' | 'UPI';
export type VisitAmount = number; // 100, 200, or doctor-overridden custom amount

export interface Patient {
  id: string; // e.g. "DC-0001"
  name: string;
  phone: string; // 10 digits
  city: string;
  createdAt: string; // ISO string
  lastVisitDate: string; // ISO string
  nextFollowUpDate?: string; // YYYY-MM-DD custom follow-up date
}

export interface Visit {
  id: string; // UUID or timestamp based
  patientId: string; // e.g. "DC-0001"
  patientName: string;
  phone: string;
  date: string; // ISO string
  amount: VisitAmount;
  mode: PaymentMode;
  shift: ShiftType;
}

export interface UserSession {
  role: 'reception' | 'admin' | 'doctor';
  email: string;
  isLoggedIn: boolean;
}

export type ActiveTab = 'checkin' | 'reminders' | 'reports' | 'logs';

export type MedicationType =
  | 'Tablet'
  | 'Capsule'
  | 'Cream'
  | 'Lotion'
  | 'Gel'
  | 'Shampoo'
  | 'Serum'
  | 'Soap'
  | 'Drops'
  | 'Powder';

export interface PrescriptionItem {
  name: string;
  type: MedicationType;
  dosage: string; // e.g. "1 Tab", "Pea-sized amount", "1 Application"
  timing: string; // e.g. "Morning & Night", "Once daily after dinner", "Apply at bedtime"
  duration: string; // e.g. "15 Days", "1 Month"
}

export type ProcedureCategory =
  | 'Chemical Peel'
  | 'Acne Surgery'
  | 'Dermatosurgery'
  | 'Aesthetic'
  | 'Trichology'
  | 'Other';

export interface ClinicalProcedure {
  id?: string | number;
  name: string;
  category: ProcedureCategory;
  fee: number;
  notes?: string;
}

export interface ClinicalPrescription {
  id?: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientCity: string;
  consultationDate: string; // YYYY-MM-DD in IST
  shift: ShiftType;
  doctorFee: number;
  followUpDays: number;
  nextFollowUpDate: string; // YYYY-MM-DD
  paperRxPhoto?: string; // Base64 data URL (compressed 1080p JPEG/WebP)
  medications: PrescriptionItem[];
  procedures?: ClinicalProcedure[];
  procedureFeeTotal?: number;
  diagnosisNotes?: string;
  createdAt: string;
}

export interface CustomMedication {
  id?: number;
  name: string;
  type: MedicationType | string;
  defaultDosage?: string;
  defaultTiming?: string;
  category?: string;
}

export const REGIONS_LIST = [
  'Jaysingpur',
  'Purtiwadi',
  'Shirol',
  'Sangli',
  'Miraj',
  'Ichalkaranji',
  'Kolhapur',
  'Hatkanangle',
  'Kurundwad',
  'Danoli',
  'Udgaon',
  'Nimshirgaon',
  'Tamdalge',
  'Dharangutti',
  'Akiwat',
  'Ankali',
  'Kavathe Mahankal',
  'Haripur',
  'Other'
] as const;
