"""Testes do conferidor independente, sem importar o código JavaScript do livro."""

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "conferir.py"
DATA = ROOT / "design" / "prototipo" / "ledger"


def run_book(path):
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(path)],
        capture_output=True,
        text=True,
        check=False,
    )


class ConferirTest(unittest.TestCase):
    def test_existing_books_pass(self):
        for name, count in (("real", 21), ("sample", 18)):
            with self.subTest(name=name):
                result = run_book(DATA / f"{name}.json")
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn(f"Tudo certo: {count} ações", result.stdout)
        self.assertIn("R$ 4.101,40", run_book(DATA / "sample.json").stdout)

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


if __name__ == "__main__":
    unittest.main()
