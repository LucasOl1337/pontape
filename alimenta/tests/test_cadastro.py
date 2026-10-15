"""Cadastro mínimo (r6): tipo, cidade, UF, CNPJ opcional, aceites v2, cadastro fechado e uma conta um papel."""

from __future__ import annotations

import pytest
from sqlalchemy import select

from alimenta.core import docs
from alimenta.db.models import AuditLog, Consent, Donor
from alimenta.tests.conftest import (CNPJ_BAIXADA, CNPJ_EMPRESA, OPERATOR, PRIVACY, REAL, TERMS, TEST_DOMAIN, donor_body,
                                     h, make_donor)

from alimenta.geo.brasilapi import _fetch as REAL_FETCH  # noqa: E402 - o cliente real, antes do fixture trocar


def test_cnpj_check_digits_numeric_and_alphanumeric():
    assert docs.cnpj_valid("11.222.333/0001-81") is True
    assert docs.cnpj_valid("11.222.333/0001-80") is False
    assert docs.cnpj_valid("00000000000000") is False
    # Exemplo publicado pela Receita para o CNPJ alfanumérico: 12.ABC.345/01DE-35.
    assert docs.cnpj_valid("12.ABC.345/01DE-35") is True
    assert docs.cnpj_valid("12.ABC.345/01DE-36") is False


def test_signup_closed_for_real_accounts(api):
    r = api.post("/donors", json=donor_body(), headers=h(REAL))
    assert r.status_code == 403
    assert r.json()["detail"] == "Cadastro ainda fechado. Abre quando o envio de e-mail estiver pronto."
    assert api.get("/me", headers=h(REAL)).json()["signup_open"] is False


def test_person_signup_is_email_kind_city_only(api, fake_brasilapi, monkeypatch, sessions):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    donor = make_donor(api, REAL, kind="person", city="  Rio de   Janeiro ", uf="rj")
    assert donor == {"id": donor["id"], "kind": "person", "city": "Rio de Janeiro", "uf": "RJ", "has_cnpj": False,
                     "distributor_id": None, "status": "active", "is_test": False}
    assert fake_brasilapi.calls == []
    me = api.get("/me", headers=h(REAL)).json()
    assert (me["role"], me["donor_kind"], me["org_status"]) == ("donor", "person", "active")
    with sessions() as s:
        row = s.get(Donor, donor["id"])
        assert (row.name, row.phone, row.cep, row.lat, row.doc_number) == (None, None, None, None, None)
        assert [(c.kind, c.version) for c in s.scalars(select(Consent))] == [("donation_terms", TERMS),
                                                                            ("privacy_notice", PRIVACY)]


def test_company_with_cnpj_keeps_private_snapshot_without_partners(api, fake_brasilapi, monkeypatch, sessions):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    donor = make_donor(api, REAL, cnpj="44.555.666/0001-" + CNPJ_EMPRESA[-2:])
    assert donor["has_cnpj"] is True and "cnpj" not in donor and "doc_check" not in donor
    assert fake_brasilapi.calls == [f"/cnpj/v1/{CNPJ_EMPRESA}"]
    with sessions() as s:
        check = s.get(Donor, donor["id"]).doc_check
    assert check["status"] == "confere" and check["razao_social"] == "MERCADO EXEMPLO LTDA"
    assert "PESSOA" not in str(check) and "qsa" not in check


@pytest.mark.parametrize("body, status, detail", [
    (donor_body(cnpj=CNPJ_BAIXADA), 422, "CNPJ com situação cadastral BAIXADA: só CNPJ ativo"),
    (donor_body(cnpj="11.222.333/0001-80"), 422, "CNPJ inválido (dígito verificador não confere)"),
    (donor_body(kind="person", cnpj=CNPJ_EMPRESA), 422, "pessoa não informa CNPJ"),
    (donor_body(uf="XX"), 422, "UF inválida"),
    (donor_body(distributor_id="sp-municipal-food-bank"), 422, "distributor_id só para distribuidor e só do catálogo"),
    (donor_body(kind="distributor", distributor_id="nao-existe"), 422,
     "distributor_id só para distribuidor e só do catálogo"),
    (donor_body(donation_terms_version="termo-de-doacao-v1"), 422,
     "aceite donation_terms na versão termo-de-doacao-v2 é obrigatório"),
])
def test_signup_refusals(api, monkeypatch, body, status, detail):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    r = api.post("/donors", json=body, headers=h(REAL))
    assert (r.status_code, r.json()["detail"]) == (status, detail)
    assert api.get("/me", headers=h(REAL)).json()["role"] is None


