# AI_RULES.md — Operational Engineering Standards & Guardrails

## 1. Absolute Operating Invariants (Gravitas Kernel)

These rules are non-negotiable and apply to every file edit, diagnosis, and code change.

1. **Ground Before Mutating:** Read target files, callers, schemas, and existing tests before editing. Never write or rewrite based on assumed code structure.
2. **Stay in Declared Scope:** Edits must stay strictly confined to files and directories within the current task scope. Never perform unrequested refactors or sweep outside boundaries.
3. **Completion Demands Fresh Evidence:** An implementation or fix is verified ONLY after running automated checks (compilation, type-check, tests) *after* the mutation. Stale evidence or self-attestation is discarded.
4. **Never Exact-Retry a Failure:** If an approach fails, do not repeat the identical action. Re-diagnose the problem, identify false assumptions, adapt context, or change strategy.
5. **Satisfy the Contract:** Acceptance criteria, edge cases, and required validators gate completion. Generic "it compiles" does not satisfy functional requirements.
6. **Explicitly Disclose the Unverifiable:** If a feature, offline scenario, or hardware integration cannot be verified locally, explicitly mark it as unverified with concrete instructions for user verification. Never fabricate certainty.

---

## 2. Systematic Root-Cause Analysis Mandate

**The Iron Law: NO FIXES WITHOUT ROOT-CAUSE INVESTIGATION FIRST.**

Before modifying code to address a bug or test failure, you must complete four phases:
- **Phase 1: Observation & Evidence Gathering:** Read error messages, logs, stack traces, and relevant file contents completely. Note exact line numbers and failed assertions.
- **Phase 2: Root-Cause Hypothesis:** Trace data flow backwards from the failure site to identify the fundamental design or state flaw, not just the surface symptom.
- **Phase 3: Minimal, High-Precision Fix:** Formulate a targeted change that fixes the root cause without side effects or defensive clutter.
- **Phase 4: Regression & Invariant Verification:** Run verification checks to confirm the failure is resolved and adjacent workflows remain unaffected.

---

## 3. Environment & Safety Directives

1. **Production Deployment Strictly Prohibited:**
   - Production deployment commands, cloud provisioning triggers, or destructive publish actions are forbidden in this environment.
   - All work is strictly local development, testing, and staging validation.
2. **Windows Shell & Host Compatibility:**
   - Development host is Windows 11 with PowerShell (`pwsh`) and Node.js (`v24.x`).
   - Do NOT execute native Linux scripts (`.sh`), bash-specific syntax, or `python3` invocations directly unless explicitly sandboxed or cross-platform translated.
   - External tooling must remain isolated in `.tools/` and excluded via `.gitignore`.
3. **Testing Delegation Requirement:**
   - In accordance with user preferences, automated test suite executions should be delegated to subagents or dedicated agent tools, keeping the parent context lean and high-level.
4. **Non-Destructive Modifications:**
   - Always verify path targets before deleting or overwriting files.
   - Never run unconstrained data-loss operations (`git clean -fdx`, recursive deletes without confirmation).

---

## 4. Code Quality & Security Standards (ECC Baselines)

1. **Strict Type Safety:** TypeScript `strict: true`. No untyped `any`. Discriminated unions for all domain states, clinic forms, and API payloads.
2. **Input Validation & Sanitization:** All patient intake inputs, form submissions, and external payloads must be validated at boundaries using schemas (Zod or type-safe validators).
3. **Healthcare Privacy & Zero-PII Leakage:**
   - Patient Health Information (PHI) must never be logged to console in production, leaked into URL parameters, or transmitted to unauthenticated endpoints.
   - Local storage (IndexedDB) must store structured clinical data predictably and securely.
4. **Fail Loudly & Gracefully:** Catch errors at appropriate architectural boundaries; present clear receptionist-facing alerts instead of silent failures or application crashes.
5. **Git Hygiene:** Conventional commits (`feat`, `fix`, `refactor`, `test`, `chore`, `docs`).

