$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $project

trap {
  Write-Host ""
  Write-Host "La instalacion no pudo completarse." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Yellow
  Write-Host ""
  Read-Host "Presiona Enter para cerrar"
  exit 1
}

function Test-Command($name) {
  return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Test-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Request-Administrator {
  if (Test-Administrator) {
    return
  }

  Write-Host "Solicitando permisos de administrador..." -ForegroundColor Cyan
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -Verb RunAs
  exit 0
}

function Update-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machinePath;$userPath"
}

function Add-WindowsAppsToProcessPath {
  $windowsApps = Join-Path $env:LOCALAPPDATA "Microsoft\WindowsApps"
  $pathEntries = $env:Path -split ";"

  if ((Test-Path -LiteralPath $windowsApps) -and ($pathEntries -notcontains $windowsApps)) {
    $env:Path = "$windowsApps;$env:Path"
  }
}

function Test-Winget {
  $command = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $command) {
    return $false
  }

  try {
    & $command.Source --version 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Ensure-Winget {
  if (Test-Winget) {
    Write-Host "App Installer y WinGet detectados." -ForegroundColor Green
    return
  }

  Add-WindowsAppsToProcessPath
  if (Test-Winget) {
    Write-Host "WinGet detectado y agregado temporalmente al PATH." -ForegroundColor Green
    return
  }

  Write-Host "App Installer no esta disponible. Instalando el paquete oficial de Microsoft..." -ForegroundColor Cyan
  $bundlePath = Join-Path ([IO.Path]::GetTempPath()) "Microsoft.DesktopAppInstaller.msixbundle"

  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://aka.ms/getwinget" -OutFile $bundlePath -UseBasicParsing
    Add-AppxPackage -Path $bundlePath
  } catch {
    Write-Host "Windows no permitio instalar App Installer automaticamente." -ForegroundColor Yellow
    Write-Host "Se abrira la pagina oficial de App Installer en Microsoft Store." -ForegroundColor Yellow
    Start-Process "ms-windows-store://pdp/?ProductId=9NBLGGH4NNS1"
    throw "Instala App Installer desde la ventana de Microsoft Store y vuelve a ejecutar este instalador."
  } finally {
    Remove-Item -LiteralPath $bundlePath -Force -ErrorAction SilentlyContinue
  }

  Add-WindowsAppsToProcessPath
  for ($attempt = 1; $attempt -le 10; $attempt++) {
    if (Test-Winget) {
      Write-Host "App Installer y WinGet se instalaron correctamente." -ForegroundColor Green
      return
    }

    Start-Sleep -Seconds 1
  }

  throw "App Installer se instalo, pero WinGet aun no responde. Reinicia Windows y vuelve a ejecutar este instalador."
}

function Invoke-Pnpm {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)

  if (Test-Command pnpm) {
    & pnpm @PnpmArgs
  } else {
    & npx --yes pnpm@11.7.0 @PnpmArgs
  }

  if ($LASTEXITCODE -ne 0) {
    throw "pnpm finalizo con el codigo $LASTEXITCODE."
  }
}

function New-DatabasePassword {
  $bytes = New-Object byte[] 24
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  } finally {
    $generator.Dispose()
  }

  return ([BitConverter]::ToString($bytes)).Replace("-", "")
}

function ConvertFrom-SecurePassword([Security.SecureString]$securePassword) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

function Read-DatabasePassword {
  while ($true) {
    Write-Host "Ingresa la clave actual del usuario postgres." -ForegroundColor Cyan
    $securePassword = Read-Host "Clave de PostgreSQL" -AsSecureString
    $plainPassword = ConvertFrom-SecurePassword $securePassword

    if ($plainPassword) {
      return $plainPassword
    }

    Write-Host "La clave no puede estar vacia." -ForegroundColor Yellow
  }
}

