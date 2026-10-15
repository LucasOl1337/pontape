"""Conta: login por código de e-mail, quem sou eu, aceites e apagar a conta."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from alimenta.api import schemas
from alimenta.api.deps import actor, db
from alimenta.auth import dev, supabase
from alimenta.core import accounts, config, deletion
from alimenta.core.accounts import Actor

router = APIRouter()
SENT = {"sent": True, "message": "Se o e-mail puder entrar, o código chega em alguns minutos."}


@router.post("/auth/code", tags=["conta"], summary="Envia o código de 6 dígitos (resposta igual com ou sem conta)")
def auth_code(body: schemas.CodeIn):
    email = body.email.strip().lower()
    if config.is_local() and accounts.is_test_email(email):
        return SENT  # local: conta de teste entra por /auth/verify com o emissor local
    try:
        supabase.send_code(email)
    except supabase.LoginUnavailable as exc:
        raise HTTPException(503, str(exc)) from exc
    return SENT


@router.post("/auth/verify", tags=["conta"], summary="Troca o código pela sessão (JWT)")
def auth_verify(body: schemas.VerifyIn):
    email = body.email.strip().lower()
    if config.is_local() and accounts.is_test_email(email):
        return dev.mint(email)
    try:
        return supabase.verify_code(email, body.code)
    except supabase.BadCode as exc:
        raise HTTPException(401, str(exc)) from exc
    except supabase.LoginUnavailable as exc:
        raise HTTPException(503, str(exc)) from exc


@router.get("/me", tags=["conta"])
def me(who: Actor = Depends(actor), session: Session = Depends(db)):
    org = accounts.org_of(session, who)
    return {"id": who.account.id, "email": who.email, "role": who.role, "org_id": org.id if org else None,
            "org_status": org.status if org else None, "donor_kind": org.kind if org else None, "is_test": who.is_test, "signup_open": config.signup_open() or who.is_test,
            "consents": accounts.consents_of(session, who.account.id), "current_versions": accounts.CURRENT}


@router.post("/me/consents", tags=["conta"], status_code=201, summary="Aceita uma versão do termo ou do aviso")
def me_consents(body: schemas.ConsentIn, who: Actor = Depends(actor), session: Session = Depends(db)):
    row = accounts.accept(session, who, body.kind, body.version)
    session.commit()
    return {"kind": row.kind, "version": row.version, "accepted_at": row.accepted_at.isoformat()}


@router.delete("/me", tags=["conta"], summary="Apaga a conta: e-mail, CNPJ, cidade e login. O livro público fica")
def delete_me(who: Actor = Depends(actor), session: Session = Depends(db)):
    if who.role == "operator":
        raise HTTPException(403, "conta de operador sai pela env ALIMENTA_OPERATOR_EMAILS, não por aqui")
    return deletion.erase(session, who)
