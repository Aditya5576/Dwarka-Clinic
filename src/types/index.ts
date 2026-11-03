export type ShiftType = 'Morning' | 'Evening';
export type PaymentMode = 'Cash' | 'UPI';
export type VisitAmount = 100 | 200;

export interface Patient {
  id: string; // e.g. "DC-0001"
  name: string;
  phone: string; // 10 digits
  city: string;
  createdAt: string; // ISO string
  lastVisitDate: string; // ISO string
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
  role: 'reception' | 'admin';
  email: string;
  isLoggedIn: boolean;
}

export type ActiveTab = 'checkin' | 'reminders' | 'reports' | 'logs';

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

