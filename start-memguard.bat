@echo off
REM ============================================================================
REM start-memguard.bat — 1-Click Windows Launcher for MemGuard Process Watchdog
REM Dr. Baldawa's Dwarka Clinic PWA & Antigravity IDE Environment
REM ============================================================================

title Antigravity MemGuard Process Watchdog

echo [MEMGUARD] Initializing background memory watchdog...
node "%~dp0scripts\memguard.cjs" %*

if %ERRORLEVEL% NEQ 0 (
  echo [MEMGUARD ERROR] MemGuard exited with error code %ERRORLEVEL%
  pause
)

