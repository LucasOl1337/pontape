"""Operador (e-mail em ALIMENTA_OPERATOR_EMAILS) e automação (ALIMENTA_OPS_TOKEN só em /ops/sweep)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from alimenta.api import schemas
from alimenta.api.deps import db, ops_token, role
from alimenta.core import accounts, offers, purge
from alimenta.core.accounts import Actor
from alimenta.core.clock import utcnow
from alimenta.core.service import Conflict, get
from alimenta.db.models import AuditLog, Donor, Lot, LotOffer, Ngo

router = APIRouter(prefix="/ops", tags=["operador"])
operator = role("operator")
NEXT_STATUS = {"approve": "approved", "reject": "rejected", "suspend": "suspended"}
FROM = {"approve": ("pending", "suspended"), "reject": ("pending",), "suspend": ("approved",)}


@router.get("/ngos", response_model=list[schemas.NgoOut], summary="ONGs por situação, com o snapshot do CNPJ")
def list_ngos(status: Literal["pending", "approved", "rejected", "suspended"] = "pending",
              _who: Actor = Depends(operator), session: Session = Depends(db)):
    return session.scalars(select(Ngo).where(Ngo.approval_status == status).order_by(Ngo.created_at)).all()


def review(action: str):
    def handler(ngo_id: str, body: schemas.ReviewIn | None = None, who: Actor = Depends(operator),
                session: Session = Depends(db)):
        ngo = get(session, Ngo, ngo_id)
        if ngo.approval_status not in FROM[action]:
            raise Conflict(f"ONG {ngo_id} está {ngo.approval_status}; {action} exige {' ou '.join(FROM[action])}")
        now = utcnow()
        ngo.approval_status = NEXT_STATUS[action]
        ngo.review_note = body.note if body else None
        if action == "approve":
            ngo.approved_by, ngo.approved_at = who.email, now
        accounts.audit(session, who.email, f"ngo_{action}", ngo.id, ngo.review_note, ngo.is_test, now)
        session.commit()
        return ngo
    return handler


for _action in NEXT_STATUS:
    router.add_api_route(f"/ngos/{{ngo_id}}/{_action}", review(_action), methods=["POST"],
                         response_model=schemas.NgoOut, name=f"ngo_{_action}")


@router.post("/donors/{donor_id}/{action}", response_model=schemas.DonorOut, summary="Suspende ou reativa doador")
def donor_status(donor_id: str, action: Literal["suspend", "activate"], who: Actor = Depends(operator),
                 session: Session = Depends(db)):
    donor = get(session, Donor, donor_id)
    donor.status = "suspended" if action == "suspend" else "active"
    accounts.audit(session, who.email, f"donor_{action}", donor.id, None, donor.is_test)
    session.commit()
    return donor


@router.get("/overview", summary="Visão geral: contagens, lotes sem ONG e ofertas pendentes")
def overview(_who: Actor = Depends(operator), session: Session = Depends(db)):
    offers.tick(session)
    count = lambda model, *where: session.scalar(select(func.count()).select_from(model).where(*where)) or 0  # noqa: E731
    stuck = session.scalars(select(Lot).where(Lot.status == "unclaimed").order_by(Lot.published_at.desc()).limit(50))
    return {"ngos": {s: count(Ngo, Ngo.approval_status == s) for s in ("pending", "approved", "rejected", "suspended")},
            "donors": {s: count(Donor, Donor.status == s) for s in ("active", "pending", "suspended")},
            "lots": {s: count(Lot, Lot.status == s) for s in ("open", "offered", "accepted", "collected", "delivered",
                                                               "expired", "unclaimed", "cancelled")},
            "pending_offers": count(LotOffer, LotOffer.status == "pending"),
            "unclaimed": [schemas.LotOut.model_validate(lot).model_dump(mode="json") for lot in stuck]}


@router.post("/lots/{lot_id}/reoffer", response_model=schemas.LotOut, summary="Reabre um lote sem ONG (unclaimed)")
def reoffer(lot_id: str, who: Actor = Depends(operator), session: Session = Depends(db)):
    lot = get(session, Lot, lot_id)
    if lot.status != "unclaimed":
        raise Conflict(f"lote {lot_id} está {lot.status}; reoferta só para lote sem ONG")
    now = utcnow()
    lot.status = "open"
    session.flush()
    offers.offer_next(session, lot, now)
    accounts.audit(session, who.email, "lot_reoffer", lot.id, lot.status, lot.is_test, now)
    session.commit()
    return lot


@router.get("/audit", summary="Últimas 200 ações de operador e cadastro")
def audit(_who: Actor = Depends(operator), session: Session = Depends(db)):
    rows = session.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(200))
    return [{"actor": r.actor, "action": r.action, "target": r.target, "note": r.note, "at": r.at.isoformat(),
             "is_test": r.is_test} for r in rows]


@router.post("/sweep", dependencies=[Depends(ops_token)], tags=["automação"],
             summary="Varredura agendada: vence ofertas e lotes e escala (só X-Alimenta-Ops-Token)")
def sweep(session: Session = Depends(db)):
    return offers.tick(session)


@router.post("/test-data/purge", summary="Apaga tudo de contas de teste (is_test). Registro real e livro não mudam")
def purge_test_data(who: Actor = Depends(operator), session: Session = Depends(db)):
    counts = purge.purge_test_data(session)
    return {"deleted": counts, "by": who.email}
