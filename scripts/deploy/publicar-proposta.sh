#!/usr/bin/env bash
# Publica a PRÉVIA de uma proposta no Worker separado "pontape-proposta", no workers.dev (F44).
# Nunca toca no site oficial: outro nome de Worker, sem rotas, sem domínio, sem D1, sem limitador,
# sem cron. Na prévia a Yume e o contador de visitas ficam desligados (não há D1 nem limitador), e a
# faixa "Prévia da proposta" aparece (PUBLIC_PREVIEW=1). A API da Rede Alimenta é a de produção: a
# prévia só lê dela (/health, /distributors). Não crie conta nem doação a partir da prévia.
#   scripts/deploy/publicar-proposta.sh            dry-run: build, checagens e o que seria enviado
#   scripts/deploy/publicar-proposta.sh --apply    publica a prévia
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
NAME=pontape-proposta
URL=https://pontape-proposta.lucasplays2000.workers.dev
[ "$(git branch --show-current)" != main ] || { echo "Na main, não. A prévia sai de uma branch de proposta."; exit 1; }
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-f838f7d26348a09f88fb38ea03272857}"
rm -rf dist
SITE_URL="$URL" PUBLIC_PREVIEW=1 npm run build
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r dist "$tmp/public"
mkdir -p "$tmp/scripts/deploy" "$tmp/src/lib/ledger"
cp scripts/deploy/worker.js scripts/deploy/worker-metrics.js scripts/deploy/worker-admin.js "$tmp/scripts/deploy/"
cp scripts/deploy/yumi.js scripts/deploy/yumi-knowledge.js "$tmp/scripts/deploy/"
cp src/lib/ledger/asaas.ts "$tmp/src/lib/ledger/"
cat > "$tmp/wrangler.jsonc" <<JSON
{
  "name": "$NAME",
  "main": "./scripts/deploy/worker.js",
  "compatibility_date": "2026-09-01",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": true,
    "not_found_handling": "404-page",
    "html_handling": "auto-trailing-slash"
  },
  "vars": { "ALIMENTA_API_ORIGIN": "https://rede-alimenta-api-u5q4.onrender.com" },
  "workers_dev": true
}
JSON
# Travas: o arquivo não pode citar o domínio oficial, o Worker oficial, o D1, rotas nem cron.
cfg="$tmp/wrangler.jsonc"
if grep -q 'pontape\.org' "$cfg" || grep -Eq '"name": *"pontape"' "$cfg" || grep -Eq 'd1_databases|routes|ratelimits|triggers|custom_domain' "$cfg"; then
  echo "wrangler.jsonc da prévia cita algo do oficial. Parei."; exit 1
fi
cd "$tmp"
commit="$(git -C "$root" rev-parse HEAD)"
if [ "${1:-}" = --apply ]; then
  npx -y wrangler@4 deploy --tag "${commit:0:7}" --message "proposta $commit"
  echo "Prévia do commit ${commit:0:7} em $URL"
else
  npx -y wrangler@4 deploy --dry-run
  echo "DRY-RUN: nada publicado. Rode com --apply."
fi
