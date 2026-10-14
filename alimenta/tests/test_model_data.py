"""Dados simulados e modelo: reprodutibilidade, integridade e baselines."""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest

from alimenta.core.clock import model_features
from alimenta.data import generate
from alimenta.model import predict
from alimenta.model.train import METRICS_PATH


def test_versioned_data_matches_generator():
    assert generate.main(["--check"]) == 0


def test_history_is_labeled_simulated():
    import pandas as pd
    df = pd.read_csv(generate.DATA_DIR / "lots_history.csv")
    assert len(df) == 6000 and set(df["data_origin"]) == {"SIMULADO"}
    assert set(df["discarded"]) == {0, 1}


def test_seed_names_are_fictitious():
    for name, prefix in (("donors", "Doador Exemplo "), ("ngos", "ONG Exemplo ")):
        doc = json.loads((generate.DATA_DIR / "seed" / f"{name}.json").read_text(encoding="utf-8"))
        assert doc["notice"].startswith("DEMONSTRAÇÃO")
        assert all(item["name"].startswith(prefix) for item in doc[name])


def test_metrics_beat_both_baselines():
    m = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
    acc = m["test"]["accuracy"]
    assert m["beats_baselines"] is True
    assert acc > m["baselines"]["majority_class"]["accuracy"]
    assert acc > m["baselines"]["deadline_rule"]["accuracy"]
    assert m["split"]["n_test"] == 1200 and m["split"]["n_train"] == 4800
    assert sum(map(sum, m["test"]["confusion_matrix"]["rows_true_cols_pred"])) == 1200


def test_artifact_sha256_is_checked(tmp_path, monkeypatch):
    bad = tmp_path / "falso.joblib"
    bad.write_bytes(b"nao e o modelo")
    monkeypatch.setenv("ALIMENTA_MODEL_PATH", str(bad))
    predict.load_model.cache_clear()
    try:
        with pytest.raises(predict.ModelIntegrityError):
            predict.load_model()
    finally:
        monkeypatch.delenv("ALIMENTA_MODEL_PATH")
        predict.load_model.cache_clear()


def test_prediction_orders_risk_as_expected():
    published = datetime(2026, 10, 15, 22, 0, tzinfo=timezone.utc)  # 19h em São Paulo, quinta
    risky = model_features("prepared_meal", "ambient", "west", 30, published,
                           published.replace(day=16, hour=1))  # vence em 3 h
    safe = model_features("dry_goods", "ambient", "east", 10, published,
                          published.replace(month=12))  # vence em ~47 dias
    assert risky["published_hour"] == 19 and risky["weekday"] == 3 and risky["hours_to_expiry"] == 3.0
    p_risky, p_safe = predict.predict(risky), predict.predict(safe)
    assert p_risky["risk_level"] == "high" and p_safe["risk_level"] == "low"
    assert p_risky["model_version"] == "discard_risk-v1"
