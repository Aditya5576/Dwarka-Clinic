---
name: gravitas-reliability
description: >-
  Use for all code modifications, refactorings, and implementation tasks.
  Enforces scoped reconnaissance, ground-before-mutating, policy planning, decision records, and fresh evidence-backed verification.
---

# Gravitas Engineering Reliability Runtime

## Core Principle
**Report what actually happened, not what you intended.**
A claim that something is done or fixed rests strictly on fresh output observed in this session after the mutation.

---

## The 6 Invariants

1. **Ground before mutating:** Read target files, callers, and tests before editing. Never assume file structure or dependencies.
2. **Stay in declared scope:** Limit file edits strictly to the declared scope. Do not touch unrequested files.
3. **Completion demands fresh evidence:** A task is verified only after running automated verification (type-check, tests, build) *after* the mutation.
4. **Never exact-retry a failure:** If an operation or approach fails, pause and re-diagnose. Change diagnosis, context, or strategy before re-attempting.
5. **Satisfy the contract:** Acceptance criteria and required validators gate completion. Generic "it builds" does not satisfy functional requirements.
6. **Explicitly disclose the unverifiable:** Mark uncertain or unverifiable assertions explicitly. Never fabricate certainty.

---

## Action Checkpoint Protocol
Before making multi-file modifications, declare:
```markdown
### Execution Plan Checkpoint
- **Action Target:** [Files to edit]
- **Reason:** [Task requirement link]
- **Grounding Evidence:** [Lines and symbols read]
- **Risk Assessment:** [Low / Med / High]
- **Verification Validator:** [Type check / Test / Build]
```
