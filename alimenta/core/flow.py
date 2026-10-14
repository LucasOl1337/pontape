"""Fluxo do lote real: publicar (termo reafirmado) → oferta → aceite/recusa → dupla confirmação → entrega.

Entrega (`delivered`) só com as duas confirmações: `pickup` do doador e `receipt` da ONG, em
qualquer ordem. Na segunda: desfecho em `lot_outcomes`, evento no livro `pontape-alimenta` e o
envio ao livro real (desligado por flag). Lote de teste não gera evento em livro nenhum.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from alimenta.core import accounts, offers
from alimenta.core.accounts import Actor
from alimenta.core.clock import aware, model_features, utcnow
from alimenta.core.service import Conflict, Forbidden, Invalid, get, new_id, ngo_view
from alimenta.db.models import Confirmation, Donor, Lot, LotOffer, Match, Ngo
from alimenta.ledger import book, public
from alimenta.model.predict import predict


def create_lot(session: Session, donor: Donor, actor: Actor, body: dict, now: datetime | None = None) -> Lot:
    now = now or utcnow()
    if donor.status != "active":
        raise Forbidden(f"doador {donor.status}: não pode publicar lote")
    if body.get("terms_version") != accounts.DONATION_TERMS:
        raise Invalid(f"reafirme o termo {accounts.DONATION_TERMS}: dentro da validade e conservado como o fabricante manda")
    expires_at = aware(body["expires_at"])
    if expires_at <= now:
        raise Invalid("lote vencido: a validade já passou, o lote não pode ser oferecido")
    pickup_from = aware(body.get("pickup_from")) or now
    pickup_until = aware(body.get("pickup_until")) or expires_at
    if not pickup_from < pickup_until <= expires_at:
        raise Invalid("janela de retirada precisa terminar depois de começar e até a validade")
    features = model_features(body["category"], body["storage"], donor.region, body["kg"], now, expires_at)
    lot = Lot(id=new_id("L"), donor_id=donor.id, created_by=actor.account.id,
              category=body["category"], storage=body["storage"], kg=body["kg"], description=body.get("description", ""),
              published_at=now, expires_at=expires_at, pickup_from=pickup_from, pickup_until=pickup_until,
              delivery_mode=body.get("delivery_mode", "ngo_pickup"), terms_version=body["terms_version"],
              features=features, status="open", is_test=donor.is_test, **predict(features))
    session.add(lot)
    session.flush()
    offers.offer_next(session, lot, now)
    session.commit()
    return lot


def cancel_lot(session: Session, lot: Lot, actor: Actor, now: datetime | None = None) -> Lot:
    now = now or utcnow()
    if lot.status not in ("open", "offered", "accepted"):
        raise Conflict(f"lote {lot.id} está {lot.status} e não pode ser cancelado")
    if session.scalar(select(Confirmation.id).join(Match, Match.id == Confirmation.match_id)
                      .where(Match.lot_id == lot.id, Match.status != "cancelled")):
        raise Conflict("a entrega já tem confirmação: não dá mais para cancelar")
    offers.withdraw_pending(session, lot.id, now)
    for match in session.scalars(select(Match).where(Match.lot_id == lot.id, Match.status == "accepted")):
        match.status, match.cancelled_at = "cancelled", now
    offers.close(session, lot, "cancelled", now)
    accounts.audit(session, actor.email, "lot_cancel", lot.id, None, lot.is_test, now)
    session.commit()
    return lot


def accept_offer(session: Session, offer: LotOffer, ngo: Ngo, now: datetime | None = None) -> Match:
    now = now or utcnow()
    if offer.ngo_id != ngo.id:
        raise Forbidden("esta oferta é de outra ONG")
    if offer.status != "pending":
        raise Conflict(f"oferta {offer.id} está {offer.status}")
    lot = get(session, Lot, offer.lot_id)
    if aware(offer.respond_by) <= now or aware(lot.expires_at) <= now:
        raise Conflict("o prazo desta oferta já passou")
    view = ngo_view(session, ngo, now)
    if view.used_today_kg + lot.kg > view.daily_capacity_kg:
        raise Conflict(f"sem capacidade hoje: {view.daily_capacity_kg - view.used_today_kg:.1f} kg livres, lote tem {lot.kg} kg")
    offer.status, offer.responded_at = "accepted", now
    match = Match(lot_id=lot.id, ngo_id=ngo.id, offer_id=offer.id, status="accepted", score=offer.score,
                  distance_km=offer.distance_km, accepted_at=now)
    lot.status = "accepted"
    session.add(match)
    try:
        session.commit()
    except IntegrityError as exc:  # corrida: o índice único parcial barrou a dupla atribuição
        session.rollback()
        raise Conflict(f"lote {lot.id} já tem ONG") from exc
    return match


def decline_offer(session: Session, offer: LotOffer, ngo: Ngo, reason: str, now: datetime | None = None) -> LotOffer:
    now = now or utcnow()
    if offer.ngo_id != ngo.id:
        raise Forbidden("esta oferta é de outra ONG")
    if offer.status != "pending":
        raise Conflict(f"oferta {offer.id} está {offer.status}")
    if reason not in offers.DECLINE_REASONS:
        raise Invalid(f"motivo fora da lista: {', '.join(offers.DECLINE_REASONS)}")
    offer.status, offer.responded_at, offer.decline_reason = "declined", now, reason
    session.flush()
    offers.offer_next(session, get(session, Lot, offer.lot_id), now)
    session.commit()
    return offer


def confirm(session: Session, match: Match, kind: str, actor: Actor, now: datetime | None = None) -> Match:
    """`pickup` (doador) ou `receipt` (ONG). Idempotente por (match, kind). Com as duas: entrega."""
    now = now or utcnow()
    if match.status not in ("accepted", "collected", "delivered"):
        raise Conflict(f"match {match.id} está {match.status}")
    exists = session.scalar(select(Confirmation).where(Confirmation.match_id == match.id, Confirmation.kind == kind))
    if exists is None:
        session.add(Confirmation(match_id=match.id, kind=kind, account_id=actor.account.id, at=now))
        if kind == "pickup" and match.status == "accepted":
            match.status, match.collected_at = "collected", now
        session.flush()
    kinds = set(session.scalars(select(Confirmation.kind).where(Confirmation.match_id == match.id)))
    if kinds == {"pickup", "receipt"} and match.status != "delivered":
        deliver(session, match, now)
    session.commit()
    return match


def deliver(session: Session, match: Match, now: datetime) -> None:
    lot = get(session, Lot, match.lot_id)
    match.status, match.delivered_at = "delivered", now
    match.collected_at = match.collected_at or now
    offers.close(session, lot, "delivered", now)
    if lot.is_test:
        return  # conta de teste: nenhum livro
    event = book.append_delivery(session, delivered_at=now, kg=lot.kg, recorded_at=now)
    match.ledger_sequence = event.sequence
    public.dispatch(session, match.id, now, now)
