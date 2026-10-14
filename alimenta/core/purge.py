"""Apaga tudo o que é de conta de teste (`is_test`). Usado no fim do ensaio. Registro real não é tocado.

Doação de teste nunca entra na fila do livro público (`ledger_outbox`), então nada a desfazer lá;
se aparecer linha de fila ligada a doação de teste, a limpeza para e desfaz tudo.
Ordem: filhos antes dos pais, sem depender de ON DELETE CASCADE.
"""

from __future__ import annotations

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from alimenta.db.models import (Account, AccountDeletion, AuditLog, Consent, Donor, LedgerOutbox, Lot, LotOutcome,
                                Recommendation)


def purge_test_data(session: Session) -> dict:
    lots = select(Lot.id).where(Lot.is_test.is_(True))
    if session.scalar(select(func.count()).select_from(LedgerOutbox).where(LedgerOutbox.lot_id.in_(lots))):
        raise RuntimeError("doação de teste na fila do livro público: limpeza parada")
    accounts = select(Account.id).where(Account.is_test.is_(True))
    steps = [
        ("recommendations", delete(Recommendation).where(Recommendation.lot_id.in_(lots))),
        ("lot_outcomes", delete(LotOutcome).where(LotOutcome.lot_id.in_(lots))),
        ("lots", delete(Lot).where(Lot.is_test.is_(True))),
        ("donors", delete(Donor).where(Donor.is_test.is_(True))),
        ("consents", delete(Consent).where(Consent.account_id.in_(accounts))),
        ("audit_log", delete(AuditLog).where(AuditLog.is_test.is_(True))),
        ("account_deletions", delete(AccountDeletion).where(AccountDeletion.is_test.is_(True))),
        ("accounts", delete(Account).where(Account.is_test.is_(True))),
    ]
    counts = {}
    for name, stmt in steps:
        counts[name] = session.execute(stmt.execution_options(synchronize_session=False)).rowcount
    session.commit()
    return counts
