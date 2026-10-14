"""Formatos de entrada e saída da API (Pydantic)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["produce", "bakery", "dairy", "prepared_meal", "dry_goods"]
Storage = Literal["ambient", "refrigerated", "frozen"]
Region = Literal["center", "north", "south", "east", "west"]


class Orm(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class DonorIn(BaseModel):
    name: str = Field(min_length=3, max_length=80, examples=["Doador Exemplo 99"])
    kind: Literal["supermarket", "bakery", "restaurant", "street_market", "distributor"]
    region: Region
    lat: float = Field(ge=-24.1, le=-23.3)
    lon: float = Field(ge=-47.0, le=-46.3)


class DonorOut(Orm):
    id: str
    name: str
    kind: str
    region: str
    lat: float
    lon: float


class NgoIn(BaseModel):
    name: str = Field(min_length=3, max_length=80, examples=["ONG Exemplo 99"])
    region: Region
    lat: float = Field(ge=-24.1, le=-23.3)
    lon: float = Field(ge=-47.0, le=-46.3)
    accepted_categories: list[Category] = Field(min_length=1)
    daily_capacity_kg: int = Field(gt=0, le=10000)
    window: str = Field(default="08:00-17:00", pattern=r"^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$")


class NgoOut(Orm):
    id: str
    name: str
    region: str
    lat: float
    lon: float
    accepted_categories: list[str]
    daily_capacity_kg: int
    window: str


class LotIn(BaseModel):
    donor_id: str = Field(examples=["D03"])
    category: Category
    storage: Storage
    kg: float = Field(gt=0, le=5000, examples=[12.5])
    expires_at: datetime = Field(description="Validade, ISO 8601 com fuso (ex.: 2026-10-15T20:00:00-03:00)")
    description: str = Field(default="", max_length=280)


class LotOut(Orm):
    id: str
    donor_id: str
    category: str
    storage: str
    kg: float
    description: str
    published_at: datetime
    expires_at: datetime
    discard_proba: float
    risk_level: str
    model_version: str
    status: str


class MatchIn(BaseModel):
    ngo_id: str = Field(examples=["N18"])


class MatchOut(Orm):
    id: int
    lot_id: str
    ngo_id: str
    status: str
    score: float
    distance_km: float
    proposed_at: datetime
    confirmed_at: datetime | None
    collected_at: datetime | None
    delivered_at: datetime | None
    cancelled_at: datetime | None
    ledger_sequence: int | None
