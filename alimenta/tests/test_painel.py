"""Painel Streamlit sem navegador: AppTest com a API real (TestClient) no lugar do HTTP.

O `wire` troca client.get/post pelo TestClient e registra se cada chamada levou token.
Login: emissor local (ALIMENTA_ENV=local + e-mail de teste), o mesmo caminho do painel.
"""

from __future__ import annotations

from pathlib import Path

from streamlit.testing.v1 import AppTest

from alimenta.painel import client as painel_client
from alimenta.tests.conftest import OPERATOR, TEST_DOMAIN, lot_body, make_ngo

APP = str(Path(__file__).resolve().parents[1] / "painel" / "app.py")
PUBLIC_TABS = ["Números", "Modelo", "Segurança e CI", "Conferir livro"]


def wire(monkeypatch, api, calls):
    def headers(token):
        return {"Authorization": f"Bearer {token}"} if token else None

    def get(path, token=None, **params):
        calls.append(("GET", path, bool(token)))
        return painel_client._check(api.get(path, params=params or None, headers=headers(token)))

    def post(path, body=None, token=None):
        calls.append(("POST", path, bool(token)))
        return painel_client._check(api.post(path, json=body, headers=headers(token)))

    monkeypatch.setattr(painel_client, "get", get)
    monkeypatch.setattr(painel_client, "post", post)
    monkeypatch.setattr(painel_client, "ci_status", lambda: {"repo": "teste", "workflows": [], "error": None})


def login(email: str) -> AppTest:
    at = AppTest.from_file(APP, default_timeout=60).run()
    at.text_input(key="email_in").input(email)
    next(b for b in at.button if b.label == "Receber código").click().run()
    at.text_input(key="code_in").input("123456")
    return next(b for b in at.button if b.label == "Entrar").click().run()


def button(at, label):
    return next(b for b in at.button if b.label == label)


def test_visitor_sees_only_public_tabs_and_honest_zero(api, monkeypatch):
    calls = []
    wire(monkeypatch, api, calls)
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert not at.exception
    assert [t.label for t in at.tabs] == PUBLIC_TABS
    metrics = {m.label: m.value for m in at.metric}
    assert (metrics["Entregas"], metrics["kg salvos"], metrics["Tempo médio até o aceite"]) == ("0", "0,0", "sem dados")
    assert at.info[0].value.startswith("Ainda não há entrega real registrada")
    assert [b.label for b in at.button] == ["Receber código"]
    assert all(not tok for _m, _p, tok in calls) and not [c for c in calls if c[0] == "POST"]


def test_login_and_signup_closed_for_real_email(api, monkeypatch):
    sent = []
    from alimenta.auth import supabase
    monkeypatch.setattr(supabase, "send_code", lambda email: sent.append(email))
    monkeypatch.setattr(supabase, "verify_code", lambda email, code: {"error": "x"})
    calls = []
    wire(monkeypatch, api, calls)
    at = AppTest.from_file(APP, default_timeout=60).run()
    at.text_input(key="email_in").input("alguem@empresa.com")
    button(at, "Receber código").click().run()
    assert sent == ["alguem@empresa.com"]
    assert at.sidebar.info[0].value == "Se o e-mail puder entrar, o código chega em alguns minutos."


def test_full_flow_through_panel(api, monkeypatch):
    calls = []
    wire(monkeypatch, api, calls)
    make_ngo(api, f"ong{TEST_DOMAIN}")
    at = login(f"doador{TEST_DOMAIN}")
    assert not at.exception
    assert [t.label for t in at.tabs] == ["Cadastro"] + PUBLIC_TABS
    for key, value in (("s_cnpj", "44.555.666/0001-81"), ("s_contact", "Ana"), ("s_phone", "11 91234-5678"),
                       ("s_cep", "01310-100"), ("s_number", "100")):
        at.text_input(key=key).input(value)
    next(t for t in at.text_input if t.label == "Nome do estabelecimento").input("Padaria Teste")
    at.checkbox(key="ok_terms").check()
    at.checkbox(key="ok_privacy").check()
    at = button(at, "Cadastrar").click().run()
    assert not at.error, [e.value for e in at.error]
    assert [t.label for t in at.tabs][0] == "Meu estabelecimento"

    button(at, "Publicar lote").click().run()
    assert [e.value for e in at.error] == ["Sem reafirmar o termo, o lote não pode ser publicado."]
    next(c for c in at.checkbox if c.label.startswith("Confirmo que o alimento")).check()
    at = button(at, "Publicar lote").click().run()
    assert [s.value for s in at.success if s.value.startswith("Lote")] == ["Lote publicado e oferecido à primeira ONG."]

    ngo = login(f"ong{TEST_DOMAIN}")
    assert [t.label for t in ngo.tabs][0] == "Minha ONG"
    ngo = next(b for b in ngo.button if b.label == "Aceitar").click().run()
    assert any(s.value.startswith("Aceito.") for s in ngo.success)
    ngo = button(ngo, "Confirmar recebimento").click().run()
    assert any(s.value == "Recebimento confirmado." for s in ngo.success)

    at = login(f"doador{TEST_DOMAIN}")
    at = button(at, "Confirmar que retiraram").click().run()
    assert any(s.value == "Retirada confirmada." for s in at.success)
    lots = api.get("/lots/mine", headers={"Authorization": f"Bearer {tok(f'doador{TEST_DOMAIN}')}"}).json()
    assert lots[0]["status"] == "delivered" and lots[0]["match"]["status"] == "delivered"
    assert {m.label: m.value for m in at.metric}["Entregas"] == "0"  # conta de teste fora do KPI


def tok(email):
    from alimenta.auth import dev
    return dev.mint(email)["access_token"]


def test_operator_approves_pending_ngo(api, monkeypatch):
    calls = []
    wire(monkeypatch, api, calls)
    pending = make_ngo(api, f"nova{TEST_DOMAIN}", approve=False)
    at = login(OPERATOR)
    assert [t.label for t in at.tabs][0] == "Operação"
    at = button(at, "Aprovar").click().run()
    assert any(s.value == "Aprovada." for s in at.success)
    ngos = api.get("/ops/ngos", params={"status": "approved"},
                   headers={"Authorization": f"Bearer {tok(OPERATOR)}"}).json()
    assert [n["id"] for n in ngos] == [pending["id"]] and ngos[0]["approved_by"] == OPERATOR


def test_api_refusal_is_shown(api, pair, monkeypatch):
    calls = []
    wire(monkeypatch, api, calls)
    api.post("/lots", json=lot_body(kg=95.0), headers=pair["d"])
    offer = api.get("/offers/mine", headers=pair["n"]).json()[0]
    api.post(f"/offers/{offer['id']}/accept", headers=pair["n"])
    at = login(f"ong{TEST_DOMAIN}")
    assert not at.exception and [t.label for t in at.tabs][0] == "Minha ONG"
    assert at.info[0].value == "Nenhuma oferta esperando resposta."
