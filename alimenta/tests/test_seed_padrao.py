"""Seed de exemplo só com ALIMENTA_ENV=local; produção nunca carrega. Render e compose conferidos."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml
from fastapi.testclient import TestClient

from alimenta.api.main import create_app, env_true

ROOT = Path(__file__).resolve().parents[2]


def test_env_true_defaults_to_false(monkeypatch):
    monkeypatch.delenv("ALIMENTA_SEED_ON_START", raising=False)
    assert env_true("ALIMENTA_SEED_ON_START") is False
    for value, expected in (("true", True), ("1", True), ("sim", True), ("false", False), ("", False)):
        monkeypatch.setenv("ALIMENTA_SEED_ON_START", value)
        assert env_true("ALIMENTA_SEED_ON_START") is expected


def test_api_without_env_starts_empty(engine, monkeypatch):
    monkeypatch.delenv("ALIMENTA_SEED_ON_START", raising=False)
    with TestClient(create_app(engine)) as api:
        k = api.get("/kpis").json()
        assert (k["kg_saved"], k["deliveries"], k["heat_points"]) == (0.0, 0, [])
        assert api.get("/ledger/verify").json()["events"] == 0


@pytest.fixture(scope="module")
def blueprint():
    return yaml.safe_load((ROOT / "render.yaml").read_text(encoding="utf-8"))


def env_of(blueprint, name):
    service = next(s for s in blueprint["services"] if s["name"] == name)
    return {e["key"]: e for e in service["envVars"]}


def test_render_is_production_with_flags_off_and_secrets_unsynced(blueprint):
    api = env_of(blueprint, "rede-alimenta-api")
    assert api["ALIMENTA_ENV"] == {"key": "ALIMENTA_ENV", "value": "production"}
    assert api["ALIMENTA_SIGNUP_OPEN"] == {"key": "ALIMENTA_SIGNUP_OPEN", "value": "false"}
    assert api["ALIMENTA_PUBLISH_REAL_LEDGER"] == {"key": "ALIMENTA_PUBLISH_REAL_LEDGER", "value": "false"}
    for secret in ("DATABASE_URL", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "ALIMENTA_OPERATOR_EMAILS",
                   "ALIMENTA_OPS_TOKEN", "ALIMENTA_LEDGER_DISPATCH_TOKEN"):
        assert api[secret] == {"key": secret, "sync": False}, secret
    assert "ALIMENTA_SEED_ON_START" not in api and "ALIMENTA_WRITE_TOKEN" not in api
    painel = env_of(blueprint, "rede-alimenta-painel")
    assert set(painel) == {"ALIMENTA_API_URL", "ALIMENTA_PUBLIC_API_URL", "ALIMENTA_GITHUB_REPO"}


def test_compose_is_local_with_seed():
    compose = yaml.safe_load((ROOT / "docker-compose.yml").read_text(encoding="utf-8"))
    env = compose["services"]["api"]["environment"]
    assert (env["ALIMENTA_ENV"], env["ALIMENTA_SEED_ON_START"]) == ("local", "true")
    assert "ALIMENTA_OPERATOR_CODE" not in compose["services"]["painel"]["environment"]
