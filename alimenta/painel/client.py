"""Cliente HTTP do painel: lê e escreve PELA API (mesmas regras 409/422 para todos).

O token de escrita fica só no servidor do painel (ALIMENTA_WRITE_TOKEN), nunca no navegador.
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path

import httpx

API_URL = os.environ.get("ALIMENTA_API_URL", "http://localhost:8000").rstrip("/")
GITHUB_REPO = os.environ.get("ALIMENTA_GITHUB_REPO", "LucasOl1337/pontape")
SECURITY_DIR = Path(__file__).resolve().parents[1] / "seguranca"


class ApiError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(f"{status}: {detail}")
        self.status, self.detail = status, detail


def _headers() -> dict:
    token = os.environ.get("ALIMENTA_WRITE_TOKEN", "")
    return {"X-Alimenta-Token": token} if token else {}


def _check(response: httpx.Response):
    if response.status_code >= 400:
        try:
            detail = response.json().get("detail")
        except ValueError:
            detail = response.text
        raise ApiError(response.status_code, detail if isinstance(detail, str) else json.dumps(detail, ensure_ascii=False))
    return response.json()


def get(path: str, **params):
    return _check(httpx.get(f"{API_URL}{path}", params=params or None, timeout=30))


def post(path: str, body: dict | None = None):
    return _check(httpx.post(f"{API_URL}{path}", json=body, headers=_headers(), timeout=60))


def can_write() -> bool:
    return bool(os.environ.get("ALIMENTA_WRITE_TOKEN"))


_ci_cache: dict = {}


def ci_status(ttl_s: int = 600) -> dict:
    """Última execução dos workflows na main, pela API pública do GitHub (sem token, cache de 10 min)."""
    now = time.time()
    if _ci_cache.get("at", 0) + ttl_s > now:
        return _ci_cache["data"]
    data: dict = {"repo": GITHUB_REPO, "workflows": [], "error": None}
    try:
        for name in ("alimenta.yml", "ci.yml"):
            url = f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{name}/runs"
            r = httpx.get(url, params={"branch": "main", "per_page": 1},
                          headers={"Accept": "application/vnd.github+json"}, timeout=10)
            if r.status_code == 404:
                data["workflows"].append({"file": name, "state": "ainda não existe na main"})
                continue
            r.raise_for_status()
            runs = r.json().get("workflow_runs", [])
            if not runs:
                data["workflows"].append({"file": name, "state": "sem execução na main"})
                continue
            run = runs[0]
            data["workflows"].append({"file": name, "name": run.get("name"), "state": run.get("status"),
                                      "conclusion": run.get("conclusion"), "sha": run.get("head_sha", "")[:7],
                                      "updated_at": run.get("updated_at"), "url": run.get("html_url")})
    except (httpx.HTTPError, ValueError) as exc:
        data["error"] = f"GitHub indisponível agora: {exc.__class__.__name__}"
    _ci_cache.update(at=now, data=data)
    return data


def security_summary() -> dict | None:
    path = SECURITY_DIR / "resumo.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))
