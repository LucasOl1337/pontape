"""Cadastro mínimo de doador (r6): tipo, cidade e UF; CNPJ opcional para empresa e distribuidor.

Sem CPF, endereço, telefone ou nome. O e-mail já está na conta (login por código).
CNPJ, quando vem, precisa ter dígito válido; a situação na Receita é consultada pela BrasilAPI e
fica em `doc_check` (privado). BrasilAPI fora do ar não bloqueia: o cadastro entra com
`status: "unavailable"` no snapshot. CNPJ com situação diferente de ATIVA é recusado (422).
Distribuidor pode dizer qual registro do catálogo ele é (`distributor_id`); a recomendação não
sugere que ele doe para si mesmo. Conta de teste não consulta CNPJ.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from alimenta.core import accounts, catalog, docs
from alimenta.core.accounts import Actor
from alimenta.core.clock import utcnow
from alimenta.core.service import Invalid, new_id
from alimenta.db.models import Donor
from alimenta.geo import brasilapi


def check_cnpj(number: str, is_test: bool, now: datetime) -> dict:
    """Snapshot do CNPJ para `doc_check`. Levanta Invalid se a Receita diz que não está ativa."""
    base = {"fonte": "brasilapi", "checked_at": now.isoformat()}
    if is_test:
        return {**base, "fonte": "nenhuma", "status": "skipped_test"}
    try:
        data = brasilapi.cnpj(number)
    except brasilapi.NotFoundUpstream:
        return {**base, "status": "not_found"}
    except brasilapi.Unavailable as exc:
        return {**base, "status": "unavailable", "erro": str(exc)}
    if data["situacao"] != "ATIVA":
        raise Invalid(f"CNPJ com situação cadastral {data['situacao'] or 'desconhecida'}: só CNPJ ativo")
    return {**base, "status": "confere", "situacao": data["situacao"], "razao_social": data["razao_social"],
            "cnae_fiscal": data["cnae_fiscal"]}


def _consents(session: Session, actor: Actor, body: dict, now: datetime) -> None:
    for kind in ("donation_terms", "privacy_notice"):
        version = body.get(f"{kind}_version")
        if version != accounts.CURRENT[kind]:
            raise Invalid(f"aceite {kind} na versão {accounts.CURRENT[kind]} é obrigatório")
        accounts.accept(session, actor, kind, version, now)


def _cnpj(raw: str) -> str:
    number = docs.clean_cnpj(raw)
    if not docs.cnpj_valid(number):
        raise Invalid("CNPJ inválido (dígito verificador não confere)")
    return number


def register_donor(session: Session, actor: Actor, body: dict, now: datetime | None = None) -> Donor:
    now = now or utcnow()
    accounts.require_signup_allowed(actor)
    kind, uf = body["kind"], body["uf"].upper()
    if uf not in catalog.UFS:
        raise Invalid("UF inválida")
    if kind == "person" and body.get("cnpj"):
        raise Invalid("pessoa não informa CNPJ")
    if body.get("distributor_id") and (kind != "distributor" or catalog.by_id(body["distributor_id"]) is None):
        raise Invalid("distributor_id só para distribuidor e só do catálogo")
    number = _cnpj(body["cnpj"]) if body.get("cnpj") else None
    _consents(session, actor, body, now)
    check = check_cnpj(number, actor.is_test, now) if number else None
    donor = Donor(id=new_id("D"), account_id=actor.account.id, name=None, kind=kind, region=None, lat=None, lon=None,
                  city=" ".join(body["city"].split()), uf=uf, doc_type="cnpj" if number else "none",
                  doc_number=number, doc_check=check, legal_name=(check or {}).get("razao_social"),
                  distributor_id=body.get("distributor_id"), created_at=now, is_test=actor.is_test, status="active")
    session.add(donor)
    actor.account.role, actor.account.org_id = "donor", donor.id
    accounts.audit(session, actor.email, "donor_signup", donor.id, (check or {}).get("status", "sem_cnpj"),
                   actor.is_test, now)
    session.commit()
    return donor
