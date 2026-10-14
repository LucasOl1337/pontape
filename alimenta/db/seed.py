"""Seed de EXEMPLO (simulado), só com ALIMENTA_ENV=local: testes e docker compose. Nunca em produção.

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
from alimenta.db.models import (Account, AuditLog, Confirmation, Consent, Donor, LedgerEvent, Lot, LotOffer,
                                LotOutcome, Match, Ngo, Notification, PublicLedgerDispatch)
from alimenta.ledger import book
from alimenta.model.predict import predict_many

SEED_DIR = Path(__file__).resolve().parents[1] / "data" / "seed"


def _load(name: str) -> list[dict]:
    return json.loads((SEED_DIR / f"{name}.json").read_text(encoding="utf-8"))[name]


def create_schema(engine: Engine) -> None:
    """Esquema pelas migrações (alimenta/db/migrate.py), com RLS sem política no Postgres.

    No Supabase, tabela em `public` sem RLS fica aberta pela Data API com a chave
    publicável. Com RLS e nenhuma política, a Data API não lê nem escreve; a
    aplicação conecta como dona das tabelas e não é afetada.
    """
    from alimenta.db.migrate import upgrade

    upgrade(engine)


def is_seeded(session: Session) -> bool:
    return (session.scalar(select(func.count()).select_from(Donor)) or 0) > 0


def seed(session: Session, now: datetime | None = None) -> dict:
    """Carrega o seed se o banco estiver vazio. Devolve contagens."""
    if is_seeded(session):
        return {"seeded": False, "reason": "banco já tem dados"}
    now = now or utcnow()
    donors = {d["id"]: d for d in _load("donors")}
    session.add_all(Donor(**d, status="active") for d in donors.values())
    session.add_all(Ngo(**g, approval_status="approved", accepts_frozen=True) for g in _load("ngos"))
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
    for lot, (published, expires), pred, feats in zip(raw, times, predictions, features):
        row = Lot(id=lot["id"], donor_id=lot["donor_id"], category=lot["category"], storage=lot["storage"],
                  kg=lot["kg"], description=lot["description"], published_at=published, expires_at=expires,
                  pickup_from=published, pickup_until=expires, status="open", features=feats, **pred)
        session.add(row)
        outcome = lot["outcome"]
        if not outcome:
            continue
        accepted = published + timedelta(minutes=outcome["confirm_after_min"])
        if accepted > now:
            continue
        match = Match(lot_id=lot["id"], ngo_id=outcome["ngo_id"], status="accepted", accepted_at=accepted)
        row.status = "accepted"
        for minutes, status, stamp in ((outcome["collect_after_min"], "collected", "collected_at"),
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
        event = book.append_delivery(session, delivered_at=delivered_at, kg=kg, recorded_at=now)
        match.ledger_sequence = event.sequence
    session.commit()
    return {"seeded": True, "donors": len(donors), "lots": len(raw), "deliveries": len(deliveries)}


ALL_TABLES = (PublicLedgerDispatch, Notification, Confirmation, LotOutcome, LedgerEvent, Match, LotOffer, Lot,
              Ngo, Donor, Consent, AuditLog, Account)


def reset(session: Session, now: datetime | None = None) -> dict:
    """Apaga TUDO do banco local (inclusive o livro) e recarrega o seed. Só existe com ALIMENTA_ENV=local."""
    for model in ALL_TABLES:
        session.execute(delete(model))
    session.commit()
    return seed(session, now)
