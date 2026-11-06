# ALWAYS_RUN.md — MemGuard Watchdog Operating Guide

> **Process Memory Watchdog & System Protection Daemon** for Dr. Baldawa's Dwarka Clinic PWA and Antigravity IDE Development Sessions.

---

## 1. Overview & Purpose

During intensive development sessions involving Vitest test suites, Vite bundling, and Playwright multi-browser end-to-end runs, orphan worker processes or memory leaks can accumulate and exhaust host system RAM.

**MemGuard** (`scripts/memguard.cjs`, `memguard.ps1`, `start-memguard.bat`) runs as a low-overhead, zero-dependency watchdog that continuously monitors RAM usage and terminates runaway development child processes before OS paging freezes or system crashes occur.

---

## 2. Critical Safety Invariants

MemGuard is designed with strict protection mechanisms to guarantee that IDEs and system tools are **never** accidentally terminated:

1. **Self & Parent Protection:**
   - Always excludes `process.pid` (MemGuard itself).
   - Always excludes `process.ppid` (the parent shell/IDE process that launched MemGuard).
   - Never terminates Windows system processes (PIDs 0, 4, Explorer, svchost, etc.).

2. **Strict Target Process Allowlist:**
   MemGuard **only** targets worker processes explicitly defined in its allowlist:
   - `node.exe` / `node` (Vitest worker threads, rogue script instances)
   - `chromium.exe` / `chromium` (Orphan Playwright browser instances)
   - `chrome.exe` / `chrome` (Headless browser instances)

3. **Multi-Tier Threshold Defense:**
   - **Process Threshold (`--max-proc-mb=1536`):** Any single worker exceeding 1.5 GB is flagged and terminated.
   - **System Threshold (`--max-sys-percent=85`):** If overall host system RAM hits 85%, any worker consuming >500 MB is terminated to safeguard the machine.
   - **Dry-Run Mode (`--dry-run`):** Allows non-destructive simulation and logging.

---

## 3. How to Launch MemGuard

### A. Via NPM Scripts
```bash
# Continuous background monitoring (default: 85% system, 1536MB process limit, 3s poll)
npm run memguard

# Single-pass cleanup check
npm run memguard:clean

# Dry-run inspection (logs without terminating)
npm run memguard:dry
```

### B. Via Native Windows PowerShell
```powershell
# Default continuous run
.\memguard.ps1

# Custom thresholds (e.g. 90% system RAM limit, 2048 MB process limit)
.\memguard.ps1 -MaxSysPercent 90 -MaxProcMB 2048

# Single pass in dry-run mode
.\memguard.ps1 -Once -DryRun
```

### C. 1-Click Launch via Windows Batch
Double-click `start-memguard.bat` or run:
```cmd
start-memguard.bat
```

---

## 4. Integration with Vitest & Playwright Workflows

Before launching full-suite test runs (e.g., `npm run test:ui` or repeated `npm test` cycles):
1. Start `start-memguard.bat` in a separate terminal or background task.
2. MemGuard logs all events and terminations with timestamps to both console output and `memguard.log`.
3. If a Playwright browser hangs or Vitest runs out of memory, MemGuard terminates the offending child worker within 3 seconds, releasing host RAM.

---

## 5. Log Files & Monitoring

- **Log Location:** `memguard.log` in project root (automatically Git-ignored).
- **Log Format:**
  ```text
  [2026-11-06 13:10:16] [MEMGUARD STARTUP] Watchdog active | Max System: 85% | Max Process: 1536 MB | Interval: 3000ms | Protected Self PID: 16580
  [2026-11-06 13:10:17] [MEMGUARD PASS COMPLETE] System RAM: 79% (12446/15848 MB) | Monitored Processes: 20 | Terminated: 0
  ```

