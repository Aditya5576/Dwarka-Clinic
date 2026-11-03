---
name: react-best-practices
description: >-
  Use when building React components, custom hooks, and UI views.
  Enforces container/presentational separation, efficient re-rendering, and snappy reception desk UI.
---

# React Best Practices for Reception Desk PWA

## Reception Desk Latency Target
The clinic receptionist enters hundreds of patient details per day. Keystroke latency must be <16ms (60fps). No form re-renders on every keystroke in parent containers.

---

## 1. Architectural Patterns
- **Container / Presentational Separation:**
  - Container components own IndexedDB reads/writes, mutations, and side-effects.
  - Presentational components are pure, accept props, and handle presentation.
- **Uncontrolled Inputs for High-Speed Forms:**
  - Use React Hook Form with Zod resolver or uncontrolled native refs for rapid data entry to prevent render thrashing.
- **Keyboard Shortcuts:**
  - Support full keyboard navigation (e.g. `Ctrl+N` for new patient, `Ctrl+F` for search, `Enter` to submit, `Esc` to clear modal).

---

## 2. Rendering & Hook Discipline
- **State Localization:**
  - Keep state as close to where it is used as possible.
  - Avoid putting transient search filter text into global state.
- **Memoization Strategy:**
  - Use `useMemo` for derived lists (e.g. filtering a 50-patient waiting queue by triage tag).
  - Use `useCallback` when passing callbacks to memoized list items (`React.memo(QueueCard)`).
- **Custom Hook Encapsulation:**
  - Encapsulate storage logic into clean hooks (`usePatientQueue()`, `usePatientSearch(query)`, `useOfflineSync()`).
