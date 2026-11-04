/**
 * Phone Number Normalizer for Indian Mobile Numbers (+91)
 * Strips non-digits, captures the last 10 digits, and prefixes standard Indian country code 91.
 */

export const formatWhatsAppNumber = (rawPhone: string): string => {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  return last10.length === 10 ? `91${last10}` : '';
};

