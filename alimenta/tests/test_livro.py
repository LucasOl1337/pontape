"""Livro pontape-alimenta (v1 exato, gramas, tools/conferir.py) e envio ao livro real desligado por flag."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
from sqlalchemy import select

from alimenta.db.models import PublicLedgerDispatch
from alimenta.db.session import make_sessionmaker
from alimenta.ledger import book, public
from alimenta.tests.conftest import h, lot_body, make_donor, make_ngo

ROOT = Path(__file__).resolve().parents[2]
T = datetime(2026, 10, 15, 2, 30, tzinfo=timezone.utc)  # 23:30 de 14/10 em São Paulo
REAL_D, REAL_N = "real@empresa-real.com.br", "real@ong-real.org.br"


def test_event_shape_and_hash_exact():
    event = book.build_event(1, "0" * 64, T, T, 12.5)
    assert event["payload"] == {"type": "field", "action": "food_delivered", "occurredOn": "2026-10-14",
                                "correctionOf": None, "quantity": "12500"}
    assert event["recordedAt"] == "2026-10-15T02:30:00.000Z"
    assert event["hash"] == "05f03c9a37c9637d560cff84f65a14fff9a6243bc1fac098179f1a45efb865d3"


def test_grams_rounding():
    assert [book.grams(kg) for kg in (0.001, 1.0, 12.3456, 250.0)] == ["1", "1000", "12346", "250000"]


def test_chain_verifies_and_tampering_fails():
    first = book.build_event(1, "0" * 64, T, T, 12.5)
    second = book.build_event(2, first["hash"], T, T, 3.0)
    doc = {"notice": book.NOTICE, "events": [first, second]}
    result = book.verify_document(doc)
    assert result["ok"] is True and result["events"] == 2 and result["total_grams"] == 15500
    tampered = json.loads(json.dumps(doc))
    tampered["events"][0]["payload"]["quantity"] = "99999"
    bad = book.verify_document(tampered)
    assert bad["ok"] is False and "Linha 1" in bad["message"]


def test_cli_conferir_accepts_exported_ledger(session, tmp_path):
    path = tmp_path / "livro.json"
    path.write_text(json.dumps(book.export(session), ensure_ascii=False), encoding="utf-8")
    out = subprocess.run([sys.executable, str(ROOT / "tools" / "conferir.py"), str(path)],
                         capture_output=True, text=True, check=False)
    assert out.returncode == 0, out.stdout
    assert out.stdout.startswith("Tudo certo: 119 ações")


def test_ledger_name_is_own_book():
    assert book.LEDGER_NAME == "pontape-alimenta"
    assert "contas de teste nunca entram" in book.NOTICE


def test_envelope_is_contract_v1():
    assert public.envelope(7, T) == {"source": "alimenta", "eventId": "delivery-7", "payload": {
        "type": "field", "action": "food_delivered", "occurredOn": "2026-10-14", "correctionOf": None, "quantity": "1"}}


def deliver_real(api, monkeypatch):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    make_donor(api, REAL_D)
    make_ngo(api, REAL_N)
    lot = api.post("/lots", json=lot_body(), headers=h(REAL_D)).json()
    offer = api.get("/offers/mine", headers=h(REAL_N)).json()[0]
    match = api.post(f"/offers/{offer['id']}/accept", headers=h(REAL_N)).json()
    api.post(f"/matches/{match['id']}/pickup", headers=h(REAL_D))
    return lot, api.post(f"/matches/{match['id']}/receipt", headers=h(REAL_N)).json()


def test_flag_off_makes_no_network_call(api, engine, monkeypatch):
    monkeypatch.setenv("ALIMENTA_LEDGER_DISPATCH_TOKEN", "token-falso")
    monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("rede com flag off")))
    _lot, match = deliver_real(api, monkeypatch)
    assert match["status"] == "delivered" and match["ledger_sequence"] == 1
    with make_sessionmaker(engine)() as s:
        rows = s.scalars(select(PublicLedgerDispatch)).all()
        assert [(r.event_id, r.status, r.http_status) for r in rows] == [(f"delivery-{match['id']}", "disabled", None)]


def test_flag_on_dispatches_workflow_once(api, engine, monkeypatch):
    monkeypatch.setenv("ALIMENTA_PUBLISH_REAL_LEDGER", "true")
    monkeypatch.setenv("ALIMENTA_LEDGER_DISPATCH_TOKEN", "token-falso")
    sent = []

    def fake_post(url, json, timeout, headers):
        sent.append((url, json, headers["Authorization"]))
        return httpx.Response(204, request=httpx.Request("POST", url))

    monkeypatch.setattr(httpx, "post", fake_post)
    _lot, match = deliver_real(api, monkeypatch)
    url, body, auth = sent[0]
    assert len(sent) == 1 and auth == "Bearer token-falso"
    assert url == "https://api.github.com/repos/LucasOl1337/pontape/actions/workflows/ledger-ingest.yml/dispatches"
    event = json.loads(body["inputs"]["event"])
    assert body["ref"] == "main" and event["eventId"] == f"delivery-{match['id']}" and event["payload"]["quantity"] == "1"
    with make_sessionmaker(engine)() as s:
        row = s.scalar(select(PublicLedgerDispatch))
        assert (row.status, row.http_status) == ("sent", 204)
        public.dispatch(s, match["id"], T, T)  # de novo: já enviado, não chama
    assert len(sent) == 1


def test_test_accounts_never_reach_any_ledger(api, pair, engine, monkeypatch):
    monkeypatch.setenv("ALIMENTA_PUBLISH_REAL_LEDGER", "true")
    monkeypatch.setenv("ALIMENTA_LEDGER_DISPATCH_TOKEN", "token-falso")
    monkeypatch.setattr(httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("teste foi à rede")))
    api.post("/lots", json=lot_body(), headers=pair["d"])
    offer = api.get("/offers/mine", headers=pair["n"]).json()[0]
    match = api.post(f"/offers/{offer['id']}/accept", headers=pair["n"]).json()
    api.post(f"/matches/{match['id']}/pickup", headers=pair["d"])
    assert api.post(f"/matches/{match['id']}/receipt", headers=pair["n"]).json()["status"] == "delivered"
    assert api.get("/ledger").json()["events"] == []
    with make_sessionmaker(engine)() as s:
        assert s.scalars(select(PublicLedgerDispatch)).all() == []
