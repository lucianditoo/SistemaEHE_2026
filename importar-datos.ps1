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

if (-not (Test-Command node) -or -not (Test-Command npx)) {
  Write-Host "Falta Node.js. Ejecuta primero Instalar Dependencias EHE.bat." -ForegroundColor Yellow
  pause
  exit 1
}

$archivo = $args[0]
if (-not $archivo) {
  Add-Type -AssemblyName System.Windows.Forms
  $selector = New-Object System.Windows.Forms.OpenFileDialog
  $selector.Title = "Seleccionar base de viviendas EHE"
  $selector.Filter = "Archivos de Excel (*.xls;*.xlsx)|*.xls;*.xlsx"
  $selector.InitialDirectory = Join-Path ([Environment]::GetFolderPath("UserProfile")) "Downloads"

  if ($selector.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
    Write-Host "Importacion cancelada." -ForegroundColor Yellow
    exit 0
  }

  $archivo = $selector.FileName
}

Write-Host "Importando viviendas EHE 2026 desde:" -ForegroundColor Cyan
Write-Host $archivo -ForegroundColor White
Write-Host ""
$reemplazar = Read-Host "Reemplazar las viviendas de prueba y cargas anteriores? (S/N)"
if ($reemplazar -match '^(s|si)$') {
  Invoke-Pnpm run importar:xls -- $archivo --reemplazar
} else {
  Invoke-Pnpm run importar:xls -- $archivo
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "La importacion no pudo completarse. La base anterior no fue modificada." -ForegroundColor Red
  pause
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Datos importados correctamente." -ForegroundColor Green
pause
