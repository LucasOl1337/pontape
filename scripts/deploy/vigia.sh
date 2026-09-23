#!/usr/bin/env bash
# Vigia da publicação: se origin/main mudou desde a última publicação, publica de novo.
# Roda por um timer de usuário do systemd (pontape-publicar.timer) nesta máquina,
# num worktree só dele, com o login do wrangler desta máquina. Nada é publicado se o check falhar.
set -euo pipefail
repo="$(cd "$(dirname "$0")/../.." && git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"
tree="$repo/.worktrees/publicacao"
state="${XDG_STATE_HOME:-$HOME/.local/state}/pontape"
mkdir -p "$state"
exec 9>"$state/vigia.lock"
flock -n 9 || exit 0

git -C "$repo" fetch -q origin main
head="$(git -C "$repo" rev-parse origin/main)"
[ "$head" = "$(cat "$state/publicado" 2>/dev/null || true)" ] && exit 0

[ -d "$tree" ] || git -C "$repo" worktree add -q --detach "$tree" "$head"
git -C "$tree" checkout -q --detach "$head"
git -C "$tree" reset -q --hard "$head"
git -C "$tree" clean -qfdx -e node_modules
cd "$tree"
npm ci --no-audit --no-fund >/dev/null
scripts/deploy/publicar.sh --apply
echo "$head" > "$state/publicado"
echo "$(date -Is) publicado $head" >> "$state/historico.log"
