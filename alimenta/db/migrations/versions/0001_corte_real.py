"""Corte real: contas, ofertas, confirmações, desfechos e livro

Revision ID: 0001_corte_real
Revises: (nenhuma: banco novo; o banco antigo do corte 1 não é migrado, ver entregas)

Cria o esquema inteiro do corte real e, no Postgres, liga RLS sem política em toda tabela.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = '0001_corte_real'
down_revision = None
branch_labels = None
depends_on = None

TABLES = ("accounts", "audit_log", "ledger_events", "consents", "donors", "ngos", "lots", "lot_offers",
          "matches", "lot_outcomes", "notifications", "confirmations", "public_ledger_dispatches")


def upgrade() -> None:
    op.create_table('accounts',
    sa.Column('id', sa.String(length=64), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('role', sa.String(length=16), nullable=True),
    sa.Column('org_id', sa.String(length=16), nullable=True),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('disabled_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_table('audit_log',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('actor', sa.String(length=254), nullable=False),
    sa.Column('action', sa.String(length=40), nullable=False),
    sa.Column('target', sa.String(length=80), nullable=False),
    sa.Column('note', sa.Text(), nullable=True),
    sa.Column('at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('ledger_events',
    sa.Column('sequence', sa.Integer(), autoincrement=False, nullable=False),
    sa.Column('hash', sa.String(length=64), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.PrimaryKeyConstraint('sequence'),
    sa.UniqueConstraint('hash')
    )
    op.create_table('consents',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('account_id', sa.String(length=64), nullable=False),
    sa.Column('kind', sa.String(length=32), nullable=False),
    sa.Column('version', sa.String(length=40), nullable=False),
    sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('consents', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_consents_account_id'), ['account_id'], unique=False)

    op.create_table('donors',
    sa.Column('id', sa.String(length=16), nullable=False),
    sa.Column('account_id', sa.String(length=64), nullable=True),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('kind', sa.String(length=32), nullable=False),
    sa.Column('region', sa.String(length=16), nullable=False),
    sa.Column('lat', sa.Float(), nullable=False),
    sa.Column('lon', sa.Float(), nullable=False),
    sa.Column('doc_type', sa.String(length=8), nullable=False),
    sa.Column('doc_number', sa.String(length=14), nullable=True),
    sa.Column('doc_check', sa.JSON(), nullable=True),
    sa.Column('pickup_hours', sa.String(length=16), nullable=True),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('legal_name', sa.String(length=160), nullable=True),
    sa.Column('contact_name', sa.String(length=80), nullable=True),
    sa.Column('phone', sa.String(length=13), nullable=True),
    sa.Column('cep', sa.String(length=8), nullable=True),
    sa.Column('street', sa.String(length=120), nullable=True),
    sa.Column('number', sa.String(length=20), nullable=True),
    sa.Column('district', sa.String(length=80), nullable=True),
    sa.Column('city', sa.String(length=80), nullable=True),
    sa.Column('uf', sa.String(length=2), nullable=True),
    sa.Column('geo_source', sa.String(length=32), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('account_id')
    )
    with op.batch_alter_table('donors', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_donors_region'), ['region'], unique=False)

    op.create_table('ngos',
    sa.Column('id', sa.String(length=16), nullable=False),
    sa.Column('account_id', sa.String(length=64), nullable=True),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('region', sa.String(length=16), nullable=False),
    sa.Column('lat', sa.Float(), nullable=False),
    sa.Column('lon', sa.Float(), nullable=False),
    sa.Column('accepted_categories', sa.JSON(), nullable=False),
    sa.Column('daily_capacity_kg', sa.Integer(), nullable=False),
    sa.Column('window', sa.String(length=16), nullable=False),
    sa.Column('cnpj', sa.String(length=14), nullable=True),
    sa.Column('cnpj_check', sa.JSON(), nullable=True),
    sa.Column('accepts_refrigerated', sa.Boolean(), nullable=False),
    sa.Column('accepts_frozen', sa.Boolean(), nullable=False),
    sa.Column('pickup_radius_km', sa.Float(), nullable=False),
    sa.Column('approval_status', sa.String(length=16), nullable=False),
    sa.Column('approved_by', sa.String(length=254), nullable=True),
    sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('review_note', sa.Text(), nullable=True),
    sa.Column('legal_name', sa.String(length=160), nullable=True),
    sa.Column('contact_name', sa.String(length=80), nullable=True),
    sa.Column('phone', sa.String(length=13), nullable=True),
    sa.Column('cep', sa.String(length=8), nullable=True),
    sa.Column('street', sa.String(length=120), nullable=True),
    sa.Column('number', sa.String(length=20), nullable=True),
    sa.Column('district', sa.String(length=80), nullable=True),
    sa.Column('city', sa.String(length=80), nullable=True),
    sa.Column('uf', sa.String(length=2), nullable=True),
    sa.Column('geo_source', sa.String(length=32), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('account_id')
    )
    with op.batch_alter_table('ngos', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_ngos_approval_status'), ['approval_status'], unique=False)
        batch_op.create_index(batch_op.f('ix_ngos_region'), ['region'], unique=False)

    op.create_table('lots',
    sa.Column('id', sa.String(length=16), nullable=False),
    sa.Column('donor_id', sa.String(length=16), nullable=False),
    sa.Column('created_by', sa.String(length=64), nullable=True),
    sa.Column('category', sa.String(length=32), nullable=False),
    sa.Column('storage', sa.String(length=16), nullable=False),
    sa.Column('kg', sa.Float(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('pickup_from', sa.DateTime(timezone=True), nullable=True),
    sa.Column('pickup_until', sa.DateTime(timezone=True), nullable=True),
    sa.Column('delivery_mode', sa.String(length=16), nullable=False),
    sa.Column('photo_path', sa.String(length=200), nullable=True),
    sa.Column('terms_version', sa.String(length=40), nullable=True),
    sa.Column('features', sa.JSON(), nullable=True),
    sa.Column('discard_proba', sa.Float(), nullable=False),
    sa.Column('risk_level', sa.String(length=8), nullable=False),
    sa.Column('model_version', sa.String(length=32), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['donor_id'], ['donors.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('lots', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_lots_donor_id'), ['donor_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_lots_status'), ['status'], unique=False)

    op.create_table('lot_offers',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('lot_id', sa.String(length=16), nullable=False),
    sa.Column('ngo_id', sa.String(length=16), nullable=False),
    sa.Column('rank', sa.Integer(), nullable=False),
    sa.Column('score', sa.Float(), nullable=False),
    sa.Column('distance_km', sa.Float(), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('offered_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('respond_by', sa.DateTime(timezone=True), nullable=False),
    sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('decline_reason', sa.String(length=32), nullable=True),
    sa.ForeignKeyConstraint(['lot_id'], ['lots.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['ngo_id'], ['ngos.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('lot_offers', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_lot_offers_lot_id'), ['lot_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_lot_offers_ngo_id'), ['ngo_id'], unique=False)
        batch_op.create_index('uq_lot_offers_pending', ['lot_id'], unique=True, sqlite_where=sa.text("status = 'pending'"), postgresql_where=sa.text("status = 'pending'"))

    op.create_table('lot_outcomes',
    sa.Column('lot_id', sa.String(length=16), nullable=False),
    sa.Column('outcome', sa.String(length=16), nullable=False),
    sa.Column('features', sa.JSON(), nullable=True),
    sa.Column('discard_proba', sa.Float(), nullable=False),
    sa.Column('model_version', sa.String(length=32), nullable=False),
    sa.Column('decided_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('is_test', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['lot_id'], ['lots.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('lot_id')
    )
    op.create_table('matches',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('lot_id', sa.String(length=16), nullable=False),
    sa.Column('ngo_id', sa.String(length=16), nullable=False),
    sa.Column('offer_id', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('score', sa.Float(), nullable=False),
    sa.Column('distance_km', sa.Float(), nullable=False),
    sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('collected_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('ledger_sequence', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['lot_id'], ['lots.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['ngo_id'], ['ngos.id'], ),
    sa.ForeignKeyConstraint(['offer_id'], ['lot_offers.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('matches', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_matches_lot_id'), ['lot_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_matches_ngo_id'), ['ngo_id'], unique=False)
        batch_op.create_index('uq_matches_active_lot', ['lot_id'], unique=True, sqlite_where=sa.text("status <> 'cancelled'"), postgresql_where=sa.text("status <> 'cancelled'"))

    op.create_table('notifications',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('ngo_id', sa.String(length=16), nullable=False),
    sa.Column('offer_id', sa.Integer(), nullable=True),
    sa.Column('channel', sa.String(length=16), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['ngo_id'], ['ngos.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['offer_id'], ['lot_offers.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_notifications_ngo_id'), ['ngo_id'], unique=False)

    op.create_table('confirmations',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('match_id', sa.Integer(), nullable=False),
    sa.Column('kind', sa.String(length=16), nullable=False),
    sa.Column('account_id', sa.String(length=64), nullable=True),
    sa.Column('at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('match_id', 'kind', name='uq_confirmations_match_kind')
    )
    with op.batch_alter_table('confirmations', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_confirmations_match_id'), ['match_id'], unique=False)

    op.create_table('public_ledger_dispatches',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('match_id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.String(length=80), nullable=False),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('dispatched_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('http_status', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['match_id'], ['matches.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('event_id'),
    sa.UniqueConstraint('match_id')
    )
    if op.get_bind().dialect.name == "postgresql":
        for table in TABLES:
            op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    op.drop_table('public_ledger_dispatches')
    with op.batch_alter_table('confirmations', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_confirmations_match_id'))

    op.drop_table('confirmations')
    with op.batch_alter_table('notifications', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_notifications_ngo_id'))

    op.drop_table('notifications')
    with op.batch_alter_table('matches', schema=None) as batch_op:
        batch_op.drop_index('uq_matches_active_lot', sqlite_where=sa.text("status <> 'cancelled'"), postgresql_where=sa.text("status <> 'cancelled'"))
        batch_op.drop_index(batch_op.f('ix_matches_ngo_id'))
        batch_op.drop_index(batch_op.f('ix_matches_lot_id'))

    op.drop_table('matches')
    op.drop_table('lot_outcomes')
    with op.batch_alter_table('lot_offers', schema=None) as batch_op:
        batch_op.drop_index('uq_lot_offers_pending', sqlite_where=sa.text("status = 'pending'"), postgresql_where=sa.text("status = 'pending'"))
        batch_op.drop_index(batch_op.f('ix_lot_offers_ngo_id'))
        batch_op.drop_index(batch_op.f('ix_lot_offers_lot_id'))

    op.drop_table('lot_offers')
    with op.batch_alter_table('lots', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_lots_status'))
        batch_op.drop_index(batch_op.f('ix_lots_donor_id'))

    op.drop_table('lots')
    with op.batch_alter_table('ngos', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_ngos_region'))
        batch_op.drop_index(batch_op.f('ix_ngos_approval_status'))

    op.drop_table('ngos')
    with op.batch_alter_table('donors', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_donors_region'))

    op.drop_table('donors')
    with op.batch_alter_table('consents', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_consents_account_id'))

    op.drop_table('consents')
    op.drop_table('ledger_events')
    op.drop_table('audit_log')
    op.drop_table('accounts')
