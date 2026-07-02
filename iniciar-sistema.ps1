$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $project

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
  if (Test-Command pnpm) {
    & pnpm @PnpmArgs
  } else {
    & npx --yes pnpm@11.7.0 @PnpmArgs
  }
}

if (-not (Test-Command node)) {
  Write-Host "No se encontro Node.js. Ejecuta primero instalar-dependencias.ps1." -ForegroundColor Yellow
  pause
  exit 1
}

if (-not (Test-Command npx)) {
  Write-Host "No se encontro npx. Reinstala Node.js LTS marcando npm como componente incluido." -ForegroundColor Yellow
  pause
  exit 1
}

Write-Host "Sistema de Impresion de Planillas EHE" -ForegroundColor Cyan
Write-Host "Iniciando servidor local en http://localhost:3000" -ForegroundColor Green
Invoke-Pnpm run dev
