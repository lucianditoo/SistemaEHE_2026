@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0importar-datos.ps1"
if errorlevel 1 pause
