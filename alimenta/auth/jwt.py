"""Validação do JWT do Supabase Auth no FastAPI.

Chave pública do JWKS do projeto (`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`), algoritmos
assimétricos (ES256/RS256), conferindo `iss = <SUPABASE_URL>/auth/v1`, `aud = authenticated`,
`exp` e `sub`. Fontes: https://supabase.com/docs/guides/auth/jwts (acesso 14/10/2026).

Com ALIMENTA_ENV=local existe também um emissor de teste (`alimenta.auth.dev`), com chave gerada
na memória do processo. Em produção ele não existe e token assinado por ele dá 401.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

import jwt
from jwt import PyJWKClient

from alimenta.core import config

ALGORITHMS = ["ES256", "RS256"]
AUDIENCE = "authenticated"
JWKS_TTL_S = 600


class AuthError(Exception):
    """Token ausente, vencido, de outro emissor ou com assinatura que não confere (401)."""


@dataclass(frozen=True)
class Claims:
    sub: str
    email: str


_clients: dict[str, tuple[float, PyJWKClient]] = {}


def issuer() -> str:
    return f"{config.supabase_url()}/auth/v1"


def jwks_client() -> PyJWKClient:
    """Um cliente por URL, renovado a cada 10 min (o edge do Supabase também guarda 10 min)."""
    url = f"{issuer()}/.well-known/jwks.json"
    cached = _clients.get(url)
    if cached and cached[0] > time.monotonic():
        return cached[1]
    client = PyJWKClient(url, cache_keys=True, lifespan=JWKS_TTL_S, timeout=5)
    _clients[url] = (time.monotonic() + JWKS_TTL_S, client)
    return client


def signing_key(token: str):
    from alimenta.auth import dev  # import tardio: o emissor de teste só vale com ALIMENTA_ENV=local

    if config.is_local() and dev.owns(token):
        return dev.public_key(), dev.ISSUER
    if not config.supabase_url():
        raise AuthError("login indisponível: SUPABASE_URL não configurado")
    try:
        return jwks_client().get_signing_key_from_jwt(token).key, issuer()
    except jwt.PyJWKClientError as exc:
        raise AuthError("não deu para conferir a assinatura do token") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError("token malformado") from exc


def verify(token: str) -> Claims:
    if not token:
        raise AuthError("faça login: token ausente")
    key, iss = signing_key(token)
    try:
        data = jwt.decode(token, key, algorithms=ALGORITHMS, audience=AUDIENCE, issuer=iss,
                          options={"require": ["exp", "sub", "aud", "iss"]})
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("sessão vencida: entre de novo") from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError("token inválido") from exc
    email = str(data.get("email") or "").strip().lower()
    if not email:
        raise AuthError("token sem e-mail")
    return Claims(sub=str(data["sub"]), email=email)
