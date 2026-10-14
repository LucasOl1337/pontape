"""Operações da Rede Alimenta sobre o banco (usadas pela API e pelo seed).

Erros de domínio viram HTTP na API: NotFound 404, Conflict 409, Invalid 422.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from alimenta.core.clock import aware, local, model_features, utcnow
from alimenta.core.matching import LotExpired, LotView, NgoView, recommend, score_ngo
from alimenta.db.models import Donor, Lot, Match, Ngo
from alimenta.ledger import demo_ledger
from alimenta.model.predict import predict


class NotFound(Exception):
    pass


class Conflict(Exception):
    pass


class Invalid(Exception):
    pass


ACTIVE = ("proposed", "confirmed", "collected", "delivered")
NEXT = {"confirm": ("proposed", "confirmed", "confirmed_at"),
        "collect": ("confirmed", "collected", "collected_at"),
        "deliver": ("collected", "delivered", "delivered_at")}


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def get(session: Session, model, key):
    row = session.get(model, key)
    if row is None:
        raise NotFound(f"{model.__tablename__}/{key} não existe")
    return row


def create_lot(session: Session, *, donor_id: str, category: str, storage: str, kg: float,
               expires_at: datetime, description: str = "", now: datetime | None = None) -> Lot:
    now = now or utcnow()
    donor = session.get(Donor, donor_id)
    if donor is None:
        raise Invalid(f"doador {donor_id} não existe")
    expires_at = aware(expires_at)
    if expires_at <= now:
        raise Invalid("lote vencido: a validade já passou, o lote não pode ser oferecido")
    pred = predict(model_features(category, storage, donor.region, kg, now, expires_at))
    lot = Lot(id=new_id("L"), donor_id=donor_id, category=category, storage=storage, kg=kg,
              description=description, published_at=now, expires_at=expires_at, status="open", **pred)
    session.add(lot)
    session.commit()
    return lot


def used_today_kg(session: Session, ngo_id: str, now: datetime) -> float:
    day_start_local = local(now).replace(hour=0, minute=0, second=0, microsecond=0)
    total = session.scalar(
        select(func.coalesce(func.sum(Lot.kg), 0.0)).join(Match, Match.lot_id == Lot.id).where(
            Match.ngo_id == ngo_id, Match.status != "cancelled",
            Match.proposed_at >= day_start_local, Match.proposed_at < day_start_local + timedelta(days=1)))
    return float(total or 0.0)


def lot_view(session: Session, lot: Lot) -> LotView:
    donor = session.get(Donor, lot.donor_id)
    return LotView(id=lot.id, category=lot.category, kg=lot.kg, lat=donor.lat, lon=donor.lon,
                   region=donor.region, expires_at=aware(lot.expires_at), risk_level=lot.risk_level)


def ngo_view(session: Session, ngo: Ngo, now: datetime) -> NgoView:
    return NgoView(id=ngo.id, name=ngo.name, region=ngo.region, lat=ngo.lat, lon=ngo.lon,
                   accepted_categories=tuple(ngo.accepted_categories),
                   daily_capacity_kg=ngo.daily_capacity_kg, used_today_kg=used_today_kg(session, ngo.id, now))


def recommendations(session: Session, lot_id: str, limit: int = 5, now: datetime | None = None) -> list[dict]:
    now = now or utcnow()
    lot = get(session, Lot, lot_id)
    ngos = [ngo_view(session, n, now) for n in session.scalars(select(Ngo).order_by(Ngo.id))]
    try:
        return recommend(lot_view(session, lot), ngos, now, limit)
    except LotExpired as exc:
        raise Invalid(f"lote vencido: {exc}") from exc


def create_match(session: Session, lot_id: str, ngo_id: str, now: datetime | None = None) -> Match:
    now = now or utcnow()
    lot = get(session, Lot, lot_id)
    ngo = get(session, Ngo, ngo_id)
    view = lot_view(session, lot)
    if view.expires_at <= now:
        raise Invalid("lote vencido: não pode receber ONG")
    if lot.status != "open":
        raise Conflict(f"lote {lot_id} já tem ONG atribuída (status {lot.status})")
    scored = score_ngo(view, ngo_view(session, ngo, now), now)
    if not scored["accepts_category"]:
        raise Invalid(f"ONG {ngo_id} não aceita a categoria {lot.category}")
    if not scored["fits_capacity"]:
        raise Invalid(f"ONG {ngo_id} sem capacidade hoje ({scored['remaining_capacity_kg']} kg livres)")
    match = Match(lot_id=lot_id, ngo_id=ngo_id, status="proposed", score=scored["score"],
                  distance_km=scored["distance_km"], proposed_at=now)
    lot.status = "matched"
    session.add(match)
    try:
        session.commit()
    except IntegrityError as exc:  # corrida: o índice único parcial barrou a dupla atribuição
        session.rollback()
        raise Conflict(f"lote {lot_id} já tem ONG atribuída") from exc
    return match


def advance(session: Session, match_id: int, step: str, now: datetime | None = None) -> Match:
    """confirm, collect ou deliver. deliver é idempotente e grava no livro da demo."""
    now = now or utcnow()
    match = get(session, Match, match_id)
    required, target, stamp = NEXT[step]
    if step == "deliver" and match.status == "delivered":
        return match  # idempotente: mesma resposta, nenhum evento novo
    if match.status != required:
        raise Conflict(f"match {match_id} está {match.status}; {step} exige {required}")
    match.status = target
    setattr(match, stamp, now)
    if step == "deliver":
        lot = get(session, Lot, match.lot_id)
        lot.status = "delivered"
        event = demo_ledger.append_delivery(session, delivered_at=now, kg=lot.kg, recorded_at=now)
        match.ledger_sequence = event.sequence
    session.commit()
    return match


def cancel(session: Session, match_id: int, now: datetime | None = None) -> Match:
    now = now or utcnow()
    match = get(session, Match, match_id)
    if match.status not in ("proposed", "confirmed"):
        raise Conflict(f"match {match_id} está {match.status} e não pode ser cancelado")
    match.status = "cancelled"
    match.cancelled_at = now
    get(session, Lot, match.lot_id).status = "open"
    session.commit()
    return match
