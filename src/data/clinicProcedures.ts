import { type ClinicalProcedure } from '../types';

/**
 * Standard In-Clinic Procedures & Minor Dermatosurgery Master Catalog
 * Custom-tailored for Dr. Sandeep Baldawa (M.B.B.S., D.D.V.)
 * Dr. Baldawa's Dwarka Clinic, Purtiwadi, Jaysingpur
 */
export const CLINIC_MASTER_PROCEDURES: ClinicalProcedure[] = [
  // Chemical Peels
  {
    id: 'proc-cp-01',
    name: 'Salicylic Acid Peel (20% / 30%)',
    category: 'Chemical Peel',
    fee: 800,
    notes: 'For active acne, comedones, and excess sebum regulation'
  },
  {
    id: 'proc-cp-02',
    name: 'Glycolic Acid Peel (35% / 50%)',
    category: 'Chemical Peel',
    fee: 1000,
    notes: 'For skin glow, mild photoaging, and epidermal pigmentation'
  },
  {
    id: 'proc-cp-03',
    name: 'Yellow Peel (Retinol / Arbutin)',
    category: 'Chemical Peel',
    fee: 1500,
    notes: 'For stubborn melasma, dermal hyperpigmentation, and rejuvenation'
  },
  {
    id: 'proc-cp-04',
    name: 'Mandelic Acid Peel (40%)',
    category: 'Chemical Peel',
    fee: 900,
    notes: 'Gentle peel for sensitive skin, rosacea, and inflammatory pustules'
  },

  // Acne & Spots
  {
    id: 'proc-ac-01',
    name: 'Comedone Extraction (Manual)',
    category: 'Acne Surgery',
    fee: 400,
    notes: 'Sterile unroofing of open & closed comedones under magnifier'
  },
  {
    id: 'proc-ac-02',
    name: 'Intralesional Steroid Injection (Triamcinolone)',
    category: 'Acne Surgery',
    fee: 500,
    notes: 'For cystic nodular acne lesions and hypertrophic scars / keloids'
  },
  {
    id: 'proc-ac-04',
    name: 'Intralesional Kenacort (Triamcinolone Acetonide)',
    category: 'Acne Surgery',
    fee: 500,
    notes: 'Targeted Kenacort injection for keloids, hypertrophic scars & alopecia areata'
  },
  {
    id: 'proc-ac-03',
    name: 'TCA Cross (70% - 90%) for Scars',
    category: 'Acne Surgery',
    fee: 1200,
    notes: 'Targeted chemical reconstruction of atrophic ice-pick acne scars'
  },

  // Dermatosurgery
  {
    id: 'proc-ds-01',
    name: 'Radiofrequency Wart Removal / Cautery',
    category: 'Dermatosurgery',
    fee: 800,
    notes: 'RF ablation under local anaesthesia with minimal downtime'
  },
  {
    id: 'proc-ds-02',
    name: 'Radiofrequency Mole Excision',
    category: 'Dermatosurgery',
    fee: 1200,
    notes: 'Precision shave excision / RF vaporization of dermal melanocytic nevus'
  },
  {
    id: 'proc-ds-03',
    name: 'Skin Tag Removal (Acrochordon Cautery)',
    category: 'Dermatosurgery',
    fee: 600,
    notes: 'Electrofulguration of neck and axillary skin tags'
  },

  // Aesthetics & Laser
  {
    id: 'proc-ae-01',
    name: 'Derma Roller / Microneedling (Acne Scars)',
    category: 'Aesthetic',
    fee: 1500,
    notes: 'Collagen induction therapy for rolling/boxcar acne scars'
  },
  {
    id: 'proc-ae-02',
    name: 'Laser Spot Reduction Therapy',
    category: 'Aesthetic',
    fee: 2000,
    notes: 'Targeted pigmentary laser session for freckles & lentigines'
  },
  {
    id: 'proc-ae-03',
    name: 'Leucoderma Spot Treatment (Punch Graft / Targeted)',
    category: 'Aesthetic',
    fee: 1800,
    notes: 'Targeted repigmentation therapy for stable vitiligo patches'
  },

  // Trichology & Hair
  {
    id: 'proc-tr-01',
    name: 'Scalp Microneedling (Collagen & Growth Boost)',
    category: 'Trichology',
    fee: 1500,
    notes: 'For androgenetic alopecia and telogen effluvium stimulation'
  },
  {
    id: 'proc-tr-02',
    name: 'Scalp Mesotherapy Injection Session',
    category: 'Trichology',
    fee: 1800,
    notes: 'Microinjections of vitamins, biotin & peptide complex into hair dermis'
  },
  {
    id: 'proc-tr-03',
    name: 'PRP Hair Therapy (Platelet-Rich Plasma)',
    category: 'Trichology',
    fee: 3500,
    notes: 'Platelet-Rich Plasma autologous follicle rejuvenation session'
  }
];

export const MASTER_CLINIC_PROCEDURES: ClinicalProcedure[] = CLINIC_MASTER_PROCEDURES;
