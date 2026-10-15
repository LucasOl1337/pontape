#!/bin/sh
# Ensaio do fluxo de doador da Rede Alimenta contra um alvo, só com contas de teste, apagando tudo no fim.
#   alimenta/scripts/ensaio.sh http://localhost:8000            (completo: fluxo e limpeza)
#   alimenta/scripts/ensaio.sh <alvo> preparar                  (doador de teste pronto para a banca)
#   alimenta/scripts/ensaio.sh <alvo> limpar                    (apaga tudo de teste)
#   ENSAIO_TOKEN_DOADOR=... ENSAIO_TOKEN_OPERADOR=... alimenta/scripts/ensaio.sh https://rede-alimenta-api-u5q4.onrender.com
# Opcional: ENSAIO_OPS_TOKEN (testa POST /ops/sweep), ENSAIO_EMAIL_DOADOR/OPERADOR.
# Local com SQLite novo:  alimenta/scripts/ensaio.sh --local-sqlite
# Local sobre o banco SP: DATABASE_URL=... alimenta/scripts/ensaio.sh --local-db
#   (sobe a API em ALIMENTA_ENV=local na porta 8765, roda o completo e derruba a API; o banco recebe só
#    linhas is_test, que o próprio ensaio apaga no fim)
# Rodar da raiz do repositório. Detalhes em alimenta/scripts/ensaio.py.
set -eu
cd "$(dirname "$0")/../.."
PY="${PYTHON:-alimenta/.venv/bin/python}"
case "${1:-}" in
  --local-sqlite|--local-db)
    if [ "$1" = "--local-sqlite" ]; then
      DB_DIR="$(mktemp -d)"
      DATABASE_URL="sqlite:///$DB_DIR/ensaio.db"
      export DATABASE_URL
    elif [ -z "${DATABASE_URL:-}" ]; then
      echo "DATABASE_URL vazio." >&2; exit 2
    fi
    ALIMENTA_ENV=local ALIMENTA_TEST_EMAILS="${ALIMENTA_TEST_EMAILS:-@teste.alimenta}" \
      ALIMENTA_OPERATOR_EMAILS="${ALIMENTA_OPERATOR_EMAILS:-operador@teste.alimenta}" \
      ALIMENTA_OPS_TOKEN="${ALIMENTA_OPS_TOKEN:-ensaio-local}" ALIMENTA_PUBLISH_REAL_LEDGER=false \
      "$PY" -m uvicorn alimenta.api.main:app --port 8765 --log-level warning &
    API_PID=$!
    trap 'kill $API_PID 2>/dev/null || true' EXIT
    i=0; until "$PY" -c "import httpx,sys; sys.exit(httpx.get('http://127.0.0.1:8765/health').status_code!=200)" 2>/dev/null; do
      i=$((i+1)); [ $i -gt 60 ] && { echo "API não subiu" >&2; exit 1; }; sleep 1; done
    ENSAIO_OPS_TOKEN="${ALIMENTA_OPS_TOKEN:-ensaio-local}" "$PY" -m alimenta.scripts.ensaio http://127.0.0.1:8765 completo
    ;;
  *) exec "$PY" -m alimenta.scripts.ensaio "$@" ;;
esac
