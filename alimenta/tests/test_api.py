"""Fluxo da API com casos exatos: token, 422 de vencido, 409 de dupla atribuição, deliver idempotente."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

LOT = {"donor_id": "D03", "category": "bakery", "storage": "ambient", "kg": 12.5, "description": "Pães do dia (simulado)"}


def in_hours(hours: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


def test_health_and_swagger(client):
    health = client.get("/health").json()
    assert health["status"] == "ok"
    assert health["notice"] == "DEMONSTRAÇÃO · dados simulados"
    assert health["model_version"] == "discard_risk-v1"
    assert client.get("/docs").status_code == 200
    assert "/lots/{lot_id}/matches" in client.get("/openapi.json").json()["paths"]


def test_seed_loaded_on_start(client):
    assert len(client.get("/donors").json()) == 15
    assert len(client.get("/ngos").json()) == 20
    assert client.get("/ledger/verify").json()["events"] == 119


def test_write_without_token_is_401(client):
    response = client.post("/lots", json={**LOT, "expires_at": in_hours(8)})
    assert response.status_code == 401
    wrong = client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers={"X-Alimenta-Token": "errado"})
    assert wrong.status_code == 401


def test_write_disabled_without_env_is_503(client, auth, monkeypatch):
    monkeypatch.delenv("ALIMENTA_WRITE_TOKEN")
    assert client.post("/demo/reset", headers=auth).status_code == 503


def test_expired_lot_is_422(client, auth):
    response = client.post("/lots", json={**LOT, "expires_at": in_hours(-1)}, headers=auth)
    assert response.status_code == 422
    assert "vencido" in response.json()["detail"]


def test_full_flow_post_to_deliver(client, auth):
    lot = client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers=auth)
    assert lot.status_code == 201
    lot = lot.json()
    assert 0 <= lot["discard_proba"] <= 1 and lot["risk_level"] in {"low", "medium", "high"}
    recs = client.get(f"/lots/{lot['id']}/recommendations").json()["recommendations"]
    assert recs and all(r["eligible"] and "bakery" for r in recs)
    assert recs == sorted(recs, key=lambda r: -r["score"])

    kg_before = client.get("/kpis").json()["kg_saved"]
    match = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": recs[0]["ngo_id"]}, headers=auth).json()
    assert match["status"] == "proposed"
    for step in ("confirm", "collect", "deliver"):
        response = client.post(f"/matches/{match['id']}/{step}", headers=auth)
        assert response.status_code == 200, response.text
    delivered = response.json()
    assert delivered["status"] == "delivered" and delivered["ledger_sequence"] == 120

    again = client.post(f"/matches/{match['id']}/deliver", headers=auth)
    assert again.status_code == 200 and again.json() == delivered
    verify = client.get("/ledger/verify").json()
    assert verify["ok"] is True and verify["events"] == 120
    last = client.get("/ledger").json()["events"][-1]["payload"]
    assert last == {"type": "field", "action": "food_delivered", "occurredOn": last["occurredOn"],
                    "correctionOf": None, "quantity": "12500"}
    assert client.get("/kpis").json()["kg_saved"] == round(kg_before + 12.5, 1)
    assert client.get(f"/lots/{lot['id']}").json()["status"] == "delivered"


def test_double_assignment_is_409(client, auth):
    lot = client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers=auth).json()
    ngo = client.get(f"/lots/{lot['id']}/recommendations").json()["recommendations"]
    first = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo[0]["ngo_id"]}, headers=auth)
    second = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo[1]["ngo_id"]}, headers=auth)
    assert first.status_code == 201 and second.status_code == 409


def test_cancel_frees_the_lot(client, auth):
    lot = client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers=auth).json()
    ngo = client.get(f"/lots/{lot['id']}/recommendations").json()["recommendations"]
    match = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo[0]["ngo_id"]}, headers=auth).json()
    assert client.post(f"/matches/{match['id']}/cancel", headers=auth).json()["status"] == "cancelled"
    assert client.get(f"/lots/{lot['id']}").json()["status"] == "open"
    again = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo[1]["ngo_id"]}, headers=auth)
    assert again.status_code == 201


def test_deliver_before_collect_is_409(client, auth):
    lot = client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers=auth).json()
    ngo = client.get(f"/lots/{lot['id']}/recommendations").json()["recommendations"]
    match = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": ngo[0]["ngo_id"]}, headers=auth).json()
    assert client.post(f"/matches/{match['id']}/deliver", headers=auth).status_code == 409


def test_ngo_that_rejects_category_is_422(client, auth):
    lot = client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers=auth).json()
    rejecting = next(n for n in client.get("/ngos").json() if "bakery" not in n["accepted_categories"])
    response = client.post(f"/lots/{lot['id']}/matches", json={"ngo_id": rejecting["id"]}, headers=auth)
    assert response.status_code == 422


def test_unknown_lot_is_404(client):
    assert client.get("/lots/L-naoexiste").status_code == 404


def test_reset_restores_seed(client, auth):
    client.post("/lots", json={**LOT, "expires_at": in_hours(8)}, headers=auth)
    assert client.post("/demo/reset", headers=auth).json()["deliveries"] == 119
    assert len(client.get("/lots").json()) == 150
    assert client.get("/ledger/verify").json()["events"] == 119
