"""Painel da Rede Alimenta (Streamlit). Corte real.

Tudo passa pela API (ALIMENTA_API_URL). Rodar, da raiz do repositório:
    streamlit run alimenta/painel/app.py

Visitante: só leitura, números agregados por região (sem nome nem coordenada exata).
Com login por código de e-mail: a tela do papel da conta (doador, ONG ou operador).
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:  # streamlit roda o arquivo como script
    sys.path.insert(0, str(ROOT))

import streamlit as st  # noqa: E402

from alimenta.painel import client, papeis, publico  # noqa: E402

ROLE_TAB = {"donor": "Meu estabelecimento", "ngo": "Minha ONG", "operator": "Operação"}

st.set_page_config(page_title="Rede Alimenta", page_icon="🥖", layout="wide")
st.title("Rede Alimenta")
st.caption("Módulo M5 do PontaPé · doação de alimento de estabelecimento para ONG, com prazo e confirmação dos dois lados")

me = papeis.login_sidebar()

try:
    kpis = client.get("/kpis")
    model = client.get("/model")
except Exception as exc:  # noqa: BLE001 - painel mostra o erro em vez de cair
    st.error(f"A API não respondeu em {client.API_URL}: {exc}")
    st.stop()

if me is None:
    private = []
elif me["role"] is None:
    private = ["Cadastro"]
else:
    private = [ROLE_TAB[me["role"]]]
TAB_NAMES = private + ["Números", "Modelo", "Segurança e CI", "Conferir livro"]
tabs = dict(zip(TAB_NAMES, st.tabs(TAB_NAMES)))

if me is not None:
    with tabs[private[0]]:
        papeis.flash()
        if me["is_test"]:
            st.caption("Conta de teste: nada desta conta entra nos números públicos nem no livro.")
        {"Cadastro": papeis.signup, "Meu estabelecimento": papeis.donor, "Minha ONG": papeis.ngo,
         "Operação": papeis.operator}[private[0]](me)

with tabs["Números"]:
    publico.overview(kpis)
with tabs["Modelo"]:
    publico.model_tab(model)
with tabs["Segurança e CI"]:
    publico.security_tab()
with tabs["Conferir livro"]:
    publico.ledger_tab()

st.divider()
st.caption(f"API {client.PUBLIC_API_URL} · Swagger em {client.PUBLIC_API_URL}/docs · "
           f"[Privacidade]({client.PUBLIC_API_URL}/legal/privacy_notice)")
