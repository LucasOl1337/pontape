"""Operador (e-mail em ALIMENTA_OPERATOR_EMAILS) e automação (ALIMENTA_OPS_TOKEN só em /ops/sweep)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from alimenta.api.deps import db, ops_token, role
from alimenta.core import accounts, catalog, deletion, donations, purge
from alimenta.core.accounts import Actor
from alimenta.core.service import get
from alimenta.db.models import AuditLog, Donor, LedgerOutbox, Lot, Recommendation

router = APIRouter(prefix="/ops", tags=["operador"])
operator = role("operator")


@router.post("/donors/{donor_id}/{action}", summary="Suspende ou reativa doador")
def donor_status(donor_id: str, action: Literal["suspend", "activate"], who: Actor = Depends(operator),
                 session: Session = Depends(db)):
    donor = get(session, Donor, donor_id)
    donor.status = "suspended" if action == "suspend" else "active"
    accounts.audit(session, who.email, f"donor_{action}", donor.id, None, donor.is_test)
    session.commit()
    return {"id": donor.id, "status": donor.status}


@router.get("/overview", summary="Contagens: doações por situação, fila do livro, recomendações AI e regra")
def overview(_who: Actor = Depends(operator), session: Session = Depends(db)):
    def grouped(column, *where):
        return dict(session.execute(select(column, func.count()).where(*where).group_by(column)).all())
    return {"donations": grouped(Lot.status, Lot.public_ref.is_not(None)),
            "ledger_outbox": grouped(LedgerOutbox.status),
            "recommendations": grouped(Recommendation.mode),
            "donors": grouped(Donor.status)}


@router.get("/audit", summary="Últimas 200 ações de operador e cadastro")
def audit(_who: Actor = Depends(operator), session: Session = Depends(db)):
    rows = session.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(200))
    return [{"actor": r.actor, "action": r.action, "target": r.target, "note": r.note, "at": r.at.isoformat(),
             "is_test": r.is_test} for r in rows]


@router.post("/sweep", dependencies=[Depends(ops_token)], tags=["automação"],
             summary="Varredura: vence doações, reenvia a fila do livro, catálogo e pedidos de apagar conta")
def sweep(session: Session = Depends(db)):
    from alimenta.ledger import outbox

    expired = donations.expire_due(session)
    return {"expired": expired, "ledger": outbox.sweep(session), "catalog": catalog.sync(session),
            "deletions": deletion.retry_pending(session)}


@router.post("/test-data/purge", summary="Apaga tudo de contas de teste (is_test). Registro real e livro não mudam")
def purge_test_data(who: Actor = Depends(operator), session: Session = Depends(db)):
    counts = purge.purge_test_data(session)
    return {"deleted": counts, "by": who.email}
