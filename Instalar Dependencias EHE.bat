@echo off
title Instalar Sistema de Planillas EHE
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0instalar-dependencias.ps1"
pause
