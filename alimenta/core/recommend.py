"""Recomendação de destino para uma doação: candidatos por regra, leitura ao vivo das fontes e AI.

1. Candidatos (regra): distribuidores ativos do catálogo na mesma cidade, que aceitam a categoria
   (catálogo sem categoria = não informado, entra depois) e recebem do tipo de doador. Ordem: categoria
   declarada, horário publicado, confiança da pesquisa, nome. Zero candidatos: resposta honesta.
2. Leitura ao vivo: só URLs do próprio catálogo (`sources[].url` e `public_contact_url`) dos primeiros
   candidatos. Timeout curto, tamanho máximo, redirecionamento só dentro do mesmo domínio. Nada fora
   do catálogo é lido. URL repetida entre unidades (Sesc) é lida uma vez e vale para todas que a
   citam. A página lida serve para conferir o que está atual; nunca cria destino.
3. Busca web aberta: só com ALIMENTA_AI_WEB_SEARCH=true (9Router /v1/search). Desligada por padrão.
4. AI: 9Router /v1/chat/completions (OpenAI-compatível), modelo ALIMENTA_AI_MODEL e reserva
   ALIMENTA_AI_FALLBACK_MODEL, temperature 0, saída JSON {ranking:[{id, reason, sources}]}. Entra a
   doação sem pessoa (categoria, kg, conservação, horas até vencer, risco do modelo, cidade).
5. Validação dura: id fora dos candidatos, URL fora das fontes daquele distribuidor, ranking vazio,
   justificativa vazia ou acima de 200 caracteres: a resposta inteira é recusada e vale a ordem por regra
   (`mode: "rule"`). Tudo fica em `recommendations` (privada), com a escolha da pessoa depois.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from alimenta.core import catalog, config
from alimenta.core.clock import aware, utcnow
from alimenta.db.models import Donor, Lot, Recommendation

CLIENT = httpx.Client  # referência própria: o teste do ensaio troca httpx.Client do script

MAX_CANDIDATES = 6
READ_CANDIDATES = 4
MAX_PAGES = 6
PAGE_TIMEOUT_S = 6.0
PAGE_MAX_BYTES = 400_000
PAGE_TEXT_CHARS = 2_500
MAX_REDIRECTS = 3
AI_TIMEOUT_S = 40.0
REASON_MAX = 200
MAX_PER_LOT = 5
SEARCH_RESULTS = 3
TRANSPORT: httpx.BaseTransport | None = None  # testes trocam por httpx.MockTransport (9Router e páginas falsos)
USER_AGENT = "rede-alimenta/1 (+https://pontape.org/alimenta)"

CATEGORY_LABEL = {"produce": "hortifrúti", "bakery": "pães e bolos", "dairy": "laticínios", "meat": "carnes",
                  "prepared_meal": "refeição pronta", "dry_goods": "não perecíveis", "beverages": "bebidas"}
STORAGE_LABEL = {"ambient": "ambiente", "refrigerated": "refrigerado", "frozen": "congelado"}
DONOR_SOURCE = {"person": "individuals", "company": "companies", "distributor": "companies"}
CONFIDENCE_ORDER = {"high": 0, "medium": 1, "low": 2}
NO_CANDIDATE = "Não achamos distribuidor com fonte pública na sua cidade. Sugira um pelo link do catálogo."


class AiRefused(Exception):
    """Resposta da AI fora do contrato: vale a ordem por regra."""


@dataclass
class Page:
    url: str
    distributor_id: str
    status: str  # ok | timeout | too_big | http_<n> | offsite_redirect | error
    text: str = ""
    final_url: str | None = None

    def log(self) -> dict:
        return {"url": self.url, "distributor_id": self.distributor_id, "status": self.status,
                "chars": len(self.text), "final_url": self.final_url}


@dataclass
class Result:
    mode: str
    ranking: list[dict]
    message: str | None = None
    model: str | None = None
    error: str | None = None
    reads: list[Page] = field(default_factory=list)
    web: list[dict] = field(default_factory=list)


def _client(timeout: float) -> httpx.Client:
    return CLIENT(timeout=timeout, transport=TRANSPORT, follow_redirects=False,
                        headers={"User-Agent": USER_AGENT})


# --- 1. candidatos por regra ------------------------------------------------------------------

def candidates(lot: Lot, donor: Donor) -> list[dict]:
    key = catalog.city_key(lot.city or "")
    wanted = DONOR_SOURCE.get(donor.kind)
    rows = []
    for record in catalog.load():
        if catalog.city_key(record["city"]) != key or record["id"] == donor.distributor_id:
            continue
        cats = catalog.categories_of(record)
        if cats and lot.category not in cats:
            continue
        if lot.category == "prepared_meal" and record.get("accepts_prepared_meals") is False:
            continue
        receives = record.get("receives_from") or []
        if wanted and receives and wanted not in receives:
            continue
        rows.append(record)
    rows.sort(key=lambda r: (0 if lot.category in catalog.categories_of(r) else 1,
                             0 if r.get("hours_public") else 1,
                             CONFIDENCE_ORDER.get(r.get("confidence"), 3), r["name"]))
    return rows[:MAX_CANDIDATES]


def rule_reason(lot: Lot, record: dict) -> str:
    parts = []
    if lot.category in catalog.categories_of(record):
        parts.append(f"Aceita {CATEGORY_LABEL.get(lot.category, lot.category)} segundo a fonte")
    else:
        parts.append("A fonte não lista as categorias aceitas")
    if record.get("hours_public"):
        parts.append(f"horário: {record['hours_public']}")
    return clean_reason(", ".join(parts) + ".")


def rule_ranking(lot: Lot, records: list[dict]) -> list[dict]:
    return [{"distributor_id": r["id"], "reason": rule_reason(lot, r), "sources": [r["sources"][0]["url"]],
             "by": "rule"} for r in records]


def clean_reason(text: str) -> str:
    text = re.sub(r"\s*[\u2014\u2013]\s*", ", ", " ".join(str(text).split()))
    text = re.sub(r"\bIA\b", "AI", text)
    if len(text) > REASON_MAX:
        text = text[:REASON_MAX - 1].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return text


# --- 2. leitura ao vivo das fontes ------------------------------------------------------------

class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head", "nav", "footer"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.depth += 1

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.depth:
            self.depth -= 1

    def handle_data(self, data):
        if not self.depth and data.strip():
            self.chunks.append(data.strip())


def page_text(raw: bytes, content_type: str) -> str:
    body = raw.decode("utf-8", errors="replace")
    if "html" in content_type or body.lstrip().startswith("<"):
        parser = _Text()
        parser.feed(body)
        body = " ".join(parser.chunks)
    return " ".join(body.split())[:PAGE_TEXT_CHARS]


def fetch_page(url: str, distributor_id: str) -> Page:
    """GET só da URL do catálogo. Redireciona no máximo 3 vezes e só para o mesmo domínio."""
    host = urlsplit(url).hostname
    current = url
    try:
        with _client(PAGE_TIMEOUT_S) as http:
            for _ in range(MAX_REDIRECTS + 1):
                with http.stream("GET", current) as r:
                    if r.is_redirect:
                        target = urljoin(current, r.headers.get("location", ""))
                        if urlsplit(target).hostname != host or urlsplit(target).scheme not in ("http", "https"):
                            return Page(url, distributor_id, "offsite_redirect", final_url=target[:300])
                        current = target
                        continue
                    if r.status_code != 200:
                        return Page(url, distributor_id, f"http_{r.status_code}")
                    raw = b""
                    for chunk in r.iter_bytes():
                        raw += chunk
                        if len(raw) > PAGE_MAX_BYTES:
                            return Page(url, distributor_id, "too_big")
                    return Page(url, distributor_id, "ok", page_text(raw, r.headers.get("content-type", "")), current)
            return Page(url, distributor_id, "too_many_redirects")
    except httpx.TimeoutException:
        return Page(url, distributor_id, "timeout")
    except httpx.HTTPError:
        return Page(url, distributor_id, "error")


def read_sources(records: list[dict]) -> list[Page]:
    pages: list[Page] = []
    seen: set[str] = set()
    for record in records[:READ_CANDIDATES]:
        urls = ([record["public_contact_url"]] if record.get("public_contact_url") else []) + \
               [s["url"] for s in record["sources"]]
        taken = 0
        for url in urls:
            if url in seen or taken >= 2 or len(pages) >= MAX_PAGES:
                continue
            seen.add(url)
            taken += 1
            pages.append(fetch_page(url, record["id"]))
    return pages


# --- 3. busca web (atrás de flag) -------------------------------------------------------------

def web_search(records: list[dict], city: str) -> list[dict]:
    if not config.ai_web_search() or not config.ai_base_url():
        return []
    found = []
    with _client(PAGE_TIMEOUT_S * 2) as http:
        for record in records[:3]:
            try:
                r = http.post(f"{config.ai_base_url()}/search", headers=_ai_headers(), json={
                    "model": config.ai_search_model(), "max_results": SEARCH_RESULTS,
                    "query": f"{record['name']} {city} doação de alimentos horário"})
                results = r.json().get("results") or [] if r.status_code == 200 else []
            except (httpx.HTTPError, ValueError):
                results = []
            for item in results[:SEARCH_RESULTS]:
                if isinstance(item, dict) and catalog._http_url(item.get("url")):  # noqa: SLF001
                    found.append({"distributor_id": record["id"], "url": item["url"],
                                  "snippet": " ".join(str(item.get("snippet") or "").split())[:400]})
    return found


# --- 4. AI ------------------------------------------------------------------------------------

def _ai_headers() -> dict:
    return {"Authorization": f"Bearer {config.ai_key()}", "Content-Type": "application/json"}


SYSTEM = (
    "Você ajuda a escolher para qual distribuidor público de comida levar uma doação. "
    "Use só os candidatos e os textos dados. Não invente horário, endereço nem regra. "
    "Responda só JSON: {\"ranking\":[{\"id\":\"<id do candidato>\",\"reason\":\"<até 160 caracteres, "
    "português simples, sem travessão>\",\"sources\":[\"<url dada para aquele candidato>\"]}]}. "
    "Ordene do mais efetivo para o menos: aceita a categoria, recebe de quem doa, horário, prazo de validade. "
    "Cada reason cita o que a fonte diz. Cada item tem pelo menos uma url da lista daquele candidato."
)


def prompt(lot: Lot, donor: Donor, records: list[dict], pages: list[Page], web: list[dict], now: datetime) -> str:
    hours = round((aware(lot.expires_at) - now).total_seconds() / 3600, 1)
    donation = {"categoria": CATEGORY_LABEL.get(lot.category, lot.category), "kg": lot.kg,
                "conservacao": STORAGE_LABEL.get(lot.storage, lot.storage), "horas_ate_vencer": hours,
                "risco_de_descarte": lot.risk_level, "cidade": lot.city,
                "quem_doa": {"person": "pessoa", "company": "empresa", "distributor": "distribuidor"}[donor.kind]}
    items = []
    for r in records:
        items.append({"id": r["id"], "nome": r["name"], "tipo": r["kind"], "aceita": sorted(catalog.categories_of(r)),
                      "recebe_de": r.get("receives_from"), "horario": r.get("hours_public"),
                      "como_doar": r.get("how_to_donate"), "urls": sorted(catalog.allowed_urls(r)),
                      "trechos_da_pesquisa": [s.get("quote") for s in r["sources"] if s.get("quote")][:3],
                      "pagina_lida_agora": [{"url": p.url, "texto": p.text} for p in pages
                                            if p.url in catalog.allowed_urls(r) and p.status == "ok"],
                      "busca_web": [w for w in web if w["distributor_id"] == r["id"]]})
    return json.dumps({"doacao": donation, "candidatos": items}, ensure_ascii=False)


def parse_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.S)
    if fence:
        text = fence.group(1)
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise AiRefused("resposta sem JSON")
    try:
        return json.loads(text[start:end + 1])
    except ValueError as exc:
        raise AiRefused("JSON inválido") from exc


def validate(data: dict, records: list[dict], web: list[dict]) -> list[dict]:
    """Recusa a resposta inteira se qualquer item sai do catálogo ou das fontes daquele item."""
    allowed = {r["id"]: catalog.allowed_urls(r) for r in records}
    for w in web:
        allowed.setdefault(w["distributor_id"], set()).add(w["url"])
    ranking = data.get("ranking") if isinstance(data, dict) else None
    if not isinstance(ranking, list) or not ranking:
        raise AiRefused("ranking vazio")
    out, seen = [], set()
    for item in ranking:
        if not isinstance(item, dict):
            raise AiRefused("item fora do formato")
        rid = item.get("id")
        if rid not in allowed:
            raise AiRefused(f"id fora dos candidatos: {str(rid)[:60]}")
        if rid in seen:
            raise AiRefused(f"id repetido: {rid}")
        seen.add(rid)
        reason = item.get("reason")
        if not isinstance(reason, str) or not reason.strip() or len(reason) > REASON_MAX:
            raise AiRefused(f"justificativa vazia ou longa demais: {rid}")
        sources = item.get("sources")
        if not isinstance(sources, list) or not sources:
            raise AiRefused(f"sem fonte citada: {rid}")
        for url in sources:
            if url not in allowed[rid]:
                raise AiRefused(f"URL fora das fontes de {rid}: {str(url)[:120]}")
        out.append({"distributor_id": rid, "reason": clean_reason(reason), "sources": list(dict.fromkeys(sources)),
                    "by": "ai"})
    return out


def ask_ai(lot: Lot, donor: Donor, records: list[dict], pages: list[Page], web: list[dict],
           now: datetime) -> tuple[list[dict], str]:
    """Tenta o modelo principal e a reserva. Devolve (ranking validado, modelo) ou levanta AiRefused."""
    base, key = config.ai_base_url(), config.ai_key()
    if not base or not key:
        raise AiRefused("AI não configurada (ALIMENTA_AI_BASE_URL ou ALIMENTA_AI_KEY vazio)")
    user = prompt(lot, donor, records, pages, web, now)
    errors = []
    with _client(AI_TIMEOUT_S) as http:
        for model in config.ai_models():
            try:
                r = http.post(f"{base}/chat/completions", headers=_ai_headers(), json={
                    "model": model, "temperature": 0, "max_tokens": 900, "stream": False,
                    "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": user}]})
            except httpx.HTTPError as exc:
                errors.append(f"{model}: {exc.__class__.__name__}")
                continue
            if r.status_code != 200:
                errors.append(f"{model}: HTTP {r.status_code}")
                continue
            try:
                content = r.json()["choices"][0]["message"]["content"]
            except (ValueError, KeyError, IndexError, TypeError):
                errors.append(f"{model}: resposta fora do formato OpenAI")
                continue
            try:
                return validate(parse_json(content or ""), records, web), model
            except AiRefused as exc:
                errors.append(f"{model}: {exc}")
    raise AiRefused("; ".join(errors)[:200])


# --- 5. orquestração --------------------------------------------------------------------------

def recommend(session: Session, lot: Lot, now: datetime | None = None) -> dict:
    now = now or utcnow()
    if lot.status not in ("registered", "destination_chosen"):
        from alimenta.core.service import Conflict
        raise Conflict(f"doação {lot.status}: não precisa mais de destino")
    used = session.scalar(select(func.count()).select_from(Recommendation).where(Recommendation.lot_id == lot.id)) or 0
    if used >= MAX_PER_LOT:
        last = session.scalars(select(Recommendation).where(Recommendation.lot_id == lot.id)
                               .order_by(Recommendation.id.desc()).limit(1)).first()
        return {**last.output, "message": "Limite de recomendações desta doação: mostrando a última."}
    donor = session.get(Donor, lot.donor_id)
    records = candidates(lot, donor)
    result = Result(mode="rule", ranking=[])
    if not records:
        result.message = NO_CANDIDATE
    else:
        result.reads = read_sources(records)
        result.web = web_search(records, lot.city or "")
        try:
            ai_ranking, result.model = ask_ai(lot, donor, records, result.reads, result.web, now)
            listed = {item["distributor_id"] for item in ai_ranking}
            result.mode = "ai"
            result.ranking = ai_ranking + [r for r in rule_ranking(lot, records) if r["distributor_id"] not in listed]
        except AiRefused as exc:
            result.error = str(exc)[:200]
            result.ranking = rule_ranking(lot, records)
            result.message = "Sem AI agora: ordem pela regra do catálogo."
    output = {"mode": result.mode, "web_search": bool(result.web), "ranking": result.ranking,
              "message": result.message, "model": result.model,
              "pages_read": sum(1 for p in result.reads if p.status == "ok")}
    session.add(Recommendation(lot_id=lot.id, mode=result.mode, model=result.model, created_at=now,
                               input={"candidates": [r["id"] for r in records], "category": lot.category,
                                      "kg": lot.kg, "city": lot.city, "risk_level": lot.risk_level},
                               reads=[p.log() for p in result.reads] + [{"web": w} for w in result.web],
                               output=output, error=result.error, is_test=lot.is_test))
    session.commit()
    return output
