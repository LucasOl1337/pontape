"""Fila do livro público: desligada sem token, uma cabeça por doação, confirmação pelo intake.json,
reenvio depois de RESEND_AFTER, número da ação no livro e envelope que o livro TS aceita."""

from __future__ import annotations

import json
from datetime import timedelta

from sqlalchemy import select

from alimenta.core.clock import utcnow
from alimenta.db.models import LedgerOutbox
from alimenta.ledger import outbox
from alimenta.tests.conftest import OPS, donation_body

BANK = "sp-municipal-food-bank"


def rows(sessions):
    with sessions() as s:
        return [(r.event_id.split(":", 1)[1], r.status, r.attempts) for r in
                s.scalars(select(LedgerOutbox).order_by(LedgerOutbox.id))]


def sweep(api):
    r = api.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": OPS})
    assert r.status_code == 200, r.text
    return r.json()["ledger"]


def two_actions(api, real_donor) -> str:
    d = api.post("/donations", json=donation_body(), headers=real_donor["h"]).json()
    api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK}, headers=real_donor["h"])
    return d["public_ref"]


def test_disabled_means_no_network(api, real_donor, net, sessions):
    two_actions(api, real_donor)
    assert sweep(api) == {"confirmed": 0, "sent": 0, "failed": 0, "waiting": 0, "disabled": 1, "numbered": 0,
                          "intake_read": False}
    assert net.log == [] or all("github" not in url for _, url in net.log)
    assert [s for _, s, _ in rows(sessions)] == ["pending", "pending"]


def test_one_head_per_donation_then_confirm_then_next(api, real_donor, net, sessions, monkeypatch):
    monkeypatch.setenv("ALIMENTA_PUBLISH_REAL_LEDGER", "true")
    monkeypatch.setenv("ALIMENTA_LEDGER_DISPATCH_TOKEN", "token-falso")
    ref = two_actions(api, real_donor)  # o registro já sai na hora; o destino espera o registro aparecer na main
    assert rows(sessions) == [("1:donation_registered", "sent", 1), ("2:destination_chosen", "pending", 0)]
    dispatch = [b for b in net.bodies if "inputs" in b]
    assert dispatch == [{"ref": "main", "inputs": {"event": dispatch[0]["inputs"]["event"]}}]
    envelope = json.loads(dispatch[0]["inputs"]["event"])
    assert envelope["source"] == "alimenta" and envelope["eventId"] == f"{ref}:1:donation_registered"
    assert ("POST", "https://api.github.com/repos/LucasOl1337/pontape/actions/workflows/ledger-ingest.yml/dispatches") \
        in net.log
    # Ainda não apareceu na main: espera, sem reenviar.
    first = sweep(api)
    assert (first["waiting"], first["sent"], first["intake_read"]) == (1, 0, True)
    net.intake = {"keys": [f"alimenta:{ref}:1:donation_registered"]}
    net.ledger = {"events": [{"sequence": "146", "payload": {"type": "donation", "donationRef": ref}}]}
    second = sweep(api)
    assert (second["confirmed"], second["sent"], second["numbered"]) == (1, 1, 1)
    assert rows(sessions) == [("1:donation_registered", "confirmed", 1), ("2:destination_chosen", "sent", 1)]
    view = api.get("/donations/mine", headers=real_donor["h"]).json()[0]
    assert view["ledger"][0] == {"action": "donation_registered", "event_id": f"{ref}:1:donation_registered",
                                 "ledger_sequence": "146", "status": "in_ledger"}
    assert view["ledger_sequence"] == "146"


def test_resend_after_window_and_failure(api, real_donor, net, sessions, monkeypatch):
    monkeypatch.setenv("ALIMENTA_PUBLISH_REAL_LEDGER", "true")
    monkeypatch.setenv("ALIMENTA_LEDGER_DISPATCH_TOKEN", "token-falso")
    net.dispatch_status = 500
    two_actions(api, real_donor)
    assert rows(sessions)[0] == ("1:donation_registered", "failed", 2)  # na hora e de novo ao escolher destino
    net.dispatch_status = 204
    assert sweep(api)["sent"] == 1  # falha reenvia na próxima varredura
    with sessions() as s:
        assert outbox.push(s, now=utcnow() + timedelta(minutes=19), keys=set())["waiting"] == 1
        assert outbox.push(s, now=utcnow() + timedelta(minutes=21), keys=set())["sent"] == 1
    assert rows(sessions)[0] == ("1:donation_registered", "sent", 4)


def test_sweep_needs_ops_token(api):
    assert api.post("/ops/sweep").status_code == 401
    assert api.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": "errado"}).status_code == 401


def test_envelope_is_accepted_by_ts_schema_shape(api, real_donor, sessions):
    """O mesmo formato do fixture do livro (src/data/ledger/donation.fixture.json)."""
    from pathlib import Path
    two_actions(api, real_donor)
    with sessions() as s:
        envs = [json.loads(r.envelope) for r in s.scalars(select(LedgerOutbox).order_by(LedgerOutbox.id))]
    fixture = json.loads((Path(__file__).resolve().parents[2] / "src/data/ledger/donation.fixture.json").read_text())
    events = fixture["events"] if isinstance(fixture, dict) else fixture
    by_action = {e["payload"]["action"]: set(e["payload"]) for e in events}
    for env in envs:
        assert set(env["payload"]) == by_action[env["payload"]["action"]]
