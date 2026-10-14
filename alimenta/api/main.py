"""API da Rede Alimenta (FastAPI + Swagger em /docs). Corte r6: só doador.

Público, sem login: /health, /kpis (só registros reais), /model, /distributors (catálogo com fonte),
/legal/{kind}. Nada de e-mail, CNPJ ou cidade de quem doa sai sem login. Conta: login por código de
e-mail (Supabase Auth), JWT validado aqui. Papéis: doador e operador (env). Automação: POST /ops/sweep
com ALIMENTA_OPS_TOKEN. O livro público é o do pontape.org (família `donation`); a API só põe na fila.

Rodar, da raiz do repositório:
    uvicorn alimenta.api.main:app --port 8000
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import select, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from alimenta.api import routes_account, routes_donor, routes_ops
from alimenta.api.deps import db
from alimenta.core import accounts, catalog, config, kpis, service
from alimenta.core.config import env_true
from alimenta.db.models import Distributor
from alimenta.db.seed import create_schema
from alimenta.db.session import make_engine, make_sessionmaker
from alimenta.model.predict import load_metrics, load_model

ROOT = Path(__file__).resolve().parents[2]
DESCRIPTION = (
    "Rede Alimenta, módulo M5 do PontaPé (projeto integrador FIAP Rede Alimenta IA). Quem doa registra a "
    "doação, o modelo estima o risco de descarte (treinado em dado sintético: partida a frio), a AI ordena os "
    "distribuidores públicos do catálogo lendo as páginas-fonte de cada um e cita a fonte; quem doa escolhe, "
    "leva e declara a entrega. Cada passo de doação real entra no livro público do pontape.org. "
    "Login por código no e-mail; `Authorization: Bearer <JWT>`."
)

__all__ = ["app", "create_app", "env_true"]


def create_app(engine: Engine | None = None) -> FastAPI:
    engine = engine or make_engine()
    sessions = make_sessionmaker(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        load_model()  # falha cedo se o artefato não confere com o sha256
        create_schema(engine)
        with sessions() as session:
            catalog.sync(session)  # falha cedo se o catálogo estiver fora do formato
        yield

    app = FastAPI(title="Rede Alimenta · API", version="2.0.0", description=DESCRIPTION, lifespan=lifespan)
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
                "publish_real_ledger": config.publish_real_ledger(),
                "ai": bool(config.ai_base_url() and config.ai_key()), "ai_web_search": config.ai_web_search()}

    @app.get("/kpis", tags=["público"], summary="Indicadores só com registros reais (zero honesto)")
    def get_kpis(session: Session = Depends(db)):
        return kpis.compute(session)

    @app.get("/model", tags=["público"], summary="Métricas do modelo de risco (metrics.json), partida a frio declarada")
    def model_metrics():
        return {**load_metrics(), "cold_start": {
            "trained_on": "dado sintético (alimenta/data/lots_history.csv), sem histórico real ainda",
            "retrain_rule": "cada doação real fechada grava features e desfecho em lot_outcomes; retreino com 300 "
                            "desfechos reais e as duas classes com 50 ou mais"}}

    @app.get("/distributors", tags=["público"], summary="Catálogo público de distribuidores, cada um com fonte")
    def distributors(city: str | None = None, session: Session = Depends(db)):
        query = select(Distributor).where(Distributor.active.is_(True)).order_by(Distributor.city, Distributor.name)
        if city:
            query = query.where(Distributor.city_key == catalog.city_key(city))
        return [{"id": d.id, "name": d.name, "kind": d.kind, "city": d.city, "uf": d.uf, "area": d.area,
                 "accepts": d.accepts, "receives_from": d.receives_from,
                 "accepts_prepared_meals": d.accepts_prepared_meals, "hours": d.hours,
                 "how_to_donate": d.how_to_donate, "address_public": d.address_public, "contact_url": d.contact_url,
                 "sources": [{"url": s["url"], "accessed": s.get("accessed"), "quote": s.get("quote")}
                             for s in d.sources], "confidence": d.confidence} for d in session.scalars(query)]

    @app.get("/legal/{kind}", tags=["público"], response_class=PlainTextResponse,
             summary="Texto do termo de doação ou do aviso de privacidade (versão atual)")
    def legal(kind: str):
        if kind not in accounts.LEGAL_PATHS:
            raise HTTPException(404, "texto não existe")
        return (ROOT / accounts.LEGAL_PATHS[kind]).read_text(encoding="utf-8")

    for router in (routes_account.router, routes_donor.router, routes_ops.router):
        app.include_router(router)
    return app


def _handler(status: int):
    async def handle(_r: Request, exc: Exception):
        return JSONResponse(status_code=status, content={"detail": str(exc)})
    return handle


app = create_app()
