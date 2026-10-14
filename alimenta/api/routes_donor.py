"""Doador: cadastro, meus dados, lotes, cancelamento e confirmação de retirada."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from alimenta.api import schemas
from alimenta.api.deps import actor, db, role
from alimenta.core import accounts, flow, notify, offers, signup
from alimenta.core.accounts import Actor
from alimenta.core.service import Forbidden, Invalid, NotFound, get
from alimenta.db.models import Donor, Lot, LotOffer, Match, Ngo

router = APIRouter(tags=["doador"])


def my_donor(session: Session, who: Actor) -> Donor:
    donor = accounts.org_of(session, who)
    if donor is None:
        raise NotFound("esta conta ainda não tem cadastro de doador")
    return donor


@router.post("/donors", response_model=schemas.DonorOut, status_code=201,
             summary="Cadastro próprio do doador (CNPJ, CEP, aceites). Fechado com ALIMENTA_SIGNUP_OPEN=false")
def create_donor(body: schemas.DonorIn, who: Actor = Depends(actor), session: Session = Depends(db)):
    return signup.register_donor(session, who, body.model_dump())


@router.get("/donors/me", response_model=schemas.DonorOut)
def donor_me(who: Actor = Depends(role("donor")), session: Session = Depends(db)):
    return my_donor(session, who)


@router.patch("/donors/me", response_model=schemas.DonorOut)
def donor_patch(body: schemas.DonorPatch, who: Actor = Depends(role("donor")), session: Session = Depends(db)):
    donor = my_donor(session, who)
    data = body.model_dump(exclude_none=True)
    if "phone" in data:
        data["phone"] = signup._phone(data["phone"])  # noqa: SLF001 - mesma regra do cadastro
    for key, value in data.items():
        setattr(donor, key, value)
    session.commit()
    return donor


@router.post("/lots", response_model=schemas.LotOut, status_code=201,
             summary="Publica um lote: termo reafirmado, risco de descarte e primeira oferta (vencido → 422)")
def create_lot(body: schemas.LotIn, who: Actor = Depends(role("donor")), session: Session = Depends(db)):
    return flow.create_lot(session, my_donor(session, who), who, body.model_dump())


@router.get("/lots/mine", summary="Meus lotes com a situação, a ONG e o link de WhatsApp para ela")
def lots_mine(who: Actor = Depends(role("donor")), session: Session = Depends(db)):
    offers.tick(session)
    donor = my_donor(session, who)
    out = []
    for lot in session.scalars(select(Lot).where(Lot.donor_id == donor.id).order_by(Lot.published_at.desc())):
        item = schemas.LotOut.model_validate(lot).model_dump(mode="json")
        match = session.scalar(select(Match).where(Match.lot_id == lot.id, Match.status != "cancelled"))
        pending = session.scalar(select(LotOffer).where(LotOffer.lot_id == lot.id, LotOffer.status == "pending"))
        item["offer"] = schemas.OfferOut.model_validate(pending).model_dump(mode="json") if pending else None
        item["match"] = schemas.MatchOut.model_validate(match).model_dump(mode="json") if match else None
        if match is not None:
            ngo = session.get(Ngo, match.ngo_id)  # depois do aceite, o doador vê a ONG para combinar
            item["ngo"] = {"id": ngo.id, "name": ngo.name, "contact_name": ngo.contact_name, "phone": ngo.phone,
                           "whatsapp": notify.wa_link(ngo.phone, f"Rede Alimenta: sobre o lote {lot.id} "
                                                                 f"({lot.kg:g} kg) que vocês aceitaram.")}
        out.append(item)
    return out


@router.post("/lots/{lot_id}/cancel", response_model=schemas.LotOut)
def cancel_lot(lot_id: str, who: Actor = Depends(role("donor")), session: Session = Depends(db)):
    lot = get(session, Lot, lot_id)
    if lot.donor_id != my_donor(session, who).id:
        raise Forbidden("este lote é de outro doador")
    return flow.cancel_lot(session, lot, who)


@router.post("/matches/{match_id}/pickup", response_model=schemas.MatchOut,
             summary="Doador confirma que a ONG retirou (ou que entregou). Com o recebimento: entrega")
def confirm_pickup(match_id: int, who: Actor = Depends(role("donor")), session: Session = Depends(db)):
    match = get(session, Match, match_id)
    if get(session, Lot, match.lot_id).donor_id != my_donor(session, who).id:
        raise Forbidden("esta entrega é de outro doador")
    if match.status == "cancelled":
        raise Invalid("entrega cancelada")
    return flow.confirm(session, match, "pickup", who)
