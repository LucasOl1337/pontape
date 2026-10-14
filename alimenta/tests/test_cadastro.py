"""Cadastro: CNPJ (inclusive alfanumérico), CEP pela BrasilAPI falsa, aceites, D012 e aprovação humana."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from alimenta.core import docs
from alimenta.core.geo import nearest_region
from alimenta.db.models import AuditLog, Consent
from alimenta.tests.conftest import (CEPS, CNPJ_BAIXADA, CNPJ_EMPRESA, CNPJ_ONG, OPERATOR, PRIVACY, TERMS, TEST_DOMAIN,
                                     donor_body, h, make_donor, make_ngo, ngo_body)

from alimenta.geo.brasilapi import _fetch as REAL_FETCH  # noqa: E402 - o cliente real, antes do fixture trocar

REAL = "pessoa@empresa-real.com.br"  # e-mail fora da lista de teste


def test_cnpj_check_digits_numeric_and_alphanumeric():
    assert docs.cnpj_valid("11.222.333/0001-81") is True
    assert docs.cnpj_valid("11.222.333/0001-80") is False
    assert docs.cnpj_valid("00000000000000") is False
    # Exemplo publicado pela Receita para o CNPJ alfanumérico: 12.ABC.345/01DE-35.
    assert docs.cnpj_valid("12.ABC.345/01DE-35") is True
    assert docs.cnpj_valid("12.ABC.345/01DE-36") is False
    assert docs.cnpj_with_dv("12ABC34501DE") == "12ABC34501DE35"


def test_phone_and_cep_cleaning():
    assert docs.clean_phone("+55 (11) 91234-5678") == "11912345678"
    assert docs.clean_phone("11 3333-4444") == "1133334444"
    with pytest.raises(ValueError):
        docs.clean_phone("91234-5678")
    assert docs.clean_cep("01310-100") == "01310100"


def test_region_is_nearest_centroid():
    assert nearest_region(-23.5617698, -46.6553299) == "center"
    assert nearest_region(-23.47, -46.62) == "north"


def test_signup_closed_for_real_accounts(api):
    r = api.post("/donors", json=donor_body(), headers=h(REAL))
    assert r.status_code == 403
    assert r.json()["detail"] == "cadastro fechado: os textos legais ainda são rascunho (ALIMENTA_SIGNUP_OPEN=false)"


def test_signup_open_real_donor_with_cnpj_snapshot(api, fake_brasilapi, monkeypatch, engine):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    donor = make_donor(api, REAL)
    assert fake_brasilapi.calls == ["/cep/v2/01310100", f"/cnpj/v1/{CNPJ_EMPRESA}"]
    assert (donor["region"], donor["district"], donor["lat"], donor["lon"]) == ("center", "Bela Vista", -23.5617698, -46.6553299)
    assert donor["geo_source"] == "brasilapi:open-cep" and donor["phone"] == "11912345678"
    assert donor["status"] == "active" and donor["is_test"] is False and donor["legal_name"] == "MERCADO EXEMPLO LTDA"
    assert donor["doc_check"]["status"] == "alerta" and donor["doc_check"]["codigo_natureza_juridica"] == "2062"
    assert api.get("/me", headers=h(REAL)).json()["role"] == "donor"
    from alimenta.db.session import make_sessionmaker
    with make_sessionmaker(engine)() as s:
        assert [(c.kind, c.version) for c in s.scalars(select(Consent))] == [("donation_terms", TERMS),
                                                                            ("privacy_notice", PRIVACY)]


def test_ngo_cnpj_snapshot_has_no_partners(api, monkeypatch):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    ngo = make_ngo(api, REAL, approve=False)
    assert ngo["approval_status"] == "pending"
    check = ngo["cnpj_check"]
    assert check["status"] == "confere" and check["natureza_juridica"] == "Associação Privada"
    assert "PESSOA" not in str(ngo) and "qsa" not in check


def test_inactive_cnpj_is_422(api, monkeypatch):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    r = api.post("/donors", json=donor_body(cnpj=CNPJ_BAIXADA), headers=h(REAL))
    assert r.status_code == 422
    assert r.json()["detail"] == "CNPJ com situação cadastral BAIXADA: só CNPJ ativo"
    assert api.get("/me", headers=h(REAL)).json()["role"] is None


def test_brasilapi_down_goes_to_manual_review(api, fake_brasilapi, monkeypatch):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    api.get("/me", headers=h(REAL))
    fake_brasilapi.calls.clear()
    fake_brasilapi.down = True
    r = api.post("/ngos", json=ngo_body(), headers=h(REAL))
    assert r.status_code == 503 and r.json()["detail"].startswith("não deu para conferir o CEP agora")
    # CEP já no cache de 24 h não depende da BrasilAPI; o CNPJ, fora do ar, cai em revisão manual.
    from alimenta.geo import brasilapi
    brasilapi._cache["/cep/v2/01001000"] = (float("inf"), CEPS["01001000"])
    fake_brasilapi.calls.clear()
    ngo = api.post("/ngos", json=ngo_body(), headers=h(REAL)).json()
    assert ngo["cnpj_check"]["status"] == "unavailable" and ngo["approval_status"] == "pending"
    assert ngo["cnpj_check"]["erro"] == "BrasilAPI não respondeu: ConnectTimeout"
    assert fake_brasilapi.calls == [f"/cnpj/v1/{CNPJ_ONG}"]


def test_cep_outside_sao_paulo_and_without_coords(api):
    other = api.post("/donors", json=donor_body(cep="13010000"), headers=h(f"a{TEST_DOMAIN}"))
    assert other.status_code == 422 and other.json()["detail"] == "ainda não atendemos fora da cidade de São Paulo"
    no_coord = api.post("/donors", json=donor_body(cep="04001000"), headers=h(f"a{TEST_DOMAIN}"))
    assert no_coord.status_code == 422
    assert no_coord.json()["detail"] == "o CEP não trouxe coordenada: confirme o ponto no mapa (lat e lon)"
    ok = api.post("/donors", json=donor_body(cep="04001000", lat=-23.575, lon=-46.645), headers=h(f"a{TEST_DOMAIN}"))
    assert ok.status_code == 201 and ok.json()["geo_source"] == "informed"


def test_consent_versions_required(api):
    r = api.post("/donors", json={**donor_body(), "donation_terms_version": "termo-de-doacao-v0"},
                 headers=h(f"a{TEST_DOMAIN}"))
    assert r.status_code == 422 and r.json()["detail"] == "aceite donation_terms na versão termo-de-doacao-v1 é obrigatório"
    me = api.post("/me/consents", json={"kind": "privacy_notice", "version": PRIVACY}, headers=h(f"a{TEST_DOMAIN}"))
    assert me.status_code == 201 and me.json()["version"] == PRIVACY
    assert api.get("/me", headers=h(f"a{TEST_DOMAIN}")).json()["consents"][0]["kind"] == "privacy_notice"


def test_test_account_skips_cnpj_lookup_and_is_marked(api, fake_brasilapi):
    donor = make_donor(api, f"d{TEST_DOMAIN}")
    assert donor["is_test"] is True and donor["doc_check"]["status"] == "skipped_test"
    assert all(not c.startswith("/cnpj") for c in fake_brasilapi.calls)


def test_one_account_one_role_and_operator_cannot_signup(api):
    make_donor(api, f"d{TEST_DOMAIN}")
    again = api.post("/ngos", json=ngo_body(), headers=h(f"d{TEST_DOMAIN}"))
    assert again.status_code == 409 and again.json()["detail"] == "esta conta já é donor: uma conta, um papel"
    assert api.post("/donors", json=donor_body(), headers=h(OPERATOR)).status_code == 403


def test_approval_flow_and_audit(api, engine):
    ngo = make_ngo(api, f"n{TEST_DOMAIN}", approve=False)
    pending = api.get("/ops/ngos", params={"status": "pending"}, headers=h(OPERATOR)).json()
    assert [n["id"] for n in pending] == [ngo["id"]]
    assert api.get("/offers/mine", headers=h(f"n{TEST_DOMAIN}")).status_code == 403
    approved = api.post(f"/ops/ngos/{ngo['id']}/approve", json={"note": "CNPJ conferido"}, headers=h(OPERATOR)).json()
    assert approved["approval_status"] == "approved" and approved["approved_by"] == OPERATOR
    assert api.post(f"/ops/ngos/{ngo['id']}/reject", headers=h(OPERATOR)).status_code == 409
    assert api.post(f"/ops/ngos/{ngo['id']}/suspend", headers=h(OPERATOR)).json()["approval_status"] == "suspended"
    actions = [a["action"] for a in api.get("/ops/audit", headers=h(OPERATOR)).json()]
    assert actions == ["ngo_suspend", "ngo_approve", "ngo_signup"]


def test_suspended_donor_cannot_publish(api, pair):
    api.post(f"/ops/donors/{pair['donor']['id']}/suspend", headers=h(OPERATOR))
    from alimenta.tests.conftest import lot_body
    r = api.post("/lots", json=lot_body(), headers=pair["d"])
    assert r.status_code == 403 and r.json()["detail"] == "doador suspended: não pode publicar lote"


def test_auth_code_same_answer_and_no_audit_leak(api, monkeypatch, engine):
    from alimenta.auth import supabase
    sent = []
    monkeypatch.setattr(supabase, "send_code", lambda email: sent.append(email))
    a = api.post("/auth/code", json={"email": "existe@empresa.com"})
    b = api.post("/auth/code", json={"email": "nunca-visto@empresa.com"})
    assert a.status_code == b.status_code == 200 and a.json() == b.json()
    assert sent == ["existe@empresa.com", "nunca-visto@empresa.com"]
    from alimenta.db.session import make_sessionmaker
    with make_sessionmaker(engine)() as s:
        assert s.scalars(select(AuditLog)).all() == []


def test_brasilapi_timeout_is_honest(monkeypatch):
    """O cliente real: timeout curto vira Unavailable, 404 vira NotFoundUpstream, nada inventado."""
    import httpx

    from alimenta.geo import brasilapi
    seen = {}

    def slow(url, timeout, headers):
        seen.update(url=url, timeout=timeout)
        raise httpx.ConnectTimeout("lento")

    monkeypatch.setattr(httpx, "get", slow)
    with pytest.raises(brasilapi.Unavailable, match="^BrasilAPI não respondeu: ConnectTimeout$"):
        REAL_FETCH("/cep/v2/01310100")
    assert seen == {"url": "https://brasilapi.com.br/api/cep/v2/01310100", "timeout": 6}
    monkeypatch.setattr(httpx, "get", lambda url, timeout, headers: httpx.Response(404, request=httpx.Request("GET", url)))
    with pytest.raises(brasilapi.NotFoundUpstream):
        REAL_FETCH("/cnpj/v1/11222333000181")