function Find-Psql {
  $command = Get-Command psql -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  foreach ($version in 18..12) {
    $candidate = "C:\Program Files\PostgreSQL\$version\bin\psql.exe"
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $null
}

function Get-PasswordFromEnv {
  if (-not (Test-Path -LiteralPath ".env")) {
    return $null
  }

  $databaseLine = Get-Content -LiteralPath ".env" |
    Where-Object { $_ -match '^DATABASE_URL=' } |
    Select-Object -First 1

  if ($databaseLine -match 'postgresql://postgres:(?<password>[^@]+)@localhost') {
    return [Uri]::UnescapeDataString($Matches.password)
  }

  return $null
}

function Test-PostgresConnection([string]$psqlPath, [string]$password) {
  $env:PGPASSWORD = $password
  try {
    & $psqlPath --host localhost --port 5432 --username postgres --dbname postgres --no-password --tuples-only --command "SELECT 1;" 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Start-PostgresService {
  $service = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1

  if ($service -and $service.Status -ne "Running") {
    Write-Host "Iniciando el servicio PostgreSQL..." -ForegroundColor Cyan
    Start-Service -Name $service.Name
    $service.WaitForStatus("Running", [TimeSpan]::FromSeconds(30))
  }
}

function Ensure-Database([string]$psqlPath, [string]$password) {
  $postgresBin = Split-Path -Parent $psqlPath
  $createdbPath = Join-Path $postgresBin "createdb.exe"
  $env:PGPASSWORD = $password

  try {
    $exists = & $psqlPath --host localhost --port 5432 --username postgres --dbname postgres --no-password --tuples-only --no-align --command "SELECT 1 FROM pg_database WHERE datname = 'ehe_planillas';"
    if ($LASTEXITCODE -ne 0) {
      throw "No se pudo consultar PostgreSQL. Revisa la clave ingresada."
    }

    if (($exists | Out-String).Trim() -ne "1") {
      Write-Host "Creando la base ehe_planillas..." -ForegroundColor Cyan
      & $createdbPath --host localhost --port 5432 --username postgres --no-password --encoding UTF8 "ehe_planillas"
      if ($LASTEXITCODE -ne 0) {
        throw "No se pudo crear la base ehe_planillas."
      }
    } else {
      Write-Host "La base ehe_planillas ya existe." -ForegroundColor Green
    }
  } finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  }
}

function Write-EnvironmentFile([string]$password) {
  $encodedPassword = [Uri]::EscapeDataString($password)
  $content = @(
    "DATABASE_URL=`"postgresql://postgres:$encodedPassword@localhost:5432/ehe_planillas?schema=public`""
    "NEXT_PUBLIC_APP_URL=`"http://localhost:3000`""
  )

  Set-Content -LiteralPath ".env" -Value $content -Encoding UTF8
  Write-Host "Archivo .env configurado." -ForegroundColor Green
}

Request-Administrator

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Instalador completo - Planillas EHE" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Command node)) {
  Ensure-Winget
  Write-Host "Instalando Node.js LTS..." -ForegroundColor Cyan
  & winget install --id OpenJS.NodeJS.LTS --exact --source winget --silent --accept-package-agreements --accept-source-agreements
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo instalar Node.js con WinGet."
  }
  Update-ProcessPath
}

if (-not (Test-Command node) -or -not (Test-Command npx)) {
  throw "Node.js se instalo, pero Windows todavia no lo reconoce. Reinicia la computadora y ejecuta nuevamente el instalador."
}

Write-Host "Node.js detectado:" -ForegroundColor Green
node --version

$psqlPath = Find-Psql
$newPostgresInstallation = -not $psqlPath
$databasePassword = $null

if ($newPostgresInstallation) {
  Ensure-Winget
  $databasePassword = New-DatabasePassword
  Write-Host "Instalando PostgreSQL 18..." -ForegroundColor Cyan
  $postgresCustomArgs = "--superpassword $databasePassword --servicepassword $databasePassword --serverport 5432"
  & winget install --id PostgreSQL.PostgreSQL.18 --exact --source winget --silent --accept-package-agreements --accept-source-agreements --custom $postgresCustomArgs
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo instalar PostgreSQL con WinGet."
  }
  Update-ProcessPath
  $psqlPath = Find-Psql
}

if (-not $psqlPath) {
  throw "PostgreSQL parece instalado, pero no se encontro psql.exe. Reinicia Windows y ejecuta nuevamente el instalador."
}

Start-PostgresService

if (-not $databasePassword) {
  $databasePassword = Get-PasswordFromEnv
  if (-not $databasePassword -or -not (Test-PostgresConnection $psqlPath $databasePassword)) {
    $databasePassword = Read-DatabasePassword
  }
}

if (-not (Test-PostgresConnection $psqlPath $databasePassword)) {
  throw "No se pudo conectar a PostgreSQL con la clave disponible."
}

Ensure-Database $psqlPath $databasePassword
Write-EnvironmentFile $databasePassword

Write-Host "Instalando dependencias del proyecto..." -ForegroundColor Cyan
Invoke-Pnpm install --frozen-lockfile

Write-Host "Generando Prisma Client..." -ForegroundColor Cyan
& ".\node_modules\.bin\prisma.cmd" generate
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo generar Prisma Client."
}

Write-Host "Aplicando migraciones de la base..." -ForegroundColor Cyan
& ".\node_modules\.bin\prisma.cmd" migrate deploy
if ($LASTEXITCODE -ne 0) {
  throw "No se pudieron aplicar las migraciones."
}

Write-Host "Instalando Chromium para generar PDF..." -ForegroundColor Cyan
& ".\node_modules\.bin\playwright.cmd" install chromium
if ($LASTEXITCODE -ne 0) {
  throw "No se pudo instalar Chromium para PDF."
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Instalacion completada correctamente" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso: ejecuta Importar Datos EHE.bat y selecciona el Excel." -ForegroundColor Cyan
Write-Host "Luego inicia la aplicacion con Iniciar Sistema EHE.bat." -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para cerrar"
