"""Carga do seed simulado (idempotente) e reset da demonstração.

O histórico dos lotes é relativo ao momento da carga: um lote com
`published_offset_h = -100` foi publicado 100 h antes da carga. Etapas do ciclo
que cairiam no futuro não são aplicadas (o match fica em andamento).
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alimenta.core.clock import model_features, utcnow
from alimenta.db.models import Base, DemoLedgerEvent, Donor, Lot, Match, Ngo
from alimenta.ledger import demo_ledger
from alimenta.model.predict import predict_many

SEED_DIR = Path(__file__).resolve().parents[1] / "data" / "seed"


def _load(name: str) -> list[dict]:
    return json.loads((SEED_DIR / f"{name}.json").read_text(encoding="utf-8"))[name]


def create_schema(engine: Engine) -> None:
    Base.metadata.create_all(engine)


def is_seeded(session: Session) -> bool:
    return (session.scalar(select(func.count()).select_from(Donor)) or 0) > 0


def seed(session: Session, now: datetime | None = None) -> dict:
    """Carrega o seed se o banco estiver vazio. Devolve contagens."""
    if is_seeded(session):
        return {"seeded": False, "reason": "banco já tem dados"}
    now = now or utcnow()
    donors = {d["id"]: d for d in _load("donors")}
    session.add_all(Donor(**d) for d in donors.values())
    session.add_all(Ngo(**g) for g in _load("ngos"))
    session.flush()

    raw = _load("lots")
    times = []
    for lot in raw:
        published = now + timedelta(hours=lot["published_offset_h"])
        expires = now + timedelta(hours=lot["expires_offset_h"])
        times.append((published, expires))
    features = [model_features(lot["category"], lot["storage"], donors[lot["donor_id"]]["region"],
                               lot["kg"], p, e) for lot, (p, e) in zip(raw, times)]
    predictions = predict_many(features)

    deliveries = []
    for lot, (published, expires), pred in zip(raw, times, predictions):
        row = Lot(id=lot["id"], donor_id=lot["donor_id"], category=lot["category"], storage=lot["storage"],
                  kg=lot["kg"], description=lot["description"], published_at=published, expires_at=expires,
                  status="open", **pred)
        session.add(row)
        outcome = lot["outcome"]
        if not outcome:
            continue
        match = Match(lot_id=lot["id"], ngo_id=outcome["ngo_id"], status="proposed",
                      proposed_at=published + timedelta(minutes=5))
        row.status = "matched"
        for minutes, status, stamp in ((outcome["confirm_after_min"], "confirmed", "confirmed_at"),
                                       (outcome["collect_after_min"], "collected", "collected_at"),
                                       (outcome["deliver_after_min"], "delivered", "delivered_at")):
            when = published + timedelta(minutes=minutes)
            if when > now:
                break
            match.status = status
            setattr(match, stamp, when)
        session.add(match)
        if match.status == "delivered":
            row.status = "delivered"
            deliveries.append((match.delivered_at, row.kg, match))
    session.flush()

    deliveries.sort(key=lambda item: (item[0], item[2].lot_id))
    for delivered_at, kg, match in deliveries:
        event = demo_ledger.append_delivery(session, delivered_at=delivered_at, kg=kg, recorded_at=now)
        match.ledger_sequence = event.sequence
    session.commit()
    return {"seeded": True, "donors": len(donors), "lots": len(raw), "deliveries": len(deliveries)}


def reset(session: Session, now: datetime | None = None) -> dict:
    """Apaga TUDO da demonstração (inclusive o livro da demo) e recarrega o seed."""
    for model in (DemoLedgerEvent, Match, Lot, Ngo, Donor):
        session.execute(delete(model))
    session.commit()
    return seed(session, now)
