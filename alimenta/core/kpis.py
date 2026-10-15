"""Indicadores públicos da Rede Alimenta (só doador). Só registros reais: tudo `is_test` fica fora.

Em produção vazia, tudo é zero (zero honesto). Fonte: as doações no banco da API; o número que vale
como prova pública é o do livro do pontape.org, família `donation`.

- doações registradas, entregues (declaradas por quem doou), canceladas e vencidas;
- kg entregues e refeições estimadas (kg / KG_PER_MEAL, estimativa declarada);
- escolhas de destino: quantas aceitaram a primeira sugestão da AI e quantas escolheram outro;
- por distribuidor do catálogo: entregas e kg (instituição pública, nunca pessoa);
- tempo médio de match: do registro da doação até a escolha do destino, em minutos (`null` sem dados);
- por cidade do distribuidor (pública no catálogo): entregas, kg e refeições estimadas. A cidade de quem doa
  é dado privado e nunca sai aqui.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.core import catalog
from alimenta.core.clock import local, utcnow
from alimenta.core.domain import KG_PER_MEAL
from alimenta.db.models import Lot


def compute(session: Session, now: datetime | None = None) -> dict:
    now = now or utcnow()
    lots = session.scalars(select(Lot).where(Lot.is_test.is_(False), Lot.public_ref.is_not(None))).all()
    status: dict[str, int] = defaultdict(int)
    choices: dict[str, int] = defaultdict(int)
    by_distributor: dict[str, dict] = {}
    daily: dict[str, float] = defaultdict(float)
    match_minutes: list[float] = []
    cities = {r["id"]: r["city"] for r in catalog.load()}
    by_city: dict[str, dict] = {}
    kg_delivered = 0.0
    for lot in lots:
        status[lot.status] += 1
        if lot.destination_at and lot.published_at:
            match_minutes.append((lot.destination_at - lot.published_at).total_seconds() / 60)
        if lot.destination_choice:
            choices[lot.destination_choice] += 1
        if lot.status == "delivered":
            kg_delivered += lot.kg
            row = by_distributor.setdefault(lot.distributor_id, {"distributor_id": lot.distributor_id,
                                                                 "deliveries": 0, "kg": 0.0})
            row["deliveries"] += 1
            row["kg"] = round(row["kg"] + lot.kg, 3)
            daily[local(lot.delivered_at).date().isoformat()] += lot.kg
            where = cities.get(lot.distributor_id, "fora do catálogo")
            city = by_city.setdefault(where, {"city": where, "deliveries": 0, "kg": 0.0})
            city["deliveries"] += 1
            city["kg"] = round(city["kg"] + lot.kg, 3)
    for city in by_city.values():
        city["meals_estimated"] = int(city["kg"] / KG_PER_MEAL)
    return {
        "notice": "Só registros reais; contas de teste ficam fora. Entrega declarada por quem doou.",
        "generated_at": now.isoformat(),
        "donations": len(lots),
        "deliveries": status.get("delivered", 0),
        "kg_delivered": round(kg_delivered, 3),
        "meals_estimated": int(kg_delivered / KG_PER_MEAL),
        "kg_per_meal": KG_PER_MEAL,
        "by_status": dict(sorted(status.items())),
        "destination_choice": {"ai_top": choices.get("ai_top", 0), "other": choices.get("other", 0)},
        "by_distributor": sorted(by_distributor.values(), key=lambda r: (-r["kg"], r["distributor_id"])),
        "daily_kg": [{"day": d, "kg": round(v, 3)} for d, v in sorted(daily.items())],
        "match": {"definition": "minutos entre registrar a doação e escolher o destino", "count": len(match_minutes),
                  "avg_minutes": round(sum(match_minutes) / len(match_minutes), 1) if match_minutes else None},
        "by_city": sorted(by_city.values(), key=lambda r: (-r["kg"], r["city"])),
    }
