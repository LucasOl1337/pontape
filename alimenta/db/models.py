"""Tabelas da Rede Alimenta (DEMONSTRAÇÃO · dados simulados)."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Index, Integer, String, Text, text
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


class Donor(Base):
    __tablename__ = "donors"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    kind: Mapped[str] = mapped_column(String(32))
    region: Mapped[str] = mapped_column(String(16), index=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)


class Ngo(Base):
    __tablename__ = "ngos"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    region: Mapped[str] = mapped_column(String(16), index=True)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    accepted_categories: Mapped[list] = mapped_column(JSON)
    daily_capacity_kg: Mapped[int] = mapped_column(Integer)
    window: Mapped[str] = mapped_column(String(16))


class Lot(Base):
    __tablename__ = "lots"
    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    donor_id: Mapped[str] = mapped_column(ForeignKey("donors.id"), index=True)
    category: Mapped[str] = mapped_column(String(32))
    storage: Mapped[str] = mapped_column(String(16))
    kg: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(Text, default="")
    published_at: Mapped[datetime] = mapped_column(UTCDateTime())
    expires_at: Mapped[datetime] = mapped_column(UTCDateTime())
    discard_proba: Mapped[float] = mapped_column(Float)
    risk_level: Mapped[str] = mapped_column(String(8))
    model_version: Mapped[str] = mapped_column(String(32))
    # open → matched → delivered (cancelar o match devolve para open)
    status: Mapped[str] = mapped_column(String(16), default="open", index=True)


class Match(Base):
    __tablename__ = "matches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lot_id: Mapped[str] = mapped_column(ForeignKey("lots.id"), index=True)
    ngo_id: Mapped[str] = mapped_column(ForeignKey("ngos.id"), index=True)
    # proposed → confirmed → collected → delivered; cancelled libera o lote
    status: Mapped[str] = mapped_column(String(16), default="proposed")
    score: Mapped[float] = mapped_column(Float, default=0.0)
    distance_km: Mapped[float] = mapped_column(Float, default=0.0)
    proposed_at: Mapped[datetime] = mapped_column(UTCDateTime())
    confirmed_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    collected_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(UTCDateTime(), nullable=True)
    ledger_sequence: Mapped[int | None] = mapped_column(Integer, nullable=True)

    __table_args__ = (
        # Impede dupla atribuição no próprio banco: um único match ativo por lote.
        Index("uq_matches_active_lot", "lot_id", unique=True,
              sqlite_where=text("status <> 'cancelled'"),
              postgresql_where=text("status <> 'cancelled'")),
    )


class DemoLedgerEvent(Base):
    """Livro da DEMO `pontape-alimenta-demo`. Só INSERT. Nunca é o livro real."""
    __tablename__ = "demo_ledger_events"
    sequence: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    hash: Mapped[str] = mapped_column(String(64), unique=True)
    body: Mapped[str] = mapped_column(Text)  # evento v1 inteiro em bytes JCS
