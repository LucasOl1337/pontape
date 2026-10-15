"""Doador: cadastro mínimo, doações, recomendação de destino, entrega declarada e cancelamento."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.api import schemas
from alimenta.api.deps import actor, db, role
from alimenta.core import donations, recommend, signup
from alimenta.core.accounts import Actor
from alimenta.db.models import Lot

router = APIRouter(tags=["doador"])
donor_only = role("donor")


def donor_out(donor) -> dict:
    return {"id": donor.id, "kind": donor.kind, "city": donor.city, "uf": donor.uf,
            "has_cnpj": donor.doc_number is not None, "distributor_id": donor.distributor_id,
            "status": donor.status, "is_test": donor.is_test}


@router.post("/donors", response_model=schemas.DonorOut, status_code=201,
             summary="Cadastro mínimo do doador (tipo, cidade, UF, CNPJ opcional e aceites)")
def create_donor(body: schemas.DonorIn, who: Actor = Depends(actor), session: Session = Depends(db)):
    return donor_out(signup.register_donor(session, who, body.model_dump()))


@router.get("/donors/me", response_model=schemas.DonorOut)
def donor_me(who: Actor = Depends(donor_only), session: Session = Depends(db)):
    return donor_out(donations.my_donor(session, who))


@router.post("/donations", status_code=201, summary="Registra uma doação (entra no livro público, exceto teste)")
def create_donation(body: schemas.DonationIn, who: Actor = Depends(donor_only), session: Session = Depends(db)):
    return donations.view(session, donations.register(session, who, body.model_dump()))


@router.get("/donations/mine", summary="Minhas doações, da mais nova para a mais antiga")
def my_donations(who: Actor = Depends(donor_only), session: Session = Depends(db)):
    donor = donations.my_donor(session, who)
    rows = session.scalars(select(Lot).where(Lot.donor_id == donor.id, Lot.public_ref.is_not(None))
                           .order_by(Lot.published_at.desc()).limit(200))
    return [donations.view(session, lot) for lot in rows]


@router.get("/donations/{donation_id}")
def one_donation(donation_id: str, who: Actor = Depends(donor_only), session: Session = Depends(db)):
    return donations.view(session, donations.mine(session, who, donation_id))


@router.post("/donations/{donation_id}/recommend",
             summary="Ordena distribuidores do catálogo para esta doação (AI com fonte citada, ou regra)")
def recommend_destination(donation_id: str, _body: schemas.Empty | None = None, who: Actor = Depends(donor_only),
                          session: Session = Depends(db)):
    return recommend.recommend(session, donations.mine(session, who, donation_id))


@router.post("/donations/{donation_id}/destination", summary="Escolhe o distribuidor (pode trocar enquanto aberta)")
def choose_destination(donation_id: str, body: schemas.DestinationIn, who: Actor = Depends(donor_only),
                       session: Session = Depends(db)):
    lot = donations.mine(session, who, donation_id)
    return donations.view(session, donations.choose(session, who, lot, body.distributor_id,
                                                    body.from_recommendation))


@router.post("/donations/{donation_id}/delivered", summary="Declara que entregou (quem doou declara)")
def mark_delivered(donation_id: str, _body: schemas.Empty | None = None, who: Actor = Depends(donor_only),
                   session: Session = Depends(db)):
    return donations.view(session, donations.deliver(session, donations.mine(session, who, donation_id)))


@router.post("/donations/{donation_id}/cancel")
def cancel_donation(donation_id: str, _body: schemas.Empty | None = None, who: Actor = Depends(donor_only),
                    session: Session = Depends(db)):
    return donations.view(session, donations.cancel(session, donations.mine(session, who, donation_id)))
