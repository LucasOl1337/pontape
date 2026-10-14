"""Emissor de JWT de teste, só com ALIMENTA_ENV=local (compose, testes e ensaio local).

A chave ES256 nasce na memória do processo a cada subida e nunca é gravada. O `iss` é próprio
(`alimenta-local`), então um token deste emissor nunca passa como token do Supabase.
"""

from __future__ import annotations

import time
import uuid
from functools import lru_cache

import jwt
from cryptography.hazmat.primitives.asymmetric import ec

TOKEN_TYPE = "bearer"  # nosec B105 - tipo do token (RFC 6750), não é segredo

ISSUER = "alimenta-local"
KID = "alimenta-local-1"


@lru_cache(maxsize=1)
def _private_key():
    return ec.generate_private_key(ec.SECP256R1())


def public_key():
    return _private_key().public_key()


def owns(token: str) -> bool:
    try:
        return jwt.get_unverified_header(token).get("kid") == KID
    except jwt.InvalidTokenError:
        return False


def mint(email: str, sub: str | None = None, ttl_s: int = 3600) -> dict:
    now = int(time.time())
    sub = sub or str(uuid.uuid5(uuid.NAMESPACE_URL, f"alimenta-local:{email.lower()}"))
    claims = {"sub": sub, "email": email.lower(), "aud": "authenticated", "iss": ISSUER,
              "iat": now, "exp": now + ttl_s, "role": "authenticated"}
    token = jwt.encode(claims, _private_key(), algorithm="ES256", headers={"kid": KID})
    return {"access_token": token, "token_type": TOKEN_TYPE, "expires_in": ttl_s, "user": {"id": sub, "email": email.lower()}}
