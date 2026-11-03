# DECISIONS.md — Architecture & Operational Decision Records

## ADR-001: External Tooling Isolation via `.tools/` and `.gitignore`

- **Status:** Accepted
- **Context:**
  The project requires continuous integration of three major agent tooling repositories:
  1. `Gravitas` (`https://github.com/udaysharmadev/Gravitas.git`)
  2. `agentic-awesome-skills` (`https://github.com/sickn33/agentic-awesome-skills.git`)
  3. `ECC` (Everything Claude Code / Agent Tools) (`https://github.com/affaan-m/ECC.git`)
  Cloning these into the main project root would introduce tens of thousands of external files (30,000+ files in `agentic-awesome-skills` alone), pollute git history, bloat bundle size, and risk accidental dependency leakage.
- **Decision:**
  All three repositories are cloned into a dedicated `.tools/` directory in the project workspace, and `.tools/` is explicitly declared in `.gitignore`.
- **Consequences:**
  - The production workspace remains clean and lightweight.
  - The full tool catalogs remain immediately accessible locally for inspection, reference, and adaptation.
  - No Git tree pollution or merge conflicts.

---

## ADR-002: Windows Host Compatibility & Hook Strategy

- **Status:** Accepted
- **Context:**
  The development environment is Windows 11 running PowerShell and Node.js v24. `python3` is not installed on PATH (Windows store alias redirection). Native runtime plugins with `python3 scripts/pre_tool.py` command hooks (such as `gravitas-native`) will fail fatally if invoked directly by the agent on every tool call.
- **Decision:**
  - Keep native Python3 plugin hooks disabled (`gravitas-native` disabled in `config.json`).
  - Distill and internalize Gravitas's 6 Invariants, Reconnaissance Rules, and Scope Guardrails directly into markdown rule files (`AI_RULES.md`, `AGENTS.md`) and native workspace skills under `.agents/skills/`.
- **Consequences:**
  - 100% cross-platform compatibility across Windows, macOS, and Linux without Python or bash runtime dependencies.
  - Zero performance overhead or shell-hook crashes on tool calls.
  - Full adherence to the strict engineering invariants of Gravitas.

---

## ADR-003: Curated Active Skills Selection vs. Indiscriminate Activation

- **Status:** Accepted
- **Context:**
  `agentic-awesome-skills` and `ECC` contain hundreds of specialized skills ranging from Solana pentesting to AWS CloudFormation to Django internals. Injecting hundreds of irrelevant skills wastes model token budgets, degrades attention, and slows down response latency.
- **Decision:**
  Curate only seven high-leverage skills directly mapped to the clinic PWA's functional and non-functional requirements:
  1. `gravitas-reliability`: Core reliability, grounding, scoped writes, evidence-based verification.
  2. `systematic-debugging`: 4-phase root-cause analysis (The Iron Law).
  3. `pwa-offline-indexeddb`: Offline service worker caching, IndexedDB transactions, offline patient queue sync.
  4. `vitest-tdd-workflow`: Vite-native TDD, component and logic testing with Vitest.
  5. `typescript-expert`: Strict typing, discriminated unions for clinical models, Zod validation.
  6. `react-best-practices`: High-performance React, container/presentational split, memoized rendering.
  7. `healthcare-security-privacy`: Patient Health Information (PHI) protection, sanitization, audit safety.
- **Consequences:**
  - High model focus, minimal token consumption, and instant relevant guidance.
  - Discoverable automatically by Antigravity via progressive disclosure.

---

## ADR-004: Workspace Customization Standard via `.agents/skills/`

- **Status:** Accepted
- **Context:**
  Antigravity discovers workspace customizations in `.agents/skills/` (and `.agent/skills/`) and hierarchical rules in `AGENTS.md` and `GEMINI.md`.
- **Decision:**
  Implement the project-level customizations in `.agents/skills/<name>/SKILL.md` and root `AGENTS.md` / `GEMINI.md`.
- **Consequences:**
  - Standardized progressive disclosure: only skill names and descriptions are injected until activated.
  - Customizations are committed to version control so any team member or laptop checkout inherits them automatically.
