#!/usr/bin/env bash
# Prova de ponta a ponta contra uma API da Rede Alimenta já no ar (DEMONSTRAÇÃO).
# Publica um lote, pega a ONG recomendada, confirma, coleta, entrega duas vezes
# (idempotente), baixa o livro da demo e confere com tools/conferir.py.
#
# Uso, da raiz do repositório:
#   ALIMENTA_API_URL=http://localhost:8000 ALIMENTA_WRITE_TOKEN=... alimenta/scripts/prova-fluxo.sh
set -euo pipefail

API="${ALIMENTA_API_URL:-http://localhost:8000}"
TOKEN="${ALIMENTA_WRITE_TOKEN:?defina ALIMENTA_WRITE_TOKEN}"
OUT="${TMPDIR:-/tmp}/alimenta-prova"
mkdir -p "$OUT"
py() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }
post() { curl -sS -f -X POST "$API$1" -H "X-Alimenta-Token: $TOKEN" -H 'Content-Type: application/json' ${2:+-d "$2"}; }

echo "health: $(curl -sS -f "$API/health")"
before=$(curl -sS -f "$API/kpis" | py 'd["kg_saved"], d["deliveries"]')
echo "kpis antes (kg_saved, entregas): $before"

expired=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/lots" -H "X-Alimenta-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"donor_id":"D03","category":"bakery","storage":"ambient","kg":5,"expires_at":"2020-01-01T00:00:00Z"}')
echo "lote vencido -> HTTP $expired (esperado 422)"

expires=$(python3 -c "from datetime import datetime,timedelta,timezone;print((datetime.now(timezone.utc)+timedelta(hours=8)).isoformat())")
lot=$(post /lots "{\"donor_id\":\"D03\",\"category\":\"bakery\",\"storage\":\"ambient\",\"kg\":12.5,\"expires_at\":\"$expires\",\"description\":\"Prova de ponta a ponta\"}")
lot_id=$(echo "$lot" | py 'd["id"]')
echo "lote $lot_id: risco $(echo "$lot" | py 'd["risk_level"], d["discard_proba"]')"

# Ranking traz nome e distância exata: só com token.
recs=$(curl -sS -f "$API/lots/$lot_id/recommendations" -H "X-Alimenta-Token: $TOKEN")
ngo=$(echo "$recs" | py 'd["recommendations"][0]["ngo_id"]')
ngo2=$(echo "$recs" | py 'd["recommendations"][1]["ngo_id"]')
match=$(post "/lots/$lot_id/matches" "{\"ngo_id\":\"$ngo\"}" | py 'd["id"]')
echo "match $match com $ngo"
dup=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/lots/$lot_id/matches" -H "X-Alimenta-Token: $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"ngo_id\":\"$ngo2\"}")
echo "segunda ONG no mesmo lote -> HTTP $dup (esperado 409)"
noauth=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$API/matches/$match/confirm")
echo "confirmar sem token -> HTTP $noauth (esperado 401)"

for step in confirm collect deliver; do
  echo "$step: $(post "/matches/$match/$step" | py 'd["status"], d["ledger_sequence"]')"
done
echo "deliver de novo: $(post "/matches/$match/deliver" | py 'd["status"], d["ledger_sequence"]')"

after=$(curl -sS -f "$API/kpis" | py 'd["kg_saved"], d["deliveries"]')
echo "kpis depois (kg_saved, entregas): $after"
curl -sS -f "$API/ledger" > "$OUT/livro-demo.json"
echo "verify da API: $(curl -sS -f "$API/ledger/verify" | py 'd["ok"], d["events"], d["total_grams"]')"
echo "último evento: $(py 'd["events"][-1]["payload"]' < "$OUT/livro-demo.json")"
python3 tools/conferir.py "$OUT/livro-demo.json"
echo "$lot_id" > "$OUT/ultimo-lote.txt"
