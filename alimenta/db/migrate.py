"""Migrações versionadas (Alembic). Substitui o create_all do corte 1.

Da raiz do repositório:
    DATABASE_URL=... alimenta/.venv/bin/python -m alimenta.db.migrate          # upgrade head
    DATABASE_URL=... alimenta/.venv/bin/python -m alimenta.db.migrate current  # revisão atual

No Postgres, toda tabela fica com RLS ligado e sem política: a Data API do Supabase não lê
nem escreve; a API conecta como dona das tabelas. A URL do banco nunca é impressa.
"""

from __future__ import annotations

import sys
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy.engine import Engine

from alimenta.db.session import make_engine

MIGRATIONS = Path(__file__).resolve().parent / "migrations"
HEAD = "0002_somente_doador"


def alembic_config() -> Config:
    cfg = Config()
    cfg.set_main_option("script_location", str(MIGRATIONS))
    return cfg


def upgrade(engine: Engine) -> None:
    with engine.begin() as conn:
        cfg = alembic_config()
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")


def current(engine: Engine) -> str | None:
    with engine.connect() as conn:
        return MigrationContext.configure(conn).get_current_revision()


def main(argv: list[str]) -> int:
    engine = make_engine()
    if argv[:1] == ["current"]:
        print(f"revisão: {current(engine)} · banco: {engine.dialect.name}")
        return 0
    upgrade(engine)
    print(f"migrado até {current(engine)} · banco: {engine.dialect.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
