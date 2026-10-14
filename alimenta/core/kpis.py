"""Indicadores públicos da Rede Alimenta. Só registros reais: tudo `is_test` fica fora.

Em produção vazia, tudo é zero ou "sem dados" (zero honesto).

- kg salvos: soma dos kg dos lotes com match `delivered` (um match ativo por lote).
- refeições estimadas: kg salvos / KG_PER_MEAL, na região da ONG que recebeu.
- tempo médio de match: lote publicado → ONG aceitou a oferta (`accepted_at`),
  matches não cancelados; "sem dados" (None) quando não há nenhum.
- alertas de validade: lotes não entregues que vencem em até 24 h (crítico em
  até 6 h) ou já venceram sem entrega.
- mapa de calor: um ponto por região, no centroide da região (nunca a
  coordenada da ONG), com o peso dos kg entregues às ONGs dessa região.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.core.clock import aware, local, utcnow
from alimenta.core.domain import CATEGORIES, KG_PER_MEAL, REGIONS, region_centroid
from alimenta.db.models import Donor, Lot, Match, Ngo

ALERT_HOURS = 24
CRITICAL_HOURS = 6


def compute(session: Session, now: datetime | None = None) -> dict:
    now = now or utcnow()
    ngos = {n.id: n for n in session.scalars(select(Ngo).where(Ngo.is_test.is_(False)))}
    donors = {d.id: d for d in session.scalars(select(Donor).where(Donor.is_test.is_(False)))}
    lots = {lot.id: lot for lot in session.scalars(select(Lot).where(Lot.is_test.is_(False)))}
    matches = [m for m in session.scalars(select(Match)) if m.status != "cancelled" and m.lot_id in lots]

    by_region = {r: {"region": r, "label": REGIONS[r]["label"], "kg_saved": 0.0, "meals_estimated": 0,
                     "deliveries": 0, "open_lots": 0, "lat": region_centroid(r)[0],
                     "lon": region_centroid(r)[1]} for r in REGIONS}
    daily: dict[str, float] = defaultdict(float)
    heat: dict[str, float] = defaultdict(float)
    kg_saved = 0.0
    match_minutes = []
    for m in matches:
        lot = lots[m.lot_id]
        if m.accepted_at is not None:
            match_minutes.append((aware(m.accepted_at) - aware(lot.published_at)).total_seconds() / 60)
        if m.status == "delivered":
            kg_saved += lot.kg
            region = by_region[ngos[m.ngo_id].region]
            region["kg_saved"] += lot.kg
            region["deliveries"] += 1
            heat[ngos[m.ngo_id].region] += lot.kg
            daily[local(m.delivered_at).date().isoformat()] += lot.kg

    alerts = []
    status_count: dict[str, int] = defaultdict(int)
    risk_count: dict[str, int] = defaultdict(int)
    for lot in lots.values():
        expires = aware(lot.expires_at)
        hours = (expires - now).total_seconds() / 3600
        status = lot.status
        if status in ("open", "offered", "accepted") and hours <= 0:
            status = "expired"
        status_count[status] += 1
        risk_count[lot.risk_level] += 1
        if lot.status in ("open", "offered") and hours > 0:
            by_region[donors[lot.donor_id].region]["open_lots"] += 1
        if lot.status in ("open", "offered", "accepted", "expired", "unclaimed") and hours <= ALERT_HOURS and hours > -72:
            level = "expired" if hours <= 0 else ("critical" if hours <= CRITICAL_HOURS else "warning")
            alerts.append({"category": CATEGORIES[lot.category], "kg": lot.kg,
                           "region": REGIONS[donors[lot.donor_id].region]["label"], "status": lot.status,
                           "risk_level": lot.risk_level, "hours_left": round(hours, 1), "level": level})
    alerts.sort(key=lambda a: a["hours_left"])

    for region in by_region.values():
        region["kg_saved"] = round(region["kg_saved"], 1)
        region["meals_estimated"] = int(region["kg_saved"] / KG_PER_MEAL)
    return {
        "notice": "Só registros reais; contas de teste ficam fora",
        "generated_at": now.isoformat(),
        "kg_saved": round(kg_saved, 1),
        "meals_estimated": int(kg_saved / KG_PER_MEAL),
        "kg_per_meal": KG_PER_MEAL,
        "deliveries": sum(1 for m in matches if m.status == "delivered"),
        "avg_match_minutes": round(sum(match_minutes) / len(match_minutes), 1) if match_minutes else None,
        "matches_accepted": len(match_minutes),
        "lots_by_status": dict(sorted(status_count.items())),
        "lots_by_risk": dict(sorted(risk_count.items())),
        "by_region": list(by_region.values()),
        "heat_points": [{"region": r, "lat": region_centroid(r)[0], "lon": region_centroid(r)[1],
                         "kg": round(v, 1)} for r, v in sorted(heat.items())],
        "daily_kg": [{"day": d, "kg": round(v, 1)} for d, v in sorted(daily.items())],
        "alerts": alerts,
    }
