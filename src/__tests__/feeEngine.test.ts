import { describe, it, expect } from 'vitest';
import { calculateVisitFee } from '../services/db';
import { type Patient } from '../types';

describe('Clinical Fee Engine (P0-1 Strict Calendar-Day Expiry)', () => {
  const createDateDaysAgo = (days: number): string => {
    const now = new Date();
    // Use local noon to test calendar date boundaries cleanly without DST/hour jitter
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, 12, 0, 0);
    return d.toISOString();
  };

  it('Test 1: New patient registration (no previous visit) defaults to ₹200', () => {
    const resultNull = calculateVisitFee(null);
    expect(resultNull.fee).toBe(200);
    expect(resultNull.amount).toBe(200);
    expect(resultNull.isFollowUp).toBe(false);
    expect(resultNull.daysRemaining).toBe(0);
    expect(resultNull.daysPassed).toBeNull();

    const resultUndefined = calculateVisitFee(undefined);
    expect(resultUndefined.fee).toBe(200);
    expect(resultUndefined.amount).toBe(200);
    expect(resultUndefined.isFollowUp).toBe(false);

    const newPatient: Patient = {
      id: 'DC-0001',
      name: 'Ramesh Patil',
      phone: '9822012345',
      city: 'Jaysingpur',
      createdAt: new Date().toISOString(),
      lastVisitDate: ''
    };
    const resultEmptyLastVisit = calculateVisitFee(newPatient);
    expect(resultEmptyLastVisit.fee).toBe(200);
    expect(resultEmptyLastVisit.amount).toBe(200);
    expect(resultEmptyLastVisit.isFollowUp).toBe(false);
  });

  it('Test 2: Follow-up visit at Day 0, Day 15, Day 29, and Day 30 calendar days qualifies strictly for ₹100', () => {
    // Day 0 (Same day check-in)
    const day0 = calculateVisitFee(createDateDaysAgo(0));
    expect(day0.fee).toBe(100);
    expect(day0.amount).toBe(100);
    expect(day0.isFollowUp).toBe(true);
    expect(day0.daysPassed).toBe(0);
    expect(day0.daysRemaining).toBe(30);

    // Day 15 (Mid-cycle check-in)
    const day15 = calculateVisitFee(createDateDaysAgo(15));
    expect(day15.fee).toBe(100);
    expect(day15.amount).toBe(100);
    expect(day15.isFollowUp).toBe(true);
    expect(day15.daysPassed).toBe(15);
    expect(day15.daysRemaining).toBe(15);

    // Day 29 (Penultimate day)
    const day29 = calculateVisitFee(createDateDaysAgo(29));
    expect(day29.fee).toBe(100);
    expect(day29.amount).toBe(100);
    expect(day29.isFollowUp).toBe(true);
    expect(day29.daysPassed).toBe(29);
    expect(day29.daysRemaining).toBe(1);

    // Day 30 (Final eligible calendar day)
    const day30 = calculateVisitFee(createDateDaysAgo(30));
    expect(day30.fee).toBe(100);
    expect(day30.amount).toBe(100);
    expect(day30.isFollowUp).toBe(true);
    expect(day30.daysPassed).toBe(30);
    expect(day30.daysRemaining).toBe(0);
  });

  it('Test 3: Follow-up visit at Day 31 resets strictly to ₹200', () => {
    const day31 = calculateVisitFee(createDateDaysAgo(31));
    expect(day31.fee).toBe(200);
    expect(day31.amount).toBe(200);
    expect(day31.isFollowUp).toBe(false);
    expect(day31.daysRemaining).toBe(0);
    expect(day31.daysPassed).toBe(31);

    const day45 = calculateVisitFee(createDateDaysAgo(45));
    expect(day45.fee).toBe(200);
    expect(day45.amount).toBe(200);
    expect(day45.isFollowUp).toBe(false);
    expect(day45.daysRemaining).toBe(0);
  });

  it('Test 4: Negative timestamps or future dates safely default to ₹200 (no negative elapsed day exploit)', () => {
    // 1 day in future
    const futureDate = calculateVisitFee(createDateDaysAgo(-1));
    expect(futureDate.fee).toBe(200);
    expect(futureDate.amount).toBe(200);
    expect(futureDate.isFollowUp).toBe(false);
    expect(futureDate.daysRemaining).toBe(0);

    // 10 days in future
    const farFutureDate = calculateVisitFee(createDateDaysAgo(-10));
    expect(farFutureDate.fee).toBe(200);
    expect(farFutureDate.amount).toBe(200);
    expect(farFutureDate.isFollowUp).toBe(false);
    expect(farFutureDate.daysRemaining).toBe(0);
  });

  it('Test 5: Invalid/corrupt date strings ("invalid-date", null, undefined) default to ₹200 without throwing unhandled exceptions', () => {
    expect(() => calculateVisitFee('invalid-date')).not.toThrow();
    const resultInvalid = calculateVisitFee('invalid-date');
    expect(resultInvalid.fee).toBe(200);
    expect(resultInvalid.amount).toBe(200);
    expect(resultInvalid.isFollowUp).toBe(false);

    expect(() => calculateVisitFee('2026-99-99')).not.toThrow();
    const resultBogus = calculateVisitFee('2026-99-99');
    expect(resultBogus.fee).toBe(200);
    expect(resultBogus.isFollowUp).toBe(false);
  });
});

