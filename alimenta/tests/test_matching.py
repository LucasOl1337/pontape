"""Regras do match com casos exatos."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from alimenta.core.domain import haversine_km, risk_level
from alimenta.core.matching import LotExpired, LotView, NgoView, recommend, score_ngo

NOW = datetime(2026, 10, 15, 12, 0, tzinfo=timezone.utc)


def lot(hours=30.0, category="bakery", kg=10.0, risk="low"):
    return LotView(id="L1", category=category, kg=kg, lat=-23.55, lon=-46.64, region="center",
                   expires_at=NOW + timedelta(hours=hours), risk_level=risk)


def ngo(id_, lat=-23.55, lon=-46.64, cats=("bakery",), cap=100, used=0, region="center"):
    return NgoView(id=id_, name=id_, region=region, lat=lat, lon=lon, accepted_categories=cats,
                   daily_capacity_kg=cap, used_today_kg=used)


def test_haversine_known_distance():
    # Dois pontos do centro de São Paulo: 2,56 km em linha reta (raio da Terra 6.371 km).
    assert haversine_km(-23.5503, -46.6339, -23.5614, -46.6559) == pytest.approx(2.5597, abs=0.0001)


def test_risk_levels_at_thresholds():
    assert [risk_level(p) for p in (0.0, 0.3299, 0.33, 0.6599, 0.66, 1.0)] == [
        "low", "low", "medium", "medium", "high", "high"]


def test_expired_lot_is_blocked():
    with pytest.raises(LotExpired):
        recommend(lot(hours=-0.1), [ngo("N1")], NOW)
    with pytest.raises(LotExpired):
        recommend(lot(hours=0), [ngo("N1")], NOW)


def test_category_and_capacity_filter():
    result = recommend(lot(kg=30), [ngo("N_tipo", cats=("dairy",)), ngo("N_cheia", cap=100, used=80),
                                    ngo("N_ok", cap=100, used=70)], NOW)
    assert [r["ngo_id"] for r in result] == ["N_ok"]


def test_exact_points_same_place_not_urgent():
    s = score_ngo(lot(kg=10), ngo("N1", cap=100), NOW)
    assert s["points"] == {"distance": 60.0, "same_region": 10.0, "capacity": 18.0, "urgency": 0.0}
    assert s["score"] == 88.0 and s["eligible"] is True


def test_closer_ngo_wins_and_urgency_shrinks_radius():
    near, far = ngo("N_perto"), ngo("N_longe", lat=-23.55 + 0.09)  # ~10 km ao norte
    calm = score_ngo(lot(hours=30), far, NOW)["points"]["distance"]
    urgent = score_ngo(lot(hours=6), far, NOW)
    assert urgent["urgent"] is True and urgent["points"]["urgency"] == 10.0
    assert urgent["points"]["distance"] < calm
    assert [r["ngo_id"] for r in recommend(lot(), [far, near], NOW)] == ["N_perto", "N_longe"]


def test_high_risk_counts_as_urgent():
    assert score_ngo(lot(hours=40, risk="high"), ngo("N1"), NOW)["urgent"] is True
