"""API da Rede Alimenta (FastAPI + Swagger em /docs). DEMONSTRAÇÃO · dados simulados.

Leitura pública sem coordenada exata, nome ou endereço: só região e campos não
sensíveis. Toda escrita, e a leitura com coordenada exata, exige o cabeçalho
`X-Alimenta-Token` igual a `ALIMENTA_WRITE_TOKEN`; sem a variável, fica desligada (503).
O seed simulado só carrega com `ALIMENTA_SEED_ON_START=true` (padrão: desligado).

Rodar, da raiz do repositório:
    uvicorn alimenta.api.main:app --port 8000
"""

from __future__ import annotations

import hmac
import os
from collections.abc import Iterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alimenta.api import schemas
from alimenta.core import kpis, service
from alimenta.core.domain import DEMO_LABEL
from alimenta.db.models import Donor, Lot, Match, Ngo
from alimenta.db.seed import create_schema, reset, seed
from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.ledger import demo_ledger
from alimenta.model.predict import load_metrics, load_model

DESCRIPTION = (
    f"**{DEMO_LABEL}.** Rede Alimenta, módulo M5 do PontaPé (projeto integrador FIAP Rede Alimenta IA). "
    "Lote de comida → risco de descarte (modelo) → ONG recomendada (regras) → coleta e entrega → KPIs. "
    "Escrita exige o cabeçalho `X-Alimenta-Token`. Sem o token, as leituras saem só com região: "
    "sem nome, endereço nem coordenada exata. Nenhum dado é de pessoa ou entidade real."
)


def env_true(name: str, default: str = "false") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "sim"}


def require_token(x_alimenta_token: str | None = Header(default=None)) -> None:
    expected = os.environ.get("ALIMENTA_WRITE_TOKEN", "")
    if not expected:
        raise HTTPException(503, "escrita desligada: ALIMENTA_WRITE_TOKEN não configurado")
    if not x_alimenta_token or not hmac.compare_digest(x_alimenta_token.encode(), expected.encode()):
        raise HTTPException(401, "token de escrita ausente ou inválido")


def has_token(x_alimenta_token: str | None = Header(default=None)) -> bool:
    """Leitura: sem cabeçalho, saída pública; com cabeçalho, ele tem de valer (401/503)."""
    if x_alimenta_token is None:
        return False
    require_token(x_alimenta_token)
    return True


def dump(model, rows) -> list[dict]:
    return [model.model_validate(row).model_dump(mode="json") for row in rows]


def public_doc(model) -> dict:
    return {200: {"model": list[model], "description": "Sem token: saída pública. Com token: saída completa."}}


