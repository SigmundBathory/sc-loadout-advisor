@echo off
title SC Loadout Advisor - Build
echo ========================================
echo   SC Loadout Advisor - Build Production
echo ========================================
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    echo.
)

echo Compilando para produccion...
call npm run build
echo.
echo Build completado. Ejecuta START.bat para iniciar.
pause
