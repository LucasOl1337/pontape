"""API da Rede Alimenta (FastAPI + Swagger em /docs). Corte real.

Público, sem login: /health, /kpis (só registros reais), /model, /ledger, /ledger/verify,
/legal/{kind}. Nada de nome, endereço ou coordenada sai sem login. Conta: login por código de
e-mail (Supabase Auth), JWT validado aqui. Papéis: doador, ONG, operador (env). Automação:
POST /ops/sweep com ALIMENTA_OPS_TOKEN. O seed de exemplo e /demo/reset só existem com
ALIMENTA_ENV=local.

Rodar, da raiz do repositório:
    uvicorn alimenta.api.main:app --port 8000
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alimenta.api import routes_account, routes_donor, routes_ngo, routes_ops
from alimenta.api.deps import db
from alimenta.core import accounts, config, kpis, service
from alimenta.core.config import env_true
from alimenta.db.seed import create_schema, reset, seed
from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.ledger import book
from alimenta.model.predict import load_metrics, load_model

ROOT = Path(__file__).resolve().parents[2]
DESCRIPTION = (
    "Rede Alimenta, módulo M5 do PontaPé (projeto integrador FIAP Rede Alimenta IA). Doador publica lote → "
    "modelo estima risco de descarte (treinado em dado sintético: partida a frio) → regras escolhem a ONG → "
    "oferta com prazo, uma ONG por vez → aceite → coleta → dupla confirmação → livro. "
    "Login por código no e-mail; `Authorization: Bearer <JWT>`. Leitura pública só agregada."
)

__all__ = ["app", "create_app", "env_true"]


def create_app(engine: Engine | None = None) -> FastAPI:
    engine = engine or make_engine()
    sessions = make_sessionmaker(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        load_model()  # falha cedo se o artefato não confere com o sha256
        create_schema(engine)
        if config.is_local() and env_true("ALIMENTA_SEED_ON_START"):
            with sessions() as session:
                seed(session)
        yield

    app = FastAPI(title="Rede Alimenta · API", version="1.0.0", description=DESCRIPTION, lifespan=lifespan)
    app.state.sessions = sessions
    app.state.engine = engine

    for exc_type, status in ((service.NotFound, 404), (service.Forbidden, 403), (service.Conflict, 409),
                             (service.Invalid, 422), (service.Unavailable, 503)):
        app.add_exception_handler(exc_type, _handler(status))

    @app.get("/health", tags=["sistema"])
    def health(session: Session = Depends(db)):
        session.execute(text("SELECT 1"))
        return {"status": "ok", "env": config.app_env(), "database": engine.dialect.name,
                "model_version": load_metrics()["model_version"], "signup_open": config.signup_open(),
                "publish_real_ledger": config.publish_real_ledger()}

    @app.get("/kpis", tags=["público"], summary="Indicadores só com registros reais (zero honesto)")
    def get_kpis(session: Session = Depends(db)):
        return kpis.compute(session)

    @app.get("/model", tags=["público"], summary="Métricas do modelo (metrics.json), partida a frio declarada")
    def model_metrics():
        return {**load_metrics(), "cold_start": {
            "trained_on": "dado sintético (alimenta/data/lots_history.csv), sem histórico real ainda",
            "retrain_rule": "cada lote real grava features e desfecho em lot_outcomes; retreino com 300 desfechos "
                            "reais e as duas classes com 50 ou mais"}}

    @app.get("/ledger", tags=["público"], summary="Livro pontape-alimenta {notice, events} para tools/conferir.py")
    def ledger(session: Session = Depends(db)):
        return book.export(session)

    @app.get("/ledger/verify", tags=["público"])
    def ledger_verify(session: Session = Depends(db)):
        return book.verify_document(book.export(session))

    @app.get("/legal/{kind}", tags=["público"], response_class=PlainTextResponse,
             summary="Texto do termo de doação ou do aviso de privacidade (versão atual)")
    def legal(kind: str):
        if kind not in accounts.LEGAL_PATHS:
            raise HTTPException(404, "texto não existe")
        return (ROOT / accounts.LEGAL_PATHS[kind]).read_text(encoding="utf-8")

    for router in (routes_account.router, routes_donor.router, routes_ngo.router, routes_ops.router):
        app.include_router(router)

    if config.is_local():
        @app.post("/demo/reset", tags=["local"], summary="Só ALIMENTA_ENV=local: apaga tudo e recarrega o exemplo")
        def demo_reset(session: Session = Depends(db)):
            return reset(session)

    return app


def _handler(status: int):
    async def handle(_r: Request, exc: Exception):
        return JSONResponse(status_code=status, content={"detail": str(exc)})
    return handle


app = create_app()
