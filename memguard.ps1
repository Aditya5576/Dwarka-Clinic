<#
.SYNOPSIS
  memguard.ps1 — Native Windows PowerShell launcher for MemGuard Process Watchdog.

.DESCRIPTION
  Monitors system and process RAM usage, automatically terminating runaway
  development/test processes (Node.js workers, Vitest tasks, Playwright headless browsers)
  before system freezes or memory exhaustion occur.

.PARAMETER MaxSysPercent
  Max system RAM usage percentage before triggering safety mitigation (default: 85).

.PARAMETER MaxProcMB
  Max RAM in MB allowed for an individual worker process (default: 1536).

.PARAMETER IntervalMs
  Watchdog polling interval in milliseconds (default: 3000).

.PARAMETER Once
  Run a single pass and exit immediately.

.PARAMETER DryRun
  Simulate detection without terminating any processes.

.EXAMPLE
  .\memguard.ps1 -DryRun -Once
  .\memguard.ps1 -MaxSysPercent 90 -MaxProcMB 2048
#>

[CmdletBinding()]
param(
  [int]$MaxSysPercent = 85,
  [int]$MaxProcMB = 1536,
  [int]$IntervalMs = 3000,
  [switch]$Once,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$ScriptDir = $PSScriptRoot
$NodeScript = Join-Path $ScriptDir "scripts\memguard.cjs"

if (-not (Test-Path $NodeScript)) {
  Write-Error "[MEMGUARD ERROR] Could not find watchdog script at: $NodeScript"
  exit 1
}

$Arguments = @(
  $NodeScript,
  "--max-sys-percent=$MaxSysPercent",
  "--max-proc-mb=$MaxProcMB",
  "--interval=$IntervalMs"
)

if ($Once) {
  $Arguments += "--once"
}

if ($DryRun) {
  $Arguments += "--dry-run"
}

Write-Host "Starting MemGuard Watchdog via Node.js..." -ForegroundColor Cyan
& node $Arguments
exit $LASTEXITCODE

