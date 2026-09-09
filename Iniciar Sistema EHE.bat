@echo off
title Sistema de Planillas EHE
cd /d "%~dp0"

echo ===============================================
echo   Sistema de Impresion de Planillas EHE
echo ===============================================
echo.
echo Iniciando servidor local...
echo Cuando aparezca "Ready", abrir:
echo http://localhost:3000
echo.
echo Para cerrar el sistema, presionar Ctrl + C y luego S.
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0iniciar-sistema.ps1"

pause
