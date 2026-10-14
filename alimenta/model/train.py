"""Treino reproduzível do classificador de risco de descarte (DEMONSTRAÇÃO).

Alvo: `discarded` (1 = lote descartado sem aproveitamento), sorteado pelo
gerador a partir de um processo escondido com ruído (data/DICIONARIO.md).

Ordem: (1) split estratificado 80/20 ANTES de qualquer ajuste; (2) baselines
(classe majoritária e regra só de prazo, com limiar escolhido no treino);
(3) modelo principal HistGradientBoosting, escolhido antes de olhar o teste;
LogisticRegression só como comparação; (4) métricas no teste reservado.

Uso, da raiz do repositório:
    python -m alimenta.model.train            # treina e grava artefato + metrics.json
    python -m alimenta.model.train --check    # retreina e compara com metrics.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder, StandardScaler

from alimenta.data.generate import SEED
from alimenta.model.features import CATEGORICAL, FEATURES, MODEL_VERSION, NUMERIC, TARGET

ROOT = Path(__file__).resolve().parent
DATA = ROOT.parent / "data" / "lots_history.csv"
ARTIFACTS = ROOT / "artifacts"
MODEL_PATH = ARTIFACTS / f"{MODEL_VERSION}.joblib"
METRICS_PATH = ARTIFACTS / "metrics.json"
LABELS = ["kept", "discarded"]


def build_hgb() -> Pipeline:
    pre = ColumnTransformer([
        ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), CATEGORICAL),
        ("num", "passthrough", NUMERIC),
    ])
    clf = HistGradientBoostingClassifier(
        categorical_features=list(range(len(CATEGORICAL))),
        max_iter=200, learning_rate=0.05, max_leaf_nodes=15, random_state=SEED,
    )
    return Pipeline([("pre", pre), ("clf", clf)])


def build_logreg() -> Pipeline:
    pre = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL),
        ("num", StandardScaler(), NUMERIC),
    ])
    return Pipeline([("pre", pre), ("clf", LogisticRegression(max_iter=1000))])


def deadline_rule_threshold(x_train: pd.DataFrame, y_train: pd.Series) -> float:
    """Melhor limiar de horas (só no TREINO) para a regra 'descarta se vence logo'."""
    best_t, best_acc = 0.0, -1.0
    for t in np.unique(np.quantile(x_train["hours_to_expiry"], np.linspace(0.02, 0.98, 97))):
        acc = float(((x_train["hours_to_expiry"] <= t).astype(int) == y_train).mean())
        if acc > best_acc:
            best_t, best_acc = float(t), acc
    return round(best_t, 1)


def evaluate(y_true, y_pred, y_proba=None) -> dict:
    report = classification_report(y_true, y_pred, labels=[0, 1], target_names=LABELS,
                                   output_dict=True, zero_division=0)
    out = {
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "confusion_matrix": {"labels": LABELS, "rows_true_cols_pred": confusion_matrix(y_true, y_pred, labels=[0, 1]).tolist()},
        "per_class": {k: {m: round(v, 4) for m, v in report[k].items()} for k in LABELS},
    }
    if y_proba is not None:
        out["roc_auc"] = round(roc_auc_score(y_true, y_proba), 4)
    return out


def train() -> tuple[Pipeline, dict]:
    df = pd.read_csv(DATA)
    x, y = df[FEATURES], df[TARGET]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, stratify=y, random_state=SEED)

    majority = int(y_train.mode()[0])
    threshold = deadline_rule_threshold(x_train, y_train)
    baseline_majority = evaluate(y_test, np.full(len(y_test), majority))
    baseline_deadline = evaluate(y_test, (x_test["hours_to_expiry"] <= threshold).astype(int))

    logreg = build_logreg().fit(x_train, y_train)
    logreg_eval = evaluate(y_test, logreg.predict(x_test), logreg.predict_proba(x_test)[:, 1])

    model = build_hgb().fit(x_train, y_train)
    proba = model.predict_proba(x_test)[:, 1]
    model_eval = evaluate(y_test, (proba >= 0.5).astype(int), proba)

    metrics = {
        "notice": "DEMONSTRAÇÃO · dados simulados",
        "model_version": MODEL_VERSION,
        "algorithm": "HistGradientBoostingClassifier",
        "target": "discarded (1 = lote descartado sem aproveitamento; rótulo sorteado do processo escondido do gerador, ver data/DICIONARIO.md)",
        "features": FEATURES,
        "seed": SEED,
        "split": {"method": "train_test_split estratificado antes de ajustar", "test_size": 0.2,
                  "n_train": int(len(y_train)), "n_test": int(len(y_test)),
                  "positive_rate_train": round(float(y_train.mean()), 4)},
        "decision_threshold": 0.5,
        "risk_levels": {"low": "proba < 0.33", "medium": "0.33 ≤ proba < 0.66", "high": "proba ≥ 0.66"},
        "test": model_eval,
        "baselines": {
            "majority_class": {"predicts": LABELS[majority], **baseline_majority},
            "deadline_rule": {"rule": f"discarded se hours_to_expiry ≤ {threshold} (limiar escolhido só no treino)", **baseline_deadline},
            "logistic_regression": logreg_eval,
        },
        "beats_baselines": bool(model_eval["accuracy"] > baseline_majority["accuracy"]
                                and model_eval["accuracy"] > baseline_deadline["accuracy"]),
        "versions": {"python": sys.version.split()[0], "scikit_learn": sklearn.__version__,
                     "pandas": pd.__version__, "numpy": np.__version__},
    }
    return model, metrics


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def comparable(metrics: dict) -> dict:
    """Parte do metrics.json que deve ser idêntica num retreino (sem hash do arquivo)."""
    keep = ("model_version", "seed", "split", "test", "baselines", "beats_baselines")
    return {k: metrics[k] for k in keep}


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Treina o modelo de risco de descarte")
    parser.add_argument("--check", action="store_true", help="retreina e compara com metrics.json")
    args = parser.parse_args(argv)
    model, metrics = train()
    if args.check:
        saved = json.loads(METRICS_PATH.read_text(encoding="utf-8"))
        if comparable(saved) != comparable(metrics):
            print("Retreino diferente do metrics.json versionado.")
            print(json.dumps({"saved": comparable(saved)["test"], "now": comparable(metrics)["test"]}, indent=1))
            return 1
        print(f"Retreino confere: acurácia {metrics['test']['accuracy']} (seed {SEED}).")
        return 0
    if not metrics["beats_baselines"]:
        print("Modelo não supera as baselines; artefato não gravado.")
        return 1
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    metrics["artifact"] = {"file": MODEL_PATH.name, "sha256": sha256_file(MODEL_PATH)}
    METRICS_PATH.write_text(json.dumps(metrics, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    t, b = metrics["test"], metrics["baselines"]
    print(f"Acurácia teste {t['accuracy']} | AUC {t['roc_auc']} | maioria {b['majority_class']['accuracy']}"
          f" | regra de prazo {b['deadline_rule']['accuracy']} | logística {b['logistic_regression']['accuracy']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
