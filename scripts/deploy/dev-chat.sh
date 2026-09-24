#!/usr/bin/env bash
# Sobe o mesmo Worker do deploy, com dist/ e o segredo apenas no .env local.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"
[ -s .env ] || { echo "Crie .env com NINEROUTER_TOKEN antes de testar."; exit 1; }
npm run build
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -r dist "$tmp/public"
cp scripts/deploy/worker.js scripts/deploy/worker-metrics.js scripts/deploy/worker-admin.js scripts/deploy/yumi.js scripts/deploy/yumi-knowledge.js "$tmp/"
cp -r scripts/deploy/migrations "$tmp/"
grep -v '^//' scripts/deploy/wrangler.template.jsonc | node -e 'let data=""; process.stdin.on("data", chunk => data += chunk).on("end", () => { const config = JSON.parse(data); delete config.routes; config.workers_dev = true; process.stdout.write(JSON.stringify(config)); });' > "$tmp/wrangler.jsonc"
cp .env "$tmp/.dev.vars"
chmod 600 "$tmp/.dev.vars"
cd "$tmp"
npx -y wrangler@4 d1 migrations apply pontape --local --persist-to "$root/.wrangler/f43"
npx -y wrangler@4 dev --local --persist-to "$root/.wrangler/f43" --port "${1:-8794}"
