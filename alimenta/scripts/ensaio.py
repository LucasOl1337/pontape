"""Ensaio do fluxo de doador contra um alvo dado, só com contas de teste, apagando tudo no fim.

Modos: `completo` (padrão: fluxo e limpeza), `preparar` (doador de teste cadastrado, para a banca)
e `limpar` (apaga tudo de teste e confere o KPI público).

Passos: saúde → login do doador e do operador → cadastro mínimo → catálogo público → doação →
recomendação (AI ou regra, a resposta diz) → recusa de destino fora do catálogo → escolha do 1º →
entrega declarada → segunda doação cancelada → KPI público igual (teste fica fora) → fila do livro
vazia (teste nunca entra) → varredura (se ENSAIO_OPS_TOKEN) → apaga os dados de teste → KPI igual.

Login:
- alvo com ALIMENTA_ENV=local: o próprio /auth/verify emite o token das contas de teste.
- alvo de produção: o Supabase só manda código por e-mail; passe os JWTs já obtidos em
  ENSAIO_TOKEN_DOADOR e ENSAIO_TOKEN_OPERADOR (as contas precisam estar em ALIMENTA_TEST_EMAILS
  e a do operador em ALIMENTA_OPERATOR_EMAILS do alvo).
Nunca imprime token.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone

import httpx

TERMS, PRIVACY = "termo-de-doacao-v2", "aviso-de-privacidade-v2"
EMAILS = {"doador": os.environ.get("ENSAIO_EMAIL_DOADOR", "ensaio-doador@teste.alimenta"),
          "operador": os.environ.get("ENSAIO_EMAIL_OPERADOR", "operador@teste.alimenta")}
CITY, UF = "São Paulo", "SP"


class Ensaio:
    def __init__(self, target: str):
        self.http = httpx.Client(base_url=target.rstrip("/"), timeout=90)
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
        print(f"   alvo: env={health['env']} banco={health['database']} cadastro_aberto={health['signup_open']} "
              f"ai={health['ai']} livro_real={health['publish_real_ledger']}")
        before = self.http.get("/kpis").json()
        for who in EMAILS:
            self.login(who)
            me = self.check(f"/me {who}", self.http.get("/me", headers=self.h(who)), 200)
            if not me["is_test"] and who != "operador":
                raise SystemExit(f"   {who} não é conta de teste no alvo: o ensaio para aqui")
            if who == "operador" and me["role"] != "operator":
                raise SystemExit("   a conta de operador não está em ALIMENTA_OPERATOR_EMAILS do alvo")
        if mode == "limpar":
            self.purge(before)
            return
        self.register()
        if mode == "preparar":
            print("PREPARO OK (doador de teste pronto; rode o modo limpar depois)")
            return
        self.flow(before)
        self.purge(before)
        print("ENSAIO OK")

    def register(self) -> None:
        me = self.http.get("/me", headers=self.h("doador")).json()
        if me["role"] == "donor":
            print("   doador de teste já cadastrado")
            return
        self.check("cadastro mínimo do doador (empresa, sem CNPJ)", self.http.post("/donors", headers=self.h("doador"), json={
            "kind": "company", "city": CITY, "uf": UF, "donation_terms_version": TERMS,
            "privacy_notice_version": PRIVACY}), 201)

    def donation(self, label: str) -> dict:
        expires = (datetime.now(timezone.utc) + timedelta(hours=30)).isoformat()
        d = self.check(label, self.http.post("/donations", headers=self.h("doador"), json={
            "category": "bakery", "storage": "ambient", "kg": 12.5, "expires_at": expires, "city": CITY, "uf": UF}), 201)
        print(f"   doação {d['id']} ref={d['public_ref']} risco={d['risk_level']} livro={d['ledger']}")
        return d

    def flow(self, before: dict) -> None:
        catalog = self.check("catálogo público da cidade", self.http.get("/distributors", params={"city": CITY}), 200)
        print(f"   {len(catalog)} distribuidores com fonte em {CITY}")
        d = self.donation("registra a doação")
        rec = self.check("recomendação", self.http.post(f"/donations/{d['id']}/recommend", headers=self.h("doador"),
                                                       json={}), 200)
        print(f"   modo={rec['mode']} modelo={rec['model']} páginas lidas={rec['pages_read']} msg={rec['message']}")
        for item in rec["ranking"][:3]:
            print(f"   - {item['distributor_id']} ({item['by']}): {item['reason']} · fonte: {item['sources'][0]}")
        if not rec["ranking"]:
            raise SystemExit("   sem candidato em São Paulo: catálogo vazio no alvo?")
        top = rec["ranking"][0]["distributor_id"]
        self.check("destino fora do catálogo é recusado", self.http.post(
            f"/donations/{d['id']}/destination", headers=self.h("doador"),
            json={"distributor_id": "inventado-fora-do-catalogo"}), 422)
        chosen = self.check("escolhe o primeiro da lista", self.http.post(
            f"/donations/{d['id']}/destination", headers=self.h("doador"),
            json={"distributor_id": top, "from_recommendation": True}), 200)
        print(f"   destino={chosen['distributor_id']} choice={chosen['choice']}")
        self.check("declara a entrega", self.http.post(f"/donations/{d['id']}/delivered", headers=self.h("doador"),
                                                       json={}), 200)
        again = self.check("entregar de novo dá 409", self.http.post(f"/donations/{d['id']}/delivered",
                                                                     headers=self.h("doador"), json={}), 409)
        print(f"   {again['detail']}")
        second = self.donation("segunda doação")
        self.check("cancela a segunda", self.http.post(f"/donations/{second['id']}/cancel", headers=self.h("doador"),
                                                       json={}), 200)
        mine = self.check("minhas doações", self.http.get("/donations/mine", headers=self.h("doador")), 200)
        print(f"   situações: {[x['status'] for x in mine]} · fila do livro: {[x['ledger'] for x in mine]}")
        if any(x["ledger"] for x in mine):
            raise SystemExit("   doação de teste entrou na fila do livro público")
        after = self.check("doação de teste fora do KPI público", self.http.get("/kpis"), 200)
        if (after["donations"], after["deliveries"]) != (before["donations"], before["deliveries"]):
            raise SystemExit("   KPI público mudou com dado de teste")
        overview = self.check("operador vê a contagem", self.http.get("/ops/overview", headers=self.h("operador")), 200)
        print(f"   overview: {overview}")
        ops = os.environ.get("ENSAIO_OPS_TOKEN")
        if ops:
            sweep = self.check("varredura", self.http.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": ops}), 200)
            print(f"   varredura: {sweep}")

    def purge(self, before: dict) -> None:
        out = self.check("apaga tudo de teste", self.http.post("/ops/test-data/purge", headers=self.h("operador")), 200)
        print(f"   apagado: {out['deleted']}")
        after = self.check("KPI público igual ao de antes", self.http.get("/kpis"), 200)
        if (after["donations"], after["deliveries"], after["kg_delivered"]) != \
                (before["donations"], before["deliveries"], before["kg_delivered"]):
            raise SystemExit("   KPI público diferente depois da limpeza")


def main(argv: list[str]) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 2
    mode = argv[1] if len(argv) > 1 else "completo"
    if mode not in ("completo", "preparar", "limpar"):
        print("modo: completo | preparar | limpar")
        return 2
    Ensaio(argv[0]).run(mode)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
