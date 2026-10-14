"""Painel público só leitura; escrita só com código de operador conferido no servidor (casos exatos)."""

from __future__ import annotations

from pathlib import Path

import pytest
from streamlit.testing.v1 import AppTest

from alimenta.painel import client as painel_client
from alimenta.tests.test_painel import CODE, login, wire

APP = str(Path(__file__).resolve().parents[1] / "painel" / "app.py")
WRITE_LABELS = {"Publicar lote", "Atribuir à ONG", "ONG confirmou", "Coleta feita", "Entrega feita", "Cancelar"}


def tab_labels(at) -> list[str]:
    return [t.label for t in at.tabs]


def test_visitor_sees_no_write_tab_form_or_button(client, auth, monkeypatch):
    calls = []
    wire(monkeypatch, client, auth, calls)
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert not at.exception
    assert tab_labels(at) == ["Visão geral", "Rota de coleta", "Modelo", "Segurança e CI", "Conferir livro da demo"]
    assert not WRITE_LABELS & {b.label for b in at.button}
    assert [b.label for b in at.button] == ["Entrar"]  # só o botão do login do operador
    assert all(not operator for _method, _path, operator in calls)  # visitante nunca usa o token
    assert not [c for c in calls if c[0] == "POST"]


def test_wrong_code_stays_read_only_and_locks_after_5(client, auth, monkeypatch):
    calls = []
    wire(monkeypatch, client, auth, calls)
    at = login(AppTest.from_file(APP, default_timeout=60).run(), "codigo-errado")
    assert [e.value for e in at.sidebar.error] == ["Código inválido."]
    assert "Novo lote" not in tab_labels(at)
    assert at.session_state["operator_tries"] == 1
    for _ in range(4):
        at = login(at, "codigo-errado")
    assert at.session_state["operator_tries"] == 5
    at.run()  # próxima interação da mesma sessão
    assert at.sidebar.error[0].value.startswith("Muitas tentativas")
    assert not [b for b in at.button if b.label == "Entrar"]  # nem o certo entra mais nesta sessão
    assert all(not operator for _method, _path, operator in calls)


def test_right_code_opens_write_tab_and_logout_closes(client, auth, monkeypatch):
    calls = []
    wire(monkeypatch, client, auth, calls)
    at = login(AppTest.from_file(APP, default_timeout=60).run())
    assert tab_labels(at) == ["Visão geral", "Novo lote", "Rota de coleta", "Modelo", "Segurança e CI",
                              "Conferir livro da demo"]
    assert "Publicar lote" in {b.label for b in at.button}
    assert ("GET", "/donors", True) in calls
    next(b for b in at.button if b.label == "Sair").click().run()
    assert "Novo lote" not in tab_labels(at)
    assert "operator" not in at.session_state


def test_without_operator_code_env_no_login_at_all(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    monkeypatch.delenv("ALIMENTA_OPERATOR_CODE")
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert not at.exception
    assert [b.label for b in at.button] == []
    assert at.sidebar.caption[0].value == "Escrita desligada neste painel. Só leitura."
    assert "Novo lote" not in tab_labels(at)


# --- client.py: comparação no servidor e token nunca sai sem operador -----------------------

def test_check_operator_code_exact(monkeypatch):
    monkeypatch.setenv("ALIMENTA_WRITE_TOKEN", "t")
    monkeypatch.setenv("ALIMENTA_OPERATOR_CODE", CODE)
    assert painel_client.check_operator_code(CODE) is True
    assert painel_client.check_operator_code(CODE + " ") is False
    assert painel_client.check_operator_code(CODE[:-1]) is False
    assert painel_client.check_operator_code("") is False
    monkeypatch.setenv("ALIMENTA_OPERATOR_CODE", "")
    assert painel_client.check_operator_code("") is False  # env vazia nunca libera
    assert painel_client.operator_enabled() is False
    monkeypatch.setenv("ALIMENTA_OPERATOR_CODE", CODE)
    monkeypatch.delenv("ALIMENTA_WRITE_TOKEN")
    assert painel_client.check_operator_code(CODE) is False  # sem token não há o que liberar
    assert painel_client.operator_enabled() is False


def test_check_uses_compare_digest(monkeypatch):
    seen = []
    real = painel_client.hmac.compare_digest
    monkeypatch.setattr(painel_client.hmac, "compare_digest", lambda a, b: seen.append((a, b)) or real(a, b))
    monkeypatch.setenv("ALIMENTA_WRITE_TOKEN", "t")
    monkeypatch.setenv("ALIMENTA_OPERATOR_CODE", CODE)
    assert painel_client.check_operator_code("x") is False
    assert seen == [(b"x", CODE.encode())]


class Recorder:
    def __init__(self):
        self.calls = []

    def __call__(self, method):
        def send(url, **kwargs):
            self.calls.append((method, url, kwargs.get("headers")))
            return painel_client.httpx.Response(200, json={"ok": True})
        return send


def test_token_only_sent_for_operator(monkeypatch):
    monkeypatch.setenv("ALIMENTA_WRITE_TOKEN", "segredo-da-api")
    rec = Recorder()
    monkeypatch.setattr(painel_client.httpx, "get", rec("GET"))
    monkeypatch.setattr(painel_client.httpx, "post", rec("POST"))
    painel_client.get("/donors")
    painel_client.get("/donors", operator=True)
    with pytest.raises(painel_client.NotOperator):
        painel_client.post("/lots", {"kg": 1})
    painel_client.post("/lots", {"kg": 1}, operator=True)
    assert [(m, h) for m, _url, h in rec.calls] == [
        ("GET", {}), ("GET", {"X-Alimenta-Token": "segredo-da-api"}),
        ("POST", {"X-Alimenta-Token": "segredo-da-api"})]


def test_token_never_reaches_the_browser(client, auth, monkeypatch):
    """Nada que o Streamlit desenha (vai ao navegador) contém o token; nem a sessão guarda o token."""
    wire(monkeypatch, client, auth)
    monkeypatch.setenv("ALIMENTA_WRITE_TOKEN", auth["X-Alimenta-Token"])
    at = login(AppTest.from_file(APP, default_timeout=60).run())
    assert at.session_state["operator"] is True
    rendered = repr(at._tree)
    assert "Publicar lote" in rendered and auth["X-Alimenta-Token"] not in rendered
    assert CODE not in rendered  # o formulário do código some depois do login
    assert auth["X-Alimenta-Token"] not in repr([at.session_state[k] for k in at.session_state])
