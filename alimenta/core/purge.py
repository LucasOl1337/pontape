"""Apaga tudo o que é de conta de teste (`is_test`). Usado no fim do ensaio. Registro real não é tocado.

Lote de teste nunca gerou evento no livro (flow.deliver para antes), então o livro não muda.
Ordem: filhos antes dos pais, sem depender de ON DELETE CASCADE.
"""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from alimenta.db.models import (Account, AuditLog, Confirmation, Consent, Donor, LedgerEvent, Lot, LotOffer,
                                LotOutcome, Match, Ngo, Notification, PublicLedgerDispatch)


def purge_test_data(session: Session) -> dict:
    ledger_before = session.query(LedgerEvent).count()
    lots = select(Lot.id).where(Lot.is_test.is_(True))
    ngos = select(Ngo.id).where(Ngo.is_test.is_(True))
    donors = select(Donor.id).where(Donor.is_test.is_(True))
    matches = select(Match.id).where(Match.lot_id.in_(lots))
    offers = select(LotOffer.id).where(LotOffer.lot_id.in_(lots))
    accounts = select(Account.id).where(Account.is_test.is_(True))
    steps = [
        ("public_ledger_dispatches", delete(PublicLedgerDispatch).where(PublicLedgerDispatch.match_id.in_(matches))),
        ("confirmations", delete(Confirmation).where(Confirmation.match_id.in_(matches))),
        ("matches", delete(Match).where(Match.lot_id.in_(lots))),
        ("notifications", delete(Notification).where(Notification.offer_id.in_(offers) | Notification.ngo_id.in_(ngos))),
        ("lot_offers", delete(LotOffer).where(LotOffer.lot_id.in_(lots))),
        ("lot_outcomes", delete(LotOutcome).where(LotOutcome.lot_id.in_(lots))),
        ("lots", delete(Lot).where(Lot.is_test.is_(True))),
        ("ngos", delete(Ngo).where(Ngo.id.in_(ngos))),
        ("donors", delete(Donor).where(Donor.id.in_(donors))),
        ("consents", delete(Consent).where(Consent.account_id.in_(accounts))),
        ("audit_log", delete(AuditLog).where(AuditLog.is_test.is_(True))),
        ("accounts", delete(Account).where(Account.is_test.is_(True))),
    ]
    counts = {}
    for name, stmt in steps:
        counts[name] = session.execute(stmt.execution_options(synchronize_session=False)).rowcount
    assert session.query(LedgerEvent).count() == ledger_before  # nosec B101 - o livro nunca muda aqui
    session.commit()
    return counts
