@echo off
title Dwarka Clinic - WhatsApp Background Dispatcher
echo ========================================================
echo   DWARKA CLINIC - WHATSAPP BACKGROUND DAEMON
echo ========================================================
cd server
if not exist node_modules (
  echo Installing daemon dependencies...
  call npm install
)
node whatsappDaemon.js
pause

