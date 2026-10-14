"""Rota de coleta (vizinho mais próximo) com casos exatos."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from alimenta.core.domain import haversine_km
from alimenta.core.route import Point, Stop, nearest_neighbor

KM_PER_DEGREE = 6371.0 * 3.141592653589793 / 180  # 111,19 km por grau no equador


def stop(id_, lon, lat=0.0):
    return Stop(Point(id_, lat, lon), items=[{"lot_id": f"L-{id_}"}])


def test_nearest_neighbor_on_a_line_exact_km():
    # ONG em (0, 0); doadores a 1, 2 e 3 graus de longitude no equador, fora de ordem.
    route = nearest_neighbor(Point("N", 0.0, 0.0), [stop("D3", 3.0), stop("D1", 1.0), stop("D2", 2.0)])
    assert [s["id"] for s in route["stops"]] == ["D1", "D2", "D3"]
    assert [s["leg_km"] for s in route["stops"]] == [111.19, 111.19, 111.19]
    assert [s["cumulative_km"] for s in route["stops"]] == [111.19, 222.39, 333.58]
    assert [s["from_id"] for s in route["stops"]] == ["N", "D1", "D2"]
    assert route["return_leg_km"] == 333.58
    assert route["total_km"] == 667.17
    assert route["total_km"] == pytest.approx(6 * KM_PER_DEGREE, abs=0.01)


def test_nearest_neighbor_is_greedy_not_optimal():
    # ONG em 0; doadores em +1, -2 e +5 graus de longitude no equador.
    # Gulosa: N→+1→-2→+5→N = 1 + 3 + 7 + 5 = 16 graus. Melhor: N→-2→+1→+5→N = 2 + 3 + 4 + 5 = 14 graus.
    route = nearest_neighbor(Point("N", 0.0, 0.0), [stop("Da", 1.0), stop("Db", -2.0), stop("Dc", 5.0)])
    assert [s["id"] for s in route["stops"]] == ["Da", "Db", "Dc"]
    assert route["total_km"] == pytest.approx(16 * KM_PER_DEGREE, abs=0.01)
    assert route["total_km"] > 14 * KM_PER_DEGREE


def test_tie_goes_to_smallest_id_and_empty_route():
    route = nearest_neighbor(Point("N", 0.0, 0.0), [stop("Db", 1.0), stop("Da", -1.0)])
    assert [s["id"] for s in route["stops"]] == ["Da", "Db"]
    empty = nearest_neighbor(Point("N", 0.0, 0.0), [])
    assert empty == {"stops": [], "return_leg_km": 0.0, "total_km": 0.0}


LOT = {"category": "bakery", "storage": "ambient", "kg": 10.0, "description": "Rota (simulado)"}


def in_hours(hours: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def confirmed_lot(client, auth, donor_id, ngo_id):
    lot = client.post("/lots", json={**LOT, "donor_id": donor_id, "expires_at": in_hours(30)}, headers=auth).json()
    match = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo_id}, headers=auth)
    assert match.status_code == 201, match.text
    assert client.post(f"/matches/{match.json()['id']}/confirm", headers=auth).status_code == 200
    return lot["id"], match.json()["id"]


def test_route_endpoint_orders_confirmed_lots_by_nearest_neighbor(client, auth):
    ngos = {n["id"]: n for n in client.get("/ngos", headers=auth).json()}
    donors = {d["id"]: d for d in client.get("/donors", headers=auth).json()}
    ngo = next(n for n in ngos.values() if "bakery" in n["accepted_categories"] and n["daily_capacity_kg"] >= 40)
    assert client.get(f"/ngos/{ngo['id']}/route", headers=auth).json()["stops"] == []  # seed não deixa match confirmado

    picked = ["D01", "D07", "D12"]
    lots = {d: confirmed_lot(client, auth, d, ngo["id"]) for d in picked}
    extra, _ = confirmed_lot(client, auth, "D07", ngo["id"])  # 2º lote do mesmo doador: mesma parada

    # Ordem esperada calculada à mão, pela mesma regra: sempre o doador mais perto do ponto atual.
    here, left, expected, total = (ngo["lat"], ngo["lon"]), set(picked), [], 0.0
    while left:
        nxt = min(left, key=lambda d: (haversine_km(*here, donors[d]["lat"], donors[d]["lon"]), d))
        leg = haversine_km(*here, donors[nxt]["lat"], donors[nxt]["lon"])
        expected.append((nxt, round(leg, 2)))
        total += leg
        here = (donors[nxt]["lat"], donors[nxt]["lon"])
        left.remove(nxt)
    total += haversine_km(*here, ngo["lat"], ngo["lon"])

    body = client.get(f"/ngos/{ngo['id']}/route", headers=auth).json()
    assert [(s["donor_id"], s["leg_km"]) for s in body["stops"]] == expected
    assert body["total_km"] == round(total, 2)
    assert body["lots"] == 4 and body["include_open"] is False and body["exact"] is True
    assert "vizinho mais próximo" in body["method"] and "heurística" in body["method"]
    d07 = next(s for s in body["stops"] if s["donor_id"] == "D07")
    assert sorted(i["lot_id"] for i in d07["items"]) == sorted([lots["D07"][0], extra])
    assert d07["kg"] == 20.0 and all(i["kind"] == "confirmed" for i in d07["items"])

    # Coletado sai da rota.
    client.post(f"/matches/{lots['D01'][1]}/collect", headers=auth)
    after = client.get(f"/ngos/{ngo['id']}/route", headers=auth).json()
    assert "D01" not in [s["donor_id"] for s in after["stops"]] and after["lots"] == 3


def test_route_include_open_adds_only_compatible_open_lots(client, auth):
    ngo = client.get("/ngos").json()[0]
    route = client.get(f"/ngos/{ngo['id']}/route", params={"include_open": "true"}).json()
    opened = [i for s in route["stops"] for i in s["items"]]
    assert opened and all(i["kind"] == "open" for i in opened)
    assert all(i["category"] in ngo["accepted_categories"] for i in opened)
    open_ids = {lot["id"] for lot in client.get("/lots", params={"status": "open"}).json()}
    assert {i["lot_id"] for i in opened} <= open_ids
    assert route["total_km"] >= sum(s["leg_km"] for s in route["stops"])


def test_route_unknown_ngo_is_404(client):
    assert client.get("/ngos/N-naoexiste/route").status_code == 404
