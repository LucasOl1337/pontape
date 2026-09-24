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
# O Worker fica no mesmo caminho do repositório (scripts/deploy) porque importa ../../src/lib/ledger/asaas.ts (E3).
mkdir -p "$tmp/scripts/deploy" "$tmp/src/lib/ledger"
cp scripts/deploy/worker.js scripts/deploy/worker-metrics.js scripts/deploy/worker-admin.js "$tmp/scripts/deploy/"
cp scripts/deploy/yumi.js scripts/deploy/yumi-knowledge.js "$tmp/scripts/deploy/"
cp src/lib/ledger/asaas.ts "$tmp/src/lib/ledger/"
cp -r scripts/deploy/migrations "$tmp/"
grep -v '^//' scripts/deploy/wrangler.template.jsonc | sed 's#"main": "./worker.js"#"main": "./scripts/deploy/worker.js"#' > "$tmp/wrangler.jsonc"

cd "$tmp"
commit="$(git -C "$root" rev-parse HEAD)"
if [ "${1:-}" = --apply ]; then
  # A versão leva o commit, pra achar a boa na hora de voltar atrás (docs/operacao/VOLTAR-ATRAS.md).
  npx -y wrangler@4 deploy --tag "${commit:0:7}" --message "commit $commit"
  echo "Publicado o commit ${commit:0:7} em https://pontape.org"
else
  npx -y wrangler@4 deploy --dry-run
  echo "DRY-RUN: nada publicado. Rode com --apply."
fi
