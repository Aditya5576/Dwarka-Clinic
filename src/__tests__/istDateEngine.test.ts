import { describe, it, expect } from 'vitest';
import { getLocalDateKey } from '../utils/dateUtils';

describe('Indian Standard Time (IST) Date Engine (P2 Asia/Kolkata Timezone)', () => {
  it('Test 1: Verify getLocalDateKey() consistently resolves to YYYY-MM-DD in Indian Standard Time (Asia/Kolkata)', () => {
    // 12:00 PM UTC on 15 Aug 2026 -> 17:30 IST on 15 Aug 2026
    const midDayUTC = '2026-08-15T12:00:00.000Z';
    expect(getLocalDateKey(midDayUTC)).toBe('2026-08-15');

    // Date instance
    const dateObj = new Date('2026-01-26T10:00:00.000Z');
    expect(getLocalDateKey(dateObj)).toBe('2026-01-26');

    // Invalid date returns empty string safely
    expect(getLocalDateKey('invalid-date-string')).toBe('');
  });

  it('Test 2: Visits recorded at 12:30 AM IST do not roll back to the previous UTC day', () => {
    // Nov 4 at 19:00:00 UTC = Nov 5 at 00:30:00 IST (12:30 AM post-midnight)
    // If evaluated in UTC, this would incorrectly yield '2026-11-04'.
    // Evaluated in Asia/Kolkata, this MUST yield '2026-11-05'.
    const postMidnightIST = '2026-11-04T19:00:00.000Z';
    expect(getLocalDateKey(postMidnightIST)).toBe('2026-11-05');

    // Exactly 00:00:00 IST on Nov 5 (18:30:00 UTC on Nov 4)
    const exactMidnightIST = '2026-11-04T18:30:00.000Z';
    expect(getLocalDateKey(exactMidnightIST)).toBe('2026-11-05');

    // 1 second before midnight IST (23:59:59 IST on Nov 4 / 18:29:59 UTC on Nov 4)
    const justBeforeMidnightIST = '2026-11-04T18:29:59.000Z';
    expect(getLocalDateKey(justBeforeMidnightIST)).toBe('2026-11-04');
  });
});

