import { type CustomMedication, type ClinicalProcedure } from '../types';
import { INDIAN_DERMA_MEDICATIONS } from './indianMedications';
import { CLINIC_MASTER_PROCEDURES } from './clinicProcedures';
import { fuzzyFilter } from '../utils/fuzzySearch';

/**
 * Dr. Baldawa's Dwarka Clinic Master Dermatology Formulary
 * Tailored for clinical practice in Jaysingpur (Kolhapur district).
 */

export const DERMA_FORMULARY_MEDICATIONS: CustomMedication[] = INDIAN_DERMA_MEDICATIONS;
export const DERMA_FORMULARY_PROCEDURES: ClinicalProcedure[] = CLINIC_MASTER_PROCEDURES;

/**
 * High-frequency core medicines prescribed by Dr. Baldawa
 */
export const CORE_DERMA_FAVORITES: CustomMedication[] = [
  {
    name: 'Isotretinoin 20mg Capsule (Tretiva / Sotret)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Once daily after dinner with milk',
    category: 'Acne Vulgaris'
  },
  {
    name: 'Tretinoin 0.025% Cream (Retino-A / Tretiheal)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Apply at night, leave for 30 mins, wash off',
    category: 'Acne & Anti-Aging'
  },
  {
    name: 'Itraconazole 100mg Capsule (Canditral / Itrasys)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Twice daily after full meals',
    category: 'Tinea & Fungal Infections'
  },
  {
    name: 'Novanib-T 1 Tab (Tofacitinib)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily after dinner',
    category: 'Autoimmune & Alopecia Areata / Vitiligo'
  },
  {
    name: 'Ketoconazole 2% Shampoo (Scalpe+ / Nizral)',
    type: 'Shampoo',
    defaultDosage: '5-10 ml',
    defaultTiming: 'Apply to scalp, leave for 5 mins, rinse twice weekly',
    category: 'Seborrheic Dermatitis & Dandruff'
  },
  {
    name: 'Eberconazole 1% Cream (Ebernet)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Twice daily after bath on dry skin',
    category: 'Tinea & Fungal Infections'
  }
];

/**
 * Fuzzy search helper for medications in the clinic formulary
 */
export function searchMedications(query: string, catalog: CustomMedication[] = DERMA_FORMULARY_MEDICATIONS): CustomMedication[] {
  return fuzzyFilter(catalog, query, med => `${med.name} ${med.category || ''} ${med.type}`);
}

/**
 * Fuzzy search helper for clinic procedures
 */
export function searchProcedures(query: string, catalog: ClinicalProcedure[] = DERMA_FORMULARY_PROCEDURES): ClinicalProcedure[] {
  return fuzzyFilter(catalog, query, proc => `${proc.name} ${proc.category} ${proc.notes || ''}`);
}

