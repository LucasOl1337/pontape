"""Doação (corte r6, só doador): registrar, escolher destino, declarar entrega, cancelar e vencer.

Estados: `registered → destination_chosen → delivered`, ou `cancelled` | `expired`.
Cada passo de doação real entra na fila do livro público (`ledger/outbox.py`) na mesma transação:
`donation_registered`, `destination_chosen` (pode repetir enquanto aberta), `donation_delivered`
(declarada por quem doou) e `donation_cancelled` (cancelada ou vencida). Conta de teste não publica.

Limites (cada evento vira um commit na main): 5 doações abertas por conta e 10 registros por dia.
Vencimento (varredura): sem destino, vence quando passa a validade; com destino, 48 h depois da
validade, para quem entregou ainda poder declarar.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from alimenta.core import accounts, catalog
from alimenta.core.accounts import Actor
from alimenta.core.clock import aware, local, model_features, utcnow
from alimenta.core.service import Conflict, Forbidden, Invalid, NotFound, new_id
from alimenta.db.models import Donor, Lot, LotOutcome, Recommendation
from alimenta.ledger import outbox
from alimenta.model.predict import predict

OPEN = ("registered", "destination_chosen")
MAX_OPEN = 5
MAX_PER_DAY = 10
GRACE_AFTER_EXPIRY = timedelta(hours=48)
REF_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ"  # sem I e O, que confundem com 1 e 0


def new_ref(session: Session) -> str:
    while True:
        ref = "AL" + "".join(secrets.choice(REF_ALPHABET) for _ in range(8))
        if session.scalar(select(Lot.id).where(Lot.public_ref == ref)) is None:
            return ref


def my_donor(session: Session, who: Actor) -> Donor:
    donor = accounts.org_of(session, who)
    if donor is None:
        raise NotFound("esta conta ainda não tem cadastro de doador")
    if donor.status != "active":
        raise Forbidden(f"cadastro de doador {donor.status}")
    return donor


def mine(session: Session, who: Actor, lot_id: str) -> Lot:
    lot = session.get(Lot, lot_id)
    donor = accounts.org_of(session, who)
    if lot is None or lot.public_ref is None or donor is None or lot.donor_id != donor.id:
        raise NotFound(f"doação {lot_id} não existe nesta conta")
    return lot


def view(session: Session, lot: Lot) -> dict:
    ledger = outbox.status_of(session, lot)
    return {"id": lot.id, "public_ref": lot.public_ref, "category": lot.category, "storage": lot.storage,
            "kg": lot.kg, "expires_at": aware(lot.expires_at).isoformat(), "city": lot.city, "uf": lot.uf,
            "status": lot.status, "distributor_id": lot.distributor_id, "choice": lot.destination_choice,
            "created_at": aware(lot.published_at).isoformat(),
            "delivered_at": aware(lot.delivered_at).isoformat() if lot.delivered_at else None,
            "risk_level": lot.risk_level, "is_test": lot.is_test, "ledger": ledger,
            "ledger_sequence": next((e["ledger_sequence"] for e in reversed(ledger) if e["ledger_sequence"]), None)}


def _day_start(now: datetime) -> datetime:
    return local(now).replace(hour=0, minute=0, second=0, microsecond=0)


def register(session: Session, who: Actor, body: dict, now: datetime | None = None) -> Lot:
    now = now or utcnow()
    donor = my_donor(session, who)
    expires_at = aware(body["expires_at"])
    if expires_at <= now:
        raise Invalid("a validade já passou: doação vencida não entra")
    open_count = session.scalar(select(func.count()).select_from(Lot).where(
        Lot.donor_id == donor.id, Lot.status.in_(OPEN))) or 0
    if open_count >= MAX_OPEN:
        raise Conflict(f"limite de {MAX_OPEN} doações abertas: entregue ou cancele uma antes")
    today = session.scalar(select(func.count()).select_from(Lot).where(
        Lot.donor_id == donor.id, Lot.public_ref.is_not(None), Lot.published_at >= _day_start(now))) or 0
    if today >= MAX_PER_DAY:
        raise Conflict(f"limite de {MAX_PER_DAY} doações por dia")
    city, uf = " ".join(body["city"].split()), body["uf"].upper()
    if uf not in catalog.UFS:
        raise Invalid("UF inválida")
    features = model_features(body["category"], body["storage"], "unknown", body["kg"], now, expires_at)
    lot = Lot(id=new_id("L"), donor_id=donor.id, created_by=who.account.id, category=body["category"],
              storage=body["storage"], kg=body["kg"], description="", published_at=now, expires_at=expires_at,
              pickup_from=None, pickup_until=None, delivery_mode="donor_delivers",
              terms_version=accounts.DONATION_TERMS, features=features, status="registered",
              is_test=donor.is_test, public_ref=new_ref(session), city=city, uf=uf, **predict(features))
    session.add(lot)
    session.flush()
    outbox.enqueue(session, lot, "donation_registered", now)
    session.commit()
    outbox.push(session, lot.id, now)
    return lot


def choose(session: Session, who: Actor, lot: Lot, distributor_id: str, from_recommendation: bool,
           now: datetime | None = None) -> Lot:
    now = now or utcnow()
    if lot.status not in OPEN:
        raise Conflict(f"doação {lot.status}: não dá mais para escolher destino")
    record = catalog.by_id(distributor_id)
    if record is None:
        raise Invalid(f"distribuidor {distributor_id} não está no catálogo")
    donor = session.get(Donor, lot.donor_id)
    if donor.distributor_id == distributor_id:
        raise Invalid("um distribuidor não pode doar para si mesmo")
    last = session.scalars(select(Recommendation).where(Recommendation.lot_id == lot.id)
                           .order_by(Recommendation.id.desc()).limit(1)).first()
    top = (last.output.get("ranking") or [{}])[0].get("distributor_id") if last is not None else None
    ai_top = bool(from_recommendation and last is not None and last.mode == "ai" and top == distributor_id)
    if last is not None and from_recommendation:
        last.choice = "accepted_top" if top == distributor_id else "picked_other"
    elif last is not None and last.choice is None:
        last.choice = "picked_other"
    if lot.distributor_id == distributor_id and lot.destination_choice == ("ai_top" if ai_top else "other"):
        return lot  # mesmo destino de novo: nada muda, nada vai ao livro
    lot.distributor_id, lot.destination_choice = distributor_id, "ai_top" if ai_top else "other"
    lot.destination_at, lot.status = now, "destination_chosen"
    outbox.enqueue(session, lot, "destination_chosen", now)
    session.commit()
    outbox.push(session, lot.id, now)
    return lot


def _outcome(session: Session, lot: Lot, outcome: str, now: datetime) -> None:
    """Desfecho para o retreino do modelo de risco (rótulo: vencida = descartada)."""
    session.merge(LotOutcome(lot_id=lot.id, outcome=outcome, features=lot.features, discard_proba=lot.discard_proba,
                             model_version=lot.model_version, decided_at=now, is_test=lot.is_test))


def deliver(session: Session, lot: Lot, now: datetime | None = None) -> Lot:
    now = now or utcnow()
    if lot.status != "destination_chosen":
        raise Conflict("entrega só depois de escolher o destino" if lot.status == "registered"
                       else f"doação {lot.status}: não dá para marcar entregue")
    lot.status, lot.delivered_at, lot.closed_at = "delivered", now, now
    _outcome(session, lot, "delivered", now)
    outbox.enqueue(session, lot, "donation_delivered", now)
    session.commit()
    outbox.push(session, lot.id, now)
    return lot


def cancel(session: Session, lot: Lot, now: datetime | None = None, status: str = "cancelled") -> Lot:
    now = now or utcnow()
    if lot.status not in OPEN:
        raise Conflict(f"doação {lot.status}: não dá para cancelar")
    lot.status, lot.closed_at = status, now
    _outcome(session, lot, status, now)
    outbox.enqueue(session, lot, "donation_cancelled", now)
    session.commit()
    outbox.push(session, lot.id, now)
    return lot


def expire_due(session: Session, now: datetime | None = None) -> int:
    """Vence doações abertas (varredura). Devolve quantas."""
    now = now or utcnow()
    count = 0
    rows = session.scalars(select(Lot).where(Lot.status.in_(OPEN), Lot.public_ref.is_not(None))).all()
    for lot in rows:
        limit = aware(lot.expires_at) + (GRACE_AFTER_EXPIRY if lot.status == "destination_chosen" else timedelta(0))
        if limit <= now:
            lot.status, lot.closed_at = "expired", now
            _outcome(session, lot, "expired", now)
            outbox.enqueue(session, lot, "donation_cancelled", now)
            count += 1
    session.commit()
    return count
