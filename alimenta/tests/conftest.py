"""Fixtures: banco SQLite temporário com o seed, relógio real e token fixo."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from alimenta.api.main import create_app
from alimenta.db.seed import create_schema, seed
from alimenta.db.session import make_engine, make_sessionmaker

TOKEN = "token-de-teste"


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
def client(engine, monkeypatch):
    monkeypatch.setenv("ALIMENTA_WRITE_TOKEN", TOKEN)
    monkeypatch.setenv("ALIMENTA_SEED_ON_START", "true")
    with TestClient(create_app(engine)) as c:
        yield c


@pytest.fixture()
def auth():
    return {"X-Alimenta-Token": TOKEN}
