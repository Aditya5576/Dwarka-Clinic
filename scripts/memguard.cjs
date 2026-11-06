/**
 * memguard.cjs — Zero-Dependency Memory Guard & Runaway Process Watchdog
 *
 * Designed for Dr. Baldawa's Dwarka Clinic PWA & Antigravity development environments.
 * Monitors system-wide and process-level RAM usage, automatically terminating
 * runaway child worker processes (Playwright browsers, Vitest workers, orphan node tasks)
 * before system memory exhaustion or OS paging freezes occur.
 *
 * CRITICAL SAFETY INVARIANTS:
 * - Excludes itself (process.pid) and its immediate parent (process.ppid).
 * - Excludes Antigravity IDE host, system processes, and explorer.
 * - Targets ONLY the explicitly permitted process allowlist:
 *     node.exe / node
 *     chromium.exe / chromium
 *     chrome.exe / chrome
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Parse CLI flags
const args = process.argv.slice(2);
let maxSysPercent = 85;
let maxProcMB = 1536;
let intervalMs = 3000;
let runOnce = false;
let isDryRun = false;

for (const arg of args) {
  if (arg.startsWith('--max-sys-percent=')) {
    const val = parseFloat(arg.split('=')[1]);
    if (!isNaN(val) && val > 0 && val <= 100) maxSysPercent = val;
  } else if (arg.startsWith('--max-proc-mb=')) {
    const val = parseFloat(arg.split('=')[1]);
    if (!isNaN(val) && val > 0) maxProcMB = val;
  } else if (arg.startsWith('--interval=')) {
    const val = parseInt(arg.split('=')[1], 10);
    if (!isNaN(val) && val >= 500) intervalMs = val;
  } else if (arg === '--once') {
    runOnce = true;
  } else if (arg === '--dry-run') {
    isDryRun = true;
  } else if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  }
}

const LOG_FILE = path.resolve(process.cwd(), 'memguard.log');
const IS_WINDOWS = process.platform === 'win32';

// Process allowlist — ONLY these process names can ever be candidates for termination
const TARGET_PROCESS_NAMES = IS_WINDOWS
  ? ['node.exe', 'chromium.exe', 'chrome.exe']
  : ['node', 'chromium', 'chrome'];

// Protected PIDs (memguard itself, its parent, and initial ancestor snapshot)
const PROTECTED_PIDS = new Set([process.pid, process.ppid, 0, 4]);

function printHelp() {
  console.log(`
MemGuard — Runaway Memory Watchdog for Antigravity & WebKit/Node Tasks

Usage:
  node scripts/memguard.cjs [options]

Options:
  --max-sys-percent=<n>  Max system RAM usage before threshold alerts (default: 85%)
  --max-proc-mb=<n>      Max individual process RAM limit in MB (default: 1536 MB)
  --interval=<n>         Watchdog poll interval in ms (default: 3000 ms)
  --once                 Run a single inspection pass and exit
  --dry-run              Inspect and log runaway processes without terminating them
  --help, -h             Show this help message

Target Process Allowlist:
  ${TARGET_PROCESS_NAMES.join(', ')}
`);
}

function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const t = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return `${d} ${t}`;
}

function logMessage(msg, alert = false) {
  const line = `[${getTimestamp()}] ${msg}`;
  if (alert) {
    console.warn(`\x1b[33m${line}\x1b[0m`);
  } else {
    console.log(line);
  }
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch {
    // Ignore logging failures (e.g. read-only disk)
  }
}

/**
 * Retrieves running processes matching TARGET_PROCESS_NAMES
 * Returns array of { name: string, pid: number, memMB: number }
 */
function getTargetProcesses() {
  const list = [];

  if (IS_WINDOWS) {
    for (const targetName of TARGET_PROCESS_NAMES) {
      try {
        // tasklist /FO CSV /NH /FI "IMAGENAME eq <name>"
        const stdout = execSync(`tasklist /FO CSV /NH /FI "IMAGENAME eq ${targetName}"`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          windowsHide: true
        });

        const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('INFO:')) continue; // No tasks found
          // CSV row: "node.exe","12345","Console","1","250,120 K"
          const match = line.match(/^"([^"]+)","([^"]+)","[^"]*","[^"]*","([^"]+)"$/);
          if (match) {
            const name = match[1];
            const pid = parseInt(match[2], 10);
            const rawMem = match[3]; // e.g. "3,47,636 K" or "250,120 K"
            const kb = parseInt(rawMem.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(pid) && !isNaN(kb)) {
              list.push({
                name,
                pid,
                memMB: Math.round((kb / 1024) * 10) / 10
              });
            }
          }
        }
      } catch {
        // If tasklist fails for a target, continue
      }
    }
  } else {
    try {
      // ps -eo pid,ppid,rss,comm
      const stdout = execSync('ps -eo pid,ppid,rss,comm', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
      for (const line of lines.slice(1)) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const pid = parseInt(parts[0], 10);
          const rssKb = parseInt(parts[2], 10);
          const comm = parts.slice(3).join(' ');
          const baseName = path.basename(comm).toLowerCase();
          if (TARGET_PROCESS_NAMES.some(t => baseName.includes(t.toLowerCase()))) {
            list.push({
              name: baseName,
              pid,
              memMB: Math.round((rssKb / 1024) * 10) / 10
            });
          }
        }
      }
    } catch {
      // ps fallback
    }
  }

  return list;
}

