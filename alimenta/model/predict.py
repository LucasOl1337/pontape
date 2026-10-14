"""Carrega o artefato do modelo (conferindo o sha256 do metrics.json) e prediz."""

from __future__ import annotations

import hashlib
import json
import os
from functools import lru_cache
from pathlib import Path

import joblib
import pandas as pd

from alimenta.core.domain import risk_level
from alimenta.model.features import FEATURES

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"


class ModelIntegrityError(RuntimeError):
    """Artefato diferente do registrado em metrics.json."""


def metrics_path() -> Path:
    return ARTIFACTS / "metrics.json"


@lru_cache(maxsize=1)
def load_metrics() -> dict:
    return json.loads(metrics_path().read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_model():
    metrics = load_metrics()
    path = Path(os.environ.get("ALIMENTA_MODEL_PATH") or ARTIFACTS / metrics["artifact"]["file"])
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != metrics["artifact"]["sha256"]:
        raise ModelIntegrityError(f"sha256 do modelo não confere: {path.name}")
    return joblib.load(path)  # nosec B301 - artefato local conferido por sha256 acima


def predict(features: dict) -> dict:
    """features: category, storage, region, kg, hours_to_expiry, published_hour, weekday."""
    row = pd.DataFrame([{k: features[k] for k in FEATURES}])
    proba = float(load_model().predict_proba(row)[0, 1])
    return {
        "discard_proba": round(proba, 4),
        "risk_level": risk_level(proba),
        "model_version": load_metrics()["model_version"],
    }
