"""Telas por papel no painel: login por código de e-mail, cadastro, doador, ONG e operador.

O JWT fica em st.session_state["token"] (no servidor do Streamlit) e vai como Bearer para a API.
Toda regra (quem pode o quê, prazo, capacidade) é da API; aqui só mostramos a recusa dela.
"""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

import pandas as pd
import streamlit as st

from alimenta.core.domain import CATEGORIES, STORAGE
from alimenta.painel import client

SAO_PAULO = timezone(timedelta(hours=-3))
DECLINE = {"no_capacity": "sem capacidade", "no_transport": "sem transporte", "category_not_needed": "não precisamos",
           "window_conflict": "horário não fecha", "too_far": "longe demais", "storage_unavailable": "sem geladeira",
           "other": "outro"}
STATUS = {"open": "aberto", "offered": "oferecido", "accepted": "aceito", "collected": "retirado",
          "delivered": "entregue", "expired": "vencido", "unclaimed": "sem ONG", "cancelled": "cancelado"}


def call(fn, *args, ok: str | None = None, **kwargs):
    """Chama a API e mostra a recusa dela em vez de cair. Devolve None se recusou.

    Com `ok` (uma ação): guarda a mensagem e recarrega a tela, para as listas já virem atualizadas.
    """
    try:
        out = fn(*args, **kwargs)
    except client.ApiError as exc:
        st.error(f"A API recusou ({exc.status}): {exc.detail}")
        return None
    if ok:
        st.session_state["flash"] = ok
        st.rerun()
    return out


def flash() -> None:
    message = st.session_state.pop("flash", None)
    if message:
        st.success(message)


def login_sidebar() -> dict | None:
    """Login por código de 6 dígitos no e-mail. Devolve /me ou None (visitante)."""
    with st.sidebar:
        st.subheader("Entrar")
        token = st.session_state.get("token")
        if token:
            try:
                me = client.get("/me", token=token)
            except client.ApiError:
                st.session_state.pop("token", None)
                st.warning("Sessão vencida. Entre de novo.")
                return None
            st.success(f"{me['email']}" + (" · conta de teste" if me["is_test"] else ""))
            if st.button("Sair", key="logout"):
                for key in ("token", "login_email"):
                    st.session_state.pop(key, None)
                st.rerun()
            return me
        with st.form("login_email_form"):
            email = st.text_input("E-mail", key="email_in")
            asked = st.form_submit_button("Receber código")
        if asked and email:
            if call(client.post, "/auth/code", {"email": email}) is not None:
                st.session_state["login_email"] = email
                st.info("Se o e-mail puder entrar, o código chega em alguns minutos.")
        if st.session_state.get("login_email"):
            with st.form("login_code_form"):
                code = st.text_input("Código de 6 dígitos", max_chars=6, key="code_in")
                sent = st.form_submit_button("Entrar")
            if sent:
                session = call(client.post, "/auth/verify", {"email": st.session_state["login_email"], "code": code})
                if session:
                    st.session_state["token"] = session["access_token"]
                    st.rerun()
        st.caption("Sem login você vê só os números públicos.")
    return None


def _org_fields(prefix: str) -> dict:
    a, b = st.columns(2)
    return {"cnpj": a.text_input("CNPJ", key=f"{prefix}_cnpj"),
            "contact_name": b.text_input("Pessoa de contato", key=f"{prefix}_contact"),
            "phone": a.text_input("Telefone com DDD (WhatsApp)", key=f"{prefix}_phone"),
            "cep": b.text_input("CEP", key=f"{prefix}_cep"),
            "number": a.text_input("Número", key=f"{prefix}_number")}


def _terms(me: dict) -> dict | None:
    versions = me["current_versions"]
    st.markdown(f"Leia o [termo de doação]({client.PUBLIC_API_URL}/legal/donation_terms) e o "
                f"[aviso de privacidade]({client.PUBLIC_API_URL}/legal/privacy_notice).")
    terms = st.checkbox(f"Aceito o termo de doação ({versions['donation_terms']})", key="ok_terms")
    privacy = st.checkbox(f"Li o aviso de privacidade ({versions['privacy_notice']})", key="ok_privacy")
    if not (terms and privacy):
        return None
    return {"donation_terms_version": versions["donation_terms"], "privacy_notice_version": versions["privacy_notice"]}


