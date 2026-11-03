---
name: typescript-expert
description: >-
  Use for TypeScript type modeling, strict type-checking, generic abstractions, Zod schemas,
  and clinical domain data structures.
---

# TypeScript Standards & Clinical Domain Modeling

## Core Standards
- **Strict Mode:** Always ensure `strict: true`, `noImplicitAny: true`, and `strictNullChecks: true`.
- **Zero `any`:** Disallow the `any` keyword. Use `unknown` with runtime type narrowing or generic constraints.
- **Discriminated Unions:** Always use discriminated unions for finite state machines (e.g. visit status, sync status, network state).

---

## Clinical Domain Modeling Patterns

### 1. Discriminated Unions for Patient Flow
```typescript
export type VisitStatus = 
  | { status: 'waiting'; queuePosition: number; checkInTime: string }
  | { status: 'with_doctor'; roomNumber: string; startTime: string }
  | { status: 'completed'; completedAt: string; prescriptionIssued: boolean }
  | { status: 'cancelled'; reason: string; cancelledAt: string };

export interface Patient {
  id: string; // UUID or UHID
  uhid: string; // Dwarka Clinic Unique Health ID (e.g., DC-2026-0042)
  fullName: string;
  phone: string; // 10 digits
  age: number;
  gender: 'M' | 'F' | 'Other';
  address?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 2. Runtime Schema Validation with Zod
```typescript
import { z } from 'zod';

export const PatientIntakeSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  age: z.number().int().min(0).max(125),
  gender: z.enum(['M', 'F', 'Other']),
  complaint: z.string().trim().min(1, 'Chief complaint required'),
  feeCollected: z.number().min(0),
  paymentMode: z.enum(['cash', 'upi', 'exempt']),
});

export type PatientIntakeInput = z.infer<typeof PatientIntakeSchema>;
```
