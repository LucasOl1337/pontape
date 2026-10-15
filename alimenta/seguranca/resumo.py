"""Compara a linha de base com o scan atual e grava resumo.json (anexado ao CI).

Mitigado = ID que aparece na linha de base e some no scan atual. Nada é
plantado para mostrar redução; se a linha de base vier limpa, o resumo
mostra zero.

Uso, da raiz do repositório:
    python -m alimenta.seguranca.resumo alimenta/seguranca/atual COMMIT_ATUAL
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASELINE = HERE / "baseline"

# Achados aceitos, com justificativa. Não bloqueiam o gate e aparecem no STRIDE.
ACCEPTED = [
    {"id": "bandit:B311", "onde": "alimenta/data/generate.py",
     "motivo": "random com seed fixa só gera dados simulados reproduzíveis; não é segredo nem token"},
    {"id": "bandit:B301", "onde": "alimenta/model/predict.py",
     "motivo": "joblib (pickle) carrega só o artefato local versionado, depois de conferir o sha256 de metrics.json"},
    {"id": "trivy:os-sem-correcao", "onde": "imagem python:3.12-slim (Debian)",
     "motivo": "CVEs do Debian sem versão corrigida publicada; o gate usa --ignore-unfixed e a imagem roda apt-get upgrade a cada build"},
]


def bandit_ids(path: Path) -> set[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return {f"{r['test_id']}:{r['filename']}" for r in data.get("results", [])}


def trivy_ids(path: Path) -> set[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    ids = set()
    for result in data.get("Results") or []:
        for v in result.get("Vulnerabilities") or []:
            ids.add(f"{v['VulnerabilityID']}:{v['PkgName']}:{v['Severity']}")
        for m in result.get("Misconfigurations") or []:
            if m.get("Status") == "FAIL":
                ids.add(f"{m['ID']}:{Path(result['Target']).name}:{m['Severity']}")
        for s in result.get("Secrets") or []:
            ids.add(f"secret:{s['RuleID']}:{result['Target']}")
    return ids


TOOLS = {
    "Bandit (código Python)": ("bandit.json", bandit_ids),
    "Trivy fs (dependências, segredos, Dockerfile)": ("trivy-fs.json", trivy_ids),
    "Trivy config (IaC do repositório)": ("trivy-config.json", trivy_ids),
    "Trivy imagem (rede-alimenta)": ("trivy-image.json", trivy_ids),
}


def summarize(current_dir: Path, current_commit: str) -> dict:
    meta = json.loads((BASELINE / "meta.json").read_text(encoding="utf-8"))
    tools, base_total, cur_total, mit_total = {}, 0, 0, 0
    for label, (name, reader) in TOOLS.items():
        base = reader(BASELINE / name)
        cur = reader(current_dir / name) if (current_dir / name).exists() else set()
        mitigated = sorted(base - cur)
        tools[label] = {"baseline": len(base), "current": len(cur), "mitigated_ids": mitigated,
                        "new_ids": sorted(cur - base)}
        base_total, cur_total, mit_total = base_total + len(base), cur_total + len(cur), mit_total + len(mitigated)
    return {
        "notice": "Scans reais do código e da imagem da Rede Alimenta (a demo usa dados simulados).",
        "baseline": {"commit": meta["commit"], "date": meta["date"], "total": base_total},
        "current": {"commit": current_commit, "date": date.today().isoformat(), "total": cur_total},
        "mitigated": {"total": mit_total},
        "gates": {"bandit": "reprova severidade >= MEDIUM e confiança >= MEDIUM",
                  "trivy": "reprova HIGH/CRITICAL com correção disponível (--ignore-unfixed)"},
        "tools": tools,
        "accepted": ACCEPTED,
    }


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 1
    summary = summarize(Path(argv[1]), argv[2])
    out = HERE / "resumo.json"
    out.write_text(json.dumps(summary, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"linha de base {summary['baseline']['total']} · atual {summary['current']['total']} · "
          f"mitigados {summary['mitigated']['total']} → {out.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
