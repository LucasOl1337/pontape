"""Fila de saída para o livro público do pontape.org (família `donation`).

Cada ação de uma doação real vira uma linha em `ledger_outbox` na mesma transação da ação.
Envio: `workflow_dispatch` do `ledger-ingest.yml` (o mesmo caminho do Asaas), um envelope
`{source: "alimenta", eventId: "<donationRef>:<n>:<ação>", payload}` por vez.

Ordem: o verificador recusa ação de uma doação antes do registro dela, e o GitHub descarta
execuções pendentes do mesmo grupo de concorrência. Por isso só vai para o GitHub a primeira
linha ainda não confirmada de cada doação; a próxima sai quando a anterior aparece no
`src/data/ledger/intake.json` da main (leitura pública, sem token). A varredura (`POST /ops/sweep`)
confirma, reenvia o que ficou mais de RESEND_AFTER sem confirmar e manda a próxima.
O `intake.json` torna o reenvio idempotente: a mesma chave nunca grava duas vezes.

Desligado (ALIMENTA_PUBLISH_REAL_LEDGER=false ou sem token): nenhuma chamada de rede, as linhas
ficam `pending` e a tela mostra "entrando no livro". Conta de teste nunca cria linha.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from alimenta.core import config
from alimenta.core.clock import aware, local, utcnow
from alimenta.db.models import LedgerOutbox, Lot

WORKFLOW = "ledger-ingest.yml"
TIMEOUT_S = 10
RESEND_AFTER = timedelta(minutes=20)
MAX_ATTEMPTS = 12
OPEN = ("pending", "sent", "failed")
TRANSPORT: httpx.BaseTransport | None = None  # testes trocam por httpx.MockTransport
CLIENT = httpx.Client  # referência própria (o teste do ensaio troca httpx.Client)


def _client() -> httpx.Client:
    return CLIENT(timeout=TIMEOUT_S, transport=TRANSPORT)


def payload(lot: Lot, action: str, when: datetime) -> dict:
    body = {"type": "donation", "action": action, "occurredOn": local(when).date().isoformat(),
            "correctionOf": None, "donationRef": lot.public_ref}
    if action == "donation_registered":
        body.update(category=lot.category, quantityGrams=str(max(1, round(lot.kg * 1000))))
    elif action == "destination_chosen":
        body.update(distributorId=lot.distributor_id, choice=lot.destination_choice)
    return body


def enqueue(session: Session, lot: Lot, action: str, when: datetime | None = None) -> LedgerOutbox | None:
    """Põe a ação na fila (não faz commit). Doação de teste não entra."""
    if lot.is_test:
        return None
    when = when or utcnow()
    n = (session.scalar(select(func.count()).select_from(LedgerOutbox).where(LedgerOutbox.lot_id == lot.id)) or 0) + 1
    event_id = f"{lot.public_ref}:{n}:{action}"
    envelope = {"source": "alimenta", "eventId": event_id, "payload": payload(lot, action, when)}
    row = LedgerOutbox(event_id=event_id, lot_id=lot.id, action=action, status="pending", attempts=0,
                       envelope=json.dumps(envelope, separators=(",", ":"), ensure_ascii=False), created_at=when)
    session.add(row)
    session.flush()
    return row


def enabled() -> bool:
    return config.publish_real_ledger() and bool(config.ledger_dispatch_token())


def _dispatch(row: LedgerOutbox, now: datetime) -> None:
    token = config.ledger_dispatch_token()
    url = f"https://api.github.com/repos/{config.github_repo()}/actions/workflows/{WORKFLOW}/dispatches"
    row.attempts += 1
    row.sent_at = now
    try:
        with _client() as http:
            r = http.post(url, json={"ref": "main", "inputs": {"event": row.envelope}}, headers={
                "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28"})
        row.http_status = r.status_code
        row.status = "sent" if r.status_code == 204 else "failed"
    except httpx.HTTPError:
        row.http_status = None
        row.status = "failed"


def _raw(path: str):
    url = f"https://raw.githubusercontent.com/{config.github_repo()}/main/{path}"
    try:
        with _client() as http:
            r = http.get(url)
        return r.json() if r.status_code == 200 else None
    except (httpx.HTTPError, ValueError):
        return None


def published_keys() -> set[str] | None:
    """Chaves já gravadas no livro da main (intake.json). None se não deu para ler."""
    data = _raw("src/data/ledger/intake.json")
    keys = data.get("keys") if isinstance(data, dict) else None
    return set(keys) if isinstance(keys, list) else None


def published_sequences() -> dict[str, list[str]]:
    """donationRef → números de ação no livro da main, em ordem. A n-ésima é a linha `<ref>:<n>:...`."""
    data = _raw("src/data/ledger/ledger.json")
    events = data.get("events") if isinstance(data, dict) else data
    found: dict[str, list[str]] = {}
    for event in events if isinstance(events, list) else []:
        body = event.get("payload") if isinstance(event, dict) else None
        if isinstance(body, dict) and body.get("type") == "donation" and isinstance(body.get("donationRef"), str):
            found.setdefault(body["donationRef"], []).append(str(event.get("sequence")))
    return found


def attach_sequences(session: Session, sequences: dict[str, list[str]]) -> int:
    """Grava o nº da ação no livro em cada linha confirmada sem número."""
    count = 0
    for row in session.scalars(select(LedgerOutbox).where(LedgerOutbox.status == "confirmed",
                                                          LedgerOutbox.ledger_sequence.is_(None))):
        ref, n, _ = row.event_id.split(":", 2)
        numbers = sequences.get(ref, [])
        if int(n) <= len(numbers):
            row.ledger_sequence = numbers[int(n) - 1]
            count += 1
    return count


def _heads(session: Session) -> list[LedgerOutbox]:
    """A primeira linha não confirmada de cada doação, na ordem de criação."""
    rows = session.scalars(select(LedgerOutbox).where(LedgerOutbox.status.in_(OPEN)).order_by(LedgerOutbox.id)).all()
    heads: dict[str, LedgerOutbox] = {}
    for row in rows:
        heads.setdefault(row.lot_id, row)
    return list(heads.values())


def push(session: Session, lot_id: str | None = None, now: datetime | None = None,
         keys: set[str] | None = None) -> dict:
    """Confirma pelo intake.json (se `keys`), depois envia a cabeça de cada doação. Faz commit."""
    now = now or utcnow()
    counts = {"confirmed": 0, "sent": 0, "failed": 0, "waiting": 0, "disabled": 0}
    if keys is not None:
        for row in session.scalars(select(LedgerOutbox).where(LedgerOutbox.status.in_(OPEN))):
            if f"alimenta:{row.event_id}" in keys:
                row.status, row.confirmed_at = "confirmed", now
                counts["confirmed"] += 1
        session.flush()
    for row in _heads(session):
        if lot_id is not None and row.lot_id != lot_id:
            continue
        if not enabled():
            counts["disabled"] += 1
            continue
        fresh = row.status == "sent" and aware(row.sent_at) > now - RESEND_AFTER
        if fresh or row.attempts >= MAX_ATTEMPTS:
            counts["waiting"] += 1
            continue
        _dispatch(row, now)
        counts["sent" if row.status == "sent" else "failed"] += 1
    session.commit()
    return counts


def sweep(session: Session, now: datetime | None = None) -> dict:
    keys = published_keys() if enabled() else None
    counts = push(session, now=now, keys=keys)
    numbered = attach_sequences(session, published_sequences()) if keys is not None else 0
    session.commit()
    return {**counts, "numbered": numbered, "intake_read": keys is not None}


def status_of(session: Session, lot: Lot) -> list[dict]:
    rows = session.scalars(select(LedgerOutbox).where(LedgerOutbox.lot_id == lot.id).order_by(LedgerOutbox.id))
    return [{"action": r.action, "event_id": r.event_id, "ledger_sequence": r.ledger_sequence,
             "status": "in_ledger" if r.status == "confirmed" else "entering_ledger"} for r in rows]
