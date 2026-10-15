"""Só doador: catálogo de distribuidores, recomendações, fila do livro público e pedidos de apagar conta

Revision ID: 0002_somente_doador
Revises: 0001_corte_real

Aditiva: cria 4 tabelas, acrescenta colunas em `lots` e `donors` e afrouxa NOT NULL de campos de
endereço do doador (o cadastro r6 não pede endereço). Nada é apagado; ONG, oferta e match ficam vazias.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = '0002_somente_doador'
down_revision = '0001_corte_real'
branch_labels = None
depends_on = None

TABLES = ("distributors", "recommendations", "ledger_outbox", "account_deletions")


def upgrade() -> None:
    op.create_table('distributors',
    sa.Column('id', sa.String(length=64), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('kind', sa.String(length=32), nullable=False),
    sa.Column('city', sa.String(length=80), nullable=False),
    sa.Column('city_key', sa.String(length=80), nullable=False),
    sa.Column('uf', sa.String(length=2), nullable=True),
    sa.Column('area', sa.String(length=32), nullable=True),
    sa.Column('accepts', sa.JSON(), nullable=False),
    sa.Column('receives_from', sa.JSON(), nullable=False),
    sa.Column('accepts_prepared_meals', sa.Boolean(), nullable=True),
    sa.Column('hours', sa.Text(), nullable=True),
    sa.Column('how_to_donate', sa.Text(), nullable=True),
    sa.Column('capacity_note', sa.Text(), nullable=True),
    sa.Column('address_public', sa.Text(), nullable=True),
    sa.Column('contact_url', sa.String(length=500), nullable=True),
    sa.Column('sources', sa.JSON(), nullable=False),
    sa.Column('confidence', sa.String(length=16), nullable=True),
    sa.Column('active', sa.Boolean(), nullable=False),
    sa.Column('synced_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('distributors', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_distributors_city_key'), ['city_key'], unique=False)

    op.create_table('account_deletions',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('account_sub', sa.String(length=64), nullable=False),
    sa.Column('requested_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('supabase_status', sa.String(length=16), nullable=False),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.Column('done_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    with op.batch_alter_table('lots', schema=None) as batch_op:
        batch_op.add_column(sa.Column('public_ref', sa.String(length=10), nullable=True))
        batch_op.add_column(sa.Column('city', sa.String(length=80), nullable=True))
        batch_op.add_column(sa.Column('uf', sa.String(length=2), nullable=True))
        batch_op.add_column(sa.Column('distributor_id', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('destination_choice', sa.String(length=8), nullable=True))
        batch_op.add_column(sa.Column('destination_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_unique_constraint('uq_lots_public_ref', ['public_ref'])

    with op.batch_alter_table('donors', schema=None) as batch_op:
        batch_op.add_column(sa.Column('distributor_id', sa.String(length=64), nullable=True))
        batch_op.alter_column('name', existing_type=sa.String(length=80), nullable=True)
        batch_op.alter_column('region', existing_type=sa.String(length=16), nullable=True)
        batch_op.alter_column('lat', existing_type=sa.Float(), nullable=True)
        batch_op.alter_column('lon', existing_type=sa.Float(), nullable=True)

    op.create_table('recommendations',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('lot_id', sa.String(length=16), nullable=False),
    sa.Column('mode', sa.String(length=8), nullable=False),
    sa.Column('model', sa.String(length=80), nullable=True),
    sa.Column('input', sa.JSON(), nullable=False),
    sa.Column('reads', sa.JSON(), nullable=False),
    sa.Column('output', sa.JSON(), nullable=False),
    sa.Column('error', sa.String(length=200), nullable=True),
    sa.Column('choice', sa.String(length=16), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['lot_id'], ['lots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('recommendations', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_recommendations_lot_id'), ['lot_id'], unique=False)

    op.create_table('ledger_outbox',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('event_id', sa.String(length=80), nullable=False),
    sa.Column('lot_id', sa.String(length=16), nullable=False),
    sa.Column('action', sa.String(length=32), nullable=False),
    sa.Column('envelope', sa.Text(), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('attempts', sa.Integer(), nullable=False),
    sa.Column('http_status', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ledger_sequence', sa.String(length=20), nullable=True),
    sa.ForeignKeyConstraint(['lot_id'], ['lots.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('event_id')
    )
    with op.batch_alter_table('ledger_outbox', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_ledger_outbox_lot_id'), ['lot_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_ledger_outbox_status'), ['status'], unique=False)

    if op.get_bind().dialect.name == "postgresql":
        for table in TABLES:
            op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    with op.batch_alter_table('ledger_outbox', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_ledger_outbox_status'))
        batch_op.drop_index(batch_op.f('ix_ledger_outbox_lot_id'))
    op.drop_table('ledger_outbox')
    with op.batch_alter_table('recommendations', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_recommendations_lot_id'))
    op.drop_table('recommendations')
    with op.batch_alter_table('donors', schema=None) as batch_op:
        batch_op.drop_column('distributor_id')
    with op.batch_alter_table('lots', schema=None) as batch_op:
        batch_op.drop_constraint('uq_lots_public_ref', type_='unique')
        for column in ('closed_at', 'delivered_at', 'destination_at', 'destination_choice', 'distributor_id', 'uf',
                       'city', 'public_ref'):
            batch_op.drop_column(column)
    op.drop_table('account_deletions')
    with op.batch_alter_table('distributors', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_distributors_city_key'))
    op.drop_table('distributors')
