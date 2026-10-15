"""Doação de ponta a ponta (só doador): registro, destino, entrega declarada, cancelamento, vencimento,
limites, isolamento entre contas e o que entra na fila do livro público. Casos exatos."""

from __future__ import annotations

import json
from datetime import timedelta

from sqlalchemy import select

from alimenta.core import donations
from alimenta.core.clock import utcnow
from alimenta.db.models import LedgerOutbox, Lot, LotOutcome
from alimenta.tests.conftest import TEST_DOMAIN, donation_body, h, in_hours, make_donor

BANK = "sp-municipal-food-bank"
SESC = "mesa-brasil-sesc-sp-hub"


def outbox_rows(sessions):
    with sessions() as s:
        return [(r.event_id.split(":", 1)[1], r.status, json.loads(r.envelope)) for r in
                s.scalars(select(LedgerOutbox).order_by(LedgerOutbox.id))]


def test_real_donation_full_cycle_goes_to_outbox_in_order(api, real_donor, sessions):
    d = api.post("/donations", json=donation_body(), headers=real_donor["h"])
    assert d.status_code == 201, d.text
    body = d.json()
    ref = body["public_ref"]
    assert (body["status"], body["city"], body["uf"], body["kg"], body["is_test"]) == \
           ("registered", "São Paulo", "SP", 12.5, False)
    assert len(ref) == 10 and ref.startswith("AL") and body["ledger_sequence"] is None
    assert body["ledger"] == [{"action": "donation_registered", "event_id": f"{ref}:1:donation_registered",
                               "ledger_sequence": None, "status": "entering_ledger"}]
    chosen = api.post(f"/donations/{body['id']}/destination", json={"distributor_id": BANK}, headers=real_donor["h"])
    assert (chosen.status_code, chosen.json()["status"], chosen.json()["distributor_id"], chosen.json()["choice"]) == \
           (200, "destination_chosen", BANK, "other")
    done = api.post(f"/donations/{body['id']}/delivered", json={}, headers=real_donor["h"])
    assert (done.status_code, done.json()["status"]) == (200, "delivered")
    rows = outbox_rows(sessions)
    assert [(e, s) for e, s, _ in rows] == [("1:donation_registered", "pending"), ("2:destination_chosen", "pending"),
                                            ("3:donation_delivered", "pending")]
    day = body["created_at"][:10]
    assert [env for _, _, env in rows] == [
        {"source": "alimenta", "eventId": f"{ref}:1:donation_registered", "payload": {
            "type": "donation", "action": "donation_registered", "occurredOn": rows[0][2]["payload"]["occurredOn"],
            "correctionOf": None, "donationRef": ref, "category": "bakery", "quantityGrams": "12500"}},
        {"source": "alimenta", "eventId": f"{ref}:2:destination_chosen", "payload": {
            "type": "donation", "action": "destination_chosen", "occurredOn": rows[1][2]["payload"]["occurredOn"],
            "correctionOf": None, "donationRef": ref, "distributorId": BANK, "choice": "other"}},
        {"source": "alimenta", "eventId": f"{ref}:3:donation_delivered", "payload": {
            "type": "donation", "action": "donation_delivered", "occurredOn": rows[2][2]["payload"]["occurredOn"],
            "correctionOf": None, "donationRef": ref}},
    ]
    assert abs(int(rows[0][2]["payload"]["occurredOn"][8:]) - int(day[8:])) <= 1
    assert "São Paulo" not in json.dumps([env for _, _, env in rows], ensure_ascii=False)
    with sessions() as s:
        assert s.get(LotOutcome, body["id"]).outcome == "delivered"
    k = api.get("/kpis").json()
    assert (k["donations"], k["deliveries"], k["kg_delivered"], k["meals_estimated"]) == (1, 1, 12.5, 22)
    assert k["by_distributor"] == [{"distributor_id": BANK, "deliveries": 1, "kg": 12.5}]
    assert k["destination_choice"] == {"ai_top": 0, "other": 1}


def test_test_account_never_enters_outbox_nor_kpis(api, donor, sessions):
    d = api.post("/donations", json=donation_body(), headers=donor["h"]).json()
    api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK}, headers=donor["h"])
    api.post(f"/donations/{d['id']}/delivered", headers=donor["h"])
    assert outbox_rows(sessions) == []
    assert api.get("/kpis").json()["deliveries"] == 0
    assert api.get("/donations/mine", headers=donor["h"]).json()[0]["ledger"] == []


def test_order_rules_are_409(api, donor):
    d = api.post("/donations", json=donation_body(), headers=donor["h"]).json()
    early = api.post(f"/donations/{d['id']}/delivered", headers=donor["h"])
    assert (early.status_code, early.json()["detail"]) == (409, "entrega só depois de escolher o destino")
    assert api.post(f"/donations/{d['id']}/cancel", headers=donor["h"]).json()["status"] == "cancelled"
    late = api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK}, headers=donor["h"])
    assert (late.status_code, late.json()["detail"]) == (409, "doação cancelled: não dá mais para escolher destino")
    again = api.post(f"/donations/{d['id']}/cancel", headers=donor["h"])
    assert (again.status_code, again.json()["detail"]) == (409, "doação cancelled: não dá para cancelar")


