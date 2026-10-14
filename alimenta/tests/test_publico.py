"""Saída pública sem coordenada exata, nome nem endereço (casos exatos).

Painel (código de operador, token fora do navegador): test_painel_operador.py.
Seed desligado por padrão: test_seed_padrao.py.
"""

from __future__ import annotations

import json
from pathlib import Path

from alimenta.core.domain import REGIONS, haversine_km, region_centroid

ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "alimenta" / "data" / "seed"
DONORS = json.loads((SEED / "donors.json").read_text(encoding="utf-8"))["donors"]
NGOS = json.loads((SEED / "ngos.json").read_text(encoding="utf-8"))["ngos"]
LOT = {"category": "bakery", "storage": "ambient", "kg": 10.0, "description": "Rua Exemplo, 123 (simulado)"}


def in_hours(hours: float) -> str:
    from datetime import datetime, timedelta, timezone
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def secrets_of(rows) -> list[str]:
    """Textos que nunca podem sair em resposta pública: nome e cada coordenada exata."""
    out = []
    for row in rows:
        out += [row["name"], json.dumps(row["lat"]), json.dumps(row["lon"])]
    return out


SENSITIVE = secrets_of(DONORS) + secrets_of(NGOS)


# --- (2) saída pública sem coordenada exata nem nome --------------------------------------

def test_region_centroid_exact():
    assert region_centroid("center") == (-23.5475, -46.6425)
    assert region_centroid("north") == (-23.475, -46.63)
    assert region_centroid("south") == (-23.66, -46.68)
    assert region_centroid("east") == (-23.55, -46.485)
    assert region_centroid("west") == (-23.5725, -46.73)


def test_public_donors_only_region_and_kind(client):
    body = client.get("/donors").json()
    assert len(body) == 15
    assert body[0] == {"id": DONORS[0]["id"], "kind": DONORS[0]["kind"], "region": DONORS[0]["region"]}
    assert all(set(d) == {"id", "kind", "region"} for d in body)


def test_public_ngos_without_name_or_coordinates(client):
    body = client.get("/ngos").json()
    assert len(body) == 20
    first = NGOS[0]
    assert body[0] == {"id": first["id"], "region": first["region"],
                       "accepted_categories": first["accepted_categories"],
                       "daily_capacity_kg": first["daily_capacity_kg"], "window": first["window"]}
    assert all(set(n) == {"id", "region", "accepted_categories", "daily_capacity_kg", "window"} for n in body)


def test_token_reads_full_and_bad_token_is_refused(client, auth, monkeypatch):
    donor = client.get("/donors", headers=auth).json()[0]
    assert donor == {k: DONORS[0][k] for k in ("id", "name", "kind", "region", "lat", "lon")}
    ngo = client.get("/ngos", headers=auth).json()[0]
    assert (ngo["name"], ngo["lat"], ngo["lon"]) == (NGOS[0]["name"], NGOS[0]["lat"], NGOS[0]["lon"])
    assert client.get("/donors", headers={"X-Alimenta-Token": "errado"}).status_code == 401
    monkeypatch.delenv("ALIMENTA_WRITE_TOKEN")
    assert client.get("/ngos", headers=auth).status_code == 503
    assert client.get("/ngos").status_code == 200  # sem cabeçalho continua público


def test_public_lot_hides_free_text_and_match_hides_distance(client, auth):
    lot = client.post("/lots", json={**LOT, "donor_id": "D01", "expires_at": in_hours(30)}, headers=auth).json()
    assert lot["description"] == LOT["description"]  # escrita (com token) devolve completo
    assert "description" not in client.get(f"/lots/{lot['id']}").json()
    assert all("description" not in row for row in client.get("/lots").json())
    assert client.get(f"/lots/{lot['id']}", headers=auth).json()["description"] == LOT["description"]
    ngo = client.get(f"/lots/{lot['id']}/recommendations", headers=auth).json()["recommendations"][0]
    client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo["ngo_id"]}, headers=auth)
    public = client.get("/matches").json()
    assert all("distance_km" not in m and "score" not in m for m in public)
    assert "distance_km" in client.get("/matches", headers=auth).json()[0]


def test_recommendations_require_token(client, auth):
    lot = client.post("/lots", json={**LOT, "donor_id": "D01", "expires_at": in_hours(30)}, headers=auth).json()
    assert client.get(f"/lots/{lot['id']}/recommendations").status_code == 401
    assert client.get(f"/lots/{lot['id']}/recommendations", headers=auth).status_code == 200


