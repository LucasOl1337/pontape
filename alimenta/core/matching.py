"""Regras do cruzamento Lote × ONG (regra, não modelo).

O modelo só estima o risco de descarte. Quem escolhe a ONG são estas regras,
na ordem:
1. Lote vencido: bloqueado (LotExpired), nenhuma ONG é sugerida.
2. Tipo aceito: a ONG precisa aceitar a categoria do lote (filtro).
3. Capacidade do dia: kg já atribuídos à ONG hoje + kg do lote ≤ capacidade (filtro).
4. Corte real (filtros): ONG aprovada; refrigeração quando o lote é refrigerado e
   congelamento quando é congelado; doador dentro do `pickup_radius_km` da ONG; janela diária
   de recebimento da ONG que cruza a janela de retirada do lote. A ONG que já recebeu oferta
   deste lote (recusou ou deixou vencer) sai antes, em core/offers.py.
5. Pontuação, de 0 a 100:
   - distância (haversine): até 60 pontos, 60 a 0 km e 0 a partir de 25 km;
     em lote urgente (vence em ≤ 12 h ou risco alto) o raio cai para 15 km,
     então a distância pesa mais, porque perto chega antes;
   - mesma região do doador: 10 pontos;
   - folga de capacidade depois do lote: até 20 pontos;
   - urgência: 10 pontos para lote urgente (sinaliza prioridade na fila).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from alimenta.core.clock import SAO_PAULO
from alimenta.core.domain import haversine_km

MAX_KM = 25.0
URGENT_MAX_KM = 15.0
URGENT_HOURS = 12.0


class LotExpired(Exception):
    """Lote vencido não pode ser oferecido."""


@dataclass(frozen=True)
class LotView:
    id: str
    category: str
    kg: float
    lat: float
    lon: float
    region: str
    expires_at: datetime
    risk_level: str
    storage: str = "ambient"
    pickup_from: datetime | None = None
    pickup_until: datetime | None = None


@dataclass(frozen=True)
class NgoView:
    id: str
    name: str
    region: str
    lat: float
    lon: float
    accepted_categories: tuple[str, ...]
    daily_capacity_kg: float
    used_today_kg: float
    approved: bool = True
    accepts_refrigerated: bool = True
    accepts_frozen: bool = False
    pickup_radius_km: float = MAX_KM
    window: str | None = None


def hours_left(lot: LotView, now: datetime) -> float:
    return (lot.expires_at - now).total_seconds() / 3600


def is_urgent(lot: LotView, now: datetime) -> bool:
    return hours_left(lot, now) <= URGENT_HOURS or lot.risk_level == "high"


def storage_ok(lot: LotView, ngo: NgoView) -> bool:
    if lot.storage == "refrigerated":
        return ngo.accepts_refrigerated
    if lot.storage == "frozen":
        return ngo.accepts_frozen
    return True


def window_ok(lot: LotView, ngo: NgoView, now: datetime) -> bool:
    """A janela diária da ONG (HH:MM-HH:MM, São Paulo) cruza [pickup_from, pickup_until] em algum dia."""
    if not ngo.window:
        return True
    start = lot.pickup_from or now
    end = lot.pickup_until or lot.expires_at
    if end <= start:
        return False
    (h1, m1), (h2, m2) = (map(int, part.split(":")) for part in ngo.window.split("-"))
    day = start.astimezone(SAO_PAULO).date()
    for _ in range(8):  # janela de retirada de até uma semana
        base = datetime(day.year, day.month, day.day, tzinfo=SAO_PAULO)
        open_at, close_at = base + timedelta(hours=h1, minutes=m1), base + timedelta(hours=h2, minutes=m2)
        if max(open_at, start) < min(close_at, end):
            return True
        day += timedelta(days=1)
    return False


def score_ngo(lot: LotView, ngo: NgoView, now: datetime) -> dict:
    """Pontos de cada regra para um par lote × ONG. `eligible` indica os filtros."""
    distance = haversine_km(lot.lat, lot.lon, ngo.lat, ngo.lon)
    accepts = lot.category in ngo.accepted_categories
    remaining = ngo.daily_capacity_kg - ngo.used_today_kg
    fits = lot.kg <= remaining
    urgent = is_urgent(lot, now)
    radius = URGENT_MAX_KM if urgent else MAX_KM
    distance_points = max(0.0, 60.0 * (1 - distance / radius))
    region_points = 10.0 if ngo.region == lot.region else 0.0
    slack = max(0.0, remaining - lot.kg) / ngo.daily_capacity_kg if ngo.daily_capacity_kg else 0.0
    capacity_points = 20.0 * min(1.0, slack)
    urgency_points = 10.0 if urgent else 0.0
    in_radius = distance <= ngo.pickup_radius_km
    storage = storage_ok(lot, ngo)
    window = window_ok(lot, ngo, now)
    eligible = accepts and fits and ngo.approved and in_radius and storage and window
    total = distance_points + region_points + capacity_points + urgency_points if eligible else 0.0
    return {
        "ngo_id": ngo.id,
        "ngo_name": ngo.name,
        "ngo_region": ngo.region,
        "eligible": eligible,
        "accepts_category": accepts,
        "fits_capacity": fits,
        "approved": ngo.approved,
        "in_radius": in_radius,
        "storage_ok": storage,
        "window_ok": window,
        "remaining_capacity_kg": round(remaining, 1),
        "distance_km": round(distance, 2),
        "urgent": urgent,
        "points": {
            "distance": round(distance_points, 2),
            "same_region": region_points,
            "capacity": round(capacity_points, 2),
            "urgency": urgency_points,
        },
        "score": round(total, 2),
    }


def recommend(lot: LotView, ngos: list[NgoView], now: datetime, limit: int = 5) -> list[dict]:
    """Ranking das ONGs elegíveis. Lote vencido levanta LotExpired."""
    if lot.expires_at <= now:
        raise LotExpired(f"lote {lot.id} venceu em {lot.expires_at.isoformat()}")
    scored = [score_ngo(lot, ngo, now) for ngo in ngos]
    eligible = [s for s in scored if s["eligible"]]
    eligible.sort(key=lambda s: (-s["score"], s["distance_km"], s["ngo_id"]))
    return eligible[:limit]
