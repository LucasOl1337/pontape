"""Configuração por variável de ambiente, lida a cada chamada (os testes trocam com monkeypatch).

Nenhuma função aqui devolve segredo para a resposta HTTP.
"""

from __future__ import annotations

import os


def env_true(name: str, default: str = "false") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "sim"}


def env_list(name: str) -> set[str]:
    """Lista separada por vírgula, normalizada para minúsculas e sem espaços."""
    return {item.strip().lower() for item in os.environ.get(name, "").split(",") if item.strip()}


def app_env() -> str:
    """`local` (compose e testes: seed de exemplo, /demo/reset, emissor de teste) ou `production` (padrão)."""
    return os.environ.get("ALIMENTA_ENV", "production").strip().lower()


def is_local() -> bool:
    return app_env() == "local"


def signup_open() -> bool:
    """Cadastro de doador e ONG de fora do time. Padrão fechado (D012)."""
    return env_true("ALIMENTA_SIGNUP_OPEN")


def operator_emails() -> set[str]:
    return env_list("ALIMENTA_OPERATOR_EMAILS")


def test_emails() -> set[str]:
    """Contas de teste do time: tudo o que criam sai com is_test=true."""
    return env_list("ALIMENTA_TEST_EMAILS")


def publish_real_ledger() -> bool:
    return env_true("ALIMENTA_PUBLISH_REAL_LEDGER")


def supabase_url() -> str:
    return os.environ.get("SUPABASE_URL", "").strip().rstrip("/")


def supabase_publishable_key() -> str:
    return os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()
