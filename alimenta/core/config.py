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
    """`local` (compose, ensaio e testes: emissor de login de teste) ou `production` (padrão)."""
    return os.environ.get("ALIMENTA_ENV", "production").strip().lower()


def is_local() -> bool:
    return app_env() == "local"


def signup_open() -> bool:
    """Cadastro de doador de fora do time. Padrão fechado; o regente liga quando o SMTP próprio estiver no ar."""
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


def supabase_secret_key() -> str:
    """Chave secreta (sb_secret_*) só para apagar o usuário no Auth (DELETE /me). Vazia: o pedido fica pendente."""
    return os.environ.get("SUPABASE_SECRET_KEY", "").strip()


def ai_base_url() -> str:
    """Base OpenAI-compatível do 9Router. Aceita com ou sem /v1 no fim."""
    url = os.environ.get("ALIMENTA_AI_BASE_URL", "").strip().rstrip("/")
    if url and not url.endswith("/v1"):
        url += "/v1"
    return url


def ai_key() -> str:
    return os.environ.get("ALIMENTA_AI_KEY", "").strip()


def ai_models() -> list[str]:
    """Modelo principal e reserva, nesta ordem, sem repetir."""
    main = os.environ.get("ALIMENTA_AI_MODEL", "").strip() or "cc/claude-haiku-4-5-20251001"
    spare = os.environ.get("ALIMENTA_AI_FALLBACK_MODEL", "").strip() or "cx/gpt-5.6-luna"
    return [main] if spare == main else [main, spare]


def ai_web_search() -> bool:
    """Busca web aberta pelo 9Router /v1/search. Desligada até existir provedor de busca no 9Router."""
    return env_true("ALIMENTA_AI_WEB_SEARCH")


def ai_search_model() -> str:
    return os.environ.get("ALIMENTA_AI_SEARCH_MODEL", "").strip() or "tavily"


def github_repo() -> str:
    return os.environ.get("ALIMENTA_GITHUB_REPO", "").strip() or "LucasOl1337/pontape"


def ledger_dispatch_token() -> str:
    return os.environ.get("ALIMENTA_LEDGER_DISPATCH_TOKEN", "").strip()