def create_app(engine: Engine | None = None) -> FastAPI:
    engine = engine or make_engine()
    sessions = make_sessionmaker(engine)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        load_model()  # falha cedo se o artefato não confere com o sha256
        create_schema(engine)
        if env_true("ALIMENTA_SEED_ON_START"):
            with sessions() as session:
                seed(session)
        yield

    app = FastAPI(title="Rede Alimenta · API (DEMONSTRAÇÃO)", version="0.1.0",
                  description=DESCRIPTION, lifespan=lifespan)

    def db() -> Iterator[Session]:
        with sessions() as session:
            yield session

    @app.exception_handler(service.NotFound)
    async def _404(_r: Request, exc: Exception):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(service.Conflict)
    async def _409(_r: Request, exc: Exception):
        return JSONResponse(status_code=409, content={"detail": str(exc)})

    @app.exception_handler(service.Invalid)
    async def _422(_r: Request, exc: Exception):
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    write = [Depends(require_token)]

    @app.get("/health", tags=["sistema"])
    def health(session: Session = Depends(db)):
        session.execute(text("SELECT 1"))
        return {"status": "ok", "notice": DEMO_LABEL, "database": engine.dialect.name,
                "model_version": load_metrics()["model_version"]}

    @app.get("/donors", response_model=None, responses=public_doc(schemas.DonorPublic), tags=["doadores"],
             summary="Doadores: público só com tipo e região; nome e coordenada só com token")
    def list_donors(full: bool = Depends(has_token), session: Session = Depends(db)):
        rows = session.scalars(select(Donor).order_by(Donor.id)).all()
        return dump(schemas.DonorOut if full else schemas.DonorPublic, rows)

    @app.post("/donors", response_model=schemas.DonorOut, status_code=201, dependencies=write, tags=["doadores"])
    def create_donor(body: schemas.DonorIn, session: Session = Depends(db)):
        donor = Donor(id=service.new_id("D"), **body.model_dump())
        session.add(donor)
        session.commit()
        return donor

    @app.get("/ngos", response_model=None, responses=public_doc(schemas.NgoPublic), tags=["ONGs"],
             summary="ONGs: público com região, categorias e capacidade; nome e coordenada só com token")
    def list_ngos(full: bool = Depends(has_token), session: Session = Depends(db)):
        rows = session.scalars(select(Ngo).order_by(Ngo.id)).all()
        return dump(schemas.NgoOut if full else schemas.NgoPublic, rows)

    @app.post("/ngos", response_model=schemas.NgoOut, status_code=201, dependencies=write, tags=["ONGs"])
    def create_ngo(body: schemas.NgoIn, session: Session = Depends(db)):
        ngo = Ngo(id=service.new_id("N"), **body.model_dump())
        session.add(ngo)
        session.commit()
        return ngo

    @app.get("/lots", response_model=None, responses=public_doc(schemas.LotPublic), tags=["lotes"],
             summary="Lotes: a descrição livre só sai com token")
    def list_lots(status: str | None = None, limit: int = 200, full: bool = Depends(has_token),
                  session: Session = Depends(db)):
        query = select(Lot).order_by(Lot.published_at.desc()).limit(min(max(limit, 1), 1000))
        if status:
            query = query.where(Lot.status == status)
        return dump(schemas.LotOut if full else schemas.LotPublic, session.scalars(query).all())

    @app.post("/lots", response_model=schemas.LotOut, status_code=201, dependencies=write, tags=["lotes"],
              summary="Publica um lote e recebe a predição de risco de descarte (lote vencido → 422)")
    def create_lot(body: schemas.LotIn, session: Session = Depends(db)):
        return service.create_lot(session, **body.model_dump())

    @app.get("/lots/{lot_id}", response_model=None, responses={200: {"model": schemas.LotPublic}}, tags=["lotes"])
    def get_lot(lot_id: str, full: bool = Depends(has_token), session: Session = Depends(db)):
        return dump(schemas.LotOut if full else schemas.LotPublic, [service.get(session, Lot, lot_id)])[0]

    @app.get("/lots/{lot_id}/recommendations", tags=["match"], dependencies=write,
             summary="Ranking de ONGs com os pontos de cada regra, só com token (lote vencido → 422)",
             description="Exige token: nome da ONG e distância exata ao doador não são públicos.")
    def recommendations(lot_id: str, limit: int = 5, session: Session = Depends(db)):
        return {"lot_id": lot_id, "rules": "alimenta/core/matching.py",
                "recommendations": service.recommendations(session, lot_id, min(max(limit, 1), 20))}

    @app.post("/lots/{lot_id}/matches", response_model=schemas.MatchOut, status_code=201, dependencies=write,
              tags=["match"], summary="Atribui o lote a uma ONG (409 se o lote já tem match ativo)")
    def create_match(lot_id: str, body: schemas.MatchIn, session: Session = Depends(db)):
        return service.create_match(session, lot_id, body.ngo_id)

    @app.get("/matches", response_model=None, responses=public_doc(schemas.MatchPublic), tags=["match"],
             summary="Matches: distância e pontos só com token")
    def list_matches(limit: int = 200, full: bool = Depends(has_token), session: Session = Depends(db)):
        rows = session.scalars(select(Match).order_by(Match.id.desc()).limit(min(max(limit, 1), 1000))).all()
        return dump(schemas.MatchOut if full else schemas.MatchPublic, rows)

    def step_route(step: str):
        def handler(match_id: int, session: Session = Depends(db)):
            return service.advance(session, match_id, step)
        return handler

    for step, summary in (("confirm", "ONG confirma o recebimento"), ("collect", "Coleta feita"),
                          ("deliver", "Entrega feita: idempotente, grava 1 evento no livro da demo")):
        app.add_api_route(f"/matches/{{match_id}}/{step}", step_route(step), methods=["POST"],
                          response_model=schemas.MatchOut, dependencies=write, tags=["match"],
                          summary=summary, name=f"match_{step}")

    @app.post("/matches/{match_id}/cancel", response_model=schemas.MatchOut, dependencies=write, tags=["match"],
              summary="Cancela um match proposto ou confirmado e libera o lote")
    def cancel_match(match_id: int, session: Session = Depends(db)):
        return service.cancel(session, match_id)

    @app.get("/ngos/{ngo_id}/route", tags=["ONGs"],
             summary="Ordem de coleta da ONG por vizinho mais próximo (heurística, não otimização)",
             description=(
                 "Sai da ONG, vai sempre ao doador mais perto ainda não visitado e volta à ONG. "
                 "Entram os lotes com match confirmado e ainda não coletado dessa ONG; com "
                 "`include_open=true`, também os lotes abertos compatíveis (não vencidos, categoria aceita, "
                 "cabem na capacidade de hoje, até 25 km). Distância haversine em km, linha reta. "
                 "Heurística gulosa: não garante a menor rota. Sem token, cada ponto é o centroide da "
                 "região (sem nome nem coordenada exata) e os km são entre centroides; com token, exatos."))
    def ngo_route(ngo_id: str, include_open: bool = False, full: bool = Depends(has_token),
                  session: Session = Depends(db)):
        return service.collection_route(session, ngo_id, include_open, exact=full)

    @app.get("/kpis", tags=["indicadores"])
    def get_kpis(session: Session = Depends(db)):
        return kpis.compute(session)

    @app.get("/model", tags=["indicadores"], summary="Métricas do modelo (metrics.json)")
    def model_metrics():
        return load_metrics()

    @app.get("/ledger", tags=["livro da demo"], summary="Livro da demo {notice, events} para tools/conferir.py")
    def ledger(session: Session = Depends(db)):
        return demo_ledger.export(session)

    @app.get("/ledger/verify", tags=["livro da demo"])
    def ledger_verify(session: Session = Depends(db)):
        return demo_ledger.verify_document(demo_ledger.export(session))

    @app.post("/demo/reset", dependencies=write, tags=["sistema"],
              summary="Apaga a demonstração inteira e recarrega o seed simulado")
    def demo_reset(session: Session = Depends(db)):
        return reset(session)

    return app


app = create_app()
