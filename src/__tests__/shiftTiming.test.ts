import { describe, it, expect } from 'vitest';
import { getAutomaticShiftInfo, detectCurrentShift } from '../services/db';

describe('Shift Automation & Boundary Engine (P2 End-Exclusive Windows)', () => {
  const createClockTime = (hours: number, minutes: number, seconds: number = 0): Date => {
    const d = new Date();
    d.setHours(hours, minutes, seconds, 0);
    return d;
  };

  it('Test 1: Morning Shift active interval [11:00, 14:00) returns shift: "Morning" and isActive: true', () => {
    // 11:00:00 (Start of Morning Window)
    const startWindow = getAutomaticShiftInfo(createClockTime(11, 0, 0));
    expect(startWindow.shift).toBe('Morning');
    expect(startWindow.isActive).toBe(true);
    expect(startWindow.label).toBe('Morning Shift');
    expect(detectCurrentShift(createClockTime(11, 0, 0))).toBe('Morning');

    // 12:30:00 (Mid-session peak)
    const midWindow = getAutomaticShiftInfo(createClockTime(12, 30, 0));
    expect(midWindow.shift).toBe('Morning');
    expect(midWindow.isActive).toBe(true);

    // 13:59:59 (Last second of Morning Window)
    const endWindow = getAutomaticShiftInfo(createClockTime(13, 59, 59));
    expect(endWindow.shift).toBe('Morning');
    expect(endWindow.isActive).toBe(true);
  });

  it('Test 2: Exactly 14:00:00 shifts to off-hours (isActive: false, label: "Next: Evening Shift (5:00 PM)")', () => {
    // 14:00:00 (Strictly End-Exclusive)
    const atClosing = getAutomaticShiftInfo(createClockTime(14, 0, 0));
    expect(atClosing.isActive).toBe(false);
    expect(atClosing.shift).toBe('Evening');
    expect(atClosing.label).toBe('Next: Evening Shift (5:00 PM)');
    expect(detectCurrentShift(createClockTime(14, 0, 0))).toBe('Evening');
  });

  it('Test 3: Evening Shift active interval [17:00, 20:30) returns shift: "Evening" and isActive: true', () => {
    // 17:00:00 (Start of Evening Window)
    const startEvening = getAutomaticShiftInfo(createClockTime(17, 0, 0));
    expect(startEvening.shift).toBe('Evening');
    expect(startEvening.isActive).toBe(true);
    expect(startEvening.label).toBe('Evening Shift');
    expect(detectCurrentShift(createClockTime(17, 0, 0))).toBe('Evening');

    // 19:15:00 (Mid Evening)
    const midEvening = getAutomaticShiftInfo(createClockTime(19, 15, 0));
    expect(midEvening.shift).toBe('Evening');
    expect(midEvening.isActive).toBe(true);

    // 20:29:59 (Final second before close)
    const finalSecond = getAutomaticShiftInfo(createClockTime(20, 29, 59));
    expect(finalSecond.shift).toBe('Evening');
    expect(finalSecond.isActive).toBe(true);
  });

  it('Test 4: Exactly 20:30:00 shifts to off-hours (isActive: false, label: "Next: Morning Shift (11:00 AM)")', () => {
    // 20:30:00 (Strictly End-Exclusive)
    const atClosing = getAutomaticShiftInfo(createClockTime(20, 30, 0));
    expect(atClosing.isActive).toBe(false);
    expect(atClosing.shift).toBe('Morning');
    expect(atClosing.label).toBe('Next: Morning Shift (11:00 AM)');
    expect(detectCurrentShift(createClockTime(20, 30, 0))).toBe('Morning');
  });

  it('Test 5: Midday break (14:30) and early morning (08:00) return correct next-shift banners', () => {
    // 14:30 (Afternoon break between 14:00 and 17:00)
    const afternoonBreak = getAutomaticShiftInfo(createClockTime(14, 30, 0));
    expect(afternoonBreak.isActive).toBe(false);
    expect(afternoonBreak.label).toBe('Next: Evening Shift (5:00 PM)');
    expect(afternoonBreak.shift).toBe('Evening');

    // 08:00 (Early morning before 11:00)
    const earlyMorning = getAutomaticShiftInfo(createClockTime(8, 0, 0));
    expect(earlyMorning.isActive).toBe(false);
    expect(earlyMorning.label).toBe('Next: Morning Shift (11:00 AM)');
    expect(earlyMorning.shift).toBe('Morning');

    // 23:15 (Night after 20:30)
    const lateNight = getAutomaticShiftInfo(createClockTime(23, 15, 0));
    expect(lateNight.isActive).toBe(false);
    expect(lateNight.label).toBe('Next: Morning Shift (11:00 AM)');
    expect(lateNight.shift).toBe('Morning');
  });
});

