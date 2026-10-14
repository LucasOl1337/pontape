"""Dependências da API: sessão do banco, quem chama (JWT) e papel exigido. Negar por padrão.

- `actor`: exige `Authorization: Bearer <JWT do Supabase>` válido (401) e devolve a conta.
- `role("donor")` etc.: 403 para qualquer outro papel. Operador vem só de ALIMENTA_OPERATOR_EMAILS.
- `ops_token`: só em POST /ops/sweep, com `X-Alimenta-Ops-Token` = ALIMENTA_OPS_TOKEN.
"""

from __future__ import annotations

import hmac
import os
from collections.abc import Iterator

from fastapi import Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from alimenta.auth import jwt as auth_jwt
from alimenta.core import accounts
from alimenta.core.accounts import Actor


def db(request: Request) -> Iterator[Session]:
    with request.app.state.sessions() as session:
        yield session


def bearer(authorization: str | None = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "faça login: cabeçalho Authorization: Bearer ausente",
                            headers={"WWW-Authenticate": "Bearer"})
    return authorization[7:].strip()


def actor(token: str = Depends(bearer), session: Session = Depends(db)) -> Actor:
    try:
        claims = auth_jwt.verify(token)
    except auth_jwt.AuthError as exc:
        raise HTTPException(401, str(exc), headers={"WWW-Authenticate": "Bearer"}) from exc
    return accounts.resolve(session, claims.sub, claims.email)


def role(*allowed: str):
    def check(who: Actor = Depends(actor)) -> Actor:
        if who.role not in allowed:
            raise HTTPException(403, f"rota só para {' ou '.join(allowed)}; esta conta é {who.role or 'sem cadastro'}")
        return who
    return check


def ops_token(x_alimenta_ops_token: str | None = Header(default=None)) -> None:
    expected = os.environ.get("ALIMENTA_OPS_TOKEN", "")
    if not expected:
        raise HTTPException(503, "varredura desligada: ALIMENTA_OPS_TOKEN não configurado")
    if not x_alimenta_ops_token or not hmac.compare_digest(x_alimenta_ops_token.encode(), expected.encode()):
        raise HTTPException(401, "token de automação ausente ou inválido")
