@echo off
title Instalar PDF - Sistema EHE
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0instalar-pdf.ps1"
pause
