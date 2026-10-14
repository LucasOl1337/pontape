"""Seed simulado desligado por padrão no código e no render.yaml; o compose local liga."""

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
        assert api.get("/donors").json() == []
        assert api.get("/ngos").json() == []
        k = api.get("/kpis").json()
        assert (k["kg_saved"], k["deliveries"], k["heat_points"]) == (0.0, 0, [])
        assert api.get("/ledger/verify").json()["events"] == 0


@pytest.fixture(scope="module")
def blueprint():
    return yaml.safe_load((ROOT / "render.yaml").read_text(encoding="utf-8"))


def env_of(blueprint, name):
    service = next(s for s in blueprint["services"] if s["name"] == name)
    return {e["key"]: e for e in service["envVars"]}


def test_render_turns_seed_off_and_operator_code_is_secret(blueprint):
    api = env_of(blueprint, "rede-alimenta-api")
    assert api["ALIMENTA_SEED_ON_START"] == {"key": "ALIMENTA_SEED_ON_START", "value": "false"}
    painel = env_of(blueprint, "rede-alimenta-painel")
    assert painel["ALIMENTA_OPERATOR_CODE"] == {"key": "ALIMENTA_OPERATOR_CODE", "sync": False}
    assert "ALIMENTA_SEED_ON_START" not in painel


def test_compose_keeps_seed_on_locally():
    compose = yaml.safe_load((ROOT / "docker-compose.yml").read_text(encoding="utf-8"))
    assert compose["services"]["api"]["environment"]["ALIMENTA_SEED_ON_START"] == "true"
    assert compose["services"]["painel"]["environment"]["ALIMENTA_OPERATOR_CODE"].startswith("${ALIMENTA_OPERATOR_CODE")
