"""Publicação de uma entrega no livro real do pontape.org (opção a). DESLIGADA por padrão.

Só roda com ALIMENTA_PUBLISH_REAL_LEDGER=true (o Lucas autoriza a primeira). Chama o
workflow `ledger-ingest.yml` por `workflow_dispatch`, o mesmo caminho do Worker do Asaas,
com o envelope `{source: "alimenta", eventId: "delivery-<match_id>", payload}`:
família `field`, ação `food_delivered`, `quantity: "1"` (o site lê como número de entregas,
nunca gramas). Sem pessoa, lugar ou estabelecimento (CONTRATO.md v1).

Token: ALIMENTA_LEDGER_DISPATCH_TOKEN (GitHub fine-grained, Actions: write, só este repo).
Com a flag desligada, nenhuma chamada de rede acontece e o envio fica `disabled`.
"""

from __future__ import annotations

import json
import os
from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from alimenta.core import config
from alimenta.db.models import PublicLedgerDispatch
from alimenta.ledger.book import sao_paulo_day

REPO = os.environ.get("ALIMENTA_GITHUB_REPO", "LucasOl1337/pontape")
WORKFLOW = "ledger-ingest.yml"
TIMEOUT_S = 10


def event_id(match_id: int) -> str:
    return f"delivery-{match_id}"


def envelope(match_id: int, delivered_at: datetime) -> dict:
    return {"source": "alimenta", "eventId": event_id(match_id),
            "payload": {"type": "field", "action": "food_delivered", "occurredOn": sao_paulo_day(delivered_at),
                        "correctionOf": None, "quantity": "1"}}


def dispatch(session: Session, match_id: int, delivered_at: datetime, now: datetime) -> PublicLedgerDispatch:
    """Registra o envio (idempotente por match). Não faz commit."""
    row = session.query(PublicLedgerDispatch).filter_by(match_id=match_id).one_or_none()
    if row is not None and row.status == "sent":
        return row
    if row is None:
        row = PublicLedgerDispatch(match_id=match_id, event_id=event_id(match_id), status="disabled")
        session.add(row)
    token = os.environ.get("ALIMENTA_LEDGER_DISPATCH_TOKEN", "")
    if not config.publish_real_ledger() or not token:
        row.status = "disabled"
        return row
    url = f"https://api.github.com/repos/{REPO}/actions/workflows/{WORKFLOW}/dispatches"
    body = {"ref": "main", "inputs": {"event": json.dumps(envelope(match_id, delivered_at), separators=(",", ":"))}}
    try:
        r = httpx.post(url, json=body, timeout=TIMEOUT_S, headers={
            "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"})
        row.http_status = r.status_code
        row.status = "sent" if r.status_code == 204 else "failed"
    except httpx.HTTPError:
        row.status = "failed"
    row.dispatched_at = now
    return row
