import { type Visit, type Patient } from '../types';
import { getLocalDateKey } from './dateUtils';

/**
 * RFC-4180 Compliant CSV Cell Escaper (P1-6)
 * - Quotes all cells
 * - Doubles internal quotes (" -> "")
 * - Neutralizes formula injection vulnerabilities (=, +, -, @, \t, \r) for Excel and Google Sheets
 */
export const escapeCsvCell = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // Prevent formula injection in Excel / Google Sheets
  if (/^[=\+\-\@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export function exportVisitsToCSV(visits: Visit[], patients: Patient[]): void {
  const patientMap = new Map<string, Patient>();
  patients.forEach(p => patientMap.set(p.id, p));

  const headers = [
    'Visit ID',
    'Patient ID',
    'Patient Name',
    'Phone',
    'City/Region',
    'Visit Date',
    'Visit Time',
    'Shift',
    'Amount (INR)',
    'Payment Mode'
  ].map(escapeCsvCell);

  const rows = visits.map(v => {
    const p = patientMap.get(v.patientId);
    const dateObj = new Date(v.date);
    const dateStr = dateObj.toLocaleDateString('en-IN');
    const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return [
      escapeCsvCell(v.id),
      escapeCsvCell(v.patientId),
      escapeCsvCell(v.patientName || p?.name || ''),
      escapeCsvCell(v.phone || p?.phone || ''),
      escapeCsvCell(p?.city || ''),
      escapeCsvCell(dateStr),
      escapeCsvCell(timeStr),
      escapeCsvCell(v.shift),
      escapeCsvCell(v.amount),
      escapeCsvCell(v.mode)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const today = getLocalDateKey();
  link.setAttribute('download', `Dwarka_Clinic_Visits_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
