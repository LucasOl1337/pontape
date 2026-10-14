#!/usr/bin/env bash
# Scan atual da Rede Alimenta: Bandit + Trivy (fs, config, imagem) + gates.
# Mesmo comando no CI e na máquina. Grava JSON em $OUT (padrão alimenta/seguranca/atual).
#
# Uso, da raiz do repositório:
#   TRIVY=/caminho/trivy IMAGE_TAR=rede-alimenta.tar alimenta/seguranca/scan.sh
# Sem IMAGE_TAR, o scan da imagem é pulado (e o resumo mostra isso).
set -uo pipefail

OUT="${OUT:-alimenta/seguranca/atual}"
TRIVY="${TRIVY:-trivy}"
BANDIT="${BANDIT:-bandit}"
mkdir -p "$OUT"
fail=0

echo "== Bandit (gate: severidade >= MEDIUM e confiança >= MEDIUM)"
"$BANDIT" -r alimenta -x alimenta/.venv,alimenta/tests -f json -o "$OUT/bandit.json" -q || true
"$BANDIT" -r alimenta -x alimenta/.venv,alimenta/tests -f txt -o "$OUT/bandit.txt" -q || true
if ! "$BANDIT" -r alimenta -x alimenta/.venv,alimenta/tests --severity-level medium --confidence-level medium -q; then
  echo "GATE Bandit: reprovado"; fail=1
fi

echo "== Trivy fs (dependências do uv.lock, segredos e Dockerfile)"
"$TRIVY" fs --quiet --scanners vuln,secret,misconfig --skip-dirs alimenta/.venv \
  --format json -o "$OUT/trivy-fs.json" alimenta
"$TRIVY" fs --quiet --scanners vuln,secret,misconfig --skip-dirs alimenta/.venv \
  --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 -o "$OUT/gate-trivy-fs.txt" alimenta || { echo "GATE Trivy fs: reprovado"; fail=1; }

echo "== Trivy config (IaC do repositório: Dockerfile, compose, workflows)"
"$TRIVY" config --quiet --skip-dirs node_modules,.worktrees,alimenta/.venv --format json -o "$OUT/trivy-config.json" .
"$TRIVY" config --quiet --skip-dirs node_modules,.worktrees,alimenta/.venv --severity HIGH,CRITICAL --exit-code 1 -o "$OUT/gate-trivy-config.txt" . || { echo "GATE Trivy config: reprovado"; fail=1; }

if [ -n "${IMAGE_TAR:-}" ]; then
  echo "== Trivy imagem ($IMAGE_TAR)"
  "$TRIVY" image --quiet --input "$IMAGE_TAR" --scanners vuln,secret --format json -o "$OUT/trivy-image.json"
  "$TRIVY" image --quiet --input "$IMAGE_TAR" --scanners vuln,secret --format sarif -o "$OUT/trivy-image.sarif"
  "$TRIVY" image --quiet --input "$IMAGE_TAR" --scanners vuln,secret --severity HIGH,CRITICAL \
    --ignore-unfixed --exit-code 1 -o "$OUT/gate-trivy-image.txt" || { echo "GATE Trivy imagem: reprovado"; fail=1; }
else
  echo "== Trivy imagem: pulado (IMAGE_TAR vazio)"
fi

[ "$fail" = 0 ] && echo "Gates de segurança: aprovados" || echo "Gates de segurança: REPROVADOS (ver $OUT)"
exit $fail
