"""A migração versionada cria exatamente o esquema dos modelos (nenhuma diferença no autogenerate)."""

from __future__ import annotations

from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect

from alimenta.db import migrate
from alimenta.db.models import Base


def test_migration_matches_models(engine):
    assert migrate.current(engine) == migrate.HEAD == "0002_somente_doador"
    with engine.connect() as conn:
        diff = compare_metadata(MigrationContext.configure(conn), Base.metadata)
    assert diff == []


def test_tables_and_partial_unique_indexes(engine):
    names = set(inspect(engine).get_table_names())
    assert names == {"alembic_version", "accounts", "consents", "donors", "ngos", "lots", "lot_offers", "matches",
                     "confirmations", "lot_outcomes", "notifications", "audit_log", "ledger_events",
                     "public_ledger_dispatches", "distributors", "recommendations", "ledger_outbox",
                     "account_deletions"}
    offers = {i["name"]: i for i in inspect(engine).get_indexes("lot_offers")}
    assert offers["uq_lot_offers_pending"]["unique"] == 1


def test_upgrade_twice_is_noop(engine):
    migrate.upgrade(engine)
    assert migrate.current(engine) == "0002_somente_doador"
