"""Painel Streamlit sem navegador: AppTest com a API real (TestClient) no lugar do HTTP.

O `wire` reproduz o client.py: token só quando `operator=True`, e post sem operador falha.
"""

from __future__ import annotations

from pathlib import Path

from streamlit.testing.v1 import AppTest

from alimenta.painel import client as painel_client

APP = str(Path(__file__).resolve().parents[1] / "painel" / "app.py")
CODE = "codigo-de-operador-teste"


def wire(monkeypatch, api, auth, calls=None):
    monkeypatch.setenv("ALIMENTA_OPERATOR_CODE", CODE)

    def get(path, operator=False, **params):
        if calls is not None:
            calls.append(("GET", path, operator))
        return painel_client._check(api.get(path, params=params or None, headers=auth if operator else None))

    def post(path, body=None, operator=False):
        if calls is not None:
            calls.append(("POST", path, operator))
        if not operator:
            raise painel_client.NotOperator("escrita só para operador")
        return painel_client._check(api.post(path, json=body, headers=auth))

    monkeypatch.setattr(painel_client, "get", get)
    monkeypatch.setattr(painel_client, "post", post)
    monkeypatch.setattr(painel_client, "ci_status", lambda: {"repo": "teste", "workflows": [], "error": None})


def login(at, code=CODE):
    at.text_input(key="operator_code").input(code)
    return next(b for b in at.button if b.label == "Entrar").click().run()


def button(at, label):
    return next(b for b in at.button if b.label == label)


def test_panel_flow_from_lot_to_delivery(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    at = login(AppTest.from_file(APP, default_timeout=60).run())
    assert not at.exception
    assert at.warning[0].value.startswith("**DEMONSTRAÇÃO · dados simulados.**")
    metrics = {m.label: m.value for m in at.metric}
    assert metrics["Entregas"] == "119"
    assert any(s.value.startswith("Tudo certo: 119 ações") for s in at.success)

    assert any(s.value == "Sessão de operador." for s in at.sidebar.success)
    at.number_input[1].set_value(8.0)
    button(at, "Publicar lote").click().run()
    for label in ("Atribuir à ONG", "ONG confirmou", "Coleta feita", "Entrega feita"):
        next(b for b in at.button if b.label == label).click().run()
        assert not at.error, [e.value for e in at.error]
    assert {m.label: m.value for m in at.metric}["Entregas"] == "120"
    assert any(s.value.startswith("Tudo certo: 120 ações") for s in at.success)


def test_panel_shows_api_refusal_for_expired_lot(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    at = login(AppTest.from_file(APP, default_timeout=60).run())
    at.number_input[1].set_value(-2.0)
    button(at, "Publicar lote").click().run()
    assert any(e.value.startswith("A API recusou (422)") for e in at.error)


def test_panel_route_section_lists_stops(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert any(i.value.startswith("Nenhum lote para coletar") for i in at.info)
    at.checkbox(key="route_open").check().run()
    assert not at.exception and not at.error
    ngo = client.get("/ngos").json()[0]
    route = client.get(f"/ngos/{ngo['id']}/route", params={"include_open": "true"}).json()  # público
    assert route["exact"] is False
    summary = next(m.value for m in at.markdown if "paradas**" in m.value)
    assert summary.startswith(f"**{len(route['stops'])} paradas**, {route['lots']} lotes")
    table = next(df.value for df in at.dataframe if "Trecho (km)" in df.value.columns)
    assert table["Ordem"].tolist() == list(range(1, len(route["stops"]) + 1))
    assert table["Trecho (km)"].tolist() == [s["leg_km"] for s in route["stops"]]
    assert "Doador" not in table.columns  # visitante não vê nome de doador
