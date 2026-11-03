import { type Visit, type Patient } from '../types';

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
  ];

  const rows = visits.map(v => {
    const p = patientMap.get(v.patientId);
    const dateObj = new Date(v.date);
    const dateStr = dateObj.toLocaleDateString('en-IN');
    const timeStr = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    return [
      `"${v.id}"`,
      `"${v.patientId}"`,
      `"${(v.patientName || p?.name || '').replace(/"/g, '""')}"`,
      `"${v.phone || p?.phone || ''}"`,
      `"${(p?.city || '').replace(/"/g, '""')}"`,
      `"${dateStr}"`,
      `"${timeStr}"`,
      `"${v.shift}"`,
      v.amount,
      `"${v.mode}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Dwarka_Clinic_Visits_${today}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

