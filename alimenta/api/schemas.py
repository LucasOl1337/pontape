"""Contratos da API (Pydantic). Erros de validação viram 422 com `detail`."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["produce", "bakery", "dairy", "meat", "prepared_meal", "dry_goods", "beverages"]
Storage = Literal["ambient", "refrigerated", "frozen"]
DonorKind = Literal["person", "company", "distributor"]
EMAIL = r"^[^@\s]{1,64}@[^@\s]{1,190}\.[A-Za-z]{2,}$"
UF = r"^[A-Za-z]{2}$"
DISTRIBUTOR = r"^[a-z0-9]{1,30}(?:-[a-z0-9]{1,30}){0,7}$"


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class CodeIn(Strict):
    email: str = Field(pattern=EMAIL, max_length=254)


class VerifyIn(Strict):
    email: str = Field(pattern=EMAIL, max_length=254)
    code: str = Field(pattern=r"^[0-9]{6}$")


class ConsentIn(Strict):
    kind: Literal["donation_terms", "privacy_notice"]
    version: str = Field(max_length=40)


class DonorIn(Strict):
    """Cadastro mínimo: sem CPF, endereço, telefone ou nome."""
    kind: DonorKind
    city: str = Field(min_length=2, max_length=80)
    uf: str = Field(pattern=UF)
    cnpj: str | None = Field(default=None, max_length=18)
    distributor_id: str | None = Field(default=None, pattern=DISTRIBUTOR, max_length=64)
    donation_terms_version: str = Field(max_length=40)
    privacy_notice_version: str = Field(max_length=40)


class DonorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    kind: str
    city: str | None
    uf: str | None
    has_cnpj: bool = False
    distributor_id: str | None
    status: str
    is_test: bool


class DonationIn(Strict):
    category: Category
    storage: Storage
    kg: float = Field(gt=0, le=5000, examples=[12.5])
    expires_at: datetime = Field(description="Validade, ISO 8601 com fuso (ex.: 2026-10-15T20:00:00-03:00)")
    city: str = Field(min_length=2, max_length=80)
    uf: str = Field(pattern=UF)


class DestinationIn(Strict):
    distributor_id: str = Field(pattern=DISTRIBUTOR, max_length=64)
    from_recommendation: bool = False


class Empty(Strict):
    pass
