"""Esquema do banco. O seed de exemplo da r5 (ONG, oferta, livro próprio) saiu no corte r6, que é só doador.

O ensaio (`alimenta/scripts/ensaio.sh`) cria dados com contas de teste e apaga tudo no fim.
"""

from __future__ import annotations

from sqlalchemy.engine import Engine


def create_schema(engine: Engine) -> None:
    """Esquema pelas migrações (alimenta/db/migrate.py), com RLS sem política no Postgres.

    No Supabase, tabela em `public` sem RLS fica aberta pela Data API com a chave
    publicável. Com RLS e nenhuma política, a Data API não lê nem escreve; a
    aplicação conecta como dona das tabelas e não é afetada.
    """
    from alimenta.db.migrate import upgrade

    upgrade(engine)
