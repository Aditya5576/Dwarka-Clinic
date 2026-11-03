@echo off
setlocal
echo ==============================================
echo  Dwarka Clinic PWA - Multi-Laptop Sync Push
echo ==============================================

set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=chore: sync work from laptop %DATE% %TIME%"

git add .
git commit -m "%COMMIT_MSG%"
git push origin main

echo.
echo [OK] Changes pushed successfully to origin main.
pause

