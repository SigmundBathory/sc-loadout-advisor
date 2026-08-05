@echo off
title SC Loadout Advisor - Full Sync

echo ============================================
echo   SC Loadout Advisor - Full Sync
echo ============================================
echo.

echo [1/3] Syncing data (Wiki API + UEX + scfocus.org)...
call npx tsx scripts/full-sync.ts
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Sync failed
    pause
    exit /b 1
)

echo.
echo [2/3] Committing changes...
git add data/sc-loadout.db
git commit -m "sync: data updated %date%"

echo.
echo [3/3] Pushing to GitHub (Render deploys automatically)...
set GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no
git push

echo.
echo ============================================
echo   Sync complete - Render deploys in ~2 min
echo ============================================
pause
