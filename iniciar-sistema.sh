#!/usr/bin/env bash

set -Eeuo pipefail

readonly PNPM_VERSION="11.7.0"
readonly MIN_NODE_MAJOR="22"
readonly DEFAULT_APP_PORT="3006"
readonly PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "$PROJECT_DIR"

fail() {
  printf '\n\033[1;31mError: %s\033[0m\n' "$1" >&2
  exit 1
}

[[ "$(uname -s)" == "Linux" ]] || \
  fail "Este iniciador debe ejecutarse en Linux."

command -v node >/dev/null 2>&1 || \
  fail "Node.js no esta instalado. Instala Node.js 24 LTS."

node_version="$(node --version | sed 's/^v//')"
node_major="${node_version%%.*}"

[[ "$node_major" =~ ^[0-9]+$ ]] || \
  fail "No se pudo determinar la version de Node.js instalada."

if (( node_major < MIN_NODE_MAJOR )); then
  fail "Node.js $node_version no es compatible. Instala Node.js 24 LTS."
fi

[[ -f .env ]] || \
  fail "No existe .env. Configura DATABASE_URL antes de iniciar el sistema."

grep -Eq '^[[:space:]]*DATABASE_URL=' .env || \
  fail "El archivo .env no contiene DATABASE_URL."

[[ -f .next/BUILD_ID ]] || \
  fail "No existe una compilacion de produccion. Ejecuta ./instalar-dependencias.sh."

if command -v corepack >/dev/null 2>&1; then
  export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
  pnpm_command=(corepack pnpm)
elif command -v npx >/dev/null 2>&1; then
  pnpm_command=(npx --yes "pnpm@$PNPM_VERSION")
else
  fail "No se encontro Corepack ni npx para ejecutar pnpm."
fi

pnpm_version="$("${pnpm_command[@]}" --version)"
[[ "$pnpm_version" == "$PNPM_VERSION" ]] || \
  fail "Se esperaba pnpm $PNPM_VERSION, pero se encontro pnpm $pnpm_version."

app_port="${PORT:-$DEFAULT_APP_PORT}"
app_host="${APP_HOST:-0.0.0.0}"

[[ "$app_port" =~ ^[0-9]+$ ]] && (( app_port >= 1 && app_port <= 65535 )) || \
  fail "El puerto $app_port no es valido."

export NODE_ENV=production

printf '\n\033[1;32mSistema EHE iniciado en http://%s:%s\033[0m\n\n' "$app_host" "$app_port"
exec "${pnpm_command[@]}" exec next start -H "$app_host" -p "$app_port"