/**
 * Terminate a runaway process safely
 */
function terminateProcess(proc, reason) {
  if (PROTECTED_PIDS.has(proc.pid)) {
    logMessage(`[MEMGUARD SAFETY] Skipping protected PID ${proc.pid} (${proc.name})`);
    return false;
  }

  const alertMsg = `[MEMGUARD ALERT] Terminating runaway process ${proc.name} (PID: ${proc.pid}) using ${proc.memMB} MB (${reason})`;
  logMessage(alertMsg, true);

  if (isDryRun) {
    logMessage(`[DRY RUN] Would have executed termination on PID ${proc.pid}`);
    return true;
  }

  try {
    if (IS_WINDOWS) {
      // Use taskkill /F /T /PID to terminate the process tree cleanly
      spawnSync('taskkill', ['/F', '/T', '/PID', String(proc.pid)], {
        windowsHide: true,
        stdio: 'ignore'
      });
    } else {
      process.kill(proc.pid, 'SIGTERM');
      setTimeout(() => {
        try {
          process.kill(proc.pid, 'SIGKILL');
        } catch {
          // Process already terminated
        }
      }, 500);
    }
    logMessage(`[MEMGUARD SUCCESS] Terminated PID ${proc.pid} successfully.`);
    return true;
  } catch (err) {
    logMessage(`[MEMGUARD ERROR] Failed to terminate PID ${proc.pid}: ${err.message}`, true);
    return false;
  }
}

/**
 * Core monitoring pass
 */
function runCheckPass() {
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;
  const sysUsedPercent = Math.round((usedMemBytes / totalMemBytes) * 100);
  const totalMemMB = Math.round(totalMemBytes / (1024 * 1024));
  const usedMemMB = Math.round(usedMemBytes / (1024 * 1024));

  const processes = getTargetProcesses();
  let highMemCount = 0;
  let terminatedCount = 0;

  for (const proc of processes) {
    if (PROTECTED_PIDS.has(proc.pid)) continue;

    // Check individual process threshold
    if (proc.memMB > maxProcMB) {
      highMemCount++;
      const reason = `Exceeds process limit of ${maxProcMB} MB`;
      if (terminateProcess(proc, reason)) {
        terminatedCount++;
      }
    } else if (sysUsedPercent > maxSysPercent && proc.memMB > 500) {
      // If system RAM is critically high, terminate heavy worker instances (>500MB)
      highMemCount++;
      const reason = `System RAM at ${sysUsedPercent}% (Threshold: ${maxSysPercent}%) & process uses ${proc.memMB} MB`;
      if (terminateProcess(proc, reason)) {
        terminatedCount++;
      }
    }
  }

  return {
    sysUsedPercent,
    usedMemMB,
    totalMemMB,
    monitoredProcessesCount: processes.length,
    highMemCount,
    terminatedCount
  };
}

// Initial announcement
const modeStr = isDryRun ? ' [DRY-RUN MODE]' : '';
logMessage(`[MEMGUARD STARTUP] Watchdog active${modeStr} | Max System: ${maxSysPercent}% | Max Process: ${maxProcMB} MB | Interval: ${intervalMs}ms | Protected Self PID: ${process.pid}`);

if (runOnce) {
  const stats = runCheckPass();
  logMessage(`[MEMGUARD PASS COMPLETE] System RAM: ${stats.sysUsedPercent}% (${stats.usedMemMB}/${stats.totalMemMB} MB) | Monitored Processes: ${stats.monitoredProcessesCount} | Terminated: ${stats.terminatedCount}`);
  process.exit(0);
} else {
  // Continuous daemon loop
  setInterval(() => {
    runCheckPass();
  }, intervalMs);

  // Graceful shutdown handling
  const shutdown = () => {
    logMessage('[MEMGUARD SHUTDOWN] Watchdog terminated gracefully.');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

