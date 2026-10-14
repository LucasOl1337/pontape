"""Recomendação: candidatos por regra, leitura só das fontes do catálogo, AI pelo 9Router falso e
recusa de id ou URL fora do catálogo (cai para regra). Casos exatos; nenhuma chamada sai para a rede."""

from __future__ import annotations

import httpx
import pytest
from sqlalchemy import select

from alimenta.core import catalog, recommend
from alimenta.db.models import Recommendation
from alimenta.tests.conftest import TEST_DOMAIN, donation_body, h, make_donor

BANK = "sp-municipal-food-bank"
HUB = "mesa-brasil-sesc-sp-hub"
# Ordem da regra: aceita a categoria, horário publicado, confiança, nome. Máximo 6.
CANDIDATES_BAKERY_COMPANY = ["mesa-brasil-sesc-sp-hub", "mesa-brasil-sesc-campo-limpo", "mesa-brasil-sesc-carmo",
                             "mesa-brasil-sesc-casa-verde", "mesa-brasil-sesc-interlagos", "mesa-brasil-sesc-ipiranga"]


def record(rid: str) -> dict:
    return catalog.by_id(rid)


def new_donation(api, headers, **extra) -> dict:
    r = api.post("/donations", json=donation_body(**extra), headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def ask(api, headers, donation_id):
    r = api.post(f"/donations/{donation_id}/recommend", json={}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()


def test_candidates_by_rule_exact(api, donor):
    d = new_donation(api, donor["h"])
    out = ask(api, donor["h"], d["id"])  # 9Router falso sem resposta: cai para regra
    assert [r["distributor_id"] for r in out["ranking"]] == CANDIDATES_BAKERY_COMPANY
    assert out["mode"] == "rule" and out["message"] == "Sem AI agora: ordem pela regra do catálogo."
    first = out["ranking"][0]
    assert first == {"distributor_id": HUB, "by": "rule",
                     "reason": first["reason"], "sources": [record(HUB)["sources"][0]["url"]]}
    assert first["reason"].startswith("Aceita pães e bolos segundo a fonte, horário: ")


def test_candidates_respect_category_and_who_gives(api):
    email = f"pessoa{TEST_DOMAIN}"
    make_donor(api, email, kind="person")
    d = new_donation(api, h(email), category="prepared_meal")
    out = ask(api, h(email), d["id"])
    assert [r["distributor_id"] for r in out["ranking"]] == ["sefras-cha-do-padre"]


def test_city_without_distributor_is_honest(api, donor):
    d = new_donation(api, donor["h"], city="Manaus", uf="AM")
    out = ask(api, donor["h"], d["id"])
    assert out == {"mode": "rule", "web_search": False, "ranking": [], "model": None, "pages_read": 0,
                   "message": "Não achamos distribuidor com fonte pública na sua cidade. Sugira um pelo link do catálogo."}


def test_city_match_ignores_accents_and_case(api, donor):
    d = new_donation(api, donor["h"], city="SAO PAULO")
    assert len(ask(api, donor["h"], d["id"])["ranking"]) == 6


def test_ai_ranking_is_validated_and_cites_source(api, donor, net, sessions):
    d = new_donation(api, donor["h"])
    src = record("mesa-brasil-sesc-carmo")["sources"][1]["url"]
    page = record("mesa-brasil-sesc-carmo")["public_contact_url"]
    assert (src, page) == ("https://sescmesabrasil.sescsp.org.br/seja-uma-empresa-doadora/",
                           "https://sescmesabrasil.sescsp.org.br/fale-conosco/")
    net.pages[page] = (200, "<html><head><title>x</title><script>nada()</script></head><body><nav>menu</nav>"
                            "<p>Recebemos pães de segunda a sexta, 8h às 17h.</p></body></html>",
                       {"content-type": "text/html; charset=utf-8"})
    net.ai = [net.answer([{"id": "mesa-brasil-sesc-carmo", "reason": "Recebe pães — segundo a fonte, das 8h às 17h. IA",
                           "sources": [src, page]}])]
    out = ask(api, donor["h"], d["id"])
    assert out["mode"] == "ai" and out["model"] == "cc/claude-haiku-4-5-20251001" and out["message"] is None
    assert out["ranking"][0] == {"distributor_id": "mesa-brasil-sesc-carmo", "by": "ai", "sources": [src, page],
                                 "reason": "Recebe pães, segundo a fonte, das 8h às 17h. AI"}
    assert [r["distributor_id"] for r in out["ranking"][1:]] == [c for c in CANDIDATES_BAKERY_COMPANY
                                                                 if c != "mesa-brasil-sesc-carmo"]
    assert all(r["by"] == "rule" for r in out["ranking"][1:])
    sent = net.bodies[-1]
    assert sent["model"] == "cc/claude-haiku-4-5-20251001" and sent["temperature"] == 0
    user = sent["messages"][1]["content"]
    assert "Recebemos pães de segunda a sexta, 8h às 17h." in user and "nada()" not in user and "menu" not in user
    assert donor["email"] not in user and donor["donor"]["id"] not in user
    with sessions() as s:
        row = s.scalars(select(Recommendation)).one()
        assert (row.mode, row.is_test, row.error) == ("ai", True, None)
        assert {"url": page, "distributor_id": HUB, "status": "ok",
                "chars": len("Recebemos pães de segunda a sexta, 8h às 17h."), "final_url": page} in row.reads
    assert [url for method, url in net.log if method == "GET"].count(page) == 1  # lida uma vez, vale para as 6 unidades
    assert user.count("Recebemos pães de segunda a sexta, 8h às 17h.") == 6


@pytest.mark.parametrize("answer, error", [
    ([{"id": "inventado", "reason": "x", "sources": ["https://x.org"]}], "id fora dos candidatos: inventado"),
    ([{"id": BANK, "reason": "x", "sources": ["https://x.org"]}], f"id fora dos candidatos: {BANK}"),
    ([{"id": "mesa-brasil-sesc-carmo", "reason": "x", "sources": ["https://outro-site.org/carmo"]}],
     "URL fora das fontes de mesa-brasil-sesc-carmo: https://outro-site.org/carmo"),
    ([{"id": "mesa-brasil-sesc-carmo", "reason": "x",
       "sources": ["https://www.sescsp.org.br/unidades/ipiranga/"]}], "URL fora das fontes de mesa-brasil-sesc-carmo"),
    ([{"id": "mesa-brasil-sesc-carmo", "reason": "x", "sources": []}], "sem fonte citada: mesa-brasil-sesc-carmo"),
    ([{"id": "mesa-brasil-sesc-carmo", "reason": "", "sources": ["x"]}],
     "justificativa vazia ou longa demais: mesa-brasil-sesc-carmo"),
    ([], "ranking vazio"),
    ("não sei", "resposta sem JSON"),
])
def test_ai_answer_outside_catalog_falls_back_to_rule(api, donor, net, sessions, answer, error):
    d = new_donation(api, donor["h"])
    net.ai = [net.answer(answer), net.answer(answer)]
    out = ask(api, donor["h"], d["id"])
    assert out["mode"] == "rule" and [r["distributor_id"] for r in out["ranking"]] == CANDIDATES_BAKERY_COMPANY
    with sessions() as s:
        row = s.scalars(select(Recommendation)).one()
    assert row.error.startswith(f"cc/claude-haiku-4-5-20251001: {error}")
    assert "cx/gpt-5.6-luna: " in row.error


def test_spare_model_when_main_fails(api, donor, net):
    d = new_donation(api, donor["h"])
    src = record("mesa-brasil-sesc-ipiranga")["sources"][0]["url"]
    net.ai = [503, net.answer("```json\n{\"ranking\":[{\"id\":\"mesa-brasil-sesc-ipiranga\",\"reason\":\"Aceita pães.\","
                              f"\"sources\":[\"{src}\"]}}]}}\n```")]
    out = ask(api, donor["h"], d["id"])
    assert (out["mode"], out["model"], out["ranking"][0]["distributor_id"]) == \
           ("ai", "cx/gpt-5.6-luna", "mesa-brasil-sesc-ipiranga")
    assert [b["model"] for b in net.bodies] == ["cc/claude-haiku-4-5-20251001", "cx/gpt-5.6-luna"]


def test_no_ai_config_means_rule_without_calls(api, donor, net, monkeypatch):
    monkeypatch.delenv("ALIMENTA_AI_KEY")
    d = new_donation(api, donor["h"])
    out = ask(api, donor["h"], d["id"])
    assert out["mode"] == "rule" and not any("9router" in url for _, url in net.log)


def test_reads_only_catalog_urls_and_never_other_domain(api, donor, net):
    d = new_donation(api, donor["h"])
    first = record(HUB)
    contact = first["public_contact_url"]
    net.pages[contact] = (302, "", {"location": "https://site-de-fora.example/golpe"})
    ask(api, donor["h"], d["id"])
    allowed = set()
    for rid in CANDIDATES_BAKERY_COMPANY:
        allowed |= catalog.allowed_urls(record(rid))
    pages = [url for method, url in net.log if method == "GET"]
    assert pages and set(pages) <= allowed
    assert "https://site-de-fora.example/golpe" not in pages
    assert len(pages) <= recommend.MAX_PAGES


def test_fetch_limits_exact(net):
    url = "https://www.sescsp.org.br/teste"
    net.pages[url] = (200, "x" * (recommend.PAGE_MAX_BYTES + 1), {"content-type": "text/plain"})
    assert recommend.fetch_page(url, "a").status == "too_big"
    net.pages[url] = (301, "", {"location": "/outra"})
    net.pages["https://www.sescsp.org.br/outra"] = (200, "ok aqui", {"content-type": "text/plain"})
    page = recommend.fetch_page(url, "a")
    assert (page.status, page.text, page.final_url) == ("ok", "ok aqui", "https://www.sescsp.org.br/outra")
    net.pages[url] = (302, "", {"location": "http://evil.example/"})
    assert recommend.fetch_page(url, "a").status == "offsite_redirect"
    net.pages[url] = (200, httpx.ReadTimeout("lento"), {})
    assert recommend.fetch_page(url, "a").status == "timeout"
    net.pages[url] = (500, "", {})
    assert recommend.fetch_page(url, "a").status == "http_500"


def test_web_search_off_by_default_and_on_with_flag(api, donor, net, monkeypatch):
    d = new_donation(api, donor["h"])
    assert ask(api, donor["h"], d["id"])["web_search"] is False
    assert not any(url.endswith("/search") for _, url in net.log)
    monkeypatch.setenv("ALIMENTA_AI_WEB_SEARCH", "true")
    net.search = {"results": [{"url": "https://noticia.example/sesc-carmo", "snippet": "Horário novo: 9h às 16h"}]}
    net.ai = [net.answer([{"id": "mesa-brasil-sesc-carmo", "reason": "Horário novo segundo a busca.",
                           "sources": ["https://noticia.example/sesc-carmo"]}])]
    out = ask(api, donor["h"], d["id"])
    assert out["web_search"] is True and out["mode"] == "ai"
    assert out["ranking"][0]["sources"] == ["https://noticia.example/sesc-carmo"]


def test_accept_top_marks_choice_ai_top(api, real_donor, net, sessions):
    d = new_donation(api, real_donor["h"])
    src = record(HUB)["sources"][0]["url"]
    net.ai = [net.answer([{"id": HUB, "reason": "Aceita pães e recebe de pessoas.", "sources": [src]}])]
    out = ask(api, real_donor["h"], d["id"])
    assert out["ranking"][0]["distributor_id"] == HUB
    chosen = api.post(f"/donations/{d['id']}/destination", json={"distributor_id": HUB, "from_recommendation": True},
                      headers=real_donor["h"]).json()
    assert chosen["choice"] == "ai_top"
    other = api.post(f"/donations/{d['id']}/destination", json={"distributor_id": BANK, "from_recommendation": True},
                     headers=real_donor["h"]).json()
    assert other["choice"] == "other"
    with sessions() as s:
        assert s.scalars(select(Recommendation)).one().choice == "picked_other"


def test_limit_per_donation_returns_last(api, donor):
    d = new_donation(api, donor["h"])
    for _ in range(recommend.MAX_PER_LOT):
        ask(api, donor["h"], d["id"])
    out = ask(api, donor["h"], d["id"])
    assert out["message"] == "Limite de recomendações desta doação: mostrando a última."
