"""Catálogo público de distribuidores de comida (`src/data/alimenta/distribuidores.json`).

O site lê o mesmo arquivo no build; a API lê ao subir e sincroniza a tabela `distributors`
(upsert por `id`; quem sai do arquivo vira `active=false`, nunca é apagado). Registro sem
fonte (`sources[].url`) ou com `id` fora do formato do livro faz a subida falhar: é dado real,
revisado em PR, não seed.
"""

from __future__ import annotations

import json
import os
import re
import unicodedata
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.core.clock import utcnow
from alimenta.db.models import Distributor

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PATH = ROOT / "src" / "data" / "alimenta" / "distribuidores.json"
ID = re.compile(r"[a-z0-9]{1,30}(?:-[a-z0-9]{1,30}){0,7}")
# Categorias do catálogo (pesquisa do Mapa) para as da doação; `prepared` é o mesmo que `prepared_meal`.
CATEGORY_ALIASES = {"prepared": "prepared_meal"}
UFS = frozenset("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())


class CatalogError(ValueError):
    """Catálogo fora do formato: a API não sobe com ele."""


def city_key(city: str) -> str:
    """Cidade comparável: sem acento, minúscula, espaços simples."""
    plain = unicodedata.normalize("NFKD", city).encode("ascii", "ignore").decode("ascii")
    return " ".join(plain.lower().split())


def catalog_path() -> Path:
    return Path(os.environ.get("ALIMENTA_CATALOG_PATH") or DEFAULT_PATH)


def _http_url(url: object) -> bool:
    if not isinstance(url, str) or len(url) > 500:
        return False
    parts = urlsplit(url)
    return parts.scheme in ("http", "https") and bool(parts.hostname)


def validate(records: object) -> list[dict]:
    if not isinstance(records, list) or not records:
        raise CatalogError("catálogo precisa ser uma lista com pelo menos um distribuidor")
    seen = set()
    for index, record in enumerate(records, 1):
        rid = record.get("id") if isinstance(record, dict) else None
        if not isinstance(rid, str) or len(rid) > 64 or not ID.fullmatch(rid):
            raise CatalogError(f"registro {index}: id fora do formato do livro")
        if rid in seen:
            raise CatalogError(f"registro {index}: id repetido {rid}")
        seen.add(rid)
        for field in ("name", "kind", "city"):
            if not isinstance(record.get(field), str) or not record[field].strip():
                raise CatalogError(f"{rid}: falta {field}")
        sources = record.get("sources")
        if not isinstance(sources, list) or not sources or not all(
                isinstance(s, dict) and _http_url(s.get("url")) for s in sources):
            raise CatalogError(f"{rid}: sem fonte pública (sources[].url)")
        if record.get("public_contact_url") is not None and not _http_url(record["public_contact_url"]):
            raise CatalogError(f"{rid}: public_contact_url inválida")
        uf = record.get("uf")
        if uf is not None and uf not in UFS:
            raise CatalogError(f"{rid}: uf inválida")
    return records


@lru_cache(maxsize=4)
def _load(path: str, mtime_ns: int) -> tuple[dict, ...]:
    del mtime_ns  # só invalida o cache quando o arquivo muda
    return tuple(validate(json.loads(Path(path).read_text(encoding="utf-8"))))


def load() -> list[dict]:
    path = catalog_path()
    if not path.is_file():
        raise CatalogError(f"catálogo não encontrado em {path} (defina ALIMENTA_CATALOG_PATH)")
    return list(_load(str(path), path.stat().st_mtime_ns))


def categories_of(record: dict) -> set[str]:
    cats = {CATEGORY_ALIASES.get(c, c) for c in record.get("accepts") or []}
    if record.get("accepts_prepared_meals") is True:
        cats.add("prepared_meal")
    return cats


def allowed_urls(record: dict) -> set[str]:
    """URLs que a AI pode ler e citar para este distribuidor: as fontes e a página de contato."""
    urls = {s["url"] for s in record["sources"]}
    if record.get("public_contact_url"):
        urls.add(record["public_contact_url"])
    return urls


def sync(session: Session, now: datetime | None = None) -> dict:
    """Upsert por id; quem saiu do arquivo fica `active=false`. Faz commit."""
    now = now or utcnow()
    records = {r["id"]: r for r in load()}
    existing = {d.id: d for d in session.scalars(select(Distributor))}
    for rid, r in records.items():
        row = existing.get(rid) or Distributor(id=rid)
        row.name, row.kind, row.city, row.city_key = r["name"], r["kind"], r["city"], city_key(r["city"])
        row.uf, row.area = r.get("uf"), r.get("region")
        row.accepts, row.receives_from = list(r.get("accepts") or []), list(r.get("receives_from") or [])
        row.accepts_prepared_meals = r.get("accepts_prepared_meals")
        row.hours, row.how_to_donate = r.get("hours_public"), r.get("how_to_donate")
        row.capacity_note, row.address_public = r.get("capacity_note"), r.get("address_public")
        row.contact_url, row.sources, row.confidence = r.get("public_contact_url"), r["sources"], r.get("confidence")
        row.active, row.synced_at = True, now
        session.add(row)
    gone = [d for rid, d in existing.items() if rid not in records and d.active]
    for row in gone:
        row.active, row.synced_at = False, now
    session.commit()
    return {"active": len(records), "deactivated": len(gone)}


def by_id(distributor_id: str) -> dict | None:
    return next((r for r in load() if r["id"] == distributor_id), None)
