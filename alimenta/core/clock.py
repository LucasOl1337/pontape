"""Tempo em UTC com fuso; SQLite devolve datetime sem fuso, aqui ele volta a ser UTC."""

from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

SAO_PAULO = ZoneInfo("America/Sao_Paulo")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt.astimezone(timezone.utc)


def local(dt: datetime) -> datetime:
    return aware(dt).astimezone(SAO_PAULO)


def model_features(category: str, storage: str, region: str, kg: float,
                   published_at: datetime, expires_at: datetime) -> dict:
    """Entradas do modelo a partir do lote (hora e dia em America/Sao_Paulo)."""
    published_local = local(published_at)
    return {
        "category": category,
        "storage": storage,
        "region": region,
        "kg": float(kg),
        "hours_to_expiry": round((aware(expires_at) - aware(published_at)).total_seconds() / 3600, 1),
        "published_hour": published_local.hour,
        "weekday": published_local.weekday(),
    }
