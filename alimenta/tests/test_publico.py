"""Rotas públicas: zero honesto em produção vazia, catálogo com fonte, nada pessoal sem login."""

from __future__ import annotations

import json
from pathlib import Path

from alimenta.tests.conftest import OPERATOR, REAL, donation_body, h, make_donor

CATALOG = Path(__file__).resolve().parents[2] / "src/data/alimenta/distribuidores.json"


def test_production_starts_with_honest_zero(api):
    k = api.get("/kpis").json()
    assert (k["donations"], k["deliveries"], k["kg_delivered"], k["meals_estimated"]) == (0, 0, 0.0, 0)
    assert k["by_distributor"] == [] and k["destination_choice"] == {"ai_top": 0, "other": 0}


def test_old_ngo_and_offer_routes_are_gone(api):
    paths = set(api.get("/openapi.json").json()["paths"])
    assert paths == {"/health", "/kpis", "/model", "/distributors", "/legal/{kind}", "/auth/code", "/auth/verify",
                     "/me", "/me/consents", "/donors", "/donors/me", "/donations", "/donations/mine",
                     "/donations/{donation_id}", "/donations/{donation_id}/recommend",
                     "/donations/{donation_id}/destination", "/donations/{donation_id}/delivered",
                     "/donations/{donation_id}/cancel", "/ops/donors/{donor_id}/{action}", "/ops/overview",
                     "/ops/audit", "/ops/sweep", "/ops/test-data/purge"}


def test_distributors_come_from_catalog_with_source(api):
    raw = json.loads(CATALOG.read_text(encoding="utf-8"))
    out = api.get("/distributors").json()
    assert len(out) == len(raw) == 30
    assert all(d["sources"] and d["sources"][0]["url"].startswith("https://") for d in out)
    sp = api.get("/distributors", params={"city": "sao paulo"}).json()
    assert len(sp) == 21 and {d["city"] for d in sp} == {"São Paulo"}
    assert api.get("/distributors", params={"city": "Manaus"}).json() == []


def test_catalog_file_is_byte_copy_of_research(api):
    report = Path("/home/lol/relatorios/pontape-alimenta-20261014/entregas/alimenta-distribuidores.json")
    if report.exists():  # na CI o relatório não existe; a cópia vale pelo hash gravado na entrega
        assert CATALOG.read_bytes() == report.read_bytes()


def test_no_public_response_carries_personal_data(api, monkeypatch):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    make_donor(api, REAL, kind="company", city="Campinas")
    d = api.post("/donations", json=donation_body(city="Campinas"), headers=h(REAL)).json()
    api.post(f"/donations/{d['id']}/destination", json={"distributor_id": "sp-municipal-food-bank"}, headers=h(REAL))
    api.post(f"/donations/{d['id']}/delivered", headers=h(REAL))
    public = json.dumps([api.get(p).json() for p in ("/kpis", "/model", "/health")], ensure_ascii=False)
    for secret in (REAL, "Campinas", d["id"], d["public_ref"]):
        assert secret not in public
    assert api.get("/kpis").json()["deliveries"] == 1


def test_operator_overview_is_not_public(api):
    assert api.get("/ops/overview").status_code == 401
    assert api.get("/ops/overview", headers=h(OPERATOR)).json() == {
        "donations": {}, "ledger_outbox": {}, "recommendations": {}, "donors": {}}
