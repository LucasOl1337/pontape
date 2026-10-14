#!/bin/sh
# Ensaio do fluxo inteiro da Rede Alimenta contra um alvo, só com contas de teste, apagando tudo no fim.
#   alimenta/scripts/ensaio.sh http://localhost:8000            (completo: fluxo e limpeza)
#   alimenta/scripts/ensaio.sh <alvo> preparar                  (contas de teste prontas para a banca)
#   alimenta/scripts/ensaio.sh <alvo> limpar                    (apaga tudo de teste)
#   ENSAIO_TOKEN_DOADOR=... ENSAIO_TOKEN_ONG=... ENSAIO_TOKEN_OPERADOR=... alimenta/scripts/ensaio.sh https://rede-alimenta-api-u5q4.onrender.com
# Opcional: ENSAIO_OPS_TOKEN (testa POST /ops/sweep), ENSAIO_EMAIL_DOADOR/ONG/OPERADOR.
# Rodar da raiz do repositório. Detalhes em alimenta/scripts/ensaio.py.
set -eu
cd "$(dirname "$0")/../.."
PY="${PYTHON:-alimenta/.venv/bin/python}"
exec "$PY" -m alimenta.scripts.ensaio "$@"
