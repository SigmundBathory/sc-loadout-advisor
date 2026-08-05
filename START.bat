@echo off
title SC Loadout Advisor
echo ========================================
echo   SC Loadout Advisor - Star Citizen
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando procesos anteriores...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo   Matar proceso %%a en puerto 3000...
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Fallo la instalacion de dependencias
        pause
        exit /b 1
    )
    echo.
)

echo Iniciando servidor de desarrollo...
echo Abre http://localhost:3000 en tu navegador
echo.
call npm run dev
if errorlevel 1 (
    echo.
    echo ERROR: El servidor se detuvo inesperadamente
)
pause
