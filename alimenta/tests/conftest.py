"""Fixtures do corte r6 (só doador): SQLite temporário, ALIMENTA_ENV=local, BrasilAPI falsa,
9Router falso, páginas-fonte falsas e GitHub falso. Nenhum teste fala com a rede.

O login usa o emissor local (alimenta.auth.dev). O caminho do Supabase (JWKS) é testado em
test_auth.py com um par ES256 gerado no teste.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from alimenta.api.main import create_app
from alimenta.auth import dev
from alimenta.core import deletion, docs, recommend
from alimenta.db.seed import create_schema
from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.geo import brasilapi
from alimenta.ledger import outbox

OPERATOR = "operador@teste.alimenta"
TEST_DOMAIN = "@teste.alimenta"
REAL = "pessoa@empresa-real.com.br"  # fora da lista de teste
OPS = "ops-token-de-teste"
TERMS, PRIVACY = "termo-de-doacao-v2", "aviso-de-privacidade-v2"
AI_BASE = "http://9router.falso/v1"
CNPJ_EMPRESA = docs.cnpj_with_dv("445556660001")
CNPJ_BAIXADA = docs.cnpj_with_dv("778889990001")
CNPJS = {
    CNPJ_EMPRESA: {"razao_social": "MERCADO EXEMPLO LTDA", "nome_fantasia": "MERCADO", "descricao_situacao_cadastral": "ATIVA",
                   "codigo_natureza_juridica": 2062, "natureza_juridica": "Sociedade Empresária Limitada",
                   "cnae_fiscal": 4711302, "data_inicio_atividade": "2001-05-02", "codigo_municipio_ibge": 3550308,
                   "uf": "SP", "qsa": [{"nome_socio": "PESSOA QUE NUNCA PODE SER GUARDADA"}]},
    CNPJ_BAIXADA: {"razao_social": "BAIXADA", "descricao_situacao_cadastral": "BAIXADA", "codigo_natureza_juridica": 3999},
}


def in_hours(hours: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


class FakeBrasilApi:
    def __init__(self):
        self.calls: list[str] = []
        self.down = False

    def __call__(self, path: str) -> dict:
        self.calls.append(path)
        if self.down:
            raise brasilapi.Unavailable("BrasilAPI não respondeu: ConnectTimeout")
        key = path.rsplit("/", 1)[1]
        if key not in CNPJS:
            raise brasilapi.NotFoundUpstream(path)
        return CNPJS[key]


class FakeNet:
    """Rede falsa: 9Router (/v1/chat/completions, /v1/search), páginas-fonte, GitHub e Supabase admin.

    `ai` é a lista de respostas do 9Router, consumida em ordem (dict = corpo JSON 200, int = status,
    Exception = erro de rede). `pages[url]` = (status, corpo, cabeçalhos). Cada pedido fica em `log`.
    """

    def __init__(self):
        self.ai: list = []
        self.search: dict = {"results": []}
        self.pages: dict[str, tuple] = {}
        self.dispatch_status = 204
        self.intake: dict = {"keys": []}
        self.ledger: dict = {"events": []}
        self.supabase_status = 204
        self.log: list[tuple[str, str]] = []
        self.bodies: list[dict] = []

    def answer(self, ranking: list[dict] | str) -> dict:
        content = ranking if isinstance(ranking, str) else json.dumps({"ranking": ranking}, ensure_ascii=False)
        return {"choices": [{"message": {"role": "assistant", "content": content}}]}

    def __call__(self, request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        self.log.append((request.method, url))
        if url.startswith(AI_BASE + "/chat/completions"):
            self.bodies.append(json.loads(request.content))
            item = self.ai.pop(0) if self.ai else 500
            if isinstance(item, Exception):
                raise item
            return httpx.Response(item) if isinstance(item, int) else httpx.Response(200, json=item)
        if url.startswith(AI_BASE + "/search"):
            return httpx.Response(200, json=self.search)
        if url.startswith("https://api.github.com/"):
            self.bodies.append(json.loads(request.content))
            return httpx.Response(self.dispatch_status)
        if url.endswith("/main/src/data/ledger/intake.json"):
            return httpx.Response(200, json=self.intake)
        if url.endswith("/main/src/data/ledger/ledger.json"):
            return httpx.Response(200, json=self.ledger)
        if "/auth/v1/admin/users/" in url:
            return httpx.Response(self.supabase_status)
        status, body, headers = self.pages.get(url, (404, "", {}))
        if isinstance(body, Exception):
            raise body
        return httpx.Response(status, content=body.encode() if isinstance(body, str) else body, headers=headers)


@pytest.fixture(autouse=True)
def local_env(monkeypatch):
    monkeypatch.setenv("ALIMENTA_ENV", "local")
    monkeypatch.setenv("ALIMENTA_TEST_EMAILS", TEST_DOMAIN)
    monkeypatch.setenv("ALIMENTA_OPERATOR_EMAILS", OPERATOR)
    monkeypatch.setenv("ALIMENTA_OPS_TOKEN", OPS)
    monkeypatch.setenv("SUPABASE_URL", "https://exemplo.supabase.co")
    monkeypatch.setenv("ALIMENTA_AI_BASE_URL", AI_BASE)
    monkeypatch.setenv("ALIMENTA_AI_KEY", "chave-falsa-de-teste")
    for name in ("ALIMENTA_SIGNUP_OPEN", "ALIMENTA_PUBLISH_REAL_LEDGER", "ALIMENTA_LEDGER_DISPATCH_TOKEN",
                 "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "ALIMENTA_AI_MODEL", "ALIMENTA_AI_FALLBACK_MODEL",
                 "ALIMENTA_AI_WEB_SEARCH", "ALIMENTA_CATALOG_PATH", "ALIMENTA_GITHUB_REPO"):
        monkeypatch.delenv(name, raising=False)


@pytest.fixture(autouse=True)
def fake_brasilapi(monkeypatch):
    fake = FakeBrasilApi()
    monkeypatch.setattr(brasilapi, "_fetch", fake)
    monkeypatch.setattr(brasilapi, "_cache", {})
    return fake


@pytest.fixture(autouse=True)
def net(monkeypatch):
    fake = FakeNet()
    transport = httpx.MockTransport(fake)
    for module in (recommend, outbox, deletion):
        monkeypatch.setattr(module, "TRANSPORT", transport)
    return fake


@pytest.fixture()
def engine(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'alimenta-test.db'}")
    create_schema(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def sessions(engine):
    return make_sessionmaker(engine)


@pytest.fixture()
def api(engine):
    """API vazia (como a produção começa), com o catálogo real sincronizado."""
    with TestClient(create_app(engine)) as c:
        yield c


def h(email: str) -> dict:
    return {"Authorization": f"Bearer {dev.mint(email)['access_token']}"}


def donor_body(**extra) -> dict:
    return {"kind": "company", "city": "São Paulo", "uf": "SP", "donation_terms_version": TERMS,
            "privacy_notice_version": PRIVACY, **extra}


def donation_body(**extra) -> dict:
    return {"category": "bakery", "storage": "ambient", "kg": 12.5, "expires_at": in_hours(30), "city": "São Paulo",
            "uf": "SP", **extra}


def make_donor(api, email: str, **extra) -> dict:
    r = api.post("/donors", json=donor_body(**extra), headers=h(email))
    assert r.status_code == 201, r.text
    return r.json()


@pytest.fixture()
def donor(api):
    """Doador de teste (empresa em São Paulo) e o cabeçalho de login dele."""
    email = f"doador{TEST_DOMAIN}"
    return {"donor": make_donor(api, email), "h": h(email), "email": email}


@pytest.fixture()
def real_donor(api, monkeypatch):
    """Doador real (cadastro aberto): as ações dele entram na fila do livro público."""
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    return {"donor": make_donor(api, REAL, kind="person"), "h": h(REAL), "email": REAL}
