"""O próprio ensaio.py roda contra a API (TestClient no lugar do httpx): completo, preparar e limpar."""

from __future__ import annotations

import pytest

from alimenta.scripts import ensaio
from alimenta.tests.conftest import OPS


def run(api, monkeypatch, mode, capsys):
    monkeypatch.setattr(ensaio.httpx, "Client", lambda base_url, timeout, **_: api)
    ensaio.Ensaio("http://alvo").run(mode)
    return capsys.readouterr().out


def test_full_ensaio_passes_and_cleans(api, monkeypatch, capsys):
    monkeypatch.setenv("ENSAIO_OPS_TOKEN", OPS)
    out = run(api, monkeypatch, "completo", capsys)
    assert out.strip().endswith("ENSAIO OK")
    assert "ERRO" not in out
    assert "modo=rule" in out  # 9Router falso sem resposta: regra, e a saída diz
    assert "   apagado: {'recommendations': 1, 'lot_outcomes': 2, 'lots': 2, 'donors': 1, 'consents': 2, " in out
    assert api.get("/kpis").json()["donations"] == 0


def test_prepare_then_clean(api, monkeypatch, capsys):
    out = run(api, monkeypatch, "preparar", capsys)
    assert out.strip().endswith("PREPARO OK (doador de teste pronto; rode o modo limpar depois)")
    out = run(api, monkeypatch, "limpar", capsys)
    assert "   apagado: {'recommendations': 0, 'lot_outcomes': 0, 'lots': 0, 'donors': 1, 'consents': 2, " in out
    assert "KPI público igual ao de antes: HTTP 200" in out


def test_refuses_real_account(api, monkeypatch):
    monkeypatch.setitem(ensaio.EMAILS, "doador", "pessoa@empresa-real.com.br")
    monkeypatch.setattr(ensaio.httpx, "Client", lambda base_url, timeout, **_: api)
    from alimenta.auth import dev
    monkeypatch.setenv("ENSAIO_TOKEN_DOADOR", dev.mint("pessoa@empresa-real.com.br")["access_token"])
    with pytest.raises(SystemExit, match="não é conta de teste no alvo"):
        ensaio.Ensaio("http://alvo").run()