def test_extra_personal_fields_are_refused(api):
    for field in ("cpf", "phone", "address", "name"):
        r = api.post("/donors", json=donor_body(**{field: "DADO FICTÍCIO"}), headers=h(f"a{TEST_DOMAIN}"))
        assert r.status_code == 422, field


def test_brasilapi_down_does_not_block(api, fake_brasilapi, monkeypatch, sessions):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    fake_brasilapi.down = True
    donor = make_donor(api, REAL, cnpj=CNPJ_EMPRESA)
    with sessions() as s:
        assert s.get(Donor, donor["id"]).doc_check["status"] == "unavailable"
    assert donor["status"] == "active"


def test_distributor_can_say_which_catalog_entry_it_is(api):
    donor = make_donor(api, f"d{TEST_DOMAIN}", kind="distributor", distributor_id="sp-municipal-food-bank")
    assert donor["distributor_id"] == "sp-municipal-food-bank"


def test_test_account_skips_cnpj_lookup(api, fake_brasilapi):
    donor = make_donor(api, f"d{TEST_DOMAIN}", cnpj=CNPJ_EMPRESA)
    assert donor["is_test"] is True and fake_brasilapi.calls == []


def test_one_account_one_role_and_operator_cannot_signup(api):
    make_donor(api, f"d{TEST_DOMAIN}")
    again = api.post("/donors", json=donor_body(), headers=h(f"d{TEST_DOMAIN}"))
    assert again.status_code == 409 and again.json()["detail"] == "esta conta já é donor: uma conta, um papel"
    op = api.post("/donors", json=donor_body(), headers=h(OPERATOR))
    assert op.status_code == 403 and op.json()["detail"] == "operador não se cadastra como doador"


def test_consents_endpoint_and_legal_texts(api):
    me = api.post("/me/consents", json={"kind": "privacy_notice", "version": PRIVACY}, headers=h(f"a{TEST_DOMAIN}"))
    assert me.status_code == 201 and me.json()["version"] == PRIVACY
    old = api.post("/me/consents", json={"kind": "privacy_notice", "version": "aviso-de-privacidade-v1"},
                   headers=h(f"a{TEST_DOMAIN}"))
    assert old.status_code == 422
    current = api.get("/me", headers=h(f"a{TEST_DOMAIN}")).json()["current_versions"]
    assert current == {"donation_terms": TERMS, "privacy_notice": PRIVACY}
    for kind, first in (("donation_terms", "# Termo de doação da Rede Alimenta (v2)"),
                        ("privacy_notice", "# Aviso de privacidade da Rede Alimenta (v2)")):
        text = api.get(f"/legal/{kind}").text
        assert text.startswith(first)
        assert "\u2014" not in text and "\u2013" not in text and " IA " not in text
    assert api.get("/legal/ngo_terms").status_code == 404


def test_auth_code_same_answer_and_no_audit_leak(api, monkeypatch, sessions):
    from alimenta.auth import supabase
    sent = []
    monkeypatch.setattr(supabase, "send_code", lambda email: sent.append(email))
    a = api.post("/auth/code", json={"email": "existe@empresa.com"})
    b = api.post("/auth/code", json={"email": "nunca-visto@empresa.com"})
    assert a.status_code == b.status_code == 200 and a.json() == b.json()
    assert sent == ["existe@empresa.com", "nunca-visto@empresa.com"]
    with sessions() as s:
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
        REAL_FETCH("/cnpj/v1/11222333000181")
    assert seen == {"url": "https://brasilapi.com.br/api/cnpj/v1/11222333000181", "timeout": 6}
    monkeypatch.setattr(httpx, "get", lambda url, timeout, headers: httpx.Response(404, request=httpx.Request("GET", url)))
    with pytest.raises(brasilapi.NotFoundUpstream):
        REAL_FETCH("/cnpj/v1/11222333000181")
