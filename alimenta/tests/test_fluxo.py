"""Fluxo real com casos exatos: lote → oferta com prazo → aceite/recusa/escalonamento → dupla confirmação."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from alimenta.core import offers
from alimenta.db.models import LedgerEvent, Lot, LotOffer, LotOutcome, Notification
from alimenta.db.session import make_sessionmaker
from alimenta.tests.conftest import OPERATOR, OPS, TEST_DOMAIN, h, in_hours, lot_body, make_ngo

NOW = datetime(2026, 10, 15, 12, 0, tzinfo=timezone.utc)


def test_respond_window_clamp_exact():
    assert offers.respond_window(NOW, NOW + timedelta(hours=30)) == timedelta(minutes=60)
    assert offers.respond_window(NOW, NOW + timedelta(hours=2)) == timedelta(minutes=30)
    assert offers.respond_window(NOW, NOW + timedelta(minutes=40)) == timedelta(minutes=15)


def publish(api, pair, **extra):
    r = api.post("/lots", json=lot_body(**extra), headers=pair["d"])
    assert r.status_code == 201, r.text
    return r.json()


def offer_of(api, headers, lot_id):
    return next(o for o in api.get("/offers/mine", headers=headers).json() if o["lot_id"] == lot_id)


def test_lot_requires_terms_and_blocks_expired(api, pair):
    no_terms = api.post("/lots", json=lot_body(terms_version="x"), headers=pair["d"])
    assert no_terms.status_code == 422 and no_terms.json()["detail"].startswith("reafirme o termo termo-de-doacao-v1")
    expired = api.post("/lots", json=lot_body(expires_at=in_hours(-1)), headers=pair["d"])
    assert expired.status_code == 422
    assert expired.json()["detail"] == "lote vencido: a validade já passou, o lote não pode ser oferecido"
    window = api.post("/lots", json=lot_body(pickup_until=in_hours(40)), headers=pair["d"])
    assert window.status_code == 422


def test_full_flow_double_confirmation(api, pair, engine):
    lot = publish(api, pair)
    assert lot["status"] == "offered" and lot["is_test"] is True and lot["terms_version"] == "termo-de-doacao-v1"
    offer = offer_of(api, pair["n"], lot["id"])
    assert offer["status"] == "pending" and offer["rank"] == 1 and offer["distance_km"] == 2.53
    assert offer["lot"]["district"] == "Bela Vista" and "donor" not in offer  # endereço só depois do aceite
    match = api.post(f"/offers/{offer['id']}/accept", headers=pair["n"])
    assert match.status_code == 201 and match.json()["status"] == "accepted"
    match = match.json()
    accepted = offer_of(api, pair["n"], lot["id"])
    assert accepted["donor"]["address"] == "Avenida Paulista, 100, Bela Vista"
    assert accepted["donor"]["whatsapp"].startswith("https://wa.me/5511912345678?text=Rede%20Alimenta")

    route = api.get("/ngos/me/route", headers=pair["n"]).json()
    assert [s["donor_id"] for s in route["stops"]] == [pair["donor"]["id"]] and route["lots"] == 1
    assert route["stops"][0]["leg_km"] == 2.53 and route["total_km"] == 5.06

    pickup = api.post(f"/matches/{match['id']}/pickup", headers=pair["d"]).json()
    assert pickup["status"] == "collected" and pickup["delivered_at"] is None
    assert api.post(f"/matches/{match['id']}/pickup", headers=pair["d"]).json()["status"] == "collected"
    done = api.post(f"/matches/{match['id']}/receipt", headers=pair["n"]).json()
    assert done["status"] == "delivered" and done["ledger_sequence"] is None  # teste: nenhum livro
    assert api.get("/ngos/me/route", headers=pair["n"]).json()["lots"] == 0
    with make_sessionmaker(engine)() as s:
        outcome = s.get(LotOutcome, lot["id"])
        assert (outcome.outcome, outcome.is_test, outcome.model_version) == ("delivered", True, "discard_risk-v1")
        assert set(outcome.features) == {"category", "storage", "region", "kg", "hours_to_expiry",
                                         "published_hour", "weekday"}
        assert s.scalars(select(LedgerEvent)).all() == []
        channels = sorted(n.channel for n in s.scalars(select(Notification)))
        assert channels == ["inbox", "whatsapp_link"]
    k = api.get("/kpis").json()
    assert (k["kg_saved"], k["deliveries"], k["lots_by_status"], k["alerts"]) == (0.0, 0, {}, [])


def test_receipt_alone_is_not_delivery(api, pair):
    lot = publish(api, pair)
    match = api.post(f"/offers/{offer_of(api, pair['n'], lot['id'])['id']}/accept", headers=pair["n"]).json()
    assert api.post(f"/matches/{match['id']}/receipt", headers=pair["n"]).json()["status"] == "accepted"
    assert api.post(f"/matches/{match['id']}/pickup", headers=pair["d"]).json()["status"] == "delivered"


def test_others_cannot_touch(api, pair):
    lot = publish(api, pair)
    other = make_ngo(api, f"outra{TEST_DOMAIN}")
    offer = offer_of(api, pair["n"], lot["id"])
    assert api.post(f"/offers/{offer['id']}/accept", headers=h(f"outra{TEST_DOMAIN}")).status_code == 403
    assert other["id"] != pair["ngo"]["id"]
    match = api.post(f"/offers/{offer['id']}/accept", headers=pair["n"]).json()
    assert api.post(f"/matches/{match['id']}/receipt", headers=h(f"outra{TEST_DOMAIN}")).status_code == 403
    assert api.post(f"/offers/{offer['id']}/accept", headers=pair["n"]).status_code == 409


def test_decline_escalates_then_unclaimed(api, pair, engine):
    make_ngo(api, f"segunda{TEST_DOMAIN}", cep="01310100")  # mesma esquina do doador: ranking 1
    lot = publish(api, pair)
    first = offer_of(api, h(f"segunda{TEST_DOMAIN}"), lot["id"])
    bad = api.post(f"/offers/{first['id']}/decline", json={"reason": "porque sim"}, headers=h(f"segunda{TEST_DOMAIN}"))
    assert bad.status_code == 422
    r = api.post(f"/offers/{first['id']}/decline", json={"reason": "no_transport"}, headers=h(f"segunda{TEST_DOMAIN}"))
    assert r.json()["status"] == "declined" and r.json()["decline_reason"] == "no_transport"
    second = offer_of(api, pair["n"], lot["id"])
    assert (second["rank"], second["status"]) == (2, "pending")
    api.post(f"/offers/{second['id']}/decline", json={"reason": "no_capacity"}, headers=pair["n"])
    with make_sessionmaker(engine)() as s:
        assert s.get(Lot, lot["id"]).status == "unclaimed"
        assert s.get(LotOutcome, lot["id"]).outcome == "unclaimed"
    overview = api.get("/ops/overview", headers=h(OPERATOR)).json()
    assert [x["id"] for x in overview["unclaimed"]] == [lot["id"]] and overview["lots"]["unclaimed"] == 1
    assert api.post(f"/ops/lots/{lot['id']}/reoffer", headers=h(OPERATOR)).json()["status"] == "unclaimed"


def test_timeout_escalates_by_sweep(api, pair, engine):
    make_ngo(api, f"segunda{TEST_DOMAIN}", cep="01310100")
    lot = publish(api, pair)
    with make_sessionmaker(engine)() as s:
        first = s.scalar(select(LotOffer).where(LotOffer.lot_id == lot["id"]))
        assert first.respond_by - first.offered_at == timedelta(minutes=60)
        later = first.respond_by + timedelta(seconds=1)
        assert offers.tick(s, now=later) == {"timed_out": 1, "escalated": 1, "unclaimed": 0, "expired": 0}
        assert offers.tick(s, now=later) == {"timed_out": 0, "escalated": 0, "unclaimed": 0, "expired": 0}
        rows = s.scalars(select(LotOffer).where(LotOffer.lot_id == lot["id"]).order_by(LotOffer.id)).all()
        assert [(o.rank, o.status) for o in rows] == [(1, "timed_out"), (2, "pending")]
        assert rows[1].ngo_id == pair["ngo"]["id"]


def test_expired_lot_closes_on_sweep(api, pair, engine):
    lot = publish(api, pair, expires_at=in_hours(2))
    with make_sessionmaker(engine)() as s:
        after = datetime.now(timezone.utc) + timedelta(hours=3)
        assert offers.tick(s, now=after)["expired"] == 1
        assert s.get(Lot, lot["id"]).status == "expired" and s.get(LotOutcome, lot["id"]).outcome == "expired"
    assert api.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": OPS}).status_code == 200


def test_pending_ngo_never_gets_offer_and_test_never_mixes_with_real(api, pair, engine):
    make_ngo(api, f"pendente{TEST_DOMAIN}", approve=False, cep="01310100")
    lot = publish(api, pair)
    assert offer_of(api, pair["n"], lot["id"])["rank"] == 1
    with make_sessionmaker(engine)() as s:
        real_ngo = s.scalars(select(LotOffer.ngo_id)).all()
        assert real_ngo == [pair["ngo"]["id"]]


def test_refrigerated_needs_fridge_and_cancel(api, pair):
    make_ngo(api, f"semgeladeira{TEST_DOMAIN}", cep="01310100", accepts_refrigerated=False)
    lot = publish(api, pair, storage="refrigerated")
    assert offer_of(api, pair["n"], lot["id"])["rank"] == 1  # a sem geladeira, mais perto, ficou fora
    cancelled = api.post(f"/lots/{lot['id']}/cancel", headers=pair["d"]).json()
    assert cancelled["status"] == "cancelled"
    assert offer_of(api, pair["n"], lot["id"])["status"] == "withdrawn"


def test_capacity_checked_on_accept(api, pair):
    big = publish(api, pair, kg=90.0)
    api.post(f"/offers/{offer_of(api, pair['n'], big['id'])['id']}/accept", headers=pair["n"])
    second = publish(api, pair, kg=20.0)
    assert second["status"] == "unclaimed"  # 90 + 20 > 100: a única ONG fica fora do ranking


def test_purge_removes_only_test_data(api, pair, engine, monkeypatch):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    from alimenta.tests.conftest import make_donor
    real = make_donor(api, "real@empresa-real.com.br")
    lot = publish(api, pair)
    match = api.post(f"/offers/{offer_of(api, pair['n'], lot['id'])['id']}/accept", headers=pair["n"]).json()
    api.post(f"/matches/{match['id']}/pickup", headers=pair["d"])
    api.post(f"/matches/{match['id']}/receipt", headers=pair["n"])
    assert api.post("/ops/test-data/purge", headers=pair["d"]).status_code == 403
    r = api.post("/ops/test-data/purge", headers=h(OPERATOR))
    assert r.status_code == 200
    assert r.json()["deleted"] == {"public_ledger_dispatches": 0, "confirmations": 2, "matches": 1, "notifications": 2,
                                   "lot_offers": 1, "lot_outcomes": 1, "lots": 1, "ngos": 1, "donors": 1,
                                   "consents": 4, "audit_log": 3, "accounts": 3}
    from alimenta.db.models import Account, Donor
    with make_sessionmaker(engine)() as s:
        assert [d.id for d in s.scalars(select(Donor))] == [real["id"]]
        assert [a.email for a in s.scalars(select(Account))] == ["real@empresa-real.com.br"]


def test_pending_offer_unique_index_blocks_second(api, pair, engine):
    """Índice único parcial: o banco recusa uma segunda oferta `pending` para o mesmo lote."""
    import pytest
    from sqlalchemy.exc import IntegrityError
    lot = publish(api, pair)
    with make_sessionmaker(engine)() as s:
        first = s.scalar(select(LotOffer).where(LotOffer.lot_id == lot["id"]))
        s.add(LotOffer(lot_id=lot["id"], ngo_id=first.ngo_id, rank=2, score=1.0, distance_km=1.0, status="pending",
                       offered_at=first.offered_at, respond_by=first.respond_by))
        with pytest.raises(IntegrityError):
            s.flush()


def test_lot_has_no_patch_after_offer(api, pair):
    lot = publish(api, pair)
    # Não existe PATCH de lote: depois de publicado, só cancelar. Entradas do modelo ficam congeladas.
    assert api.patch(f"/lots/{lot['id']}", json={"kg": 1}, headers=pair["d"]).status_code in (404, 405)
    assert lot["kg"] == 10.0


def test_notification_records_channel_and_wa_link(api, pair, engine):
    lot = publish(api, pair)
    offer = offer_of(api, pair["n"], lot["id"])
    with make_sessionmaker(engine)() as s:
        rows = s.scalars(select(Notification).where(Notification.offer_id == offer["id"])).all()
        assert sorted((n.channel, n.ngo_id) for n in rows) == [("inbox", pair["ngo"]["id"]),
                                                               ("whatsapp_link", pair["ngo"]["id"])]
    from alimenta.core import notify
    text = notify.offer_text("bakery", 10.0, datetime(2026, 10, 15, 15, 0, tzinfo=timezone.utc), "Bela Vista")
    assert text == "Rede Alimenta: oferta de doação de padaria, 10 kg em Bela Vista. Responda no painel até 15/10 12:00."
    assert notify.wa_link(None, text) is None
