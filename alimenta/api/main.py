"""API da Rede Alimenta (FastAPI + Swagger em /docs). DEMONSTRAÇÃO · dados simulados.

Leitura aberta. Toda escrita exige o cabeçalho `X-Alimenta-Token` igual a
`ALIMENTA_WRITE_TOKEN`; sem a variável, a escrita fica desligada (503).

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
    "Escrita exige o cabeçalho `X-Alimenta-Token`. Nenhum dado é de pessoa ou entidade real."
)


def env_true(name: str, default: str = "true") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "sim"}


def require_token(x_alimenta_token: str | None = Header(default=None)) -> None:
    expected = os.environ.get("ALIMENTA_WRITE_TOKEN", "")
    if not expected:
        raise HTTPException(503, "escrita desligada: ALIMENTA_WRITE_TOKEN não configurado")
    if not x_alimenta_token or not hmac.compare_digest(x_alimenta_token.encode(), expected.encode()):
        raise HTTPException(401, "token de escrita ausente ou inválido")


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

    @app.get("/donors", response_model=list[schemas.DonorOut], tags=["doadores"])
    def list_donors(session: Session = Depends(db)):
        return session.scalars(select(Donor).order_by(Donor.id)).all()

    @app.post("/donors", response_model=schemas.DonorOut, status_code=201, dependencies=write, tags=["doadores"])
    def create_donor(body: schemas.DonorIn, session: Session = Depends(db)):
        donor = Donor(id=service.new_id("D"), **body.model_dump())
        session.add(donor)
        session.commit()
        return donor

    @app.get("/ngos", response_model=list[schemas.NgoOut], tags=["ONGs"])
    def list_ngos(session: Session = Depends(db)):
        return session.scalars(select(Ngo).order_by(Ngo.id)).all()

    @app.post("/ngos", response_model=schemas.NgoOut, status_code=201, dependencies=write, tags=["ONGs"])
    def create_ngo(body: schemas.NgoIn, session: Session = Depends(db)):
        ngo = Ngo(id=service.new_id("N"), **body.model_dump())
        session.add(ngo)
        session.commit()
        return ngo

    @app.get("/lots", response_model=list[schemas.LotOut], tags=["lotes"])
    def list_lots(status: str | None = None, limit: int = 200, session: Session = Depends(db)):
        query = select(Lot).order_by(Lot.published_at.desc()).limit(min(max(limit, 1), 1000))
        if status:
            query = query.where(Lot.status == status)
        return session.scalars(query).all()

    @app.post("/lots", response_model=schemas.LotOut, status_code=201, dependencies=write, tags=["lotes"],
              summary="Publica um lote e recebe a predição de risco de descarte (lote vencido → 422)")
    def create_lot(body: schemas.LotIn, session: Session = Depends(db)):
        return service.create_lot(session, **body.model_dump())

    @app.get("/lots/{lot_id}", response_model=schemas.LotOut, tags=["lotes"])
    def get_lot(lot_id: str, session: Session = Depends(db)):
        return service.get(session, Lot, lot_id)

    @app.get("/lots/{lot_id}/recommendations", tags=["match"],
             summary="Ranking de ONGs com os pontos de cada regra (lote vencido → 422)")
    def recommendations(lot_id: str, limit: int = 5, session: Session = Depends(db)):
        return {"lot_id": lot_id, "rules": "alimenta/core/matching.py",
                "recommendations": service.recommendations(session, lot_id, min(max(limit, 1), 20))}

    @app.post("/lots/{lot_id}/matches", response_model=schemas.MatchOut, status_code=201, dependencies=write,
              tags=["match"], summary="Atribui o lote a uma ONG (409 se o lote já tem match ativo)")
    def create_match(lot_id: str, body: schemas.MatchIn, session: Session = Depends(db)):
        return service.create_match(session, lot_id, body.ngo_id)

    @app.get("/matches", response_model=list[schemas.MatchOut], tags=["match"])
    def list_matches(limit: int = 200, session: Session = Depends(db)):
        return session.scalars(select(Match).order_by(Match.id.desc()).limit(min(max(limit, 1), 1000))).all()

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
