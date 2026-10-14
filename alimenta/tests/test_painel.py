"""Painel Streamlit sem navegador: AppTest com a API real (TestClient) no lugar do HTTP."""

from __future__ import annotations

from pathlib import Path

from streamlit.testing.v1 import AppTest

from alimenta.painel import client as painel_client

APP = str(Path(__file__).resolve().parents[1] / "painel" / "app.py")


def wire(monkeypatch, api, auth):
    def get(path, **params):
        return painel_client._check(api.get(path, params=params or None))

    def post(path, body=None):
        return painel_client._check(api.post(path, json=body, headers=auth))

    monkeypatch.setattr(painel_client, "get", get)
    monkeypatch.setattr(painel_client, "post", post)
    monkeypatch.setattr(painel_client, "ci_status", lambda: {"repo": "teste", "workflows": [], "error": None})


def test_panel_flow_from_lot_to_delivery(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert not at.exception
    assert at.warning[0].value.startswith("**DEMONSTRAÇÃO · dados simulados.**")
    metrics = {m.label: m.value for m in at.metric}
    assert metrics["Entregas"] == "119"
    assert any(s.value.startswith("Tudo certo: 119 ações") for s in at.success)

    at.number_input[1].set_value(8.0)
    at.button[0].click().run()  # Publicar lote
    for label in ("Atribuir à ONG", "ONG confirmou", "Coleta feita", "Entrega feita"):
        next(b for b in at.button if b.label == label).click().run()
        assert not at.error, [e.value for e in at.error]
    assert {m.label: m.value for m in at.metric}["Entregas"] == "120"
    assert any(s.value.startswith("Tudo certo: 120 ações") for s in at.success)


def test_panel_shows_api_refusal_for_expired_lot(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    at = AppTest.from_file(APP, default_timeout=60).run()
    at.number_input[1].set_value(-2.0)
    at.button[0].click().run()
    assert any(e.value.startswith("A API recusou (422)") for e in at.error)


def test_panel_route_section_lists_stops(client, auth, monkeypatch):
    wire(monkeypatch, client, auth)
    at = AppTest.from_file(APP, default_timeout=60).run()
    assert any(i.value.startswith("Nenhum lote para coletar") for i in at.info)
    at.checkbox(key="route_open").check().run()
    assert not at.exception and not at.error
    ngo = client.get("/ngos").json()[0]
    route = client.get(f"/ngos/{ngo['id']}/route", params={"include_open": "true"}).json()
    summary = next(m.value for m in at.markdown if "paradas**" in m.value)
    assert summary.startswith(f"**{len(route['stops'])} paradas**, {route['lots']} lotes")
    table = next(df.value for df in at.dataframe if "Trecho (km)" in df.value.columns)
    assert table["Ordem"].tolist() == list(range(1, len(route["stops"]) + 1))
    assert table["Trecho (km)"].tolist() == [s["leg_km"] for s in route["stops"]]
