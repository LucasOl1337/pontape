"""Testes do conferidor independente, sem importar o código JavaScript do livro."""

import copy
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from tools.conferir import jcs


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "conferir.py"
DATA = ROOT / "design" / "prototipo" / "ledger"
PUBLISHED = ROOT / "src" / "data" / "ledger"
VECTOR_HASH = "a8183311eaf2313a098f25b08352e4676b9555c4a3c752efc024c60063c3d454"


def contract_vector():
    event = {
        "schemaVersion": 1,
        "sequence": "1",
        "previousHash": "0" * 64,
        "recordedAt": "2000-01-02T12:00:00.000Z",
        "payload": {
            "type": "field",
            "action": "food_delivered",
            "occurredOn": "2000-01-01",
            "correctionOf": None,
            "quantity": "1",
        },
        "hash": VECTOR_HASH,
    }
    checkpoint = {
        "schemaVersion": 1,
        "ledger": "vidanova-public-actions",
        "sequence": "1",
        "headHash": VECTOR_HASH,
        "generatedAt": "2000-01-02T12:00:00.000Z",
    }
    return {"events": [event], "checkpoint": checkpoint}


def run_book(path):
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(path)],
        capture_output=True,
        text=True,
        check=False,
    )


class ConferirTest(unittest.TestCase):
    def test_fixed_contract_vector(self):
        document = contract_vector()
        unsigned = {key: value for key, value in document["events"][0].items() if key != "hash"}
        self.assertEqual(hashlib.sha256(jcs(unsigned).encode("utf-8")).hexdigest(), VECTOR_HASH)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "vetor.json"
            path.write_text(jcs(document), encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Tudo certo: 1 ação", result.stdout)

    def test_existing_books_pass(self):
        for name, count in (("real", 21), ("sample", 18)):
            with self.subTest(name=name):
                result = run_book(DATA / f"{name}.json")
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn(f"Tudo certo: {count} ações", result.stdout)
        self.assertIn("R$ 4.101,40", run_book(DATA / "sample.json").stdout)

    def test_published_book_and_contract_fixture_pass(self):
        for name in ("ledger.json", "conformance.fixture.json"):
            with self.subTest(name=name):
                result = run_book(PUBLISHED / name)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("Tudo certo:", result.stdout)

    def test_first_bad_line_for_four_adulterations(self):
        original = json.loads((DATA / "sample.json").read_text(encoding="utf-8"))
        for kind in ("campo", "apagado", "ordem", "hash"):
            with self.subTest(kind=kind):
                document = copy.deepcopy(original)
                events = document["events"]
                if kind == "campo":
                    events[0]["payload"]["occurredOn"] = "2026-01-01"
                    expected = "Linha 1: hash não confere"
                elif kind == "apagado":
                    del events[1]
                    expected = "Linha 2: sequência esperada 2"
                elif kind == "ordem":
                    events[1], events[2] = events[2], events[1]
                    expected = "Linha 2: sequência esperada 2"
                else:
                    events[0]["hash"] = "0" * 64
                    expected = "Linha 1: hash não confere"
                with tempfile.TemporaryDirectory() as directory:
                    path = Path(directory) / "adulterado.json"
                    path.write_text(json.dumps(document, ensure_ascii=False), encoding="utf-8")
                    result = run_book(path)
                self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
                self.assertIn(expected, result.stdout)

    def test_duplicate_json_key_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "duplicado.json"
            path.write_text('{"events":[],"events":[]}', encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 1)
        self.assertIn("chave JSON repetida", result.stdout)

    def test_future_fact_date_is_rejected(self):
        document = json.loads((DATA / "real.json").read_text(encoding="utf-8"))
        document[0]["payload"]["occurredOn"] = "2099-01-01"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data-futura.json"
            path.write_text(json.dumps(document, ensure_ascii=False), encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Linha 1: occurredOn posterior a recordedAt", result.stdout)

    def test_recomputed_hash_cannot_authorize_extra_payload_field(self):
        document = contract_vector()
        event = document["events"][0]
        event["payload"]["name"] = "não permitido"
        unsigned = {key: value for key, value in event.items() if key != "hash"}
        event["hash"] = hashlib.sha256(jcs(unsigned).encode("utf-8")).hexdigest()
        document["checkpoint"]["headHash"] = event["hash"]
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "campo-extra.json"
            path.write_text(jcs(document), encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Linha 1: payload tem campo ausente ou extra", result.stdout)

    def test_checkpoint_detects_removed_suffix(self):
        document = contract_vector()
        document["events"] = []
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fim-apagado.json"
            path.write_text(jcs(document), encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 1)
        self.assertIn("checkpoint: sequence diferente", result.stdout)

    def test_production_document_requires_exact_jcs_bytes(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "livro.json"
            path.write_text(jcs(contract_vector()) + "\n", encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 1)
        self.assertIn("documento de produção não está em bytes JCS exatos", result.stdout)

    def test_malformed_unicode_in_notice_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "unicode.json"
            path.write_text('{"notice":"\\ud800","events":[]}', encoding="utf-8")
            result = run_book(path)
        self.assertEqual(result.returncode, 1)
        self.assertIn("substituto Unicode isolado", result.stdout)


if __name__ == "__main__":
    unittest.main()
