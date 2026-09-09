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

Write-Host "Instalando Chromium de Playwright para descargar PDF..." -ForegroundColor Cyan
Invoke-Pnpm exec playwright install chromium
Write-Host "Listo. Volve a iniciar el sistema y proba Descargar PDF." -ForegroundColor Green
pause
