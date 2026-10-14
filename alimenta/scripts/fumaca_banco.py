"""Fumaça contra um banco real: migra até a cabeça e só lê. Nunca grava dado de exemplo.

Lê DATABASE_URL do ambiente e nunca imprime a URL nem a senha. Confere: versão do servidor,
revisão Alembic, tabelas, RLS ligado em todas sem política, contagens, linhas de teste e KPI.

Uso, da raiz do repositório:
    DATABASE_URL=... alimenta/.venv/bin/python -m alimenta.scripts.fumaca_banco
"""

from __future__ import annotations

import os
import sys
import time

from sqlalchemy import func, select, text

from alimenta.core import kpis
from alimenta.db import migrate
from alimenta.db.models import Base
from alimenta.db.session import make_engine, make_sessionmaker

TEST_TABLES = ("accounts", "donors", "lots", "lot_outcomes", "recommendations", "audit_log", "account_deletions")


def main() -> int:
    if not os.environ.get("DATABASE_URL"):
        print("DATABASE_URL vazio.")
        return 1
    started = time.monotonic()
    engine = make_engine()
    if engine.dialect.name != "postgresql":
        print("este script é para Postgres")
        return 1
    with engine.connect() as conn:
        print(f"servidor: {conn.execute(text('SHOW server_version')).scalar()}")
    migrate.upgrade(engine)
    print(f"revisão: {migrate.current(engine)}")
    names = sorted(t.name for t in Base.metadata.sorted_tables)
    with make_sessionmaker(engine)() as session:
        rls = dict(session.execute(text(
            "SELECT c.relname, c.relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
            "WHERE n.nspname = 'public' AND c.relkind = 'r'")).all())
        missing = [n for n in names if not rls.get(n)]
        print(f"tabelas: {len(names)} · RLS ligado em todas: {not missing}" + (f" · sem RLS: {missing}" if missing else ""))
        policies = session.execute(text("SELECT count(*) FROM pg_policies WHERE schemaname = 'public'")).scalar()
        print(f"políticas RLS em public: {policies} (esperado 0: a Data API não lê nem escreve)")
        tables = {t.name: t for t in Base.metadata.sorted_tables}
        counts = {n: session.scalar(select(func.count()).select_from(tables[n])) for n in names}
        print(f"linhas: {counts}")
        tests = {n: session.scalar(select(func.count()).select_from(tables[n]).where(tables[n].c.is_test.is_(True)))
                 for n in TEST_TABLES}
        print(f"linhas is_test (devem ser 0 fora do ensaio): {tests}")
        k = kpis.compute(session)
        print(f"kpis públicos: doações={k['donations']} entregas={k['deliveries']} kg={k['kg_delivered']}")
    engine.dispose()
    ok = not missing and policies == 0
    print(f"tempo: {time.monotonic() - started:.1f} s · {'OK' if ok else 'FALHOU'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
