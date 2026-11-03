---
name: pwa-offline-indexeddb
description: >-
  Use when designing, implementing, or debugging PWA service workers, caching strategies,
  IndexedDB schemas, offline queue sync, and local data persistence for Dr. Baldawa's Dwarka Clinic PWA.
---

# PWA Offline & IndexedDB Architecture

## Operational Requirement
Dr. Baldawa's Dwarka Clinic reception desk operates in an environment where network dropouts can happen anytime. The receptionist cannot be blocked from registering patients, generating tokens, or logging fee collections when offline.

---

## 1. PWA Service Worker & Caching Strategy
- **Application Shell:** Precache all static assets (HTML, CSS, JS, fonts, clinic branding) using CacheFirst or StaleWhileRevalidate via `vite-plugin-pwa` / Workbox.
- **Service Worker Updates:** Prompt receptionist gently when an update is available without abruptly reloading the page during active form entry.
- **Installability:** Ensure valid manifest with appropriate icons, `display: "standalone"`, `orientation: "any"`, and theme colors.

---

## 2. IndexedDB Storage Architecture (Dexie.js / idb)
- **Primary Entities:**
  - `patients`: Local search index on `id`, `phone`, `name`, `uhid`, `createdAt`.
  - `visits`: Queue visits with `id`, `patientId`, `tokenNumber`, `status` (`waiting` | `with_doctor` | `completed`), `timestamp`.
  - `billing`: Intake fees and payment modes (`cash`, `upi`).
  - `syncQueue`: Offline mutation log for actions requiring sync to backend (`create_patient`, `update_visit`, etc.).
- **ACID Transactions:** Always group related writes (e.g. create patient + assign queue token) within a single IndexedDB transaction.
- **Optimistic UI:** Always update local IndexedDB first, reflect immediately in the UI (0ms latency), and asynchronously flush the sync queue.

---

## 3. Offline Queue & Conflict Resolution
- Every queued mutation must include:
  - `mutationId` (UUID)
  - `timestamp` (ISO string)
  - `entity` & `action`
  - `payload`
  - `status` (`pending` | `syncing` | `failed`)
  - `retryCount`
- When network reconnects, process mutations sequentially in FIFO order.
- On conflict, clinic desk local state takes precedence for receptionist notes; server provides authoritative sequence numbers if applicable.
