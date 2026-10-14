"""Rota de coleta de uma ONG: heurística do vizinho mais próximo.

É uma heurística gulosa, não otimização: o veículo sai da ONG, vai sempre ao
ponto de coleta ainda não visitado mais perto de onde está e, no fim, volta à
ONG. Não garante a menor rota possível (o problema exato é o do caixeiro
viajante). Distância em linha reta (haversine), não pelas ruas.

Lotes do mesmo doador viram uma parada só. Empate de distância: menor id do
doador, para a ordem ser sempre a mesma.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from alimenta.core.domain import haversine_km

METHOD = ("vizinho mais próximo: heurística gulosa que sai da ONG, vai sempre à parada mais perto ainda "
          "não visitada e volta à ONG; não garante a menor rota")
DISTANCE = "haversine (linha reta, raio da Terra 6.371 km), não é distância pelas ruas"


@dataclass(frozen=True)
class Point:
    id: str
    lat: float
    lon: float


@dataclass
class Stop:
    point: Point
    items: list = field(default_factory=list)


def nearest_neighbor(start: Point, stops: list[Stop]) -> dict:
    """Ordena as paradas a partir de `start` e devolve trechos e total em km."""
    pending = sorted(stops, key=lambda s: s.point.id)
    here, total = start, 0.0
    ordered: list[dict] = []
    while pending:
        nxt = min(pending, key=lambda s: (haversine_km(here.lat, here.lon, s.point.lat, s.point.lon), s.point.id))
        pending.remove(nxt)
        leg = haversine_km(here.lat, here.lon, nxt.point.lat, nxt.point.lon)
        total += leg
        ordered.append({"order": len(ordered) + 1, "id": nxt.point.id, "lat": nxt.point.lat, "lon": nxt.point.lon,
                        "from_id": here.id, "leg_km": round(leg, 2), "cumulative_km": round(total, 2),
                        "items": nxt.items})
        here = nxt.point
    back = haversine_km(here.lat, here.lon, start.lat, start.lon) if ordered else 0.0
    total += back
    return {"stops": ordered, "return_leg_km": round(back, 2), "total_km": round(total, 2)}
