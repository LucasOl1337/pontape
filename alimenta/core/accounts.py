"""Contas, papéis, consentimentos, cadastro de doador e ONG, aprovação e auditoria.

- Operador: e-mail em ALIMENTA_OPERATOR_EMAILS. Nunca por cadastro.
- Conta de teste: e-mail em ALIMENTA_TEST_EMAILS (aceita `@dominio` para o domínio inteiro).
  Tudo o que ela cria sai com is_test=true.
- Cadastro de fora do time só com ALIMENTA_SIGNUP_OPEN=true (D012). Contas de teste passam sempre.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.core import config
from alimenta.core.clock import utcnow
from alimenta.core.service import Conflict, Forbidden
from alimenta.db.models import Account, AuditLog, Consent, Donor, Ngo

DONATION_TERMS = "termo-de-doacao-v1"
PRIVACY_NOTICE = "aviso-de-privacidade-v1"
CURRENT = {"donation_terms": DONATION_TERMS, "privacy_notice": PRIVACY_NOTICE}
LEGAL_PATHS = {"donation_terms": "alimenta/legal/termo-de-doacao-v1.md",
               "privacy_notice": "alimenta/legal/aviso-de-privacidade-v1.md"}


@dataclass
class Actor:
    account: Account
    role: str | None  # donor | ngo | operator | None (conta sem cadastro ainda)

    @property
    def email(self) -> str:
        return self.account.email

    @property
    def is_test(self) -> bool:
        return self.account.is_test


def is_test_email(email: str) -> bool:
    email = email.lower()
    for entry in config.test_emails():
        if entry == email or (entry.startswith("@") and email.endswith(entry)):
            return True
    return False


def resolve(session: Session, sub: str, email: str, now: datetime | None = None) -> Actor:
    """Conta do `sub` (cria na primeira chamada). Papel de operador vem só da env."""
    now = now or utcnow()
    account = session.get(Account, sub)
    if account is None:
        if session.scalar(select(Account).where(Account.email == email)) is not None:
            raise Conflict("este e-mail já tem outra conta")
        account = Account(id=sub, email=email, is_test=is_test_email(email), created_at=now)
        session.add(account)
        session.commit()
    if account.disabled_at is not None:
        raise Forbidden("conta desativada")
    role = "operator" if email in config.operator_emails() else account.role
    return Actor(account=account, role=role)


def audit(session: Session, actor: str, action: str, target: str, note: str | None = None,
          is_test: bool = False, now: datetime | None = None) -> None:
    session.add(AuditLog(actor=actor, action=action, target=target, note=note, at=now or utcnow(), is_test=is_test))


def accept(session: Session, actor: Actor, kind: str, version: str, now: datetime | None = None) -> Consent:
    from alimenta.core.service import Invalid

    if kind not in CURRENT:
        raise Invalid(f"tipo de aceite desconhecido: {kind}")
    if version != CURRENT[kind]:
        raise Invalid(f"versão {version} não é a atual ({CURRENT[kind]})")
    row = Consent(account_id=actor.account.id, kind=kind, version=version, accepted_at=now or utcnow())
    session.add(row)
    return row


def consents_of(session: Session, account_id: str) -> list[dict]:
    rows = session.scalars(select(Consent).where(Consent.account_id == account_id).order_by(Consent.id)).all()
    return [{"kind": r.kind, "version": r.version, "accepted_at": r.accepted_at.isoformat()} for r in rows]


def org_of(session: Session, actor: Actor):
    if actor.role == "donor":
        return session.scalar(select(Donor).where(Donor.account_id == actor.account.id))
    if actor.role == "ngo":
        return session.scalar(select(Ngo).where(Ngo.account_id == actor.account.id))
    return None


def require_signup_allowed(actor: Actor) -> None:
    if actor.role == "operator":
        raise Forbidden("operador não se cadastra como doador ou ONG")
    if actor.role is not None:
        raise Conflict(f"esta conta já é {actor.role}: uma conta, um papel")
    if not config.signup_open() and not actor.is_test:
        raise Forbidden("cadastro fechado: os textos legais ainda são rascunho (ALIMENTA_SIGNUP_OPEN=false)")
