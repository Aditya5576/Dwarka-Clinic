/**
 * Local Date Utilities for Dr. Baldawa's Dwarka Clinic PWA
 * Enforces explicit Indian Standard Time (IST / Asia/Kolkata, UTC+5:30)
 * ensuring devices configured with any timezone calculate clinic dates consistently.
 */

export const getLocalDateKey = (dateInput: string | Date = new Date()): string => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d); // Returns YYYY-MM-DD in IST
};