def signup(me: dict) -> None:
    st.subheader("Cadastro")
    if not me["signup_open"]:
        st.info("O cadastro ainda está fechado: os textos legais estão em revisão. Fale com a equipe.")
        return
    kind = st.radio("Sou", ["doador (estabelecimento)", "ONG"], horizontal=True)
    with st.form("signup"):
        body = _org_fields("s")
        if kind.startswith("doador"):
            body.update(trade_name=st.text_input("Nome do estabelecimento"),
                        kind=st.selectbox("Tipo", ["supermarket", "bakery", "restaurant", "street_market",
                                                   "distributor", "producer", "other"]),
                        pickup_hours=st.text_input("Horário de retirada", "08:00-18:00"))
            path = "/donors"
        else:
            body.update(name=st.text_input("Nome da ONG"),
                        accepted_categories=st.multiselect("Categorias aceitas", list(CATEGORIES), format_func=CATEGORIES.get),
                        daily_capacity_kg=int(st.number_input("Capacidade por dia (kg)", 1, 10000, 50)),
                        receive_window=st.text_input("Janela de recebimento", "08:00-17:00"),
                        accepts_refrigerated=st.checkbox("Tem geladeira"), accepts_frozen=st.checkbox("Tem freezer"),
                        pickup_radius_km=float(st.number_input("Até quantos km busca", 1.0, 40.0, 15.0)))
            path = "/ngos"
        consents = _terms(me)
        sent = st.form_submit_button("Cadastrar")
    if sent:
        if consents is None:
            st.error("Marque os dois aceites para cadastrar.")
        else:
            call(client.post, path, {**body, **consents}, token=st.session_state["token"], ok="Cadastro feito.")


def donor(me: dict) -> None:
    token = st.session_state["token"]
    if me["org_status"] != "active":
        st.warning(f"Cadastro {me['org_status']}: a equipe precisa liberar antes de publicar lote.")
    st.subheader("Publicar lote")
    with st.form("lot"):
        a, b, c = st.columns(3)
        category = a.selectbox("Categoria", list(CATEGORIES), format_func=CATEGORIES.get)
        storage = b.selectbox("Armazenamento", list(STORAGE), format_func=STORAGE.get)
        kg = c.number_input("Peso (kg)", 0.1, 5000.0, 10.0, 0.5)
        day = a.date_input("Validade (dia)", datetime.now(SAO_PAULO).date() + timedelta(days=1))
        hour = b.time_input("Validade (hora)", time(18, 0))
        desc = c.text_input("Descrição curta (opcional)")
        reaffirm = st.checkbox("Confirmo que o alimento está dentro da validade e foi conservado como o fabricante "
                               f"manda (termo {me['current_versions']['donation_terms']}).")
        sent = st.form_submit_button("Publicar lote")
    if sent:
        if not reaffirm:
            st.error("Sem reafirmar o termo, o lote não pode ser publicado.")
        else:
            expires = datetime.combine(day, hour, tzinfo=SAO_PAULO).isoformat()
            call(client.post, "/lots", {"category": category, "storage": storage, "kg": kg, "expires_at": expires,
                                        "description": desc, "terms_version": me["current_versions"]["donation_terms"]},
                 token=token, ok="Lote publicado e oferecido à primeira ONG.")
    st.subheader("Meus lotes")
    lots = call(client.get, "/lots/mine", token=token) or []
    if not lots:
        st.info("Nenhum lote ainda.")
    for lot in lots:
        with st.expander(f"{lot['id']} · {CATEGORIES[lot['category']]} {lot['kg']:g} kg · {STATUS[lot['status']]}"):
            if lot["offer"]:
                st.caption(f"Oferecido; a ONG responde até {lot['offer']['respond_by']}.")
            if lot.get("ngo"):
                ngo = lot["ngo"]
                st.markdown(f"**ONG:** {ngo['name']} · {ngo['contact_name']}")
                if ngo["whatsapp"]:
                    st.link_button("Falar no WhatsApp", ngo["whatsapp"])
            match = lot["match"]
            if match and match["status"] in ("accepted", "collected"):
                if st.button("Confirmar que retiraram", key=f"pickup-{match['id']}"):
                    call(client.post, f"/matches/{match['id']}/pickup", token=token, ok="Retirada confirmada.")
            if lot["status"] in ("open", "offered", "accepted"):
                if st.button("Cancelar lote", key=f"cancel-{lot['id']}"):
                    call(client.post, f"/lots/{lot['id']}/cancel", token=token, ok="Lote cancelado.")


