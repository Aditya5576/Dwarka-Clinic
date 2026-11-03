---
name: vitest-tdd-workflow
description: >-
  Use when writing, executing, or debugging automated unit and component tests with Vitest
  and React Testing Library. Enforces test-first development and mock isolation.
---

# Vitest TDD & Verification Workflow

## Core Mandates
1. **Delegated Execution:** When executing test commands via agents, always delegate test runs to subagents or dedicated testing tools as per user rule preferences.
2. **Test-First for Fixes:** Write a failing test demonstrating the bug before modifying implementation code.
3. **Pure Unit Isolation:** Mock external hardware (thermal printers), network APIs, and IndexedDB in unit tests using Vitest's `vi.mock()` and `fake-indexeddb`.

---

## Standard Vitest Patterns

### 1. Store / Service Logic Testing
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { PatientQueueService } from './patientQueueService';
import { db } from '../db';

describe('PatientQueueService', () => {
  let service: PatientQueueService;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    service = new PatientQueueService(db);
  });

  it('assigns sequential tokens for same-day visits', async () => {
    const token1 = await service.registerIntake({ name: 'Ramesh Patil', phone: '9876543210' });
    const token2 = await service.registerIntake({ name: 'Suresh More', phone: '9876543211' });

    expect(token1.tokenNumber).toBe(1);
    expect(token2.tokenNumber).toBe(2);
  });
});
```

### 2. Component Testing with React Testing Library
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientIntakeForm } from './PatientIntakeForm';
import { describe, it, expect, vi } from 'vitest';

describe('PatientIntakeForm', () => {
  it('validates 10-digit Indian mobile number format', async () => {
    const onSubmit = vi.fn();
    render(<PatientIntakeForm onSubmit={onSubmit} />);

    const phoneInput = screen.getByLabelText(/mobile number/i);
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/enter a valid 10-digit mobile number/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

