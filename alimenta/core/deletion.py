"""Apagar minha conta (DELETE /me), conforme o aviso de privacidade v2.

O que acontece:
1. Doações abertas são canceladas (o livro recebe `donation_cancelled`, para não ficar doação pendurada).
2. Saem da base: e-mail (a linha de `accounts`), aceites, CNPJ e o snapshot da Receita, cidade e UF
   do cadastro e das doações, as recomendações. No registro de auditoria o e-mail vira "conta apagada".
3. Ficam: as doações sem dono identificável (categoria, kg, datas, distribuidor) e o livro público,
   que nunca teve dado pessoal (só `donationRef`).
4. O usuário do Supabase Auth (onde mora o e-mail do login) é apagado pela API de administração
   com SUPABASE_SECRET_KEY. Sem a chave, o pedido fica `pending` em `account_deletions` e a
   varredura tenta de novo quando a chave existir; o operador vê em /ops/overview.
Conta de teste em ambiente local não chama o Supabase (`skipped_local`).
O `sub` apagado não volta a entrar: a próxima chamada com o mesmo token dá 403.
"""

from __future__ import annotations

from datetime import datetime

import httpx
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from alimenta.core import config, donations
from alimenta.core.accounts import Actor
from alimenta.core.clock import utcnow
from alimenta.db.models import Account, AccountDeletion, AuditLog, Consent, Donor, Lot, Recommendation

TIMEOUT_S = 10
MAX_ATTEMPTS = 10
TRANSPORT: httpx.BaseTransport | None = None  # testes trocam por httpx.MockTransport
CLIENT = httpx.Client  # referência própria (o teste do ensaio troca httpx.Client)


def delete_auth_user(sub: str) -> str:
    """Apaga o usuário no Supabase Auth. Devolve deleted | pending | failed."""
    key = config.supabase_secret_key()
    if not key or not config.supabase_url():
        return "pending"
    try:
        with CLIENT(timeout=TIMEOUT_S, transport=TRANSPORT) as http:
            r = http.delete(f"{config.supabase_url()}/auth/v1/admin/users/{sub}",
                            headers={"apikey": key, "Authorization": f"Bearer {key}"})
    except httpx.HTTPError:
        return "failed"
    return "deleted" if r.status_code in (200, 204, 404) else "failed"


def erase(session: Session, who: Actor, now: datetime | None = None) -> dict:
    now = now or utcnow()
    account = who.account
    donor = session.scalar(select(Donor).where(Donor.account_id == account.id))
    cancelled = 0
    if donor is not None:
        for lot in session.scalars(select(Lot).where(Lot.donor_id == donor.id, Lot.status.in_(donations.OPEN))).all():
            donations.cancel(session, lot, now)
            cancelled += 1
        lots = select(Lot.id).where(Lot.donor_id == donor.id)
        session.execute(delete(Recommendation).where(Recommendation.lot_id.in_(lots)))
        session.execute(update(Lot).where(Lot.donor_id == donor.id).values(city=None, uf=None, created_by=None))
        donor.account_id, donor.city, donor.uf, donor.doc_number, donor.doc_check = None, None, None, None, None
        donor.legal_name, donor.status = None, "deleted"
    session.execute(update(AuditLog).where(AuditLog.actor == account.email).values(actor="conta apagada"))
    session.execute(delete(Consent).where(Consent.account_id == account.id))
    local_test = config.is_local() and account.is_test
    status = "skipped_local" if local_test else delete_auth_user(account.id)
    row = AccountDeletion(account_sub=account.id, requested_at=now, supabase_status=status, attempts=0 if local_test else 1,
                          done_at=now if status in ("deleted", "skipped_local") else None, is_test=account.is_test)
    session.add(row)
    session.delete(account)
    session.commit()
    return {"deleted": True, "cancelled_open_donations": cancelled, "login_erased": status in ("deleted", "skipped_local"),
            "supabase": status}


def retry_pending(session: Session, now: datetime | None = None) -> dict:
    """Varredura: tenta de novo apagar no Supabase os pedidos pendentes."""
    now = now or utcnow()
    rows = session.scalars(select(AccountDeletion).where(AccountDeletion.supabase_status.in_(("pending", "failed")),
                                                         AccountDeletion.attempts < MAX_ATTEMPTS)).all()
    done = 0
    if config.supabase_secret_key():
        for row in rows:
            row.attempts += 1
            row.supabase_status = delete_auth_user(row.account_sub)
            if row.supabase_status == "deleted":
                row.done_at = now
                done += 1
    session.commit()
    return {"pending": len(rows) - done, "deleted": done}


def is_erased(session: Session, sub: str) -> bool:
    return session.scalar(select(AccountDeletion.id).where(AccountDeletion.account_sub == sub).limit(1)) is not None
