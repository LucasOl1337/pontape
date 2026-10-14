"""Colunas de entrada do modelo de risco de descarte."""

from __future__ import annotations

CATEGORICAL = ["category", "storage", "region"]
NUMERIC = ["kg", "hours_to_expiry", "published_hour", "weekday"]
FEATURES = CATEGORICAL + NUMERIC
TARGET = "discarded"
MODEL_VERSION = "discard_risk-v1"
