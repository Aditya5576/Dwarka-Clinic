---
name: systematic-debugging
description: >-
  Use when encountering any bug, error, test failure, or unexpected behavior before proposing fixes.
  Enforces root-cause investigation before mutation and the 4-phase debugging cycle.
---

# Systematic Debugging — The Iron Law

## The Iron Law
```
NO FIXES WITHOUT ROOT-CAUSE INVESTIGATION FIRST
```
Random patches and guess-and-check edits waste time, create new defects, and mask underlying architectural problems.

---

## The Four Phases

You MUST complete each phase before moving to the next.

### Phase 1: Observation & Evidence Gathering
- Read error messages and stack traces completely without skipping.
- Identify exact file paths, line numbers, error codes, and assertion failures.
- Inspect the actual runtime state or inputs leading to the failure.

### Phase 2: Root-Cause Tracing
- Trace backwards through execution paths from the failure site to the source of invalid data or incorrect state.
- Formulate a clear hypothesis: *"The failure occurs because component X assumes Y, but state Z is emitted when W occurs."*
- Prove or disprove the hypothesis with targeted checks before touching code.

### Phase 3: Minimal, High-Precision Fix
- Write the minimal change that directly fixes the root cause.
- Avoid defensive workarounds or speculative patches that hide the symptom.
- Maintain existing architecture and interfaces.

### Phase 4: Regression & Invariant Verification
- Run the failing test or reproduction step to verify the fix works.
- Run the full suite of related tests to verify no regressions were introduced.
- Confirm system invariants remain intact.

