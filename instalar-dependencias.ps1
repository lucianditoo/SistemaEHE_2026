$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $project

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Instalador - Sistema de Planillas EHE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

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
  Write-Host "Node.js no esta instalado o no esta en el PATH." -ForegroundColor Yellow
  if (Test-Command winget) {
    Write-Host "Intentando instalar Node.js LTS con winget..." -ForegroundColor Cyan
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    Write-Host ""
    Write-Host "Node.js se instalo o se intento instalar. Cerra esta ventana, abri PowerShell de nuevo y ejecuta este script otra vez." -ForegroundColor Yellow
    pause
    exit 0
  }

  Write-Host "Instala Node.js LTS desde https://nodejs.org/ y ejecuta este script otra vez." -ForegroundColor Yellow
  pause
  exit 1
}

if (-not (Test-Command npx)) {
  Write-Host "npx no esta disponible. Reinstala Node.js LTS marcando npm como componente incluido." -ForegroundColor Yellow
  pause
  exit 1
}

Write-Host "Node detectado:" -ForegroundColor Green
node --version

Write-Host "pnpm disponible via npx o instalacion local:" -ForegroundColor Green
Invoke-Pnpm --version

if (-not (Test-Path ".env")) {
  Write-Host "Creando .env desde .env.example..." -ForegroundColor Cyan
  Copy-Item ".env.example" ".env"
}

Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Cyan
Invoke-Pnpm install

Write-Host "Generando Prisma Client..." -ForegroundColor Cyan
Invoke-Pnpm exec prisma generate

Write-Host "Verificando conexion con PostgreSQL y aplicando migraciones..." -ForegroundColor Cyan
try {
  Invoke-Pnpm exec prisma migrate dev
} catch {
  Write-Host "No se pudieron aplicar las migraciones." -ForegroundColor Yellow
  Write-Host "Revisa que PostgreSQL este instalado, iniciado, y que DATABASE_URL en .env tenga usuario, clave y base correctos." -ForegroundColor Yellow
  throw
}

Write-Host "Instalando navegador para PDF..." -ForegroundColor Cyan
Invoke-Pnpm exec playwright install chromium

Write-Host "Cargando datos mock de prueba..." -ForegroundColor Cyan
Invoke-Pnpm run seed

Write-Host ""
Write-Host "Instalacion lista. Ahora podes ejecutar iniciar-sistema.ps1 o Iniciar Sistema EHE.bat." -ForegroundColor Green
pause
