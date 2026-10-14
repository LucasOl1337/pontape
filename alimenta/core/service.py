"""Base das operações sobre o banco: erros de domínio, leitura, visões do match e rota de coleta.

Erros viram HTTP na API: NotFound 404, Forbidden 403, Conflict 409, Invalid 422, Unavailable 503.
O fluxo do lote (ofertas, aceite, dupla confirmação) está em core/flow.py; contas e cadastro em
core/accounts.py.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from alimenta.core.clock import aware, local, utcnow
from alimenta.core.domain import REGIONS
from alimenta.core.matching import LotView, NgoView
from alimenta.core.route import DISTANCE, METHOD, Point, Stop, nearest_neighbor
from alimenta.db.models import Donor, Lot, Match, Ngo


class NotFound(Exception):
    pass


class Forbidden(Exception):
    pass


class Conflict(Exception):
    pass


class Invalid(Exception):
    pass


class Unavailable(Exception):
    pass


ACTIVE_MATCH = ("accepted", "collected", "delivered")


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def get(session: Session, model, key):
    row = session.get(model, key)
    if row is None:
        raise NotFound(f"{model.__tablename__}/{key} não existe")
    return row


def used_today_kg(session: Session, ngo_id: str, now: datetime) -> float:
    """kg já aceitos pela ONG no dia de hoje (São Paulo), sem contar match cancelado."""
    day_start = local(now).replace(hour=0, minute=0, second=0, microsecond=0)
    total = session.scalar(
        select(func.coalesce(func.sum(Lot.kg), 0.0)).join(Match, Match.lot_id == Lot.id).where(
            Match.ngo_id == ngo_id, Match.status != "cancelled",
            Match.accepted_at >= day_start, Match.accepted_at < day_start + timedelta(days=1)))
    return float(total or 0.0)


def lot_view(session: Session, lot: Lot) -> LotView:
    donor = session.get(Donor, lot.donor_id)
    return LotView(id=lot.id, category=lot.category, kg=lot.kg, lat=donor.lat, lon=donor.lon,
                   region=donor.region, expires_at=aware(lot.expires_at), risk_level=lot.risk_level,
                   storage=lot.storage, pickup_from=aware(lot.pickup_from), pickup_until=aware(lot.pickup_until))


def ngo_view(session: Session, ngo: Ngo, now: datetime) -> NgoView:
    return NgoView(id=ngo.id, name=ngo.name, region=ngo.region, lat=ngo.lat, lon=ngo.lon,
                   accepted_categories=tuple(ngo.accepted_categories), daily_capacity_kg=ngo.daily_capacity_kg,
                   used_today_kg=used_today_kg(session, ngo.id, now), approved=ngo.approval_status == "approved",
                   accepts_refrigerated=ngo.accepts_refrigerated, accepts_frozen=ngo.accepts_frozen,
                   pickup_radius_km=ngo.pickup_radius_km, window=ngo.window)


def collection_route(session: Session, ngo_id: str, now: datetime | None = None) -> dict:
    """Ordem de coleta da ONG por vizinho mais próximo (heurística, ver core/route.py).

    Entram os lotes que a ONG aceitou e ainda não retirou (match `accepted`), com retirada pela
    ONG (`delivery_mode = ngo_pickup`). Coordenada exata: só a própria ONG e o operador chamam.
    """
    now = now or utcnow()
    ngo = get(session, Ngo, ngo_id)
    stops: dict[str, Stop] = {}
    labels: dict[str, dict] = {}
    rows = session.execute(
        select(Match, Lot).join(Lot, Lot.id == Match.lot_id)
        .where(Match.ngo_id == ngo_id, Match.status == "accepted", Lot.delivery_mode == "ngo_pickup")
        .order_by(Lot.id)).all()
    for match, lot in rows:
        donor = session.get(Donor, lot.donor_id)
        labels[donor.id] = {"donor_id": donor.id, "donor_name": donor.name, "region": donor.region,
                            "address": address_line(donor)}
        stops.setdefault(donor.id, Stop(Point(donor.id, donor.lat, donor.lon))).items.append(
            {"lot_id": lot.id, "match_id": match.id, "kg": lot.kg, "category": lot.category,
             "expires_at": aware(lot.expires_at).isoformat(),
             "pickup_until": aware(lot.pickup_until).isoformat() if lot.pickup_until else None})
    result = nearest_neighbor(Point(ngo.id, ngo.lat, ngo.lon), list(stops.values()))
    for stop in result["stops"]:
        info = labels[stop.pop("id")]
        stop.update(info, region_label=REGIONS[info["region"]]["label"],
                    kg=round(sum(i["kg"] for i in stop["items"]), 1))
    return {"ngo_id": ngo.id, "ngo_name": ngo.name, "start": {"lat": ngo.lat, "lon": ngo.lon},
            "method": METHOD, "distance": DISTANCE, "lots": sum(len(s["items"]) for s in result["stops"]),
            "generated_at": now.isoformat(), **result}


def address_line(org) -> str:
    parts = [p for p in (org.street, org.number, org.district) if p]
    return ", ".join(parts)
