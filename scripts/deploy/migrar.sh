#!/usr/bin/env bash
# Prepara a configuração do Worker e aplica as migrações no D1 remoto. Só o Regente executa.
set -euo pipefail
[ "${1:-}" = --remote ] || { echo "Uso: scripts/deploy/migrar.sh --remote (aplica no banco de produção)"; exit 1; }
root="$(cd "$(dirname "$0")/../.." && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r "$root/scripts/deploy/migrations" "$tmp/"
grep -v '^//' "$root/scripts/deploy/wrangler.template.jsonc" |
  node -e 'let data=""; process.stdin.on("data", chunk => data += chunk).on("end", () => { const source = JSON.parse(data); process.stdout.write(JSON.stringify({ name: source.name, compatibility_date: source.compatibility_date, d1_databases: source.d1_databases })); });' > "$tmp/wrangler.jsonc"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-f838f7d26348a09f88fb38ea03272857}"
cd "$tmp"
npx -y wrangler@4 d1 migrations apply pontape --remote
