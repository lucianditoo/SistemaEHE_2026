@echo off
title Instalador completo - Sistema de Planillas EHE
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar-dependencias.ps1"
