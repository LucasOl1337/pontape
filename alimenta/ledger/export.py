"""Exporta o livro da demo de um banco para JSON `{notice, events}`.

Uso, da raiz do repositório:
    DATABASE_URL=... python -m alimenta.ledger.export livro-demo.json
    python3 tools/conferir.py livro-demo.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.ledger.demo_ledger import export


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print("Uso: python -m alimenta.ledger.export CAMINHO.json", file=sys.stderr)
        return 1
    with make_sessionmaker(make_engine())() as session:
        document = export(session)
    Path(argv[1]).write_text(json.dumps(document, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(document['events'])} eventos gravados em {argv[1]}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
