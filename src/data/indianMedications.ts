import { type CustomMedication } from '../types';

export const INDIAN_DERMA_MEDICATIONS: CustomMedication[] = [
  // --- ACNE & ROSACEA ---
  {
    name: 'Isotretinoin 10mg Capsule (Tretiva / Sotret)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Once daily after dinner with milk',
    category: 'Acne Vulgaris'
  },
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
    name: 'Tretinoin 0.05% Cream (Retino-A)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Apply thin layer at bedtime',
    category: 'Acne & Anti-Aging'
  },
  {
    name: 'Adapalene 0.1% Gel (Adaferin / Deriva)',
    type: 'Gel',
    defaultDosage: 'Small pea-sized amount',
    defaultTiming: 'Apply thin layer at night',
    category: 'Acne Vulgaris'
  },
  {
    name: 'Adapalene 0.1% + Clindamycin 1% Gel (Deriva-CMS)',
    type: 'Gel',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Apply at night on acne lesions',
    category: 'Acne Vulgaris'
  },
  {
    name: 'Clindamycin 1% Gel (Clindac-A / Nilac)',
    type: 'Gel',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Morning & Afternoon on active pimples',
    category: 'Acne Vulgaris'
  },
  {
    name: 'Benzoyl Peroxide 2.5% Gel (Persol AC / Benxop)',
    type: 'Gel',
    defaultDosage: 'Spot application',
    defaultTiming: 'Morning on pimples after face wash',
    category: 'Acne Vulgaris'
  },
  {
    name: 'Benzoyl Peroxide 5% Gel (Persol 5% / Brevoxyl)',
    type: 'Gel',
    defaultDosage: 'Spot application',
    defaultTiming: 'Leave on for 1 hour, then rinse',
    category: 'Acne Vulgaris'
  },
  {
    name: 'Azelaic Acid 10% Cream (Aziderm 10%)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Morning & Night',
    category: 'Acne & Post-Inflammatory Erythema'
  },
  {
    name: 'Azelaic Acid 20% Cream (Aziderm 20%)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Apply thin layer at bedtime',
    category: 'Acne & Hyperpigmentation'
  },
  {
    name: 'Nadifloxacin 1% Cream (Nadoxin)',
    type: 'Cream',
    defaultDosage: 'Small amount',
    defaultTiming: 'Twice daily on acne spots',
    category: 'Acne & Folliculitis'
  },
  {
    name: 'Doxycycline 100mg Tablet (Doxicip / Doxy-1)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Twice daily after meals with full glass of water',
    category: 'Acne & Rosacea'
  },
  {
    name: 'Minocycline 50mg Tablet (Minoz 50)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily after meals',
    category: 'Acne & Rosacea'
  },
  {
    name: 'Salicylic Acid 2% Face Wash (Saslic DS / Sebogel)',
    type: 'Lotion',
    defaultDosage: 'Gentle foam',
    defaultTiming: 'Wash face twice daily',
    category: 'Cleanser'
  },

  // --- TRICHOLOGY & HAIR LOSS ---
  {
    name: 'Minoxidil 5% Topical Solution (Mintop / Morr 5%)',
    type: 'Lotion',
    defaultDosage: '1 ml (5-6 sprays)',
    defaultTiming: 'Twice daily on dry scalp (Morning & Night)',
    category: 'Alopecia & Hair Regrowth'
  },
  {
    name: 'Minoxidil 10% Solution (Mintop 10% / Morr 10%)',
    type: 'Lotion',
    defaultDosage: '1 ml (5 sprays)',
    defaultTiming: 'Once daily at night on crown area',
    category: 'Alopecia & Hair Regrowth'
  },
  {
    name: 'Minoxidil 5% + Finasteride 0.1% Solution (Morr-F 5%)',
    type: 'Lotion',
    defaultDosage: '1 ml (6 sprays)',
    defaultTiming: 'Apply at night on thinning areas',
    category: 'Androgenetic Alopecia'
  },
  {
    name: 'Finasteride 1mg Tablet (Finax / Finalo)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily after breakfast',
    category: 'Androgenetic Alopecia (Male)'
  },
  {
    name: 'Dutasteride 0.5mg Capsule (Dutas)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Once daily after meals',
    category: 'Alopecia'
  },
  {
    name: 'Procapil + Redensyl + Anagain Hair Serum (Renocia / Bontress)',
    type: 'Serum',
    defaultDosage: '1 ml to 2 ml',
    defaultTiming: 'Apply every night on scalp & massage gently',
    category: 'Hair Growth Factor Serum'
  },
  {
    name: 'Biotin 10mg + Zinc + L-Cysteine Tablets (Keraglo-Eva / Follihair)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily after lunch',
    category: 'Hair & Nail Supplement'
  },
  {
    name: 'Ketoconazole 2% Shampoo (Nizral / Scalpe+)',
    type: 'Shampoo',
    defaultDosage: '5 ml to 10 ml',
    defaultTiming: 'Apply on scalp, leave 5 mins, wash off (2-3x/week)',
    category: 'Dandruff & Seborrheic Dermatitis'
  },
  {
    name: 'Ketoconazole 2% + Zinc Pyrithione (ZPTO) Lotion (Scalpe Pro)',
    type: 'Shampoo',
    defaultDosage: 'Generous lather',
    defaultTiming: 'Twice weekly, leave for 5 minutes',
    category: 'Dandruff'
  },
  {
    name: 'Coal Tar + Salicylic Acid Solution (Salytar / Ionax-T)',
    type: 'Lotion',
    defaultDosage: '5 ml',
    defaultTiming: 'Twice weekly for scaliness and psoriasis',
    category: 'Scalp Psoriasis'
  },
  {
    name: 'Clobetasol Propionate 0.05% Scalp Solution (Tenovate Scalp)',
    type: 'Lotion',
    defaultDosage: 'A few drops',
    defaultTiming: 'Apply on affected itchy scalp patches at night',
    category: 'Scalp Dermatitis'
  },

  // --- FUNGAL INFECTIONS (TINEA / CANDIDA) ---
  {
    name: 'Itraconazole 100mg Capsule (Candiforce 100 / Itaspor)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Twice daily after full meals',
    category: 'Tinea & Fungal Infections'
  },
  {
    name: 'Itraconazole 200mg Capsule (Candiforce 200 / Canditral)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Once daily after lunch or dinner',
    category: 'Tinea & Fungal Infections'
  },
  {
    name: 'Terbinafine 250mg Tablet (Sebifin 250 / Terbicip)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily after food',
    category: 'Onychomycosis & Tinea'
  },
  {
    name: 'Terbinafine 1% Cream (Sebifin Cream / Lamisil)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Twice daily on affected clean & dry area',
    category: 'Tinea Corporis / Cruris'
  },
  {
    name: 'Luliconazole 1% Cream (Lulifin / Lulican)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Apply once daily at night on rash & 2cm margin',
    category: 'Tinea & Ringworm'
  },
  {
    name: 'Sertaconazole 2% Cream (Onabet)',
    type: 'Cream',
    defaultDosage: 'Thin application',
    defaultTiming: 'Twice daily for 2 to 4 weeks',
    category: 'Tinea & Candidiasis'
  },
  {
    name: 'Ketoconazole 2% Cream (Nizral Cream / Fungicide)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Twice daily after bath and before sleeping',
    category: 'Fungal Infection'
  },
  {
    name: 'Fluconazole 150mg Tablet (Forcan 150 / Zocon 150)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once weekly for 4 weeks',
    category: 'Candidiasis & Recurrent Fungal'
  },
  {
    name: 'Clotrimazole 1% Dusting Powder (Candid Dusting Powder / Abzorb)',
    type: 'Powder',
    defaultDosage: 'Dust gently',
    defaultTiming: 'Apply twice daily in body folds & groin after drying',
    category: 'Anti-Fungal Dusting Powder'
  },
  {
    name: 'Amorolfine 0.25% Cream / Nail Lacquer (Loceryl / Amrosys)',
    type: 'Cream',
    defaultDosage: 'Thin film',
    defaultTiming: 'Apply once or twice weekly on affected nails',
    category: 'Onychomycosis (Nail Fungus)'
  },

  // --- ECZEMA, DERMATITIS & PSORIASIS ---
  {
    name: 'Desonide 0.05% Cream (Desowen / Dosetil)',
    type: 'Cream',
    defaultDosage: 'Thin film',
    defaultTiming: 'Twice daily on facial / sensitive skin rash',
    category: 'Mild Topical Steroid'
  },
  {
    name: 'Mometasone Furoate 0.1% Cream (Elocon / Momate)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Once daily at night on eczema / dermatitis',
    category: 'Moderate Topical Steroid'
  },
  {
    name: 'Clobetasol Propionate 0.05% Cream (Tenovate / Cosvate)',
    type: 'Cream',
    defaultDosage: 'Very thin layer',
    defaultTiming: 'Apply once daily for max 7-10 days',
    category: 'Potent Topical Steroid'
  },
  {
    name: 'Halobetasol Propionate 0.05% Cream (Halovate)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Apply once daily at bedtime',
    category: 'Ultra-Potent Steroid'
  },
  {
    name: 'Clobetasol + Salicylic Acid Ointment (Tenovate-S / Cosvate-S)',
    type: 'Cream',
    defaultDosage: 'Thin application',
    defaultTiming: 'Apply twice daily on thickened plaque or cracked heels',
    category: 'Keratolytic & Steroid'
  },
  {
    name: 'Tacrolimus 0.03% Ointment (Tacroz 0.03% / Takfa)',
    type: 'Cream',
    defaultDosage: 'Small amount',
    defaultTiming: 'Twice daily on atopic dermatitis / vitiligo',
    category: 'Calcineurin Inhibitor (Non-Steroid)'
  },
  {
    name: 'Tacrolimus 0.1% Ointment (Tacroz 0.1% / Takfa Forte)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Twice daily on adult eczema / vitiligo',
    category: 'Calcineurin Inhibitor'
  },
  {
    name: 'Pimecrolimus 1% Cream (Pacroma / Elidel)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Twice daily on facial dermatitis',
    category: 'Calcineurin Inhibitor'
  },
  {
    name: 'Calcipotriol 0.005% + Betamethasone Ointment (Daivobet)',
    type: 'Cream',
    defaultDosage: 'Thin application',
    defaultTiming: 'Apply once daily on psoriasis plaques',
    category: 'Psoriasis'
  },
  {
    name: 'Deflazacort 6mg Tablet (Defnalone / Orthocort)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Morning after breakfast for acute flare',
    category: 'Oral Corticosteroid'
  },
  {
    name: 'Methotrexate 7.5mg Tablet (Folitrax 7.5)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once a week on fixed day (e.g. Sunday)',
    category: 'Psoriasis Immunosuppressant'
  },
  {
    name: 'Folic Acid 5mg Tablet (Folvite 5mg)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily except on Methotrexate day',
    category: 'Supplement'
  },

  // --- MOISTURIZERS & BARRIER REPAIR ---
  {
    name: 'Liquid Paraffin + White Soft Paraffin Lotion (Cetaphil / Moisturex Soft)',
    type: 'Lotion',
    defaultDosage: 'Liberal application',
    defaultTiming: 'Apply twice daily immediately after bathing',
    category: 'Emollient & Moisturizer'
  },
  {
    name: 'Ceramide + Hyaluronic Acid Cream (Acrofy / Cerave / Cetaphil DAM)',
    type: 'Cream',
    defaultDosage: 'Generous layer',
    defaultTiming: 'Morning & Night on face & neck',
    category: 'Skin Barrier Repair'
  },
  {
    name: 'Colloidal Oatmeal 2% Lotion (Aveeno / Elovera / Emolene)',
    type: 'Lotion',
    defaultDosage: 'Apply gently',
    defaultTiming: 'Twice to thrice daily on itchy dry skin',
    category: 'Soothing Emollient'
  },
  {
    name: 'Urea 10% + Lactic Acid Cream (Moisturex / U-Lactin)',
    type: 'Cream',
    defaultDosage: 'Rub thoroughly',
    defaultTiming: 'Twice daily on rough knees, elbows, cracked heels',
    category: 'Keratolytic & Hydration'
  },
  {
    name: 'Syndet Bar / Soap-Free Cleanser (Dove / Cetaphil Bar / Tedibar)',
    type: 'Soap',
    defaultDosage: 'Lather gently',
    defaultTiming: 'Use during daily bath instead of ordinary soap',
    category: 'Gentle Cleansing'
  },

  // --- PARASITIC INFECTIONS & SCABIES ---
  {
    name: 'Permethrin 5% Lotion (Scabper / Permite 5%)',
    type: 'Lotion',
    defaultDosage: 'Apply from neck to toes',
    defaultTiming: 'Apply all over body at night, wash off after 10-12 hrs',
    category: 'Scabies'
  },
  {
    name: 'Permethrin 5% Soap (Scabper Soap)',
    type: 'Soap',
    defaultDosage: 'Bath lather',
    defaultTiming: 'Use daily for 1 week for family members',
    category: 'Scabies Bathing'
  },
  {
    name: 'Ivermectin 12mg Tablet (Ivecop 12 / Vermact 12)',
    type: 'Tablet',
    defaultDosage: '1 Tab (stat)',
    defaultTiming: 'Take single dose on empty stomach, repeat after 7 days',
    category: 'Scabies & Parasites'
  },
  {
    name: 'Calamine + Zinc Oxide Lotion (Lacto Calamine / Calosoft)',
    type: 'Lotion',
    defaultDosage: 'Dab gently',
    defaultTiming: 'Twice daily on itchy pruritc rashes',
    category: 'Anti-Pruritic'
  },

  // --- HYPERPIGMENTATION & SUNSCREENS ---
  {
    name: 'Sunscreen Gel SPF 50+ PA++++ (La Shield / Suncros / UV Doux)',
    type: 'Gel',
    defaultDosage: 'Two-finger rule',
    defaultTiming: 'Apply 20 mins before sun exposure, reapply every 3 hrs',
    category: 'Photoprotection'
  },
  {
    name: 'Sunscreen Lotion SPF 30+ (Neutrogena / Photoban)',
    type: 'Lotion',
    defaultDosage: 'Generous application',
    defaultTiming: 'Morning at 9:00 AM on face, neck and exposed arms',
    category: 'Photoprotection'
  },
  {
    name: 'Kojic Acid + Arbutin + Vitamin C Cream (Kojivit Ultra / Demelan)',
    type: 'Cream',
    defaultDosage: 'Pea-sized amount',
    defaultTiming: 'Apply at bedtime on dark spots and blemishes',
    category: 'Hyperpigmentation & Melasma'
  },
  {
    name: 'Glycolic Acid 6% Cream (Glyco-6)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Nightly application, 2-3 times a week initially',
    category: 'Skin Renewal & Glow'
  },
  {
    name: 'Glycolic Acid 12% Cream (Glyco-12)',
    type: 'Cream',
    defaultDosage: 'Small amount',
    defaultTiming: 'Apply at night on elbows, knees, hyperpigmented areas',
    category: 'Exfoliation'
  },
  {
    name: 'Hydroquinone 2% + Tretinoin 0.025% + Mometasone Cream (Melalite Forte / Skinlite)',
    type: 'Cream',
    defaultDosage: 'Tiny spot application',
    defaultTiming: 'Night only on stubborn melasma (strict doctor monitoring)',
    category: 'Triple Combination Depigmentation'
  },
  {
    name: 'Tranexamic Acid 250mg Tablet (Trapic 250)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Twice daily after meals for melasma',
    category: 'Melasma Systemic'
  },
  {
    name: 'Tranexamic Acid 5% + Kojic Acid Serum (Tyrodin / Melanofree)',
    type: 'Serum',
    defaultDosage: '3 to 4 drops',
    defaultTiming: 'Apply before bedtime on hyperpigmented areas',
    category: 'Melasma & PIH'
  },
  {
    name: 'Vitamin C 20% + Ferulic Acid Serum (C-Vit / VCX Serum)',
    type: 'Serum',
    defaultDosage: '4 to 5 drops',
    defaultTiming: 'Morning under sunscreen on clean face',
    category: 'Antioxidant & Radiance'
  },
  {
    name: 'Niacinamide 10% + Zinc 1% Serum (The Derma Co / Minimalist)',
    type: 'Serum',
    defaultDosage: '3 drops',
    defaultTiming: 'Twice daily after face wash',
    category: 'Pores & Oil Control'
  },

  // --- ANTIHISTAMINES & ANTI-ALLERGIC ---
  {
    name: 'Levocetirizine 5mg Tablet (1-AL / Vozet / Teczine)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily at bedtime',
    category: 'Allergic Pruritus & Urticaria'
  },
  {
    name: 'Cetirizine 10mg Tablet (Cetzine / Alerid)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily at bedtime',
    category: 'Anti-Allergic'
  },
  {
    name: 'Bilastine 20mg Tablet (Bilashine / Bilaxten)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily on empty stomach (1 hr before breakfast)',
    category: 'Chronic Urticaria (Non-Sedating)'
  },
  {
    name: 'Fexofenadine 120mg Tablet (Allegra 120)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily in the morning',
    category: 'Non-Sedating Antihistamine'
  },
  {
    name: 'Fexofenadine 180mg Tablet (Allegra 180)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily in the morning with water',
    category: 'Urticaria & Severe Itch'
  },
  {
    name: 'Hydroxyzine 25mg Tablet (Atarax 25)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily at night (for severe nocturnal itching)',
    category: 'Sedative Anti-Pruritic'
  },
  {
    name: 'Ebastine 10mg Tablet (Ebast / Ebast-M)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily at night',
    category: 'Antihistamine'
  },

  // --- BACTERIAL INFECTIONS, WOUNDS & ANTISEPTICS ---
  {
    name: 'Mupirocin 2% Ointment (Bactroban / T-Bact)',
    type: 'Cream',
    defaultDosage: 'Small amount',
    defaultTiming: 'Apply 3 times daily on cuts, boils & bacterial lesions',
    category: 'Topical Antibacterial'
  },
  {
    name: 'Fusidic Acid 2% Cream (Fucidin)',
    type: 'Cream',
    defaultDosage: 'Thin layer',
    defaultTiming: 'Apply twice daily for 7 days',
    category: 'Impetigo & Folliculitis'
  },
  {
    name: 'Fusidic Acid + Betamethasone Cream (Fucibet)',
    type: 'Cream',
    defaultDosage: 'Thin film',
    defaultTiming: 'Twice daily for infected eczema (max 7 days)',
    category: 'Antibacterial + Steroid'
  },
  {
    name: 'Amoxicillin + Clavulanic Acid 625mg Tablet (Augmentin 625 Duo / Moxikind-CV)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Twice daily after food for 5-7 days',
    category: 'Oral Antibiotic'
  },
  {
    name: 'Cephalexin 500mg Capsule (Sporidex 500)',
    type: 'Capsule',
    defaultDosage: '1 Cap',
    defaultTiming: 'Twice daily after food for skin infections',
    category: 'Oral Antibiotic'
  },
  {
    name: 'Povidone Iodine 5% Ointment (Betadine Ointment)',
    type: 'Cream',
    defaultDosage: 'Generous application',
    defaultTiming: 'Apply twice daily with sterile dressing',
    category: 'Antiseptic'
  },
  {
    name: 'Silver Sulfadiazine 1% Cream (Silverex / Silvazine)',
    type: 'Cream',
    defaultDosage: '1-2 mm thick layer',
    defaultTiming: 'Apply twice daily on burn or ulcer surface',
    category: 'Burns & Ulcers'
  },
  {
    name: 'Ciprofloxacin 0.3% Ear/Eye Drops (Ciplox Drops)',
    type: 'Drops',
    defaultDosage: '2 drops',
    defaultTiming: 'Thrice daily into ear or eye as advised',
    category: 'Antibiotic Drops'
  },
  // --- IMMUNOMODULATORS & JAK INHIBITORS ---
  {
    name: 'Novanib-T 1 Tab (Tofacitinib)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Once daily after dinner',
    category: 'Autoimmune & Alopecia Areata / Vitiligo'
  },
  {
    name: 'Novanib 5mg Tablet (Tofacitinib)',
    type: 'Tablet',
    defaultDosage: '1 Tab',
    defaultTiming: 'Twice daily after meals',
    category: 'Autoimmune & Alopecia Areata / Vitiligo'
  }
];

