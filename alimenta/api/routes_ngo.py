"""ONG: cadastro (entra pendente), ofertas com prazo, aceite/recusa, rota de coleta e recebimento."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.api import schemas
from alimenta.api.deps import actor, db, role
from alimenta.core import accounts, flow, notify, offers, service, signup
from alimenta.core.accounts import Actor
from alimenta.core.clock import aware
from alimenta.core.domain import CATEGORIES, STORAGE
from alimenta.core.service import Conflict, Forbidden, NotFound, get
from alimenta.db.models import Donor, Lot, LotOffer, Match, Ngo

router = APIRouter(tags=["ONG"])


def my_ngo(session: Session, who: Actor, approved: bool = True) -> Ngo:
    ngo = accounts.org_of(session, who)
    if ngo is None:
        raise NotFound("esta conta ainda não tem cadastro de ONG")
    if approved and ngo.approval_status != "approved":
        raise Forbidden(f"ONG {ngo.approval_status}: só opera depois de aprovada pelo operador")
    return ngo


@router.post("/ngos", response_model=schemas.NgoOut, status_code=201,
             summary="Cadastro da ONG: CNPJ conferido na BrasilAPI, entra pendente de aprovação humana")
def create_ngo(body: schemas.NgoIn, who: Actor = Depends(actor), session: Session = Depends(db)):
    return signup.register_ngo(session, who, body.model_dump())


@router.get("/ngos/me", response_model=schemas.NgoOut)
def ngo_me(who: Actor = Depends(role("ngo")), session: Session = Depends(db)):
    return my_ngo(session, who, approved=False)


@router.get("/offers/mine", summary="Caixa de ofertas da ONG: pendentes com prazo e as já respondidas")
def offers_mine(who: Actor = Depends(role("ngo")), session: Session = Depends(db)):
    offers.tick(session)
    ngo = my_ngo(session, who)
    out = []
    rows = session.scalars(select(LotOffer).where(LotOffer.ngo_id == ngo.id).order_by(LotOffer.id.desc()).limit(100))
    for offer in rows:
        lot = session.get(Lot, offer.lot_id)
        donor = session.get(Donor, lot.donor_id)
        item = schemas.OfferOut.model_validate(offer).model_dump(mode="json")
        item["lot"] = {"id": lot.id, "category": CATEGORIES[lot.category], "storage": STORAGE[lot.storage],
                       "kg": lot.kg, "expires_at": aware(lot.expires_at).isoformat(), "risk_level": lot.risk_level,
                       "pickup_until": aware(lot.pickup_until).isoformat() if lot.pickup_until else None,
                       "delivery_mode": lot.delivery_mode, "district": donor.district, "region": donor.region}
        if offer.status == "accepted":  # depois do aceite, a ONG vê onde retirar e com quem falar
            item["donor"] = {"name": donor.name, "address": service.address_line(donor), "contact_name": donor.contact_name,
                             "phone": donor.phone, "pickup_hours": donor.pickup_hours, "lat": donor.lat, "lon": donor.lon,
                             "whatsapp": notify.wa_link(donor.phone, f"Rede Alimenta: vamos retirar o lote {lot.id} "
                                                                     f"({lot.kg:g} kg).")}
            match = session.scalar(select(Match).where(Match.offer_id == offer.id))
            item["match"] = schemas.MatchOut.model_validate(match).model_dump(mode="json") if match else None
        out.append(item)
    return out


def _offer(session: Session, offer_id: int) -> LotOffer:
    return get(session, LotOffer, offer_id)


@router.post("/offers/{offer_id}/accept", response_model=schemas.MatchOut, status_code=201,
             summary="Aceita a oferta (409 se venceu, se outra já aceitou ou se passa da capacidade)")
def accept(offer_id: int, who: Actor = Depends(role("ngo")), session: Session = Depends(db)):
    offers.tick(session)
    return flow.accept_offer(session, _offer(session, offer_id), my_ngo(session, who))


@router.post("/offers/{offer_id}/decline", response_model=schemas.OfferOut,
             summary="Recusa com motivo da lista fechada; o lote vai para a próxima ONG")
def decline(offer_id: int, body: schemas.DeclineIn, who: Actor = Depends(role("ngo")), session: Session = Depends(db)):
    offers.tick(session)
    return flow.decline_offer(session, _offer(session, offer_id), my_ngo(session, who), body.reason)


@router.get("/ngos/me/route", summary="Rota de coleta da ONG (vizinho mais próximo, coordenada exata só para ela)")
def my_route(who: Actor = Depends(role("ngo")), session: Session = Depends(db)):
    return service.collection_route(session, my_ngo(session, who).id)


@router.post("/matches/{match_id}/receipt", response_model=schemas.MatchOut,
             summary="ONG confirma o recebimento. Com a retirada do doador: entrega e livro")
def confirm_receipt(match_id: int, who: Actor = Depends(role("ngo")), session: Session = Depends(db)):
    match = get(session, Match, match_id)
    if match.ngo_id != my_ngo(session, who).id:
        raise Forbidden("esta entrega é de outra ONG")
    if match.status == "cancelled":
        raise Conflict("entrega cancelada")
    return flow.confirm(session, match, "receipt", who)
