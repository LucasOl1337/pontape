"""Livro da demo: v1 exato em gramas, conferido pelo tools/conferir.py sem mudança."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from alimenta.ledger import demo_ledger

ROOT = Path(__file__).resolve().parents[2]
T = datetime(2026, 10, 15, 2, 30, tzinfo=timezone.utc)  # 23:30 de 14/10 em São Paulo


def test_event_shape_and_hash_exact():
    event = demo_ledger.build_event(1, "0" * 64, T, T, 12.5)
    assert event["payload"] == {"type": "field", "action": "food_delivered", "occurredOn": "2026-10-14",
                                "correctionOf": None, "quantity": "12500"}
    assert event["recordedAt"] == "2026-10-15T02:30:00.000Z"
    assert set(event) == {"schemaVersion", "sequence", "previousHash", "recordedAt", "payload", "hash"}
    # SHA-256 do JCS do envelope sem hash, calculado à parte com tools/conferir.jcs + hashlib.
    assert event["hash"] == "05f03c9a37c9637d560cff84f65a14fff9a6243bc1fac098179f1a45efb865d3"


def test_grams_rounding():
    assert [demo_ledger.grams(kg) for kg in (0.001, 1.0, 12.3456, 250.0)] == ["1", "1000", "12346", "250000"]


def test_chain_verifies_and_tampering_fails():
    first = demo_ledger.build_event(1, "0" * 64, T, T, 12.5)
    second = demo_ledger.build_event(2, first["hash"], T, T, 3.0)
    doc = {"notice": demo_ledger.NOTICE, "events": [first, second]}
    result = demo_ledger.verify_document(doc)
    assert result["ok"] is True and result["events"] == 2 and result["total_grams"] == 15500
    tampered = json.loads(json.dumps(doc))
    tampered["events"][0]["payload"]["quantity"] = "99999"
    bad = demo_ledger.verify_document(tampered)
    assert bad["ok"] is False and "Linha 1" in bad["message"]


def test_cli_conferir_accepts_exported_ledger(session, tmp_path):
    path = tmp_path / "livro-demo.json"
    path.write_text(json.dumps(demo_ledger.export(session), ensure_ascii=False), encoding="utf-8")
    out = subprocess.run([sys.executable, str(ROOT / "tools" / "conferir.py"), str(path)],
                         capture_output=True, text=True, check=False)
    assert out.returncode == 0, out.stdout
    assert out.stdout.startswith("Tudo certo: 119 ações")


def test_notice_names_demo_ledger_not_real():
    assert "pontape-alimenta-demo" in demo_ledger.NOTICE
    assert "não é o livro real" in demo_ledger.NOTICE
    assert demo_ledger.LEDGER_NAME != "vidanova-public-actions"
