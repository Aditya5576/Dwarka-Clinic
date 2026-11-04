import { describe, it, expect } from 'vitest';
import { formatWhatsAppNumber } from '../utils/phoneUtils';

describe('Phone Number Normalizer (P1-3 Indian Mobile Phone Sanitizer)', () => {
  it('Test 1: Standard 10-digit input (9822012345) returns 919822012345', () => {
    expect(formatWhatsAppNumber('9822012345')).toBe('919822012345');
    expect(formatWhatsAppNumber('9421198765')).toBe('919421198765');
  });

  it('Test 2: Prefixed with country code (+919822012345) returns 919822012345 (no 9191... duplication)', () => {
    expect(formatWhatsAppNumber('+919822012345')).toBe('919822012345');
    expect(formatWhatsAppNumber('919822012345')).toBe('919822012345');
  });

  it('Test 3: Prefixed with leading zero (09822012345) returns 919822012345', () => {
    expect(formatWhatsAppNumber('09822012345')).toBe('919822012345');
    expect(formatWhatsAppNumber('09421198765')).toBe('919421198765');
  });

  it('Test 4: Formatted strings with hyphens/spaces (+91 98220-12345) extract cleanly to 919822012345', () => {
    expect(formatWhatsAppNumber('+91 98220-12345')).toBe('919822012345');
    expect(formatWhatsAppNumber('+91 (98220) 12345')).toBe('919822012345');
    expect(formatWhatsAppNumber('98220 12345')).toBe('919822012345');
  });

  it('Test 5: Invalid numbers (< 10 digits or garbage text) return empty string "" safely', () => {
    expect(formatWhatsAppNumber('')).toBe('');
    expect(formatWhatsAppNumber('12345')).toBe('');
    expect(formatWhatsAppNumber('98220')).toBe('');
    expect(formatWhatsAppNumber('abcdefghij')).toBe('');
    expect(formatWhatsAppNumber('invalid-phone-number')).toBe('');
  });
});

