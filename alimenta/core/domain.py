"""Vocabulário fixo da Rede Alimenta (DEMONSTRAÇÃO · dados simulados).

Identificadores em inglês; rótulos em PT-BR para a interface.
As caixas de região são aproximações da cidade de São Paulo, só para sortear
pontos fictícios. Nenhum ponto é endereço real.
"""

from __future__ import annotations

import math

DEMO_LABEL = "DEMONSTRAÇÃO · dados simulados"

# Região: rótulo, caixa (lat_min, lat_max, lon_min, lon_max).
REGIONS: dict[str, dict] = {
    "center": {"label": "Centro", "box": (-23.565, -23.530, -46.665, -46.620)},
    "north": {"label": "Norte", "box": (-23.500, -23.450, -46.700, -46.560)},
    "south": {"label": "Sul", "box": (-23.700, -23.620, -46.720, -46.640)},
    "east": {"label": "Leste", "box": (-23.580, -23.520, -46.550, -46.420)},
    "west": {"label": "Oeste", "box": (-23.600, -23.545, -46.760, -46.700)},
}

CATEGORIES: dict[str, str] = {
    "produce": "Hortifrúti",
    "bakery": "Padaria",
    "dairy": "Laticínios",
    "prepared_meal": "Refeição pronta",
    "dry_goods": "Secos",
}

STORAGE: dict[str, str] = {
    "ambient": "Ambiente",
    "refrigerated": "Refrigerado",
    "frozen": "Congelado",
}

# Estimativa declarada: 1 refeição ≈ 0,544 kg (1,2 lb).
# Fonte: Feeding America, https://www.feedingamerica.org/ways-to-give/faq/about-our-claims
# (acesso 14/10/2026). Exibida sempre como "refeições estimadas".
KG_PER_MEAL = 0.544

# Limiares da probabilidade de descarte para o nível de risco exibido.
RISK_THRESHOLDS = (0.33, 0.66)


def risk_level(proba: float) -> str:
    low, high = RISK_THRESHOLDS
    if proba < low:
        return "low"
    if proba < high:
        return "medium"
    return "high"


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distância em linha reta (km) entre dois pontos."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