def test_destination_must_be_in_catalog_and_change_is_recorded(api, real_donor, sessions):
    d = api.post("/donations", json=donation_body(), headers=real_donor["h"]).json()
    bad = api.post(f"/donations/{d['id']}/destination", json={"distributor_id": "inventado-pela-ai"},
                   headers=real_donor["h"])
    assert (bad.status_code, bad.json()["detail"]) == (422, "distribuidor inventado-pela-ai não está no catálogo")
    url = api.post(f"/donations/{d['id']}/destination", json={"distributor_id": "https://x.org"}, headers=real_donor["h"])
    assert url.status_code == 422
    api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK}, headers=real_donor["h"])
    api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK}, headers=real_donor["h"])
    api.post(f"/donations/{d['id']}/destination", json={"distributor_id": SESC}, headers=real_donor["h"])
    assert [e for e, _, _ in outbox_rows(sessions)] == ["1:donation_registered", "2:destination_chosen",
                                                        "3:destination_chosen"]


def test_distributor_cannot_donate_to_itself(api):
    email = f"banco{TEST_DOMAIN}"
    make_donor(api, email, kind="distributor", distributor_id=BANK)
    d = api.post("/donations", json=donation_body(), headers=h(email)).json()
    r = api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK}, headers=h(email))
    assert (r.status_code, r.json()["detail"]) == (422, "um distribuidor não pode doar para si mesmo")


def test_registration_refusals_and_limits(api, donor):
    past = api.post("/donations", json=donation_body(expires_at=in_hours(-1)), headers=donor["h"])
    assert (past.status_code, past.json()["detail"]) == (422, "a validade já passou: doação vencida não entra")
    assert api.post("/donations", json=donation_body(kg=0), headers=donor["h"]).status_code == 422
    assert api.post("/donations", json=donation_body(category="clothing"), headers=donor["h"]).status_code == 422
    assert api.post("/donations", json=donation_body(description="texto livre"), headers=donor["h"]).status_code == 422
    for _ in range(donations.MAX_OPEN):
        assert api.post("/donations", json=donation_body(), headers=donor["h"]).status_code == 201
    six = api.post("/donations", json=donation_body(), headers=donor["h"])
    assert (six.status_code, six.json()["detail"]) == \
           (409, "limite de 5 doações abertas: entregue ou cancele uma antes")
    first = api.get("/donations/mine", headers=donor["h"]).json()[-1]
    api.post(f"/donations/{first['id']}/cancel", headers=donor["h"])
    for _ in range(donations.MAX_PER_DAY - donations.MAX_OPEN):
        api.post("/donations", json=donation_body(), headers=donor["h"])
        last = api.get("/donations/mine", headers=donor["h"]).json()[0]
        api.post(f"/donations/{last['id']}/cancel", headers=donor["h"])
    eleven = api.post("/donations", json=donation_body(), headers=donor["h"])
    assert (eleven.status_code, eleven.json()["detail"]) == (409, "limite de 10 doações por dia")


def test_any_city_registers_and_other_accounts_cannot_touch(api, donor):
    d = api.post("/donations", json=donation_body(city="Manaus", uf="am"), headers=donor["h"]).json()
    assert (d["city"], d["uf"]) == ("Manaus", "AM")
    other = f"outro{TEST_DOMAIN}"
    make_donor(api, other)
    for method, path in (("get", f"/donations/{d['id']}"), ("post", f"/donations/{d['id']}/cancel"),
                         ("post", f"/donations/{d['id']}/recommend")):
        r = getattr(api, method)(path, headers=h(other))
        assert (r.status_code, r.json()["detail"]) == (404, f"doação {d['id']} não existe nesta conta"), path
    no_signup = api.post("/donations", json=donation_body(), headers=h(f"sem-cadastro{TEST_DOMAIN}"))
    assert no_signup.status_code == 403


def test_expiry_cancels_and_grace_after_destination(api, real_donor, sessions):
    a = api.post("/donations", json=donation_body(expires_at=in_hours(1)), headers=real_donor["h"]).json()
    b = api.post("/donations", json=donation_body(expires_at=in_hours(1)), headers=real_donor["h"]).json()
    api.post(f"/donations/{b['id']}/destination", json={"distributor_id": BANK}, headers=real_donor["h"])
    with sessions() as s:
        assert donations.expire_due(s, utcnow() + timedelta(hours=2)) == 1
        assert donations.expire_due(s, utcnow() + timedelta(hours=48, minutes=30)) == 0
        assert donations.expire_due(s, utcnow() + timedelta(hours=50)) == 1
        assert (s.get(Lot, a["id"]).status, s.get(Lot, b["id"]).status) == ("expired", "expired")
        assert s.get(LotOutcome, a["id"]).outcome == "expired"
    actions = [e.split(":")[1] for e, _, _ in outbox_rows(sessions)]
    assert actions.count("donation_cancelled") == 2


def test_suspended_donor_cannot_register(api, donor):
    from alimenta.tests.conftest import OPERATOR
    api.post(f"/ops/donors/{donor['donor']['id']}/suspend", headers=h(OPERATOR))
    r = api.post("/donations", json=donation_body(), headers=donor["h"])
    assert (r.status_code, r.json()["detail"]) == (403, "cadastro de doador suspended")
