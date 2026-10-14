"""Gerador dos dados SIMULADOS da Rede Alimenta (seed fixa 20261015).

Gera:
- data/lots_history.csv: histórico rotulado para treinar o modelo de risco.
- data/seed/{donors,ngos,lots}.json: seed operacional da demonstração.

Nada aqui é dado real. O rótulo `discarded` é sorteado de uma probabilidade
escondida (ver `discard_logit` e data/DICIONARIO.md), com ruído.

Uso, a partir da raiz do repositório:
    python -m alimenta.data.generate          # grava os arquivos
    python -m alimenta.data.generate --check  # confere se os versionados batem
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import random
import sys
from pathlib import Path

from alimenta.core.domain import CATEGORIES, REGIONS

SEED = 20261015
HISTORY_ROWS = 6000
DATA_DIR = Path(__file__).resolve().parent
NOTICE = "DEMONSTRAÇÃO · dados simulados · Rede Alimenta · não são pessoas nem entidades reais"

# Parâmetros do processo escondido (documentados no DICIONARIO.md).
PERISHABILITY = {"produce": 1.0, "bakery": 0.85, "dairy": 0.7, "prepared_meal": 1.2, "dry_goods": 0.1}
STORAGE_SHELF = {"ambient": 1.0, "refrigerated": 2.0, "frozen": 4.0}
REGION_DEMAND = {"center": 0.7, "north": 0.8, "south": 0.6, "east": 0.9, "west": 0.4}
HOURS_RANGE = {
    "produce": (8, 96),
    "bakery": (4, 48),
    "dairy": (18, 240),
    "prepared_meal": (2, 24),
    "dry_goods": (240, 2160),
}
KG_RANGE = {"produce": (5, 180), "bakery": (2, 60), "dairy": (3, 90), "prepared_meal": (2, 40), "dry_goods": (5, 250)}
STORAGE_BY_CATEGORY = {
    "produce": (("ambient", 0.6), ("refrigerated", 0.4)),
    "bakery": (("ambient", 0.85), ("frozen", 0.15)),
    "dairy": (("refrigerated", 0.9), ("ambient", 0.1)),
    "prepared_meal": (("refrigerated", 0.6), ("ambient", 0.3), ("frozen", 0.1)),
    "dry_goods": (("ambient", 1.0),),
}
CATEGORY_WEIGHTS = {"produce": 0.3, "bakery": 0.22, "dairy": 0.16, "prepared_meal": 0.17, "dry_goods": 0.15}


def discard_logit(category, storage, kg, hours_to_expiry, published_hour, weekday, region):
    """Logito da probabilidade escondida de descarte (sem ruído)."""
    effective_hours = hours_to_expiry * STORAGE_SHELF[storage]
    urgency = math.exp(-effective_hours / 36.0)
    z = -3.6
    z += 6.1 * PERISHABILITY[category] * urgency
    z += 1.6 * math.log1p(kg) / math.log1p(250)
    z += 1.4 if published_hour >= 18 else 0.0
    z += 0.9 if weekday >= 5 else 0.0
    z -= 2.9 * (REGION_DEMAND[region] - 0.65)
    z += 1.1 if (storage == "ambient" and category in {"dairy", "prepared_meal"}) else 0.0
    return z


def _choice(rng, pairs):
    names = [p[0] for p in pairs]
    weights = [p[1] for p in pairs]
    return rng.choices(names, weights=weights, k=1)[0]


def _sample_lot_features(rng):
    category = _choice(rng, list(CATEGORY_WEIGHTS.items()))
    storage = _choice(rng, STORAGE_BY_CATEGORY[category])
    lo, hi = KG_RANGE[category]
    kg = round(math.exp(rng.uniform(math.log(lo), math.log(hi))), 1)
    lo, hi = HOURS_RANGE[category]
    hours = round(rng.uniform(lo, hi), 1)
    hour = rng.choice(range(6, 23))
    weekday = rng.randrange(7)
    region = rng.choice(sorted(REGIONS))
    return category, storage, kg, hours, hour, weekday, region


def history_rows(rng):
    rows = []
    for i in range(1, HISTORY_ROWS + 1):
        category, storage, kg, hours, hour, weekday, region = _sample_lot_features(rng)
        z = discard_logit(category, storage, kg, hours, hour, weekday, region) + rng.gauss(0, 0.5)
        p = 1 / (1 + math.exp(-z))
        rows.append({
            "lot_id": f"H{i:05d}",
            "category": category,
            "storage": storage,
            "kg": kg,
            "hours_to_expiry": hours,
            "published_hour": hour,
            "weekday": weekday,
            "region": region,
            "region_demand": REGION_DEMAND[region],
            "discarded": int(rng.random() < p),
            "data_origin": "SIMULADO",
        })
    return rows


def history_csv(rows) -> str:
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


DONOR_KINDS = ("supermarket", "bakery", "restaurant", "street_market", "distributor")
NGO_WINDOWS = ("08:00-12:00", "08:00-17:00", "13:00-19:00", "09:00-18:00")


def _point(rng, region):
    lat_min, lat_max, lon_min, lon_max = REGIONS[region]["box"]
    return round(rng.uniform(lat_min, lat_max), 5), round(rng.uniform(lon_min, lon_max), 5)


def donors(rng, n=15):
    regions = sorted(REGIONS)
    out = []
    for i in range(1, n + 1):
        region = regions[(i - 1) % len(regions)]
        lat, lon = _point(rng, region)
        out.append({
            "id": f"D{i:02d}",
            "name": f"Doador Exemplo {i:02d}",
            "kind": rng.choice(DONOR_KINDS),
            "region": region,
            "lat": lat,
            "lon": lon,
        })
    return out


def ngos(rng, n=20):
    regions = sorted(REGIONS)
    cats = sorted(CATEGORIES)
    out = []
    for i in range(1, n + 1):
        region = regions[(i - 1) % len(regions)]
        lat, lon = _point(rng, region)
        accepted = sorted(rng.sample(cats, rng.randint(2, 5)))
        out.append({
            "id": f"N{i:02d}",
            "name": f"ONG Exemplo {i:02d}",
            "region": region,
            "lat": lat,
            "lon": lon,
            "accepted_categories": accepted,
            "daily_capacity_kg": rng.choice((80, 120, 150, 200, 300, 400)),
            "window": rng.choice(NGO_WINDOWS),
        })
    return out


def seed_lots(rng, donor_list, ngo_list, days=30, per_day=(3, 7)):
    """Lotes do seed com tempos RELATIVOS ao momento da carga (horas).

    `outcome` descreve o ciclo simulado: ONG, minutos até confirmar, coletar e
    entregar. Lotes do último dia ficam em aberto para alimentar os alertas.
    """
    out = []
    n = 0
    for day in range(days, 0, -1):
        for _ in range(rng.randint(*per_day)):
            n += 1
            donor = rng.choice(donor_list)
            category, storage, kg, hours, hour, _wd, _r = _sample_lot_features(rng)
            published_offset = round(-day * 24 + rng.uniform(0, 20), 2)
            lot = {
                "id": f"L{n:04d}",
                "donor_id": donor["id"],
                "category": category,
                "storage": storage,
                "kg": kg,
                "published_offset_h": published_offset,
                "expires_offset_h": round(published_offset + hours, 2),
                "description": f"Lote simulado de {CATEGORIES[category].lower()}",
                "outcome": None,
            }
            if day > 1 and rng.random() < 0.82:
                fits = [g for g in ngo_list if category in g["accepted_categories"]]
                same = [g for g in fits if g["region"] == donor["region"]]
                ngo = rng.choice(same or fits)
                confirm = rng.randint(10, 240)
                collect = confirm + rng.randint(20, 180)
                deliver = collect + rng.randint(15, 90)
                # Entrega só conta se acontece antes da validade; senão o lote venceu em aberto.
                if deliver < hours * 60:
                    lot["outcome"] = {
                        "ngo_id": ngo["id"],
                        "confirm_after_min": confirm,
                        "collect_after_min": collect,
                        "deliver_after_min": deliver,
                    }
            out.append(lot)
    return out


def build_all():
    rng = random.Random(SEED)
    history = history_csv(history_rows(rng))
    d = donors(rng)
    g = ngos(rng)
    lots = seed_lots(rng, d, g)
    def doc(key, items):
        return json.dumps({"notice": NOTICE, "seed": SEED, key: items}, ensure_ascii=False, indent=1) + "\n"
    return {
        DATA_DIR / "lots_history.csv": history,
        DATA_DIR / "seed" / "donors.json": doc("donors", d),
        DATA_DIR / "seed" / "ngos.json": doc("ngos", g),
        DATA_DIR / "seed" / "lots.json": doc("lots", lots),
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="só confere os arquivos versionados")
    args = parser.parse_args(argv)
    files = build_all()
    if args.check:
        bad = [str(p) for p, text in files.items() if not p.exists() or p.read_text(encoding="utf-8") != text]
        if bad:
            print("Diferente do gerador:", *bad, sep="\n  ")
            return 1
        print(f"Dados simulados conferem com a seed {SEED}.")
        return 0
    for path, text in files.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        print(f"gravado {path.relative_to(DATA_DIR.parent.parent)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
