"""Ensaio do fluxo inteiro contra um alvo dado, só com contas de teste, apagando tudo no fim.

Modos: `completo` (padrão: fluxo e limpeza), `preparar` (cadastra doador e ONG de teste e aprova a ONG,
para a banca) e `limpar` (apaga tudo de teste e confere o KPI público).

Passos: saúde → login das 3 contas → cadastro do doador e da ONG → aprovação pelo operador →
lote com termo → oferta → recusa de um segundo lote (sem ONG) → aceite → rota → retirada →
recebimento (entrega) → KPI público e livro sem mudança → varredura → apaga os dados de teste.

Login:
- alvo com ALIMENTA_ENV=local: o próprio /auth/verify emite o token das contas de teste.
- alvo de produção: o Supabase só manda código por e-mail; passe os JWTs já obtidos em
  ENSAIO_TOKEN_DOADOR, ENSAIO_TOKEN_ONG e ENSAIO_TOKEN_OPERADOR (as contas precisam estar em
  ALIMENTA_TEST_EMAILS e a do operador em ALIMENTA_OPERATOR_EMAILS do alvo).
Nunca imprime token.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone

import httpx

from alimenta.core import docs

TERMS, PRIVACY = "termo-de-doacao-v1", "aviso-de-privacidade-v1"
EMAILS = {"doador": os.environ.get("ENSAIO_EMAIL_DOADOR", "ensaio-doador@teste.alimenta"),
          "ong": os.environ.get("ENSAIO_EMAIL_ONG", "ensaio-ong@teste.alimenta"),
          "operador": os.environ.get("ENSAIO_EMAIL_OPERADOR", "operador@teste.alimenta")}
PAULISTA = {"cep": "01310-100", "number": "1000", "lat": -23.5617698, "lon": -46.6553299}
SE = {"cep": "01001-000", "number": "1", "lat": -23.5503, "lon": -46.6339}


class Ensaio:
    def __init__(self, target: str):
        self.http = httpx.Client(base_url=target.rstrip("/"), timeout=60)
        self.tokens: dict[str, str] = {}
        self.step = 0

    def check(self, label: str, response: httpx.Response, status: int) -> dict:
        self.step += 1
        ok = response.status_code == status
        print(f"{self.step:02d} {'ok ' if ok else 'ERRO'} {label}: HTTP {response.status_code}")
        if not ok:
            raise SystemExit(f"   esperado {status}; resposta: {response.text[:300]}")
        try:
            return response.json()
        except ValueError:
            return {}

    def h(self, who: str) -> dict:
        return {"Authorization": f"Bearer {self.tokens[who]}"}

    def login(self, who: str) -> None:
        given = os.environ.get(f"ENSAIO_TOKEN_{who.upper()}")
        if given:
            self.tokens[who] = given
            return
        r = self.http.post("/auth/verify", json={"email": EMAILS[who], "code": "000000"})
        self.tokens[who] = self.check(f"login local {who}", r, 200)["access_token"]

    def run(self, mode: str = "completo") -> None:
        health = self.check("saúde", self.http.get("/health"), 200)
        print(f"   alvo: env={health['env']} banco={health['database']} cadastro_aberto={health['signup_open']}")
        before = self.http.get("/kpis").json()
        ledger_before = self.http.get("/ledger/verify").json()
        for who in EMAILS:
            self.login(who)
            me = self.check(f"/me {who}", self.http.get("/me", headers=self.h(who)), 200)
            if not me["is_test"]:
                raise SystemExit(f"   {who} não é conta de teste no alvo: ensaio parado sem escrever nada")
            if who == "operador" and me["role"] != "operator":
                raise SystemExit("   a conta de operador não está em ALIMENTA_OPERATOR_EMAILS do alvo")
        if mode == "preparar":
            self.register()
            print("PREPARO OK (contas de teste prontas; rode o modo limpar depois)")
            return
        if mode == "limpar":
            self.purge(before)
            return
        try:
            self.flow(before, ledger_before)
        finally:
            self.purge(before)
        print("ENSAIO OK")

    def purge(self, before: dict) -> None:
        r = self.http.post("/ops/test-data/purge", headers=self.h("operador"))
        print(f"   apagado: {self.check('apaga os dados de teste', r, 200)['deleted']}")
        after = self.http.get("/kpis").json()
        same = (after["deliveries"], after["kg_saved"]) == (before["deliveries"], before["kg_saved"])
        self.check("KPI público igual ao de antes", httpx.Response(200 if same else 500), 200)

    def register(self) -> tuple[dict, dict]:
        consent = {"donation_terms_version": TERMS, "privacy_notice_version": PRIVACY,
                   "contact_name": "Ensaio", "phone": "11 90000-0000"}
        donor = self.check("cadastro do doador", self.http.post("/donors", headers=self.h("doador"), json={
            **consent, **PAULISTA, "cnpj": docs.cnpj_with_dv("ENSAIO000001"), "trade_name": "Ensaio Mercado",
            "kind": "supermarket"}), 201)
        ngo = self.check("cadastro da ONG (pendente)", self.http.post("/ngos", headers=self.h("ong"), json={
            **consent, **SE, "cnpj": docs.cnpj_with_dv("ENSAIO000002"), "name": "Ensaio ONG",
            "accepted_categories": ["bakery"], "daily_capacity_kg": 50, "receive_window": "00:00-23:59",
            "accepts_refrigerated": True}), 201)
        assert ngo["approval_status"] == "pending" and donor["is_test"] and ngo["is_test"]  # nosec B101
        self.check("ONG pendente não vê ofertas", self.http.get("/offers/mine", headers=self.h("ong")), 403)
        self.check("operador aprova a ONG", self.http.post(f"/ops/ngos/{ngo['id']}/approve", headers=self.h("operador"),
                                                           json={"note": "ensaio"}), 200)
        return donor, ngo

    def flow(self, before: dict, ledger_before: dict) -> None:
        self.register()
        expires = (datetime.now(timezone.utc) + timedelta(hours=30)).isoformat()
        lot_body = {"category": "bakery", "storage": "ambient", "kg": 8.0, "expires_at": expires, "terms_version": TERMS}
        self.check("lote sem termo é recusado", self.http.post("/lots", headers=self.h("doador"),
                                                               json={**lot_body, "terms_version": "x"}), 422)
        lot = self.check("publica o lote", self.http.post("/lots", headers=self.h("doador"), json=lot_body), 201)
        print(f"   lote {lot['id']} risco={lot['risk_level']} status={lot['status']}")
        offers = self.check("caixa de ofertas da ONG", self.http.get("/offers/mine", headers=self.h("ong")), 200)
        offer = next(o for o in offers if o["lot_id"] == lot["id"])
        print(f"   oferta {offer['id']} {offer['distance_km']} km, responder até {offer['respond_by']}")
        second = self.check("segundo lote", self.http.post("/lots", headers=self.h("doador"), json=lot_body), 201)
        other = next(o for o in self.http.get("/offers/mine", headers=self.h("ong")).json() if o["lot_id"] == second["id"])
        self.check("ONG recusa o segundo", self.http.post(f"/offers/{other['id']}/decline", headers=self.h("ong"),
                                                          json={"reason": "no_transport"}), 200)
        overview = self.check("operador vê o lote sem ONG", self.http.get("/ops/overview", headers=self.h("operador")), 200)
        assert second["id"] in [x["id"] for x in overview["unclaimed"]]  # nosec B101
        match = self.check("ONG aceita o primeiro", self.http.post(f"/offers/{offer['id']}/accept", headers=self.h("ong")), 201)
        self.check("aceitar de novo dá 409", self.http.post(f"/offers/{offer['id']}/accept", headers=self.h("ong")), 409)
        route = self.check("rota de coleta da ONG", self.http.get("/ngos/me/route", headers=self.h("ong")), 200)
        print(f"   rota: {len(route['stops'])} parada(s), {route['total_km']} km")
        got = self.check("doador confirma a retirada", self.http.post(f"/matches/{match['id']}/pickup",
                                                                      headers=self.h("doador")), 200)
        assert got["status"] == "collected"  # nosec B101
        done = self.check("ONG confirma o recebimento", self.http.post(f"/matches/{match['id']}/receipt",
                                                                       headers=self.h("ong")), 200)
        assert done["status"] == "delivered" and done["ledger_sequence"] is None  # nosec B101
        k = self.http.get("/kpis").json()
        assert (k["deliveries"], k["kg_saved"]) == (before["deliveries"], before["kg_saved"])  # nosec B101
        self.check("entrega de teste fora do KPI", httpx.Response(200), 200)
        ledger = self.http.get("/ledger/verify").json()
        assert ledger["events"] == ledger_before["events"] and ledger["ok"]  # nosec B101
        self.check("livro sem evento novo e conferido", httpx.Response(200), 200)
        token = os.environ.get("ENSAIO_OPS_TOKEN")
        if token:
            sweep = self.check("varredura", self.http.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": token}), 200)
            print(f"   varredura: {sweep}")


def main(argv: list[str]) -> int:
    if not argv or (len(argv) > 1 and argv[1] not in ("completo", "preparar", "limpar")):
        print("uso: ensaio.sh <URL da API> [completo|preparar|limpar]")
        return 2
    Ensaio(argv[0]).run(argv[1] if len(argv) > 1 else "completo")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
