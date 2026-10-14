"""Fixtures do corte real: banco SQLite temporário, ALIMENTA_ENV=local, BrasilAPI falsa e contas por e-mail.

Nenhum teste fala com a rede: a BrasilAPI é trocada por respostas fixas e o login usa o
emissor local (alimenta.auth.dev). O caminho do Supabase (JWKS) é testado em test_auth.py
com um par ES256 gerado no teste.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from alimenta.api.main import create_app
from alimenta.auth import dev
from alimenta.core import docs
from alimenta.db.seed import create_schema, seed
from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.geo import brasilapi

OPERATOR = "operador@teste.alimenta"
TEST_DOMAIN = "@teste.alimenta"
OPS = "ops-token-de-teste"
TERMS, PRIVACY = "termo-de-doacao-v1", "aviso-de-privacidade-v1"

# Respostas fixas no formato da BrasilAPI (campos conferidos numa chamada real em 14/10/2026).
CEPS = {
    "01310100": {"cep": "01310100", "state": "SP", "city": "São Paulo", "neighborhood": "Bela Vista",
                 "street": "Avenida Paulista", "service": "open-cep", "ibge": {"city": "3550308", "state": "35"},
                 "location": {"type": "Point", "coordinates": {"longitude": "-46.6553299", "latitude": "-23.5617698"}}},
    "01001000": {"cep": "01001000", "state": "SP", "city": "São Paulo", "neighborhood": "Sé", "street": "Praça da Sé",
                 "service": "open-cep", "ibge": {"city": "3550308", "state": "35"},
                 "location": {"type": "Point", "coordinates": {"longitude": "-46.6339", "latitude": "-23.5503"}}},
    "04001000": {"cep": "04001000", "state": "SP", "city": "São Paulo", "neighborhood": "Paraíso", "street": "Rua X",
                 "service": "viacep", "ibge": {"city": "3550308", "state": "35"}, "location": {"coordinates": {}}},
    "13010000": {"cep": "13010000", "state": "SP", "city": "Campinas", "neighborhood": "Centro", "street": "Rua Y",
                 "service": "open-cep", "ibge": {"city": "3509502", "state": "35"},
                 "location": {"coordinates": {"longitude": "-47.06", "latitude": "-22.90"}}},
}
CNPJ_ONG = docs.cnpj_with_dv("112223330001")
CNPJ_EMPRESA = docs.cnpj_with_dv("445556660001")
CNPJ_BAIXADA = docs.cnpj_with_dv("778889990001")
CNPJS = {
    CNPJ_ONG: {"razao_social": "ASSOCIACAO EXEMPLO", "nome_fantasia": "", "descricao_situacao_cadastral": "ATIVA",
               "codigo_natureza_juridica": 3999, "natureza_juridica": "Associação Privada", "cnae_fiscal": 8800600,
               "data_inicio_atividade": "2010-01-01", "codigo_municipio_ibge": 3550308, "uf": "SP",
               "qsa": [{"nome_socio": "PESSOA QUE NUNCA PODE SER GUARDADA"}]},
    CNPJ_EMPRESA: {"razao_social": "MERCADO EXEMPLO LTDA", "nome_fantasia": "MERCADO", "descricao_situacao_cadastral": "ATIVA",
                   "codigo_natureza_juridica": 2062, "natureza_juridica": "Sociedade Empresária Limitada",
                   "cnae_fiscal": 4711302, "data_inicio_atividade": "2001-05-02", "codigo_municipio_ibge": 3550308, "uf": "SP"},
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
        kind, key = path.split("/")[1], path.rsplit("/", 1)[1]
        table = CEPS if kind == "cep" else CNPJS
        if key not in table:
            raise brasilapi.NotFoundUpstream(path)
        return table[key]


@pytest.fixture(autouse=True)
def local_env(monkeypatch):
    monkeypatch.setenv("ALIMENTA_ENV", "local")
    monkeypatch.setenv("ALIMENTA_TEST_EMAILS", TEST_DOMAIN)
    monkeypatch.setenv("ALIMENTA_OPERATOR_EMAILS", OPERATOR)
    monkeypatch.setenv("ALIMENTA_OPS_TOKEN", OPS)
    monkeypatch.setenv("SUPABASE_URL", "https://exemplo.supabase.co")
    for name in ("ALIMENTA_SIGNUP_OPEN", "ALIMENTA_PUBLISH_REAL_LEDGER", "ALIMENTA_LEDGER_DISPATCH_TOKEN",
                 "SUPABASE_PUBLISHABLE_KEY", "ALIMENTA_SEED_ON_START"):
        monkeypatch.delenv(name, raising=False)


@pytest.fixture(autouse=True)
def fake_brasilapi(monkeypatch):
    fake = FakeBrasilApi()
    monkeypatch.setattr(brasilapi, "_fetch", fake)
    monkeypatch.setattr(brasilapi, "_cache", {})
    return fake


@pytest.fixture()
def engine(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'alimenta-test.db'}")
    create_schema(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def session(engine):
    with make_sessionmaker(engine)() as s:
        seed(s)
        yield s


@pytest.fixture()
def api(engine):
    """API vazia (como a produção começa)."""
    with TestClient(create_app(engine)) as c:
        yield c


def h(email: str) -> dict:
    return {"Authorization": f"Bearer {dev.mint(email)['access_token']}"}


def org_body(cep="01310100", **extra) -> dict:
    return {"contact_name": "Contato Teste", "phone": "11 91234-5678", "cep": cep, "number": "100",
            "donation_terms_version": TERMS, "privacy_notice_version": PRIVACY, **extra}


def donor_body(cnpj=CNPJ_EMPRESA, cep="01310100", **extra) -> dict:
    return org_body(cep, cnpj=cnpj, trade_name="Mercado Teste", kind="supermarket", **extra)


def ngo_body(cnpj=CNPJ_ONG, cep="01001000", **extra) -> dict:
    base = {"cnpj": cnpj, "name": "ONG Teste", "accepted_categories": ["bakery", "produce"], "daily_capacity_kg": 100,
            "receive_window": "00:00-23:59", "accepts_refrigerated": True, "accepts_frozen": False,
            "pickup_radius_km": 15.0}
    return org_body(cep, **{**base, **extra})


def lot_body(**extra) -> dict:
    return {"category": "bakery", "storage": "ambient", "kg": 10.0, "expires_at": in_hours(30),
            "terms_version": TERMS, **extra}


def make_donor(api, email: str, **extra) -> dict:
    r = api.post("/donors", json=donor_body(**extra), headers=h(email))
    assert r.status_code == 201, r.text
    return r.json()


def make_ngo(api, email: str, approve: bool = True, **extra) -> dict:
    r = api.post("/ngos", json=ngo_body(**extra), headers=h(email))
    assert r.status_code == 201, r.text
    ngo = r.json()
    if approve:
        ok = api.post(f"/ops/ngos/{ngo['id']}/approve", json={"note": "conferido"}, headers=h(OPERATOR))
        assert ok.status_code == 200, ok.text
        ngo = ok.json()
    return ngo


@pytest.fixture()
def pair(api):
    """Doador e ONG de teste, ONG aprovada, a 2,53 km um do outro (Paulista e Sé)."""
    donor = make_donor(api, f"doador{TEST_DOMAIN}")
    ngo = make_ngo(api, f"ong{TEST_DOMAIN}")
    return {"donor": donor, "ngo": ngo, "d": h(f"doador{TEST_DOMAIN}"), "n": h(f"ong{TEST_DOMAIN}")}