def ngo(me: dict) -> None:
    token = st.session_state["token"]
    if me["org_status"] != "approved":
        st.warning(f"Cadastro {me['org_status']}: a equipe confere o CNPJ antes da primeira oferta.")
        return
    st.subheader("Ofertas")
    items = call(client.get, "/offers/mine", token=token) or []
    pending = [o for o in items if o["status"] == "pending"]
    if not pending:
        st.info("Nenhuma oferta esperando resposta.")
    for o in pending:
        lot = o["lot"]
        st.markdown(f"**{lot['category']} · {lot['kg']:g} kg** ({lot['storage']}) em {lot['district'] or lot['region']}"
                    f" · vence {lot['expires_at']} · **responder até {o['respond_by']}**")
        a, b, c = st.columns([1, 2, 1])
        if a.button("Aceitar", key=f"acc-{o['id']}"):
            call(client.post, f"/offers/{o['id']}/accept", token=token, ok="Aceito. Combine a retirada com o doador.")
        reason = b.selectbox("Motivo", list(DECLINE), format_func=DECLINE.get, key=f"why-{o['id']}")
        if c.button("Recusar", key=f"dec-{o['id']}"):
            call(client.post, f"/offers/{o['id']}/decline", {"reason": reason}, token=token, ok="Recusado.")
    st.subheader("Aceitos")
    for o in [o for o in items if o["status"] == "accepted" and o.get("match")]:
        d, match = o["donor"], o["match"]
        st.markdown(f"**{o['lot_id']}** · {d['name']} · {d['address']} · retirada {d['pickup_hours']} · "
                    f"situação `{match['status']}`")
        if d["whatsapp"]:
            st.link_button("Falar com o doador no WhatsApp", d["whatsapp"])
        if match["status"] in ("accepted", "collected") and st.button("Confirmar recebimento", key=f"rec-{match['id']}"):
            call(client.post, f"/matches/{match['id']}/receipt", token=token, ok="Recebimento confirmado.")
    st.subheader("Rota de coleta")
    route = call(client.get, "/ngos/me/route", token=token)
    if route and route["stops"]:
        st.dataframe(pd.DataFrame([{"Ordem": s["order"], "Doador": s["donor_name"], "kg": s["kg"],
                                    "Trecho (km)": s["leg_km"]} for s in route["stops"]]), hide_index=True)
        st.caption(f"Total {route['total_km']} km com a volta (vizinho mais próximo, linha reta).")
    else:
        st.info("Nada para buscar agora.")


def operator(me: dict) -> None:
    token = st.session_state["token"]
    over = call(client.get, "/ops/overview", token=token)
    if over is None:
        return
    st.json({k: over[k] for k in ("ngos", "donors", "lots", "pending_offers")}, expanded=False)
    st.subheader("ONGs esperando aprovação")
    pending = call(client.get, "/ops/ngos", token=token, status="pending") or []
    if not pending:
        st.info("Nenhuma ONG pendente.")
    for n in pending:
        check = n["cnpj_check"] or {}
        st.markdown(f"**{n['name']}** · CNPJ {n['cnpj']} · Receita: `{check.get('status')}` "
                    f"{check.get('natureza_juridica') or ''} · {n['district']} · teste: {n['is_test']}")
        note = st.text_input("Nota", key=f"note-{n['id']}")
        a, b = st.columns(2)
        if a.button("Aprovar", key=f"ok-{n['id']}"):
            call(client.post, f"/ops/ngos/{n['id']}/approve", {"note": note or None}, token=token, ok="Aprovada.")
        if b.button("Recusar", key=f"no-{n['id']}"):
            call(client.post, f"/ops/ngos/{n['id']}/reject", {"note": note or None}, token=token, ok="Recusada.")
    st.subheader("Lotes sem ONG")
    for lot in over["unclaimed"]:
        if st.button(f"Oferecer de novo {lot['id']} ({lot['kg']:g} kg)", key=f"re-{lot['id']}"):
            call(client.post, f"/ops/lots/{lot['id']}/reoffer", token=token, ok="Reoferecido.")
