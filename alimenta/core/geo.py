"""Região derivada da coordenada: centroide mais perto entre as 5 macrorregiões do modelo.

Só a cidade de São Paulo (IBGE 3550308) é atendida no lançamento (Q4): o modelo só conhece
essas 5 regiões.
"""

from __future__ import annotations

from alimenta.core.domain import REGIONS, haversine_km, region_centroid

SERVED_CITY_IBGE = "3550308"


def nearest_region(lat: float, lon: float) -> str:
    return min(REGIONS, key=lambda r: (haversine_km(lat, lon, *region_centroid(r)), r))
