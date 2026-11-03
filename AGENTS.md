# AGENTS.md — Dr. Baldawa's Dwarka Clinic PWA Operating Instructions

> Model-Agnostic Operating System for Dr. Baldawa's Dwarka Clinic (Jaysingpur) Patient Intake & Receptionist Management PWA.

---

## 1. Core Operating Invariants

1. **Ground Before Mutating:** Read the target file, callers, and test files before editing. Never assume file structure or dependencies.
2. **Stay in Declared Scope:** Confine edits strictly to requested targets. Never introduce unsolicited rewrites or broad formatting changes.
3. **Completion Demands Fresh Evidence:** An implementation or fix is verified ONLY when fresh test or compiler output confirms success *after* the edit.
4. **Never Exact-Retry a Failure:** If a tool call or approach fails, pause, re-diagnose root cause, and adjust strategy.
5. **Satisfy Acceptance Criteria:** Check off every functional requirement and edge case before claiming completion.
6. **No Fixes Without Root Cause Investigation First:** Follow the 4-phase debugging process: Observe → Hypothesize → Fix → Verify.
7. **Disclose the Unverifiable:** Explicitly state what could not be tested locally (e.g. physical thermal receipt printer integration).
8. **Testing Preference:** Delegate automated test execution to subagents or dedicated agent tools.

---

## 2. Security & Operational Guardrails

- **PROHIBITED:** Production deployment, remote database wipes, unconfirmed deletions.
- **ENVIRONMENT:** Windows 11 host with PowerShell and Node.js v24. External tools stay isolated in `.tools/`.
- **HEALTHCARE PRIVACY:** Zero PII leakage in logs, error toasts, or URL query params. Local-first persistence in IndexedDB.

---

## 3. Project Configuration & References

- Complete Operational Rules: [AI_RULES.md](file:///c:/Users/adity/Desktop/ADI/Dwarka%20Clinic%20Application/AI_RULES.md)
- Architecture & Active Skills: [AI_BRAIN.md](file:///c:/Users/adity/Desktop/ADI/Dwarka%20Clinic%20Application/AI_BRAIN.md)
- Architectural Decision Records: [DECISIONS.md](file:///c:/Users/adity/Desktop/ADI/Dwarka%20Clinic%20Application/DECISIONS.md)
- Active Workspace Skills: `.agents/skills/`

