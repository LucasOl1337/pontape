"""Login por código de 6 dígitos no e-mail (OTP do Supabase Auth), chamado pela API.

O painel nunca fala com o Supabase: chama `POST /auth/code` e `POST /auth/verify` da API, que
usam a chave publicável (SUPABASE_PUBLISHABLE_KEY). O e-mail precisa do modelo com `{{ .Token }}`
no Supabase (Auth > Email Templates > Magic Link). Fonte: https://supabase.com/docs/guides/auth/auth-email-passwordless
(acesso 14/10/2026).
"""

from __future__ import annotations

import re

import httpx

from alimenta.core import config

TIMEOUT_S = 8
EMAIL = re.compile(r"^[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,}$")


class LoginUnavailable(Exception):
    """Supabase não configurado ou fora do ar (503)."""


class BadCode(Exception):
    """Código errado ou vencido (401)."""


def _headers() -> dict:
    key = config.supabase_publishable_key()
    if not config.supabase_url() or not key:
        raise LoginUnavailable("login indisponível: SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não configurado")
    return {"apikey": key, "Content-Type": "application/json"}


def send_code(email: str) -> None:
    """Pede o código. Resposta igual para e-mail com ou sem conta (o chamador não diz qual)."""
    headers = _headers()
    try:
        r = httpx.post(f"{config.supabase_url()}/auth/v1/otp", headers=headers, timeout=TIMEOUT_S,
                       json={"email": email, "create_user": True})
    except httpx.HTTPError as exc:
        raise LoginUnavailable("Supabase Auth não respondeu") from exc
    if r.status_code == 429:
        raise LoginUnavailable("limite de e-mails do Supabase atingido: tente mais tarde")
    if r.status_code >= 500:
        raise LoginUnavailable(f"Supabase Auth respondeu {r.status_code}")
    # 4xx que não seja 429 (ex.: e-mail recusado pelo SMTP padrão) não é revelado a quem pediu.


def verify_code(email: str, code: str) -> dict:
    headers = _headers()
    try:
        r = httpx.post(f"{config.supabase_url()}/auth/v1/verify", headers=headers, timeout=TIMEOUT_S,
                       json={"type": "email", "email": email, "token": code})
    except httpx.HTTPError as exc:
        raise LoginUnavailable("Supabase Auth não respondeu") from exc
    if r.status_code >= 500:
        raise LoginUnavailable(f"Supabase Auth respondeu {r.status_code}")
    if r.status_code != 200:
        raise BadCode("código errado ou vencido")
    data = r.json()
    return {"access_token": data["access_token"], "token_type": "bearer",
            "expires_in": data.get("expires_in"), "user": {"id": data["user"]["id"], "email": data["user"]["email"]}}
