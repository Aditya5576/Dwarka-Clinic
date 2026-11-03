---
name: healthcare-security-privacy
description: >-
  Use when handling patient data, intake forms, local storage encryption, input sanitization,
  and compliance with patient health information privacy rules.
---

# Healthcare Security & Patient Privacy Standards

## Clinical Context
Dr. Baldawa's Dwarka Clinic handles confidential medical records, diagnoses, and personal contact info. Patient Health Information (PHI) must be guarded rigorously.

---

## 1. Zero-Leakage Principles
- **No PHI in Logs:** Never use `console.log(patient)` or print names, phone numbers, or medical diagnoses in logs. Use masked identifiers (e.g. `UHID: DC-***-0042`).
- **No PHI in URLs:** Never pass patient details or query params containing names or phone numbers in browser history or URL paths.
- **No Third-Party Analytics / Trackers:** Absolutely zero external tracking scripts, Google Analytics, or third-party ad beacons in the clinic application.

---

## 2. Local Storage Protection
- **IndexedDB Isolation:** Clinic database must be scoped to the origin.
- **Secure Export / Backup:** When receptionist exports patient registers or end-of-day billing tallies, use password-protected or local encrypted CSV/JSON exports.
- **Session Auto-Lock:** Support an automatic inactivity lock screen on the reception desk terminal if left unattended for 15 minutes.

---

## 3. Input Sanitization & Boundary Defense
- **XSS Prevention:** Always render patient notes and inputs through React's native JSX escaping. Never use `dangerouslySetInnerHTML`.
- **Sanitized Search Queries:** Sanitize phone numbers and patient names to strip control characters before querying IndexedDB.

