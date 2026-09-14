#!/usr/bin/env bash

set -Eeuo pipefail

readonly PNPM_VERSION="11.7.0"
readonly MIN_NODE_MAJOR="22"
readonly PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "$PROJECT_DIR"

info() {
  printf '\n\033[1;36m%s\033[0m\n' "$1"
}

success() {
  printf '\033[1;32m%s\033[0m\n' "$1"
}

warning() {
  printf '\033[1;33m%s\033[0m\n' "$1" >&2
}

fail() {
  printf '\n\033[1;31mError: %s\033[0m\n' "$1" >&2
  exit 1
}

on_error() {
  local exit_code="$1"
  local line_number="$2"
  printf '\n\033[1;31mLa instalacion fallo en la linea %s (codigo %s).\033[0m\n' \
    "$line_number" "$exit_code" >&2
  exit "$exit_code"
}

trap 'on_error "$?" "$LINENO"' ERR

[[ "$(uname -s)" == "Linux" ]] || \
  fail "Este instalador debe ejecutarse en Linux."

command -v node >/dev/null 2>&1 || \
  fail "Node.js no esta instalado. Instala Node.js 24 LTS y vuelve a ejecutar este archivo."

node_version="$(node --version | sed 's/^v//')"
node_major="${node_version%%.*}"

[[ "$node_major" =~ ^[0-9]+$ ]] || \
  fail "No se pudo determinar la version de Node.js instalada."

if (( node_major < MIN_NODE_MAJOR )); then
  fail "Node.js $node_version no es compatible con pnpm $PNPM_VERSION. Instala Node.js 24 LTS."
fi

if command -v corepack >/dev/null 2>&1; then
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  pnpm_command=(corepack pnpm)
elif command -v npx >/dev/null 2>&1; then
  warning "Corepack no esta disponible; se usara pnpm $PNPM_VERSION mediante npx."
  pnpm_command=(npx --yes "pnpm@$PNPM_VERSION")
else
  fail "No se encontro Corepack ni npx para ejecutar pnpm."
fi

run_pnpm() {
  "${pnpm_command[@]}" "$@"
}

pnpm_version="$(run_pnpm --version)"
[[ "$pnpm_version" == "$PNPM_VERSION" ]] || \
  fail "Se esperaba pnpm $PNPM_VERSION, pero se encontro pnpm $pnpm_version."

info "Entorno detectado"
printf 'Node.js: %s\n' "$node_version"
printf 'pnpm:   %s\n' "$pnpm_version"
printf 'Proyecto: %s\n' "$PROJECT_DIR"

info "Instalando las dependencias del proyecto para Linux"
# --force evita reutilizar binarios nativos copiados desde una instalacion de Windows.
run_pnpm install --frozen-lockfile --force

info "Generando Prisma Client"
run_pnpm exec prisma generate

info "Instalando Chromium y sus dependencias de Linux"
warning "Playwright puede solicitar permisos sudo para instalar librerias del sistema."
run_pnpm exec playwright install --with-deps chromium

info "Generando la compilacion de produccion"
run_pnpm run build

database_ready="false"

if [[ ! -f .env ]]; then
  cp .env.example .env
  warning "Se creo .env desde .env.example. Configura DATABASE_URL antes de iniciar el sistema."
elif ! grep -Eq '^[[:space:]]*DATABASE_URL=' .env; then
  warning "El archivo .env no contiene DATABASE_URL. No se aplicaron las migraciones."
else
  info "Aplicando las migraciones de PostgreSQL"
  run_pnpm exec prisma migrate deploy
  database_ready="true"
fi

printf '\n\033[1;32m===============================================\033[0m\n'
success "Dependencias y compilacion instaladas correctamente"
printf '\033[1;32m===============================================\033[0m\n\n'

if [[ "$database_ready" == "true" ]]; then
  printf 'Para iniciar el servidor:\n'
  printf '  ./iniciar-sistema.sh\n'
else
  printf 'Antes de iniciar, edita %s/.env y ejecuta:\n' "$PROJECT_DIR"
  printf '  corepack pnpm exec prisma migrate deploy\n'
  printf '  ./iniciar-sistema.sh\n'
fi