def test_public_heat_map_uses_region_centroids(client):
    k = client.get("/kpis").json()
    assert k["heat_points"], "seed tem entregas"
    for point in k["heat_points"]:
        assert set(point) == {"region", "lat", "lon", "kg"}
        assert (point["lat"], point["lon"]) == region_centroid(point["region"])
    assert round(sum(p["kg"] for p in k["heat_points"]), 1) == k["kg_saved"]
    by_region = {r["region"]: r["kg_saved"] for r in k["by_region"]}
    assert {p["region"]: p["kg"] for p in k["heat_points"]} == {r: v for r, v in by_region.items() if v}
    ngo_points = {(n["lat"], n["lon"]) for n in NGOS}
    assert not ngo_points & {(p["lat"], p["lon"]) for p in k["heat_points"]}


def confirmed(client, auth, donor_id, ngo_id):
    lot = client.post("/lots", json={**LOT, "donor_id": donor_id, "expires_at": in_hours(30)}, headers=auth).json()
    match = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo_id}, headers=auth).json()
    assert client.post(f"/matches/{match['id']}/confirm", headers=auth).status_code == 200
    return lot["id"]


def test_public_route_uses_centroids_exact_km(client, auth):
    ngo = next(n for n in NGOS if "bakery" in n["accepted_categories"] and n["daily_capacity_kg"] >= 30)
    far = [d for d in DONORS if d["region"] != ngo["region"]]
    first, second = far[0], next(d for d in far if d["region"] != far[0]["region"])
    lot_a = confirmed(client, auth, first["id"], ngo["id"])
    lot_b = confirmed(client, auth, second["id"], ngo["id"])

    body = client.get(f"/ngos/{ngo['id']}/route").json()
    start = region_centroid(ngo["region"])
    assert body["exact"] is False and body["start"] == {"lat": start[0], "lon": start[1]}
    assert body["ngo_region"] == ngo["region"] and "ngo_name" not in body
    # Ordem esperada calculada à mão entre centroides.
    a, b = region_centroid(first["region"]), region_centroid(second["region"])
    order = sorted([(haversine_km(*start, *a), first, a, lot_a), (haversine_km(*start, *b), second, b, lot_b)],
                   key=lambda t: (t[0], t[1]["region"]))
    legs = [order[0][0], haversine_km(*order[0][2], *order[1][2])]
    total = sum(legs) + haversine_km(*order[1][2], *start)
    assert [(s["region"], s["lat"], s["lon"]) for s in body["stops"]] == [
        (o[1]["region"], o[2][0], o[2][1]) for o in order]
    assert [s["leg_km"] for s in body["stops"]] == [round(x, 2) for x in legs]
    assert body["total_km"] == round(total, 2)
    assert [i["lot_id"] for s in body["stops"] for i in s["items"]] == [o[3] for o in order]
    for stop in body["stops"]:
        assert "donor_id" not in stop and "donor_name" not in stop and "from_id" not in stop
        assert stop["region_label"] == REGIONS[stop["region"]]["label"]

    exact = client.get(f"/ngos/{ngo['id']}/route", headers=auth).json()
    assert exact["exact"] is True and exact["start"] == {"lat": ngo["lat"], "lon": ngo["lon"]}
    assert {s["donor_id"] for s in exact["stops"]} == {first["id"], second["id"]}


PUBLIC_GETS = ["/health", "/donors", "/ngos", "/lots", "/matches", "/kpis", "/model", "/ledger",
               "/ledger/verify", "/openapi.json"]


def test_no_public_response_carries_name_or_exact_coordinate(client, auth):
    ngo = next(n for n in NGOS if "bakery" in n["accepted_categories"] and n["daily_capacity_kg"] >= 30)
    for donor in ("D01", "D07"):
        confirmed(client, auth, donor, ngo["id"])
    lot = client.get("/lots").json()[0]["id"]
    paths = PUBLIC_GETS + [f"/lots/{lot}"] + [f"/ngos/{n['id']}/route?include_open=true" for n in NGOS]
    for path in paths:
        response = client.get(path)
        assert response.status_code == 200, path
        leaked = [s for s in SENSITIVE if s in response.text]
        assert leaked == [], (path, leaked[:3])
