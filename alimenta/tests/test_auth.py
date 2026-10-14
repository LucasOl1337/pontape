"""JWT do Supabase validado com JWKS (par ES256 gerado no teste, sem rede) e papéis, casos exatos."""

from __future__ import annotations

import json
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from jwt import PyJWKClient
from jwt.algorithms import ECAlgorithm

from alimenta.auth import jwt as auth_jwt
from alimenta.tests.conftest import OPERATOR, OPS, TEST_DOMAIN, h

URL = "https://exemplo.supabase.co"
ISS = f"{URL}/auth/v1"
KEY = ec.generate_private_key(ec.SECP256R1())
OTHER = ec.generate_private_key(ec.SECP256R1())


def jwks() -> dict:
    jwk = json.loads(ECAlgorithm.to_jwk(KEY.public_key()))
    return {"keys": [{**jwk, "kid": "chave-1", "alg": "ES256", "use": "sig"}]}


def token(key=KEY, kid="chave-1", **over) -> str:
    now = int(time.time())
    claims = {"sub": "11111111-2222-3333-4444-555555555555", "email": "Pessoa@Exemplo.com", "aud": "authenticated",
              "iss": ISS, "iat": now, "exp": now + 600, "role": "authenticated", **over}
    claims = {k: v for k, v in claims.items() if v is not None}
    return jwt.encode(claims, key, algorithm="ES256", headers={"kid": kid})


@pytest.fixture(autouse=True)
def fake_jwks(monkeypatch):
    calls = []

    def fetch(self):
        calls.append(self.uri)
        return jwks()

    monkeypatch.setattr(PyJWKClient, "fetch_data", fetch)
    auth_jwt._clients.clear()
    return calls


def test_valid_supabase_token(fake_jwks):
    claims = auth_jwt.verify(token())
    assert (claims.sub, claims.email) == ("11111111-2222-3333-4444-555555555555", "pessoa@exemplo.com")
    assert fake_jwks == [f"{ISS}/.well-known/jwks.json"]


@pytest.mark.parametrize("over, message", [
    ({"exp": int(time.time()) - 5}, "sessão vencida: entre de novo"),
    ({"iss": "https://outro.supabase.co/auth/v1"}, "token inválido"),
    ({"aud": "anon"}, "token inválido"),
    ({"sub": None}, "token inválido"),
    ({"email": None}, "token sem e-mail"),
])
def test_bad_claims_are_rejected(over, message):
    with pytest.raises(auth_jwt.AuthError) as err:
        auth_jwt.verify(token(**over))
    assert str(err.value) == message


def test_swapped_signature_and_unknown_kid():
    with pytest.raises(auth_jwt.AuthError, match="^token inválido$"):
        auth_jwt.verify(token(key=OTHER))
    with pytest.raises(auth_jwt.AuthError, match="^não deu para conferir a assinatura do token$"):
        auth_jwt.verify(token(kid="chave-que-nao-existe"))


def test_hs256_with_public_key_is_rejected():
    forged = jwt.encode({"sub": "x", "email": "a@b.co", "aud": "authenticated", "iss": ISS,
                         "exp": int(time.time()) + 60}, "segredo", algorithm="HS256", headers={"kid": "chave-1"})
    with pytest.raises(auth_jwt.AuthError):
        auth_jwt.verify(forged)


def test_local_issuer_is_refused_in_production(api, monkeypatch):
    local = h(f"doador{TEST_DOMAIN}")
    assert api.get("/me", headers=local).status_code == 200
    monkeypatch.setenv("ALIMENTA_ENV", "production")
    r = api.get("/me", headers=local)
    assert r.status_code == 401
    assert r.json()["detail"] == "não deu para conferir a assinatura do token"


def test_supabase_token_reaches_me(api):
    r = api.get("/me", headers={"Authorization": f"Bearer {token()}"})
    assert r.status_code == 200
    assert r.json()["email"] == "pessoa@exemplo.com" and r.json()["role"] is None and r.json()["is_test"] is False


def test_missing_and_malformed_header_are_401(api):
    assert api.get("/me").status_code == 401
    assert api.get("/me", headers={"Authorization": "Token abc"}).status_code == 401
    assert api.get("/me", headers={"Authorization": "Bearer nao-e-jwt"}).status_code == 401


def test_operator_only_from_env(api, monkeypatch):
    assert api.get("/me", headers=h(OPERATOR)).json()["role"] == "operator"
    assert api.get("/ops/overview", headers=h(OPERATOR)).status_code == 200
    stranger = api.get("/ops/overview", headers=h(f"curioso{TEST_DOMAIN}"))
    assert stranger.status_code == 403
    assert stranger.json()["detail"] == "rota só para operator; esta conta é sem cadastro"
    monkeypatch.setenv("ALIMENTA_OPERATOR_EMAILS", "")
    assert api.get("/ops/overview", headers=h(OPERATOR)).status_code == 403


def test_wrong_role_is_403(api, pair):
    assert api.get("/offers/mine", headers=pair["d"]).status_code == 403
    assert api.post("/lots", json={}, headers=pair["n"]).status_code == 403
    assert api.get("/ops/ngos", headers=pair["n"]).status_code == 403


def test_ops_token_only_on_sweep(api):
    ops = {"X-Alimenta-Ops-Token": OPS}
    assert api.post("/ops/sweep").status_code == 401
    assert api.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": "errado"}).status_code == 401
    assert api.post("/ops/sweep", headers=ops).json() == {"timed_out": 0, "escalated": 0, "unclaimed": 0, "expired": 0}
    for method, path in (("get", "/ops/overview"), ("post", "/lots"), ("get", "/me"), ("post", "/ops/ngos/N-x/approve")):
        assert getattr(api, method)(path, headers=ops).status_code == 401, path


def test_sweep_without_env_is_503(api, monkeypatch):
    monkeypatch.delenv("ALIMENTA_OPS_TOKEN")
    assert api.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": OPS}).status_code == 503
