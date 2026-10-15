"""Gera src/data/alimenta/painel.json, a parte SIMULADA do painel público da Rede Alimenta.

Lê o dataset simulado (data/lots_history.csv) e o modelo versionado. Nada aqui é doação real:
o painel mostra os números reais ao vivo pela API (/kpis) e estes, sempre com o rótulo SIMULADO.

- por região de São Paulo: lotes, kg, taxa de descarte do histórico e refeições estimadas do que não foi descartado;
- por categoria: taxa de descarte;
- alertas de validade: os lotes simulados de uma "manhã de demonstração" (seed fixa) que vencem em até 48 h,
  ordenados pelo risco que o modelo calcula. Vencido nunca entra: a API recusa validade no passado (422).

Uso, da raiz do repositório:
    python -m alimenta.scripts.painel            # grava o JSON
    python -m alimenta.scripts.painel --check    # confere se o JSON versionado está em dia
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

from alimenta.core.domain import CATEGORIES, DEMO_LABEL, KG_PER_MEAL, REGIONS, STORAGE, region_centroid
from alimenta.model.predict import load_metrics, predict

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "alimenta" / "data" / "lots_history.csv"
OUT = ROOT / "src" / "data" / "alimenta" / "painel.json"
ALERT_HOURS = 48
ALERT_SAMPLE = 400  # lotes de uma "manhã" sorteados com seed fixa
SEED = 20261015


def build() -> dict:
    df = pd.read_csv(DATA)
    regions = []
    for key, meta in REGIONS.items():
        part = df[df["region"] == key]
        kept_kg = float(part.loc[part["discarded"] == 0, "kg"].sum())
        lat, lon = region_centroid(key)
        regions.append({
            "id": key, "label": meta["label"], "lat": lat, "lon": lon,
            "lots": int(len(part)), "kg": round(float(part["kg"].sum()), 1),
            "discard_rate": round(float(part["discarded"].mean()), 4),
            "kg_discarded": round(float(part.loc[part["discarded"] == 1, "kg"].sum()), 1),
            "meals_estimated": int(kept_kg / KG_PER_MEAL),
            "demand": round(float(part["region_demand"].mean()), 2),
        })
    categories = [{
        "id": key, "label": label,
        "lots": int((df["category"] == key).sum()),
        "discard_rate": round(float(df.loc[df["category"] == key, "discarded"].mean()), 4),
    } for key, label in CATEGORIES.items()]

    morning = df.sample(n=ALERT_SAMPLE, random_state=SEED)
    soon = morning[morning["hours_to_expiry"] <= ALERT_HOURS]
    alerts = []
    for _, row in soon.iterrows():
        p = predict({k: row[k] for k in ("category", "storage", "region", "kg", "hours_to_expiry", "published_hour", "weekday")})
        alerts.append({
            "lot": row["lot_id"], "category": CATEGORIES[row["category"]], "storage": STORAGE[row["storage"]],
            "region": REGIONS[row["region"]]["label"], "kg": float(row["kg"]),
            "hours_to_expiry": round(float(row["hours_to_expiry"]), 1),
            "discard_proba": p["discard_proba"], "risk_level": p["risk_level"],
        })
    alerts.sort(key=lambda a: (-a["discard_proba"], a["hours_to_expiry"], a["lot"]))

    return {
        "notice": DEMO_LABEL,
        "source": "alimenta/data/lots_history.csv",
        "model_version": load_metrics()["model_version"],
        "kg_per_meal": KG_PER_MEAL,
        "totals": {
            "lots": int(len(df)), "kg": round(float(df["kg"].sum()), 1),
            "discard_rate": round(float(df["discarded"].mean()), 4),
            "meals_estimated": int(float(df.loc[df["discarded"] == 0, "kg"].sum()) / KG_PER_MEAL),
        },
        "regions": regions,
        "categories": categories,
        "alerts": {"window_hours": ALERT_HOURS, "sample": ALERT_SAMPLE, "count": len(alerts),
                   "high": sum(a["risk_level"] == "high" for a in alerts), "top": alerts[:8]},
    }


def render() -> str:
    return json.dumps(build(), ensure_ascii=False, indent=1) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    text = render()
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print(f"{OUT.relative_to(ROOT)} desatualizado: rode python -m alimenta.scripts.painel", file=sys.stderr)
            return 1
        print("painel.json em dia")
        return 0
    OUT.write_text(text, encoding="utf-8")
    print(f"gravado {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
