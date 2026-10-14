"""Ofertas uma por vez, com prazo, e escalonamento (Q7).

- Candidatas: ONGs aprovadas que passam nos filtros de core/matching.py, da mesma natureza do lote
  (lote de teste só vai para ONG de teste, lote real só para ONG real) e que ainda não receberam
  oferta deste lote.
- Prazo: `respond_by = agora + clamp(25% do tempo até vencer, 15 min, 60 min)`, nunca depois da validade.
- Venceu ou recusou: próxima ONG do ranking. Sem próxima: lote `unclaimed`, desfecho gravado e o
  operador vê em /ops/overview. Passou da validade: `expired`.
- `tick` roda a cada leitura de quem opera (preguiçoso) e em POST /ops/sweep (agendado).
"""

from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from alimenta.core.clock import aware, utcnow
from alimenta.core.matching import LotExpired, recommend
from alimenta.core.service import Conflict, Invalid, lot_view, ngo_view
from alimenta.db.models import Lot, LotOffer, LotOutcome, Match, Ngo, Notification

MIN_WINDOW = timedelta(minutes=15)
MAX_WINDOW = timedelta(minutes=60)
OPEN_STATES = ("open", "offered", "accepted")
DECLINE_REASONS = ("no_capacity", "no_transport", "category_not_needed", "window_conflict",
                   "too_far", "storage_unavailable", "other")


def respond_window(now: datetime, expires_at: datetime) -> timedelta:
    left = aware(expires_at) - now
    return min(max(left * 0.25, MIN_WINDOW), MAX_WINDOW)


def ranking(session: Session, lot: Lot, now: datetime, limit: int = 20) -> list[dict]:
    tried = set(session.scalars(select(LotOffer.ngo_id).where(LotOffer.lot_id == lot.id)))
    ngos = session.scalars(select(Ngo).where(Ngo.approval_status == "approved", Ngo.is_test == lot.is_test)
                           .order_by(Ngo.id)).all()
    views = [ngo_view(session, n, now) for n in ngos if n.id not in tried]
    try:
        return recommend(lot_view(session, lot), views, now, limit)
    except LotExpired as exc:
        raise Invalid(f"lote vencido: {exc}") from exc


def close(session: Session, lot: Lot, outcome: str, now: datetime) -> None:
    """Fecha o lote com um desfecho e grava a linha de retreino (uma por lote)."""
    lot.status = outcome
    row = session.get(LotOutcome, lot.id)
    if row is None:
        session.add(LotOutcome(lot_id=lot.id, outcome=outcome, features=lot.features, discard_proba=lot.discard_proba,
                               model_version=lot.model_version, decided_at=now, is_test=lot.is_test))
    else:
        row.outcome, row.decided_at = outcome, now


def offer_next(session: Session, lot: Lot, now: datetime) -> LotOffer | None:
    """Oferece à próxima ONG do ranking. Sem candidata: `unclaimed`. Não faz commit."""
    if aware(lot.expires_at) <= now:
        close(session, lot, "expired", now)
        return None
    ranked = ranking(session, lot, now, limit=1)
    if not ranked:
        close(session, lot, "unclaimed", now)
        return None
    best = ranked[0]
    rank = 1 + len(session.scalars(select(LotOffer.id).where(LotOffer.lot_id == lot.id)).all())
    respond_by = min(now + respond_window(now, lot.expires_at), aware(lot.expires_at))
    offer = LotOffer(lot_id=lot.id, ngo_id=best["ngo_id"], rank=rank, score=best["score"],
                     distance_km=best["distance_km"], status="pending", offered_at=now, respond_by=respond_by)
    session.add(offer)
    try:
        session.flush()
    except IntegrityError as exc:  # índice único parcial: já existe oferta pendente para o lote
        session.rollback()
        raise Conflict(f"lote {lot.id} já tem oferta pendente") from exc
    lot.status = "offered"
    for channel in ("inbox", "whatsapp_link"):
        session.add(Notification(ngo_id=offer.ngo_id, offer_id=offer.id, channel=channel, status="created",
                                 created_at=now))
    return offer


def withdraw_pending(session: Session, lot_id: str, now: datetime) -> None:
    for offer in session.scalars(select(LotOffer).where(LotOffer.lot_id == lot_id, LotOffer.status == "pending")):
        offer.status, offer.responded_at = "withdrawn", now


def tick(session: Session, now: datetime | None = None) -> dict:
    """Vence ofertas e lotes e escala. Idempotente: rodar duas vezes no mesmo instante não muda nada."""
    now = now or utcnow()
    counts = {"timed_out": 0, "escalated": 0, "unclaimed": 0, "expired": 0}
    open_lots = session.scalars(select(Lot).where(Lot.status.in_(OPEN_STATES)).order_by(Lot.id)).all()
    for lot in open_lots:
        if aware(lot.expires_at) <= now:
            withdraw_pending(session, lot.id, now)
            for match in session.scalars(select(Match).where(Match.lot_id == lot.id, Match.status == "accepted")):
                match.status, match.cancelled_at = "cancelled", now
            close(session, lot, "expired", now)
            counts["expired"] += 1
    session.flush()
    late = session.scalars(select(LotOffer).where(LotOffer.status == "pending", LotOffer.respond_by <= now)
                           .order_by(LotOffer.id)).all()
    for offer in late:
        offer.status, offer.responded_at = "timed_out", now
        counts["timed_out"] += 1
        session.flush()
        lot = session.get(Lot, offer.lot_id)
        nxt = offer_next(session, lot, now)
        counts["escalated" if nxt else lot.status] += 1
    session.commit()
    return counts
