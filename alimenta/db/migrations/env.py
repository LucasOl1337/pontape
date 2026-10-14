"""Ambiente do Alembic. A conexão vem de `config.attributes["connection"]` (alimenta/db/migrate.py)
ou de DATABASE_URL. A URL nunca é impressa."""

from __future__ import annotations

from alembic import context
from sqlalchemy import pool

from alimenta.db.models import Base
from alimenta.db.session import make_engine

config = context.config
target_metadata = Base.metadata


def run(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata,
                      render_as_batch=connection.dialect.name == "sqlite")
    with context.begin_transaction():
        context.run_migrations()


connection = config.attributes.get("connection")
if connection is not None:
    run(connection)
else:
    engine = make_engine()
    engine.pool = pool.NullPool(engine.pool._creator)  # noqa: SLF001 - uma conexão só
    with engine.connect() as conn:
        run(conn)
