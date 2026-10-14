"""O próprio ensaio.py roda contra a API (TestClient no lugar do httpx): completo, preparar e limpar."""

from __future__ import annotations

from alimenta.scripts import ensaio


def run(api, monkeypatch, mode, capsys):
    monkeypatch.setattr(ensaio.httpx, "Client", lambda base_url, timeout: api)
    ensaio.Ensaio("http://alvo").run(mode)
    return capsys.readouterr().out


def test_full_ensaio_passes_and_cleans(api, monkeypatch, capsys):
    out = run(api, monkeypatch, "completo", capsys)
    assert out.strip().endswith("ENSAIO OK")
    assert "ERRO" not in out
    assert "apagado: {'public_ledger_dispatches': 0, 'confirmations': 2, 'matches': 1" in out
    assert api.get("/kpis").json()["deliveries"] == 0


def test_prepare_then_clean(api, monkeypatch, capsys):
    out = run(api, monkeypatch, "preparar", capsys)
    assert out.strip().endswith("PREPARO OK (contas de teste prontas; rode o modo limpar depois)")
    out = run(api, monkeypatch, "limpar", capsys)
    assert "apagado: {'public_ledger_dispatches': 0, 'confirmations': 0, 'matches': 0, 'notifications': 0, " \
           "'lot_offers': 0, 'lot_outcomes': 0, 'lots': 0, 'ngos': 1, 'donors': 1, 'consents': 4" in out
    assert "KPI público igual ao de antes: HTTP 200" in out


def test_refuses_real_account(api, monkeypatch, capsys):
    import pytest
    monkeypatch.setitem(ensaio.EMAILS, "doador", "pessoa@empresa-real.com.br")
    monkeypatch.setattr(ensaio.httpx, "Client", lambda base_url, timeout: api)
    from alimenta.auth import dev
    monkeypatch.setenv("ENSAIO_TOKEN_DOADOR", dev.mint("pessoa@empresa-real.com.br")["access_token"])
    with pytest.raises(SystemExit, match="não é conta de teste no alvo"):
        ensaio.Ensaio("http://alvo").run()
