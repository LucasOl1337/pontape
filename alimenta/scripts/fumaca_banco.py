"""Teste de fumaça contra um banco real: create_all + seed idempotente + leitura.

Lê DATABASE_URL do ambiente e NUNCA imprime a URL nem a senha. Não apaga nada:
se o banco já tem dados, o seed é pulado e só a leitura roda.

Uso, da raiz do repositório:
    DATABASE_URL=... python -m alimenta.scripts.fumaca_banco
"""

from __future__ import annotations

import os
import sys
import time

from sqlalchemy import func, select, text

from alimenta.core import kpis
from alimenta.db.models import DemoLedgerEvent, Donor, Lot, Match, Ngo
from alimenta.db.seed import create_schema, seed
from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.ledger import demo_ledger


def main() -> int:
    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL vazio.")
        return 1
    started = time.monotonic()
    engine = make_engine()
    print(f"dialeto: {engine.dialect.name} · driver: {engine.dialect.driver}")
    with engine.connect() as conn:
        version = conn.execute(text("SHOW server_version")).scalar() if engine.dialect.name == "postgresql" else "sqlite"
        print(f"servidor: {version}")
    create_schema(engine)
    print("create_all: ok")
    with make_sessionmaker(engine)() as session:
        print(f"seed: {seed(session)}")
        counts = {m.__tablename__: session.scalar(select(func.count()).select_from(m))
                  for m in (Donor, Ngo, Lot, Match, DemoLedgerEvent)}
        print(f"linhas: {counts}")
        k = kpis.compute(session)
        print(f"kpis: kg_saved={k['kg_saved']} entregas={k['deliveries']} tempo_medio_min={k['avg_match_minutes']}")
        result = demo_ledger.verify_document(demo_ledger.export(session))
        print(f"livro da demo: {result['message']} · gramas={result.get('total_grams')}")
        index = session.execute(text(
            "SELECT indexdef FROM pg_indexes WHERE indexname = 'uq_matches_active_lot'")).scalar() \
            if engine.dialect.name == "postgresql" else "sqlite"
        print(f"índice parcial: {index}")
        if engine.dialect.name == "postgresql":
            rls = session.execute(text(
                "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN "
                "('donors','ngos','lots','matches','demo_ledger_events') ORDER BY relname")).all()
            print(f"RLS ligado: {dict(rls)}")
    engine.dispose()
    print(f"tempo: {time.monotonic() - started:.1f} s")
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    sys.exit(main())
