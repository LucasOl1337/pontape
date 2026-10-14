"""CEP e CNPJ pela BrasilAPI, com timeout curto, cache em memória e falha honesta.

CEP: GET https://brasilapi.com.br/api/cep/v2/{cep} (location.coordinates; às vezes vem vazio).
CNPJ: GET https://brasilapi.com.br/api/cnpj/v1/{cnpj}. Docs: https://brasilapi.com.br/docs
(acesso 14/10/2026). Se a BrasilAPI cair ou demorar, nada é inventado: o CEP volta sem
coordenada (`geo_source = "pending"`) e o CNPJ vai para revisão manual (`status = "unavailable"`).
"""

from __future__ import annotations

import os
import time

import httpx

BASE = os.environ.get("ALIMENTA_BRASILAPI_URL", "https://brasilapi.com.br/api").rstrip("/")
TIMEOUT_S = 6
TTL_S = 24 * 3600
SAO_PAULO_IBGE = "3550308"
_cache: dict[str, tuple[float, dict]] = {}


class Unavailable(Exception):
    """BrasilAPI fora do ar, lenta ou com resposta inesperada."""


class NotFoundUpstream(Exception):
    """CEP ou CNPJ não existe na fonte."""


def _get(path: str) -> dict:
    hit = _cache.get(path)
    if hit and hit[0] > time.monotonic():
        return hit[1]
    try:
        r = httpx.get(f"{BASE}{path}", timeout=TIMEOUT_S, headers={"User-Agent": "rede-alimenta/1 (pontape.org)"})
    except httpx.HTTPError as exc:
        raise Unavailable(f"BrasilAPI não respondeu: {exc.__class__.__name__}") from exc
    if r.status_code == 404:
        raise NotFoundUpstream(path)
    if r.status_code != 200:
        raise Unavailable(f"BrasilAPI respondeu {r.status_code}")
    try:
        data = r.json()
    except ValueError as exc:
        raise Unavailable("BrasilAPI respondeu algo que não é JSON") from exc
    _cache[path] = (time.monotonic() + TTL_S, data)
    return data


def cep(code: str) -> dict:
    """Endereço do CEP. lat/lon None quando a fonte não traz coordenada."""
    data = _get(f"/cep/v2/{code}")
    coords = ((data.get("location") or {}).get("coordinates") or {})
    try:
        lat, lon = float(coords["latitude"]), float(coords["longitude"])
        source = f"brasilapi:{data.get('service', '?')}"
    except (KeyError, TypeError, ValueError):
        lat = lon = None
        source = "pending"
    ibge = str(((data.get("ibge") or {}).get("city")) or "")
    return {"cep": code, "street": data.get("street") or "", "district": data.get("neighborhood") or "",
            "city": data.get("city") or "", "uf": data.get("state") or "", "ibge_city": ibge,
            "lat": lat, "lon": lon, "geo_source": source}


def cnpj(number: str) -> dict:
    """Recorte do cadastro da Receita (sem sócios: o QSA nunca é guardado)."""
    data = _get(f"/cnpj/v1/{number}")
    return {"razao_social": data.get("razao_social") or "", "nome_fantasia": data.get("nome_fantasia") or "",
            "situacao": (data.get("descricao_situacao_cadastral") or "").upper(),
            "codigo_natureza_juridica": data.get("codigo_natureza_juridica"),
            "natureza_juridica": data.get("natureza_juridica") or "",
            "cnae_fiscal": data.get("cnae_fiscal"), "data_inicio_atividade": data.get("data_inicio_atividade"),
            "municipio_ibge": str(data.get("codigo_municipio_ibge") or ""), "uf": data.get("uf") or ""}
