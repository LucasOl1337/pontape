"""Leitura pública: só agregados reais, sem nome, endereço ou coordenada (casos exatos).

As listas públicas de doadores, ONGs, lotes e matches saíram. Os KPIs ignoram `is_test`.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from alimenta.api.main import create_app
from alimenta.core.domain import region_centroid
from alimenta.tests.conftest import OPERATOR, h, lot_body, make_donor, make_ngo

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "alimenta" / "data" / "seed"
DONORS = json.loads((SEED / "donors.json").read_text(encoding="utf-8"))["donors"]
NGOS = json.loads((SEED / "ngos.json").read_text(encoding="utf-8"))["ngos"]
PUBLIC_GETS = ["/health", "/kpis", "/model", "/ledger", "/ledger/verify", "/openapi.json",
               "/legal/donation_terms", "/legal/privacy_notice"]
REAL = "real@empresa-real.com.br"
REAL_NGO = "real@ong-real.org.br"


def secrets_of(rows) -> list[str]:
    out = []
    for row in rows:
        out += [row["name"], json.dumps(row["lat"]), json.dumps(row["lon"])]
    return out


def test_region_centroid_exact():
    assert region_centroid("center") == (-23.5475, -46.6425)
    assert region_centroid("north") == (-23.475, -46.63)
    assert region_centroid("south") == (-23.66, -46.68)
    assert region_centroid("east") == (-23.55, -46.485)
    assert region_centroid("west") == (-23.5725, -46.73)


def test_old_public_lists_are_gone(api):
    for path in ("/donors", "/ngos", "/lots", "/matches", "/ngos/N01/route", "/lots/L001/recommendations"):
        assert api.get(path).status_code in (404, 405), path


def test_production_starts_with_honest_zero(api):
    k = api.get("/kpis").json()
    assert (k["kg_saved"], k["deliveries"], k["meals_estimated"], k["avg_match_minutes"]) == (0.0, 0, 0, None)
    assert k["heat_points"] == [] and k["alerts"] == [] and k["lots_by_status"] == {}
    assert api.get("/ledger/verify").json()["events"] == 0
    assert api.get("/ledger").json()["events"] == []


def test_seed_never_loads_outside_local(engine, monkeypatch):
    monkeypatch.setenv("ALIMENTA_ENV", "production")
    monkeypatch.setenv("ALIMENTA_SEED_ON_START", "true")
    with TestClient(create_app(engine)) as prod:
        assert prod.get("/kpis").json()["deliveries"] == 0
        assert prod.post("/demo/reset").status_code == 404


def test_real_delivery_counts_and_test_does_not(api, pair, monkeypatch):
    """Uma entrega real (fora da lista de teste) entra em KPI e livro; a de teste não."""
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    make_donor(api, REAL)
    ngo = make_ngo(api, REAL_NGO)
    for donor_h, ngo_h in ((h(REAL), h(REAL_NGO)), (pair["d"], pair["n"])):
        lot = api.post("/lots", json=lot_body(kg=12.5), headers=donor_h).json()
        offer = next(o for o in api.get("/offers/mine", headers=ngo_h).json() if o["lot_id"] == lot["id"])
        match = api.post(f"/offers/{offer['id']}/accept", headers=ngo_h).json()
        api.post(f"/matches/{match['id']}/pickup", headers=donor_h)
        api.post(f"/matches/{match['id']}/receipt", headers=ngo_h)
    k = api.get("/kpis").json()
    assert (k["kg_saved"], k["deliveries"], k["meals_estimated"]) == (12.5, 1, 22)
    assert k["heat_points"] == [{"region": ngo["region"], "lat": region_centroid(ngo["region"])[0],
                                 "lon": region_centroid(ngo["region"])[1], "kg": 12.5}]
    verify = api.get("/ledger/verify").json()
    assert (verify["ok"], verify["events"], verify["total_grams"], verify["ledger"]) == (True, 1, 12500, "pontape-alimenta")
    text = json.dumps(api.get("/kpis").json())
    for leak in (ngo["name"], "Paulista", json.dumps(ngo["lat"]), "11912345678"):
        assert leak not in text


def test_no_public_response_carries_name_or_exact_coordinate(session, engine):
    with TestClient(create_app(engine)) as api:
        sensitive = secrets_of(DONORS) + secrets_of(NGOS)
        for path in PUBLIC_GETS:
            response = api.get(path)
            assert response.status_code == 200, path
            assert [s for s in sensitive if s in response.text] == [], path
        assert api.get("/kpis").json()["deliveries"] == 119


def test_operator_overview_is_not_public(api):
    assert api.get("/ops/overview").status_code == 401
    assert api.get("/ops/overview", headers=h(OPERATOR)).status_code == 200
