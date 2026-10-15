"""DELETE /me: apaga e-mail, CNPJ, cidade e aceites; cancela abertas; Supabase admin ou pendente."""

from __future__ import annotations

from sqlalchemy import select

from alimenta.db.models import Account, AccountDeletion, Consent, Donor, LedgerOutbox, Lot
from alimenta.tests.conftest import CNPJ_EMPRESA, OPERATOR, OPS, REAL, donation_body, h, make_donor


def test_delete_me_real_account_without_secret_key_stays_pending(api, monkeypatch, sessions, net):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    donor = make_donor(api, REAL, cnpj=CNPJ_EMPRESA)
    d = api.post("/donations", json=donation_body(), headers=h(REAL)).json()
    r = api.delete("/me", headers=h(REAL))
    assert (r.status_code, r.json()) == (200, {"deleted": True, "cancelled_open_donations": 1, "login_erased": False,
                                               "supabase": "pending"})
    with sessions() as s:
        assert s.scalars(select(Account)).all() == []
        assert s.scalars(select(Consent)).all() == []
        row = s.get(Donor, donor["id"])
        assert (row.account_id, row.city, row.uf, row.doc_number, row.doc_check, row.status) == \
               (None, None, None, None, None, "deleted")
        lot = s.get(Lot, d["id"])
        assert (lot.status, lot.city, lot.uf, lot.kg) == ("cancelled", None, None, 12.5)
        assert [r.action for r in s.scalars(select(LedgerOutbox).order_by(LedgerOutbox.id))] == \
               ["donation_registered", "donation_cancelled"]
        deletion = s.scalars(select(AccountDeletion)).one()
        assert (deletion.supabase_status, deletion.done_at) == ("pending", None)
    assert not any("/auth/v1/admin/users/" in url for _, url in net.log)
    again = api.get("/me", headers=h(REAL))
    assert (again.status_code, again.json()["detail"]) == (403, "esta conta foi apagada")


def test_delete_me_with_secret_key_calls_supabase_admin(api, monkeypatch, sessions, net):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_falsa")
    make_donor(api, REAL, kind="person")
    sub = api.get("/me", headers=h(REAL)).json()["id"]
    r = api.delete("/me", headers=h(REAL)).json()
    assert (r["supabase"], r["login_erased"]) == ("deleted", True)
    assert ("DELETE", f"https://exemplo.supabase.co/auth/v1/admin/users/{sub}") in net.log


def test_pending_deletion_retried_by_sweep(api, monkeypatch, sessions, net):
    monkeypatch.setenv("ALIMENTA_SIGNUP_OPEN", "true")
    make_donor(api, REAL, kind="person")
    api.delete("/me", headers=h(REAL))
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_falsa")
    out = api.post("/ops/sweep", headers={"X-Alimenta-Ops-Token": OPS}).json()
    assert out["deletions"] == {"pending": 0, "deleted": 1}
    with sessions() as s:
        assert s.scalars(select(AccountDeletion)).one().supabase_status == "deleted"


def test_operator_cannot_delete_by_api(api):
    r = api.delete("/me", headers=h(OPERATOR))
    assert r.status_code == 403
