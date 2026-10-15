"""Tabelas da Rede Alimenta (corte real). O esquema muda só por migração (alimenta/db/migrations).

Corte r6 (só doador): o papel aberto é `donor`; `operator` vem da env. As tabelas de ONG, oferta, match e
confirmação continuam no banco, vazias, até uma limpeza futura (migração 0002 é só aditiva).
Um usuário Supabase (`sub`) = uma conta = um papel = um cadastro.
`is_test` marca contas de teste do time: tudo o que elas criam herda a marca, fica fora de KPI
público e do livro, e o ensaio apaga no fim.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import TypeDecorator


class UTCDateTime(TypeDecorator):
    """Grava em UTC e devolve sempre com fuso (o SQLite perde o fuso)."""
    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value, _dialect):
        if value is not None:
            value = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value, _dialect):
        if value is not None:
            value = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
        return value


class Base(DeclarativeBase):
    pass


class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # = sub do JWT do Supabase
    email: Mapped[str] = mapped_column(String(254), unique=True)
    role: Mapped[str | None] = mapped_column(String(16), nullable=True)  # donor | ngo (operator vem da env)
    org_id: Mapped[str | None] = mapped_column(String(16), nullable=True)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime())
    disabled_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)


class Consent(Base):
    """Só INSERT: cada aceite é uma linha com a versão do texto aceito."""
    __tablename__ = "consents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(32))  # donation_terms | privacy_notice
    version: Mapped[str] = mapped_column(String(40))
    accepted_at: Mapped[datetime] = mapped_column(UTCDateTime())


class OrgMixin:
    """Campos comuns de doador e ONG: razão social, contato e endereço (nunca saem em rota pública)."""
    legal_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(13), nullable=True)  # só dígitos, DDD + número
    cep: Mapped[str | None] = mapped_column(String(8), nullable=True)
    street: Mapped[str | None] = mapped_column(String(120), nullable=True)
    number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    district: Mapped[str | None] = mapped_column(String(80), nullable=True)
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    geo_source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)


class Donor(OrgMixin, Base):
    __tablename__ = "donors"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    account_id: Mapped[str | None] = mapped_column(ForeignKey("accounts.id"), unique=True, nullable=True)
    name: Mapped[str | None] = mapped_column(String(80), nullable=True)  # nome de exibição, privado e opcional
    kind: Mapped[str] = mapped_column(String(32))  # person | company | distributor
    region: Mapped[str | None] = mapped_column(String(16), index=True, nullable=True)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lon: Mapped[float | None] = mapped_column(Float, nullable=True)
    distributor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)  # distribuidor do catálogo que doa
    doc_type: Mapped[str] = mapped_column(String(8), default="cnpj")
    doc_number: Mapped[str | None] = mapped_column(String(14), nullable=True)
    doc_check: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    pickup_hours: Mapped[str | None] = mapped_column(String(16), nullable=True)  # HH:MM-HH:MM
    status: Mapped[str] = mapped_column(String(16), default="active")  # active | suspended


class Ngo(OrgMixin, Base):
    __tablename__ = "ngos"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    account_id: Mapped[str | None] = mapped_column(ForeignKey("accounts.id"), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(80))
    region: Mapped[str] = mapped_column(String(16), index=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    accepted_categories: Mapped[list] = mapped_column(JSON)
    daily_capacity_kg: Mapped[int] = mapped_column(Integer)
    window: Mapped[str] = mapped_column(String(16))  # receive_window diária, HH:MM-HH:MM (São Paulo)
    cnpj: Mapped[str | None] = mapped_column(String(14), nullable=True)
    cnpj_check: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    accepts_refrigerated: Mapped[bool] = mapped_column(Boolean, default=True)
    accepts_frozen: Mapped[bool] = mapped_column(Boolean, default=False)
    pickup_radius_km: Mapped[float] = mapped_column(Float, default=25.0)
    approval_status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    approved_by: Mapped[str | None] = mapped_column(String(254), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class Lot(Base):
    __tablename__ = "lots"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    donor_id: Mapped[str] = mapped_column(ForeignKey("donors.id"), index=True)
    created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)  # accounts.id
    category: Mapped[str] = mapped_column(String(32))
    storage: Mapped[str] = mapped_column(String(16))
    kg: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(Text, default="")
    published_at: Mapped[datetime] = mapped_column(UTCDateTime())
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime())
    pickup_from: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    pickup_until: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    delivery_mode: Mapped[str] = mapped_column(String(16), default="ngo_pickup")  # ngo_pickup | donor_delivers
    photo_path: Mapped[str | None] = mapped_column(String(200), nullable=True)  # fila: Storage privado
    terms_version: Mapped[str | None] = mapped_column(String(40), nullable=True)  # termo reafirmado no lote
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # entrada do modelo congelada
    discard_proba: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(8))
    model_version: Mapped[str] = mapped_column(String(32))
    # Doação (r6): registered → destination_chosen → delivered; ou cancelled | expired
    status: Mapped[str] = mapped_column(String(16), default="open", index=True)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)
    public_ref: Mapped[str | None] = mapped_column(String(10), nullable=True)  # donationRef do livro
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    distributor_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    destination_choice: Mapped[str | None] = mapped_column(String(8), nullable=True)  # ai_top | other
    destination_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)

    __table_args__ = (UniqueConstraint("public_ref", name="uq_lots_public_ref"),)


class LotOffer(Base):
    __tablename__ = "lot_offers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), index=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id"), index=True)
    rank: Mapped[int] = mapped_column(Integer)
    score: Mapped[float] = mapped_column(Float)
    distance_km: Mapped[float] = mapped_column(Float)
    # pending | accepted | declined | timed_out | withdrawn
    status: Mapped[str] = mapped_column(String(16), default="pending")
    offered_at: Mapped[datetime] = mapped_column(UTCDateTime())
    respond_by: Mapped[datetime] = mapped_column(UTCDateTime())
    responded_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    decline_reason: Mapped[str | None] = mapped_column(String(32), nullable=True)

    __table_args__ = (
        # Uma oferta pendente por lote: escalonamento é uma ONG por vez.
        Index("uq_lot_offers_pending", "lot_id", unique=True,
              sqlite_where=text("status = 'pending'"), postgresql_where=text("status = 'pending'")),
    )


class Match(Base):
    __tablename__ = "matches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), index=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id"), index=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("lot_offers.id", ondelete="SET NULL"), nullable=True)
    # accepted → collected → delivered; cancelled libera o lote
    status: Mapped[str] = mapped_column(String(16), default="accepted")
    score: Mapped[float] = mapped_column(Float, default=0.0)
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    accepted_at: Mapped[datetime] = mapped_column(UTCDateTime())
    collected_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    ledger_sequence: Mapped[int | None] = mapped_column(Integer, nullable=True)

    __table_args__ = (
        # Impede dupla atribuição no próprio banco: um único match ativo por lote.
        Index("uq_matches_active_lot", "lot_id", unique=True,
              sqlite_where=text("status <> 'cancelled'"), postgresql_where=text("status <> 'cancelled'")),
    )


class Confirmation(Base):
    """Dupla confirmação: `pickup` (doador entregou à ONG) e `receipt` (ONG recebeu)."""
    __tablename__ = "confirmations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(16))
    account_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    at: Mapped[datetime] = mapped_column(UTCDateTime())

    __table_args__ = (UniqueConstraint("match_id", "kind", name="uq_confirmations_match_kind"),)


class LotOutcome(Base):
    """Desfecho de cada lote fechado: rótulo de retreino `discarded = outcome in (expired, unclaimed)`."""
    __tablename__ = "lot_outcomes"
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), primary_key=True)
    outcome: Mapped[str] = mapped_column(String(16))  # delivered | expired | unclaimed | cancelled
    features: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    discard_proba: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(32))
    decided_at: Mapped[datetime] = mapped_column(UTCDateTime())
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id", ondelete="CASCADE"), index=True)
    offer_id: Mapped[int | None] = mapped_column(ForeignKey("lot_offers.id", ondelete="CASCADE"), nullable=True)
    channel: Mapped[str] = mapped_column(String(16))  # inbox | email | whatsapp_link
    status: Mapped[str] = mapped_column(String(16))  # created | sent | failed
    created_at: Mapped[datetime] = mapped_column(UTCDateTime())
    sent_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor: Mapped[str] = mapped_column(String(254))
    action: Mapped[str] = mapped_column(String(40))
    target: Mapped[str] = mapped_column(String(80))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    at: Mapped[datetime] = mapped_column(UTCDateTime())
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)


class LedgerEvent(Base):
    """Livro `pontape-alimenta`. Só INSERT. Só entrega real (sem is_test) com dupla confirmação."""
    __tablename__ = "ledger_events"
    sequence: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    hash: Mapped[str] = mapped_column(String(64), unique=True)
    body: Mapped[str] = mapped_column(Text)  # evento v1 inteiro em bytes JCS


class PublicLedgerDispatch(Base):
    """Envio de uma entrega ao livro real do pontape.org (desligado por ALIMENTA_PUBLISH_REAL_LEDGER)."""
    __tablename__ = "public_ledger_dispatches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), unique=True)
    event_id: Mapped[str] = mapped_column(String(80), unique=True)
    status: Mapped[str] = mapped_column(String(16))  # disabled | sent | failed
    dispatched_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Distributor(Base):
    """Catálogo público (src/data/alimenta/distribuidores.json), sincronizado ao subir. Nunca apaga: `active=false`."""
    __tablename__ = "distributors"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    kind: Mapped[str] = mapped_column(String(32))
    city: Mapped[str] = mapped_column(String(80))
    city_key: Mapped[str] = mapped_column(String(80), index=True)  # cidade sem acento e em minúsculas
    uf: Mapped[str | None] = mapped_column(String(2), nullable=True)
    area: Mapped[str | None] = mapped_column(String(32), nullable=True)
    accepts: Mapped[list] = mapped_column(JSON)
    receives_from: Mapped[list] = mapped_column(JSON)
    accepts_prepared_meals: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    hours: Mapped[str | None] = mapped_column(Text, nullable=True)
    how_to_donate: Mapped[str | None] = mapped_column(Text, nullable=True)
    capacity_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    address_public: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sources: Mapped[list] = mapped_column(JSON)
    confidence: Mapped[str | None] = mapped_column(String(16), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    synced_at: Mapped[datetime] = mapped_column(UTCDateTime())


class Recommendation(Base):
    """Cada pedido de recomendação: entrada, páginas lidas, saída e a escolha. Privada; mede a AI depois."""
    __tablename__ = "recommendations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id", ondelete="CASCADE"), index=True)
    mode: Mapped[str] = mapped_column(String(8))  # ai | rule
    model: Mapped[str | None] = mapped_column(String(80), nullable=True)
    input: Mapped[dict] = mapped_column(JSON)
    reads: Mapped[list] = mapped_column(JSON)
    output: Mapped[dict] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(String(200), nullable=True)
    choice: Mapped[str | None] = mapped_column(String(16), nullable=True)  # accepted_top | picked_other
    created_at: Mapped[datetime] = mapped_column(UTCDateTime())
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)


class LedgerOutbox(Base):
    """Fila de saída para o livro público do pontape.org. Conta de teste nunca entra.

    pending → sent (workflow aceitou) → confirmed (chave apareceu no intake.json da main); failed volta na varredura.
    """
    __tablename__ = "ledger_outbox"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(String(80), unique=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id"), index=True)
    action: Mapped[str] = mapped_column(String(32))
    envelope: Mapped[str] = mapped_column(Text)  # JSON {source, eventId, payload}
    status: Mapped[str] = mapped_column(String(16), default="pending", index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    http_status: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(UTCDateTime())
    sent_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    ledger_sequence: Mapped[str | None] = mapped_column(String(20), nullable=True)  # nº da ação no livro público


class AccountDeletion(Base):
    """Pedido de apagar conta (DELETE /me). Guarda só o `sub` do Supabase, nunca o e-mail."""
    __tablename__ = "account_deletions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    account_sub: Mapped[str] = mapped_column(String(64))
    requested_at: Mapped[datetime] = mapped_column(UTCDateTime())
    # deleted | pending (sem chave de serviço) | failed | skipped_local
    supabase_status: Mapped[str] = mapped_column(String(16))
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    done_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)
