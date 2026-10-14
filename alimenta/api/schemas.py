"""Formatos de entrada e saída da API (Pydantic). Saída pública nunca traz nome, endereço ou coordenada."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["produce", "bakery", "dairy", "prepared_meal", "dry_goods"]
Storage = Literal["ambient", "refrigerated", "frozen"]
DonorKind = Literal["supermarket", "bakery", "restaurant", "street_market", "distributor", "producer", "other"]
HOURS = r"^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$"
EMAIL = r"^[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,}$"


class Orm(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CodeIn(BaseModel):
    email: str = Field(pattern=EMAIL, max_length=254)


class VerifyIn(BaseModel):
    email: str = Field(pattern=EMAIL, max_length=254)
    code: str = Field(pattern=r"^[0-9]{6}$")


class ConsentIn(BaseModel):
    kind: Literal["donation_terms", "privacy_notice"]
    version: str = Field(max_length=40)


class OrgIn(BaseModel):
    cnpj: str = Field(min_length=14, max_length=18, examples=["12.ABC.345/01DE-35"])
    legal_name: str | None = Field(default=None, max_length=160)
    contact_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=10, max_length=20, examples=["11 91234-5678"])
    cep: str = Field(min_length=8, max_length=9, examples=["01310-100"])
    number: str = Field(min_length=1, max_length=20)
    lat: float | None = Field(default=None, ge=-24.1, le=-23.3, description="Só se o CEP vier sem coordenada")
    lon: float | None = Field(default=None, ge=-47.0, le=-46.3)
    donation_terms_version: str = Field(examples=["termo-de-doacao-v1"])
    privacy_notice_version: str = Field(examples=["aviso-de-privacidade-v1"])


class DonorIn(OrgIn):
    trade_name: str = Field(min_length=2, max_length=80)
    kind: DonorKind
    pickup_hours: str = Field(default="08:00-18:00", pattern=HOURS)


class DonorPatch(BaseModel):
    contact_name: str | None = Field(default=None, min_length=2, max_length=80)
    phone: str | None = Field(default=None, min_length=10, max_length=20)
    pickup_hours: str | None = Field(default=None, pattern=HOURS)


class NgoIn(OrgIn):
    name: str = Field(min_length=2, max_length=80)
    accepted_categories: list[Category] = Field(min_length=1)
    daily_capacity_kg: int = Field(gt=0, le=10000)
    receive_window: str = Field(default="08:00-17:00", pattern=HOURS)
    accepts_refrigerated: bool = False
    accepts_frozen: bool = False
    pickup_radius_km: float = Field(default=15.0, gt=0, le=40)


class OrgOut(Orm):
    """Visão do dono e do operador (nunca pública)."""
    id: str
    name: str
    legal_name: str | None
    region: str
    cep: str | None
    street: str | None
    number: str | None
    district: str | None
    city: str | None
    lat: float
    lon: float
    geo_source: str | None
    contact_name: str | None
    phone: str | None
    is_test: bool


class DonorOut(OrgOut):
    kind: str
    doc_number: str | None
    doc_check: dict | None
    pickup_hours: str | None
    status: str


class NgoOut(OrgOut):
    cnpj: str | None
    cnpj_check: dict | None
    accepted_categories: list[str]
    daily_capacity_kg: int
    window: str
    accepts_refrigerated: bool
    accepts_frozen: bool
    pickup_radius_km: float
    approval_status: str
    approved_by: str | None
    approved_at: datetime | None
    review_note: str | None


class LotIn(BaseModel):
    category: Category
    storage: Storage
    kg: float = Field(gt=0, le=5000, examples=[12.5])
    expires_at: datetime = Field(description="Validade, ISO 8601 com fuso (ex.: 2026-10-15T20:00:00-03:00)")
    pickup_from: datetime | None = None
    pickup_until: datetime | None = None
    delivery_mode: Literal["ngo_pickup", "donor_delivers"] = "ngo_pickup"
    description: str = Field(default="", max_length=280)
    terms_version: str = Field(description="Reafirma o termo: dentro da validade e conservado como o fabricante manda",
                               examples=["termo-de-doacao-v1"])


class LotOut(Orm):
    id: str
    donor_id: str
    category: str
    storage: str
    kg: float
    description: str
    published_at: datetime
    expires_at: datetime
    pickup_from: datetime | None
    pickup_until: datetime | None
    delivery_mode: str
    terms_version: str | None
    discard_proba: float
    risk_level: str
    model_version: str
    status: str
    is_test: bool


class OfferOut(Orm):
    id: int
    lot_id: str
    ngo_id: str
    rank: int
    score: float
    distance_km: float
    status: str
    offered_at: datetime
    respond_by: datetime
    responded_at: datetime | None
    decline_reason: str | None


class DeclineIn(BaseModel):
    reason: Literal["no_capacity", "no_transport", "category_not_needed", "window_conflict",
                    "too_far", "storage_unavailable", "other"]


class MatchOut(Orm):
    id: int
    lot_id: str
    ngo_id: str
    offer_id: int | None
    status: str
    accepted_at: datetime
    collected_at: datetime | None
    delivered_at: datetime | None
    cancelled_at: datetime | None
    ledger_sequence: int | None


class ReviewIn(BaseModel):
    note: str | None = Field(default=None, max_length=500)
