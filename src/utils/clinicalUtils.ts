/**
 * Clinical utilities for Dr. Baldawa's consultation desk:
 * - Follow-up date calculations (7d, 15d, 21d, 30d, custom date)
 * - Doctor fee resolution & override logic
 * - Prescription WhatsApp summary builder
 */

export const QUICK_FOLLOW_UP_DAYS = [7, 15, 21, 30] as const;

/**
 * Calculates next follow-up date string (YYYY-MM-DD) given base date and number of days.
 */
export function calculateNextFollowUpDate(baseDateStr?: string, daysToAdd: number = 15): string {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const date = isNaN(base.getTime()) ? new Date() : new Date(base);

  date.setDate(date.getDate() + daysToAdd);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Calculates elapsed or remaining days between two YYYY-MM-DD or ISO dates
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const startOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffTime = endOnly.getTime() - startOnly.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates elapsed calendar days between a past date (dateA) and a reference date (dateB, defaults to today).
 * Always returns a non-negative integer.
 */
export function calculateElapsedDays(dateA: string | Date, dateB: string | Date = new Date()): number {
  const a = typeof dateA === 'string' ? new Date(dateA) : dateA;
  const b = typeof dateB === 'string' ? new Date(dateB) : dateB;

  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;

  const aOnly = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bOnly = new Date(b.getFullYear(), b.getMonth(), b.getDate());

  const diffMs = Math.abs(bOnly.getTime() - aOnly.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Validates and resolves doctor fee override
 */
export function resolveDoctorFee(defaultFee: number, customFeeInput?: string | number | null): number {
  if (customFeeInput === undefined || customFeeInput === null || customFeeInput === '') {
    return defaultFee;
  }
  const parsed = typeof customFeeInput === 'number' ? customFeeInput : parseInt(customFeeInput, 10);
  if (isNaN(parsed) || parsed < 0) {
    return defaultFee;
  }
  return parsed;
}

/**
 * Formats YYYY-MM-DD date into Indian display format (e.g. "19 Nov 2026")
 */
export function formatIndianDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

