"""Livro da DEMO `pontape-alimenta-demo` (DEMONSTRAÇÃO · dados simulados).

Separado do livro real do PontaPé (D040: doação fictícia não entra no livro
real). Cada entrega da demo vira um evento no formato v1 exato do contrato
(`docs/transparencia/CONTRATO.md`): família `field`, ação `food_delivered`,
`quantity` em GRAMAS. Sem região, lote, ONG ou doador no evento (o contrato
proíbe localização e estabelecimento); kg por região fica só no banco.

Hash: SHA-256 do JCS do envelope sem `hash`, com o `jcs()` do próprio
`tools/conferir.py`, e a conferência usa o `verify()` desse mesmo arquivo.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.db.models import DemoLedgerEvent

LEDGER_NAME = "pontape-alimenta-demo"
NOTICE = (
    "DEMONSTRAÇÃO · dados simulados · Rede Alimenta · livro pontape-alimenta-demo · "
    "quantity em gramas · não é o livro real do PontaPé"
)
SAO_PAULO = ZoneInfo("America/Sao_Paulo")
ZERO_HASH = "0" * 64


@lru_cache(maxsize=1)
def conferir():
    """Carrega tools/conferir.py (stdlib) sem copiar o código."""
    candidates = [os.environ.get("ALIMENTA_CONFERIR_PATH"),
                  Path(__file__).resolve().parents[2] / "tools" / "conferir.py"]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            spec = importlib.util.spec_from_file_location("pontape_conferir", candidate)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
    raise FileNotFoundError("tools/conferir.py não encontrado (defina ALIMENTA_CONFERIR_PATH)")


def utc_ms(dt: datetime) -> str:
    dt = dt.astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


def sao_paulo_day(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(SAO_PAULO).date().isoformat()


def grams(kg: float) -> str:
    value = round(kg * 1000)
    if value < 1:
        raise ValueError("entrega precisa de pelo menos 1 grama")
    return str(value)


def build_event(sequence: int, previous_hash: str, recorded_at: datetime,
                delivered_at: datetime, kg: float) -> dict:
    envelope = {
        "schemaVersion": 1,
        "sequence": str(sequence),
        "previousHash": previous_hash,
        "recordedAt": utc_ms(recorded_at),
        "payload": {
            "type": "field",
            "action": "food_delivered",
            "occurredOn": sao_paulo_day(delivered_at),
            "correctionOf": None,
            "quantity": grams(kg),
        },
    }
    envelope["hash"] = hashlib.sha256(conferir().jcs(envelope).encode("utf-8")).hexdigest()
    return envelope


def head(session: Session) -> tuple[int, str]:
    last = session.scalars(select(DemoLedgerEvent).order_by(DemoLedgerEvent.sequence.desc()).limit(1)).first()
    return (last.sequence, last.hash) if last else (0, ZERO_HASH)


def append_delivery(session: Session, delivered_at: datetime, kg: float,
                    recorded_at: datetime | None = None) -> DemoLedgerEvent:
    """Anexa um evento na mesma transação da entrega. Não faz commit."""
    sequence, previous = head(session)
    event = build_event(sequence + 1, previous, recorded_at or datetime.now(timezone.utc), delivered_at, kg)
    row = DemoLedgerEvent(sequence=sequence + 1, hash=event["hash"], body=conferir().jcs(event))
    session.add(row)
    session.flush()
    return row


def export(session: Session) -> dict:
    rows = session.scalars(select(DemoLedgerEvent).order_by(DemoLedgerEvent.sequence)).all()
    return {"notice": NOTICE, "events": [json.loads(r.body) for r in rows]}


def verify_document(document: dict) -> dict:
    """Confere com o verify() de tools/conferir.py. Nunca levanta: devolve o resultado."""
    module = conferir()
    try:
        count, _cents = module.verify(document)
    except module.LedgerError as exc:
        return {"ok": False, "ledger": LEDGER_NAME, "message": f"Problema: {exc}"}
    events = document if isinstance(document, list) else document["events"]
    total_g = sum(int(e["payload"]["quantity"]) for e in events if e["payload"]["type"] == "field")
    head_hash = events[-1]["hash"] if events else ZERO_HASH
    return {"ok": True, "ledger": LEDGER_NAME, "events": count, "head_hash": head_hash,
            "total_grams": total_g, "message": f"Tudo certo: {count} ações, nada apagado nem mudado"}
