@echo off
title SC Loadout Advisor - Full Sync

echo ============================================
echo   SC Loadout Advisor - Full Sync
echo ============================================
echo.

echo [1/4] Syncing data (Wiki API + UEX + scfocus.org)...
call npx tsx scripts/full-sync.ts
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Sync failed
    pause
    exit /b 1
)

echo.
echo [2/4] Checking for changes...
git add data/sc-loadout.db
git diff --cached --quiet
if %ERRORLEVEL% EQU 0 (
    echo.
    echo No changes in database. Nothing to push.
    pause
    exit /b 0
)

echo.
echo [3/4] Committing...
git commit -m "sync: data updated %date%"

echo.
echo [4/4] Pushing to GitHub (Render deploys automatically)...
set GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no
git push

echo.
echo ============================================
echo   Sync complete
echo   Render deploys in ~2 minutes
echo ============================================
pause
