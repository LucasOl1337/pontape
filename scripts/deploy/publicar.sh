#!/usr/bin/env bash
# Publica o site estático em pontape.org (Cloudflare Workers com assets estáticos, D019).
# Roda a partir de um checkout limpo em origin/main (o Regente, ou o vigia scripts/deploy/vigia.sh).
#   scripts/deploy/publicar.sh            dry-run: build, checagens e o que seria enviado
#   scripts/deploy/publicar.sh --apply    publica de verdade
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
[ -z "$(git status --porcelain)" ] || { echo "Checkout com mudanças. Publique só a main limpa."; exit 1; }
git fetch -q origin main
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "HEAD diferente de origin/main. Publique só a main enviada."; exit 1; }
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-f838f7d26348a09f88fb38ea03272857}"

rm -rf dist
SITE_URL=https://pontape.org npm run check
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r dist "$tmp/public"
cp scripts/deploy/worker.js "$tmp/worker.js"
grep -v '^//' scripts/deploy/wrangler.template.jsonc > "$tmp/wrangler.jsonc"

cd "$tmp"
if [ "${1:-}" = --apply ]; then
  npx -y wrangler@4 deploy
  echo "Publicado o commit $(git -C "$root" rev-parse --short HEAD) em https://pontape.org"
else
  npx -y wrangler@4 deploy --dry-run
  echo "DRY-RUN: nada publicado. Rode com --apply."
fi
