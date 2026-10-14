"""Rota de coleta (vizinho mais próximo) com casos exatos."""

from __future__ import annotations

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
