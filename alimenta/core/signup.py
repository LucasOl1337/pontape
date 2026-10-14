"""Cadastro de doador (CNPJ) e ONG (CNPJ + aprovação humana), com CEP e CNPJ pela BrasilAPI.

Regras (Q4, Q5): só CNPJ; só a cidade de São Paulo (IBGE 3550308). CNPJ com situação diferente
de ATIVA é recusado (422). BrasilAPI fora do ar não inventa nada: doador fica `pending` até o
operador liberar, ONG vai para revisão com `cnpj_check.status = "unavailable"`. A ONG sempre
nasce `pending` e só recebe oferta depois de aprovada por um operador.
Conta de teste (is_test) não consulta CNPJ: o ensaio usa CNPJ fictício com dígito válido.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from alimenta.core import accounts, docs
from alimenta.core.accounts import Actor
from alimenta.core.clock import utcnow
from alimenta.core.geo import SERVED_CITY_IBGE, nearest_region
from alimenta.core.service import Invalid, Unavailable, new_id
from alimenta.db.models import Donor, Ngo
from alimenta.geo import brasilapi

NONPROFIT_PREFIX = "3"  # natureza jurídica 3xx-x: entidades sem fins lucrativos (tabela da Receita)


def check_cnpj(number: str, is_test: bool, now: datetime) -> dict:
    """Snapshot do CNPJ para `cnpj_check`/`doc_check`. Levanta Invalid se a Receita diz que não está ativa."""
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
    code = str(data["codigo_natureza_juridica"] or "")
    status = "confere" if code.startswith(NONPROFIT_PREFIX) else "alerta"
    return {**base, "status": status, "situacao": data["situacao"], "codigo_natureza_juridica": code,
            "natureza_juridica": data["natureza_juridica"], "cnae_fiscal": data["cnae_fiscal"],
            "data_inicio_atividade": data["data_inicio_atividade"], "razao_social": data["razao_social"]}


def address(cep_raw: str, number: str, lat: float | None, lon: float | None) -> dict:
    try:
        cep = docs.clean_cep(cep_raw)
    except ValueError as exc:
        raise Invalid(str(exc)) from exc
    try:
        found = brasilapi.cep(cep)
    except brasilapi.NotFoundUpstream as exc:
        raise Invalid(f"CEP {cep} não encontrado") from exc
    except brasilapi.Unavailable as exc:
        raise Unavailable(f"não deu para conferir o CEP agora ({exc}); tente de novo em alguns minutos") from exc
    if found["ibge_city"] != SERVED_CITY_IBGE:
        raise Invalid("ainda não atendemos fora da cidade de São Paulo")
    if lat is not None and lon is not None:
        found.update(lat=lat, lon=lon, geo_source="informed")
    elif found["lat"] is None:
        raise Invalid("o CEP não trouxe coordenada: confirme o ponto no mapa (lat e lon)")
    found["number"] = number
    found["region"] = nearest_region(found["lat"], found["lon"])
    return found


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


def _phone(raw: str) -> str:
    try:
        return docs.clean_phone(raw)
    except ValueError as exc:
        raise Invalid(str(exc)) from exc


ADDRESS_FIELDS = ("cep", "street", "number", "district", "city", "uf", "geo_source", "lat", "lon", "region")


def register_donor(session: Session, actor: Actor, body: dict, now: datetime | None = None) -> Donor:
    now = now or utcnow()
    accounts.require_signup_allowed(actor)
    number, phone = _cnpj(body["cnpj"]), _phone(body["phone"])
    where = address(body["cep"], body["number"], body.get("lat"), body.get("lon"))
    _consents(session, actor, body, now)
    check = check_cnpj(number, actor.is_test, now)
    donor = Donor(id=new_id("D"), account_id=actor.account.id, name=body["trade_name"], kind=body["kind"],
                  legal_name=check.get("razao_social") or body.get("legal_name"), doc_type="cnpj",
                  doc_number=number, doc_check=check, contact_name=body["contact_name"], phone=phone,
                  pickup_hours=body["pickup_hours"], created_at=now, is_test=actor.is_test,
                  status="active" if check["status"] in ("confere", "alerta", "skipped_test") else "pending",
                  **{k: where[k] for k in ADDRESS_FIELDS})
    session.add(donor)
    actor.account.role, actor.account.org_id = "donor", donor.id
    accounts.audit(session, actor.email, "donor_signup", donor.id, check["status"], actor.is_test, now)
    session.commit()
    return donor


def register_ngo(session: Session, actor: Actor, body: dict, now: datetime | None = None) -> Ngo:
    now = now or utcnow()
    accounts.require_signup_allowed(actor)
    number, phone = _cnpj(body["cnpj"]), _phone(body["phone"])
    where = address(body["cep"], body["number"], body.get("lat"), body.get("lon"))
    _consents(session, actor, body, now)
    check = check_cnpj(number, actor.is_test, now)
    ngo = Ngo(id=new_id("N"), account_id=actor.account.id, name=body["name"], cnpj=number, cnpj_check=check,
              legal_name=check.get("razao_social") or body.get("legal_name"), contact_name=body["contact_name"],
              phone=phone, accepted_categories=body["accepted_categories"], daily_capacity_kg=body["daily_capacity_kg"],
              window=body["receive_window"], accepts_refrigerated=body["accepts_refrigerated"],
              accepts_frozen=body["accepts_frozen"], pickup_radius_km=body["pickup_radius_km"],
              approval_status="pending", created_at=now, is_test=actor.is_test,
              **{k: where[k] for k in ADDRESS_FIELDS})
    session.add(ngo)
    actor.account.role, actor.account.org_id = "ngo", ngo.id
    accounts.audit(session, actor.email, "ngo_signup", ngo.id, check["status"], actor.is_test, now)
    session.commit()
    return ngo
