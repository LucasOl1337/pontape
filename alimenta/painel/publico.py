"""Abas públicas do painel (só leitura, sem login): KPIs reais, modelo, segurança e CI, livro."""

from __future__ import annotations

import json

import pandas as pd
import pydeck as pdk
import streamlit as st

from alimenta.ledger import book
from alimenta.painel import client

RISK = {"low": "baixo", "medium": "médio", "high": "alto"}
LEVEL = {"expired": "vencido sem entrega", "critical": "crítico (até 6 h)", "warning": "atenção (até 24 h)"}


def br(value: float, decimals: int = 0) -> str:
    """Número no formato brasileiro: 4.276,0."""
    text = f"{value:,.{decimals}f}"
    return text.replace(",", "§").replace(".", ",").replace("§", ".")


def overview(kpis: dict) -> None:
    if kpis["deliveries"] == 0:
        st.info("Ainda não há entrega real registrada. Os números abaixo são zero de verdade, não simulação.")
    c = st.columns(4)
    c[0].metric("kg salvos", br(kpis["kg_saved"], 1))
    c[1].metric("Refeições estimadas", br(kpis["meals_estimated"]),
                help=f"kg salvos ÷ {kpis['kg_per_meal']} kg por refeição (Feeding America, estimativa)")
    c[2].metric("Entregas", kpis["deliveries"])
    avg = kpis["avg_match_minutes"]
    c[3].metric("Tempo médio até o aceite", "sem dados" if avg is None else f"{avg:.0f} min",
                help="Da publicação do lote até a ONG aceitar a oferta. Não é a latência da API.")
    regions = pd.DataFrame(kpis["by_region"])
    left, right = st.columns([3, 2])
    with left:
        st.subheader("Mapa de calor: kg entregues por região")
        heat = pd.DataFrame(kpis["heat_points"])
        layers = []
        if not heat.empty:
            layers.append(pdk.Layer("HeatmapLayer", data=heat, get_position=["lon", "lat"], get_weight="kg",
                                    radius_pixels=60, aggregation="SUM"))
        layers.append(pdk.Layer("TextLayer", data=regions, get_position=["lon", "lat"], get_text="label",
                                get_size=14, get_color=[30, 30, 30]))
        st.pydeck_chart(pdk.Deck(layers=layers, map_style="light",
                                 initial_view_state=pdk.ViewState(latitude=-23.57, longitude=-46.63, zoom=9.6)))
        st.caption("Um ponto por macrorregião, no centro dela. Nenhum ponto é endereço de doador ou ONG.")
    with right:
        st.subheader("Por região (da ONG)")
        st.dataframe(regions[["label", "kg_saved", "meals_estimated", "deliveries", "open_lots"]].rename(columns={
            "label": "Região", "kg_saved": "kg salvos", "meals_estimated": "Refeições estimadas",
            "deliveries": "Entregas", "open_lots": "Lotes abertos"}), hide_index=True, width="stretch")
    daily = pd.DataFrame(kpis["daily_kg"])
    st.subheader("kg entregues por dia")
    if daily.empty:
        st.info("Sem entregas ainda.")
    else:
        st.line_chart(daily.set_index("day")["kg"], height=220)
    st.subheader("Alertas de validade")
    alerts = pd.DataFrame(kpis["alerts"])
    if alerts.empty:
        st.success("Nenhum lote perto de vencer.")
    else:
        alerts["level"] = alerts["level"].map(LEVEL)
        alerts["risk_level"] = alerts["risk_level"].map(RISK)
        st.dataframe(alerts.rename(columns={"category": "Categoria", "region": "Região", "status": "Situação",
                                            "risk_level": "Risco", "hours_left": "Horas restantes",
                                            "level": "Alerta"}), hide_index=True, width="stretch")


