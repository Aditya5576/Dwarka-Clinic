@echo off
title Dwarka Clinic - Pull Latest Changes
echo ===================================================
echo   DWARKA CLINIC PWA - SYNCING LATEST CODE
echo ===================================================
echo.

echo Checking local working tree status...
git status -s > temp_status.txt
set /p STATUS=<temp_status.txt
del temp_status.txt

if not "%STATUS%"=="" (
    echo [WARNING] You have uncommitted local changes!
    echo Stashing your uncommitted changes safely before pulling...
    git stash push -m "Auto-stashed before sync-pull-latest at %date% %time%"
)

echo Pulling latest code from GitHub (origin/main)...
git pull --rebase origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Pull failed! Check your internet connection or git conflicts.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Installing dependencies (if any package updates exist)...
call npm install --silent

echo.
echo ===================================================
echo   SUCCESS: Laptop is up to date with origin/main!
echo ===================================================
echo.
pause

