"""Seed idempotente e KPIs com definições exatas."""

from __future__ import annotations

from sqlalchemy import func, select

from alimenta.core import kpis
from alimenta.core.domain import KG_PER_MEAL
from alimenta.db.models import Lot, Match
from alimenta.db.seed import seed


def test_seed_is_idempotent(session):
    assert seed(session) == {"seeded": False, "reason": "banco já tem dados"}
    assert session.scalar(select(func.count()).select_from(Lot)) == 150


def test_kg_saved_counts_only_delivered(session):
    delivered = session.scalars(select(Match).where(Match.status == "delivered")).all()
    expected = round(sum(session.get(Lot, m.lot_id).kg for m in delivered), 1)
    k = kpis.compute(session)
    assert k["deliveries"] == len(delivered) == 119
    assert k["kg_saved"] == expected
    assert k["meals_estimated"] == int(expected / KG_PER_MEAL)
    assert round(sum(r["kg_saved"] for r in k["by_region"]), 1) == expected


def test_avg_match_time_is_publish_to_accept(session):
    k = kpis.compute(session)
    rows = [(m, session.get(Lot, m.lot_id)) for m in session.scalars(select(Match)) if m.accepted_at]
    expected = sum((m.accepted_at - lot.published_at).total_seconds() / 60 for m, lot in rows) / len(rows)
    assert k["avg_match_minutes"] == round(expected, 1)
    assert k["matches_accepted"] == len(rows)


def test_avg_match_time_empty_is_none(engine):
    from alimenta.db.session import make_sessionmaker
    with make_sessionmaker(engine)() as empty:
        assert kpis.compute(empty)["avg_match_minutes"] is None
        assert kpis.compute(empty)["kg_saved"] == 0.0


def test_alerts_sorted_and_labeled(session):
    alerts = kpis.compute(session)["alerts"]
    assert alerts == sorted(alerts, key=lambda a: a["hours_left"])
    assert {a["level"] for a in alerts} <= {"expired", "critical", "warning"}