def model_tab(model: dict) -> None:
    st.subheader("Modelo de risco de descarte")
    st.warning("Partida a frio: o modelo foi treinado em dado sintético. Cada lote real grava o desfecho para o "
               "retreino (" + model["cold_start"]["retrain_rule"] + ").")
    st.markdown(f"**Alvo:** {model['target']}  \n**Algoritmo:** {model['algorithm']} · versão `{model['model_version']}`"
                f" · seed {model['seed']}  \n**Split:** {model['split']['n_train']} treino / "
                f"{model['split']['n_test']} teste, estratificado antes de ajustar.")
    base = model["baselines"]
    st.dataframe(pd.DataFrame([
        {"Modelo": "HistGradientBoosting (principal)", "Acurácia": model["test"]["accuracy"], "AUC": model["test"].get("roc_auc")},
        {"Modelo": "Regressão logística", "Acurácia": base["logistic_regression"]["accuracy"],
         "AUC": base["logistic_regression"].get("roc_auc")},
        {"Modelo": f"Regra só de prazo ({base['deadline_rule']['rule']})", "Acurácia": base["deadline_rule"]["accuracy"], "AUC": None},
        {"Modelo": "Classe majoritária", "Acurácia": base["majority_class"]["accuracy"], "AUC": None},
    ]), hide_index=True, width="stretch")
    st.caption("Métricas no teste reservado do dado sintético; não medem o mundo real ainda. Artefato "
               f"`{model['artifact']['file']}` · sha256 `{model['artifact']['sha256'][:16]}…`, conferido ao carregar.")


def security_tab() -> None:
    st.subheader("Saúde do CI (branch main)")
    ci = client.ci_status()
    if ci["error"]:
        st.warning(ci["error"])
    for wf in ci["workflows"]:
        if "conclusion" in wf:
            text = f"**{wf['name']}** · {wf['conclusion'] or wf['state']} · commit `{wf['sha']}` · {wf['updated_at']}"
            (st.success if wf["conclusion"] == "success" else st.error)(text)
        else:
            st.info(f"`{wf['file']}`: {wf['state']}")
    summary = client.security_summary()
    st.subheader("Vulnerabilidades: linha de base e scan atual")
    if not summary:
        st.info("Ainda não há resumo de scan versionado (alimenta/seguranca/resumo.json).")
        return
    v1, v2, v3 = st.columns(3)
    v1.metric("Achados na linha de base", summary["baseline"]["total"])
    v2.metric("Mitigados", summary["mitigated"]["total"])
    v3.metric("Abertos no scan atual", summary["current"]["total"])
    st.dataframe(pd.DataFrame([{"Ferramenta": tool, "Linha de base": d["baseline"], "Atual": d["current"],
                                "Mitigados": ", ".join(d["mitigated_ids"]) or "nenhum"}
                               for tool, d in summary["tools"].items()]), hide_index=True, width="stretch")


def ledger_tab() -> None:
    st.subheader("Conferir o livro da Rede Alimenta")
    st.markdown(f"Livro **{book.LEDGER_NAME}**, separado do livro do PontaPé. Só entregas reais com as duas "
                "confirmações (doador e ONG); contas de teste não entram. Cada evento é `field.food_delivered` "
                "no formato v1, com `quantity` em gramas e sem lugar, lote ou ONG.")
    document = client.get("/ledger")
    result = book.verify_document(document)
    (st.success if result["ok"] else st.error)(result["message"])
    st.download_button("Baixar livro (JSON)", json.dumps(document, ensure_ascii=False, indent=1),
                       file_name="livro-rede-alimenta.json", mime="application/json")
    st.code("python3 tools/conferir.py livro-rede-alimenta.json", language="bash")
    if document["events"]:
        st.dataframe(pd.DataFrame([{"Sequência": e["sequence"], "Dia": e["payload"]["occurredOn"],
                                    "Gramas": e["payload"]["quantity"], "Hash": e["hash"][:16] + "…"}
                                   for e in document["events"][-15:][::-1]]), hide_index=True, width="stretch")
