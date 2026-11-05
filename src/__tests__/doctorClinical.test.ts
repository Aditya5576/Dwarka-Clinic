import { describe, it, expect } from 'vitest';
import {
  calculateNextFollowUpDate,
  calculateDaysBetween,
  calculateElapsedDays,
  resolveDoctorFee,
  formatIndianDisplayDate,
  QUICK_FOLLOW_UP_DAYS
} from '../utils/clinicalUtils';
import { getBase64SizeInKB } from '../utils/imageCompressor';
import { buildPrescriptionWhatsAppText } from '../services/whatsappService';
import { type ClinicalPrescription, type ClinicalProcedure } from '../types';
import { MASTER_CLINIC_PROCEDURES } from '../data/clinicProcedures';
import { fuzzyFilter, levenshteinDistance } from '../utils/fuzzySearch';
import { DERMA_FORMULARY_MEDICATIONS, DERMA_FORMULARY_PROCEDURES } from '../data/dermaFormulary';

describe('Doctor Desk Clinical Engine (Milestone 2)', () => {

  describe('1. Follow-Up Date Calculation Engine', () => {
    it('calculates 7-day, 15-day, 21-day, and 30-day follow-up dates correctly from base date', () => {
      const baseDate = '2026-11-04';

      expect(calculateNextFollowUpDate(baseDate, 7)).toBe('2026-11-11');
      expect(calculateNextFollowUpDate(baseDate, 15)).toBe('2026-11-19');
      expect(calculateNextFollowUpDate(baseDate, 21)).toBe('2026-11-25');
      expect(calculateNextFollowUpDate(baseDate, 30)).toBe('2026-12-04');
    });

    it('handles month and year rollover boundaries correctly', () => {
      const yearEnd = '2026-12-25';
      expect(calculateNextFollowUpDate(yearEnd, 15)).toBe('2027-01-09');

      const leapYearFeb = '2028-02-20';
      expect(calculateNextFollowUpDate(leapYearFeb, 10)).toBe('2028-03-01');
    });

    it('calculates elapsed days between consultation and custom follow-up dates', () => {
      expect(calculateDaysBetween('2026-11-04', '2026-11-19')).toBe(15);
      expect(calculateDaysBetween('2026-11-04', '2026-11-04')).toBe(0);
      expect(calculateDaysBetween('2026-11-04', '2026-11-25')).toBe(21);
    });

    it('formats Indian display date accurately', () => {
      expect(formatIndianDisplayDate('2026-11-04')).toContain('2026');
      expect(formatIndianDisplayDate('2026-11-04')).toContain('Nov');
      expect(formatIndianDisplayDate('')).toBe('—');
    });

    it('defines standard quick follow-up intervals', () => {
      expect(QUICK_FOLLOW_UP_DAYS).toEqual([7, 15, 21, 30]);
    });
  });

  describe('2. Doctor Consultation Fee Resolution & Override', () => {
    it('returns auto-calculated fee when doctor input is empty or null', () => {
      expect(resolveDoctorFee(200, '')).toBe(200);
      expect(resolveDoctorFee(100, null)).toBe(100);
      expect(resolveDoctorFee(200, undefined)).toBe(200);
    });

    it('accepts doctor-entered custom fees (numeric or string input)', () => {
      expect(resolveDoctorFee(200, 350)).toBe(350);
      expect(resolveDoctorFee(100, '500')).toBe(500);
      expect(resolveDoctorFee(200, '0')).toBe(0); // Free/courtesy consultation
    });

    it('guards against negative numbers or invalid NaN strings', () => {
      expect(resolveDoctorFee(200, -50)).toBe(200);
      expect(resolveDoctorFee(200, 'invalid-abc')).toBe(200);
    });
  });

  describe('3. Image Compression & Base64 Payload Utility', () => {
    it('accurately computes payload size in KB from Data URL string', () => {
      // 1000 characters of base64 data
      const sampleBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(1024);
      const sizeKB = getBase64SizeInKB(sampleBase64);
      expect(sizeKB).toBeGreaterThan(0);
      expect(sizeKB).toBeLessThan(10);
    });

    it('handles empty or malformed strings gracefully without throwing', () => {
      expect(getBase64SizeInKB('')).toBe(0);
      expect(getBase64SizeInKB('random_text')).toBe(0);
    });
  });

  describe('4. WhatsApp Prescription Summary Composer', () => {
    it('builds a complete structured medical message including doctor, clinic, medicines and follow-up', () => {
      const mockPrescription: ClinicalPrescription = {
        id: 'rx-test-001',
        visitId: 'visit-test-001',
        patientId: 'DC-0001',
        patientName: 'Ramesh Balasaheb Patil',
        patientPhone: '9822012345',
        patientCity: 'Jaysingpur',
        consultationDate: '2026-11-04',
        shift: 'Morning',
        doctorFee: 200,
        followUpDays: 15,
        nextFollowUpDate: '2026-11-19',
        medications: [
          {
            name: 'Isotretinoin 20mg Capsule',
            type: 'Capsule',
            dosage: '1 Cap',
            timing: 'Once daily after dinner with milk',
            duration: '15 Days'
          },
          {
            name: 'Tretinoin 0.025% Cream',
            type: 'Cream',
            dosage: 'Pea-sized amount',
            timing: 'Apply at night',
            duration: '15 Days'
          }
        ],
        diagnosisNotes: 'Severe cystic acne over cheek region.',
        createdAt: new Date().toISOString()
      };

      const text = buildPrescriptionWhatsAppText(mockPrescription);

      expect(text).toContain("Dr. Baldawa's Dwarka Clinic");
      expect(text).toContain('Jaysingpur');
      expect(text).toContain('DC-0001');
      expect(text).toContain('Ramesh Balasaheb Patil');
      expect(text).toContain('Isotretinoin 20mg Capsule');
      expect(text).toContain('Tretinoin 0.025% Cream');
      expect(text).toContain('Severe cystic acne');
      expect(text).toContain('15 Days');
    });

    it('gracefully formats prescription when only paper Rx photo is attached', () => {
      const mockPaperOnly: ClinicalPrescription = {
        id: 'rx-test-002',
        visitId: 'visit-test-002',
        patientId: 'DC-0002',
        patientName: 'Sunita Ananda Khot',
        patientPhone: '9421198765',
        patientCity: 'Shirol',
        consultationDate: '2026-11-04',
        shift: 'Evening',
        doctorFee: 100,
        followUpDays: 7,
        nextFollowUpDate: '2026-11-11',
        paperRxPhoto: 'data:image/jpeg;base64,sample',
        medications: [],
        createdAt: new Date().toISOString()
      };

      const text = buildPrescriptionWhatsAppText(mockPaperOnly);

      expect(text).toContain("Dr. Baldawa's Dwarka Clinic");
      expect(text).toContain('*Doctor Notes / Diagnosis:* NA');
      expect(text).toContain('Handwritten Paper Rx attached');
      expect(text).toContain('7 Days');
    });

    it('formats prescription with both medicines and in-clinic procedures included', () => {
      const mockWithProcedures: ClinicalPrescription = {
        id: 'rx-test-003',
        visitId: 'visit-test-003',
        patientId: 'DC-0003',
        patientName: 'Kavita Sharad Patil',
        patientPhone: '9822154321',
        patientCity: 'Jaysingpur',
        consultationDate: '2026-11-04',
        shift: 'Morning',
        doctorFee: 200,
        followUpDays: 21,
        nextFollowUpDate: '2026-11-25',
        medications: [
          {
            name: 'Mupirocin 2% Ointment',
            type: 'Cream',
            dosage: 'Apply twice daily',
            timing: 'Post-procedure',
            duration: '7 Days'
          }
        ],
        procedures: [
          {
            id: 'proc-1',
            name: 'Salicylic Acid Peel (20%)',
            category: 'Chemical Peel',
            fee: 1200,
            notes: 'Active acne flare, session 1'
          },
          {
            id: 'proc-2',
            name: 'Comedone Extraction',
            category: 'Acne Surgery',
            fee: 400,
            notes: 'Nose & forehead'
          }
        ],
        procedureFeeTotal: 1600,
        diagnosisNotes: 'Comedonal acne with inflammatory papules.',
        createdAt: new Date().toISOString()
      };

      const text = buildPrescriptionWhatsAppText(mockWithProcedures);

      expect(text).toContain('*IN-CLINIC PROCEDURES:*');
      expect(text).toContain('Salicylic Acid Peel (20%)');
      expect(text).toContain('Chemical Peel');
      expect(text).toContain('Comedone Extraction');
      expect(text).toContain('*Procedures Total:* ₹1600');
      expect(text).toContain('*Procedure Charges:* ₹1600');
      expect(text).toContain('*Total Fee:* ₹1800'); // 200 + 1600
    });
  });

  describe('5. In-Clinic Procedures & Fee Aggregation Engine', () => {
    it('aggregates multiple procedure fees accurately', () => {
      const procedures: ClinicalProcedure[] = [
        { id: '1', name: 'PRP Hair Therapy', category: 'Trichology', fee: 3500 },
        { id: '2', name: 'Derma Roller (Microneedling)', category: 'Trichology', fee: 1500 }
      ];

      const procedureTotal = procedures.reduce((acc, p) => acc + (Number(p.fee) || 0), 0);
      expect(procedureTotal).toBe(5000);

      const doctorFee = 200;
      const grandTotal = doctorFee + procedureTotal;
      expect(grandTotal).toBe(5200);
    });

    it('gracefully handles missing or string fee fields', () => {
      const procedures: any[] = [
        { id: '1', name: 'Skin Tag Removal', category: 'Dermatosurgery', fee: '800' },
        { id: '2', name: 'Wart Excision', category: 'Dermatosurgery', fee: undefined }
      ];

      const procedureTotal = procedures.reduce((acc, p) => acc + (Number(p.fee) || 0), 0);
      expect(procedureTotal).toBe(800);
    });
  });

  describe('6. Clinic Master Procedure Catalog Verification', () => {
    it('contains verified dermatology and trichology procedure items', () => {
      expect(MASTER_CLINIC_PROCEDURES.length).toBeGreaterThanOrEqual(10);

      const names = MASTER_CLINIC_PROCEDURES.map((p: ClinicalProcedure) => p.name);
      expect(names.some(n => n.includes('Salicylic Acid Peel'))).toBe(true);
      expect(names.some(n => n.includes('Glycolic Acid Peel'))).toBe(true);
      expect(names.some(n => n.includes('Comedone Extraction'))).toBe(true);
      expect(names.some(n => n.includes('PRP Hair Therapy'))).toBe(true);
      expect(names.some(n => n.includes('Skin Tag Removal'))).toBe(true);
    });

    it('all master procedures have valid categories and positive fees', () => {
      for (const proc of MASTER_CLINIC_PROCEDURES) {
        expect(proc.name).toBeTruthy();
        expect(proc.category).toBeTruthy();
        expect(proc.fee).toBeGreaterThan(0);
      }
    });
  });

  describe('7. Fuzzy Search & Typo Tolerance Engine', () => {
    it('computes accurate Levenshtein distance for typos and transpositions', () => {
      expect(levenshteinDistance('Novnib', 'Novanib')).toBe(1);
      expect(levenshteinDistance('Salycilic', 'Salicylic')).toBe(2);
      expect(levenshteinDistance('Kenacot', 'Kenacort')).toBe(1);
      expect(levenshteinDistance('same', 'same')).toBe(0);
      expect(levenshteinDistance('', 'test')).toBe(4);
    });

    it('matches "Novnib" to "Novanib-T 1 Tab (Tofacitinib)" tolerating typo', () => {
      const results = fuzzyFilter(
        DERMA_FORMULARY_MEDICATIONS,
        'Novnib',
        m => `${m.name} ${m.category || ''} ${m.type}`
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Novanib');
    });

    it('matches "Salycilic" to "Salicylic Acid Peel (20%)" tolerating vowel transposition', () => {
      const results = fuzzyFilter(
        DERMA_FORMULARY_PROCEDURES,
        'Salycilic',
        p => `${p.name} ${p.category} ${p.notes || ''}`
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Salicylic Acid Peel');
    });

    it('matches "Kenacot" to "Intralesional Kenacort (Triamcinolone Acetonide)" tolerating omission', () => {
      const results = fuzzyFilter(
        DERMA_FORMULARY_PROCEDURES,
        'Kenacot',
        p => `${p.name} ${p.category} ${p.notes || ''}`
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toContain('Kenacort');
    });

    it('ranks exact and prefix matches above fuzzy matches', () => {
      const sampleItems = [
        { name: 'Itraconazole 200mg' },
        { name: 'Itraconazole 100mg Capsule' },
        { name: 'Itracanazole (Typo)' }
      ];

      const ranked = fuzzyFilter(sampleItems, 'Itraconazole', item => item.name);
      expect(ranked[0].name).toContain('Itraconazole');
    });

    it('returns all items when query is empty or whitespace', () => {
      const sample = [{ name: 'A' }, { name: 'B' }];
      expect(fuzzyFilter(sample, '', i => i.name)).toEqual(sample);
      expect(fuzzyFilter(sample, '   ', i => i.name)).toEqual(sample);
    });
  });

  describe('8. Elapsed Follow-Up Days & Renewal Policy Calculation', () => {
    it('calculates elapsed calendar days accurately regardless of time of day', () => {
      expect(calculateElapsedDays('2026-11-04', '2026-11-04')).toBe(0);
      expect(calculateElapsedDays('2026-10-20', '2026-11-04')).toBe(15);
      expect(calculateElapsedDays('2026-10-05', '2026-11-04')).toBe(30);
      expect(calculateElapsedDays('2026-10-04', '2026-11-04')).toBe(31);
    });

    it('accurately evaluates 30-day renewal policy boundary condition', () => {
      const refDate = '2026-11-04';

      // Within 30 days: valid ₹100 follow-up
      const withinVisit = '2026-10-10';
      const withinDays = calculateElapsedDays(withinVisit, refDate);
      expect(withinDays).toBeLessThanOrEqual(30);
      const isWithinWindow = withinDays <= 30;
      expect(isWithinWindow).toBe(true);

      // Over 30 days: ₹200 renewal due
      const expiredVisit = '2026-10-01';
      const expiredDays = calculateElapsedDays(expiredVisit, refDate);
      expect(expiredDays).toBeGreaterThan(30);
      const isExpired = expiredDays > 30;
      expect(isExpired).toBe(true);
    });

    it('handles Date objects as well as string dates cleanly', () => {
      const dateA = new Date('2026-10-28');
      const dateB = new Date('2026-11-04');
      expect(calculateElapsedDays(dateA, dateB)).toBe(7);
    });
  });

});
