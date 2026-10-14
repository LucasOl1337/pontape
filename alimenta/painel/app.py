"""Painel da Rede Alimenta (Streamlit). DEMONSTRAÇÃO · dados simulados.

Tudo passa pela API (ALIMENTA_API_URL). Rodar, da raiz do repositório:
    streamlit run alimenta/painel/app.py
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:  # streamlit roda o arquivo como script
    sys.path.insert(0, str(ROOT))

import pandas as pd  # noqa: E402
import pydeck as pdk  # noqa: E402
import streamlit as st  # noqa: E402

from alimenta.core.domain import CATEGORIES, DEMO_LABEL, REGIONS, STORAGE  # noqa: E402
from alimenta.ledger import demo_ledger  # noqa: E402
from alimenta.painel import client  # noqa: E402

RISK = {"low": "baixo", "medium": "médio", "high": "alto"}


def br(value: float, decimals: int = 0) -> str:
    """Número no formato brasileiro: 4.276,0."""
    text = f"{value:,.{decimals}f}"
    return text.replace(",", "§").replace(".", ",").replace("§", ".")


LEVEL = {"expired": "vencido sem entrega", "critical": "crítico (até 6 h)", "warning": "atenção (até 24 h)"}

st.set_page_config(page_title="Rede Alimenta · DEMONSTRAÇÃO", page_icon="🥖", layout="wide")
st.warning(f"**{DEMO_LABEL}.** Nenhum doador, ONG ou lote é real. Refeições são estimadas.", icon="⚠️")
st.title("Rede Alimenta")
st.caption("Módulo M5 do PontaPé · lote de comida → risco de descarte → ONG recomendada → coleta e entrega")

try:
    kpis = client.get("/kpis")
    model = client.get("/model")
except Exception as exc:  # noqa: BLE001 - painel mostra o erro em vez de cair
    st.error(f"A API não respondeu em {client.API_URL}: {exc}")
    st.stop()

tabs = st.tabs(["Visão geral", "Novo lote", "Rota de coleta", "Modelo", "Segurança e CI", "Conferir livro da demo"])

with tabs[0]:
    c = st.columns(5)
    c[0].metric("kg salvos", br(kpis["kg_saved"], 1))
    c[1].metric("Refeições estimadas", br(kpis["meals_estimated"]),
                help=f"kg salvos ÷ {kpis['kg_per_meal']} kg por refeição (Feeding America, estimativa)")
    c[2].metric("Entregas", kpis["deliveries"])
    avg = kpis["avg_match_minutes"]
    c[3].metric("Tempo médio de match", "sem dados" if avg is None else f"{avg:.0f} min",
                help="Da publicação do lote até a ONG confirmar. Não é a latência da API.")
    c[4].metric("Acurácia do modelo", br(model["test"]["accuracy"] * 100, 1) + "%",
                help="No teste reservado (20%), dados simulados")

    regions = pd.DataFrame(kpis["by_region"])
    left, right = st.columns([3, 2])
    with left:
        st.subheader("Mapa de calor: kg entregues onde a carência foi atendida")
        heat = pd.DataFrame(kpis["heat_points"])
        layers = []
        if not heat.empty:
            layers.append(pdk.Layer("HeatmapLayer", data=heat, get_position=["lon", "lat"], get_weight="kg",
                                    radius_pixels=60, aggregation="SUM"))
        layers.append(pdk.Layer("TextLayer", data=regions, get_position=["lon", "lat"], get_text="label",
                                get_size=14, get_color=[30, 30, 30]))
        st.pydeck_chart(pdk.Deck(layers=layers, map_style="light",
                                 initial_view_state=pdk.ViewState(latitude=-23.57, longitude=-46.63, zoom=9.6)))
        st.caption("Peso de cada ponto = kg entregues à ONG. Pontos fictícios dentro de cada macrorregião.")
    with right:
        st.subheader("Por região (da ONG)")
        st.bar_chart(regions.set_index("label")[["kg_saved"]], height=230)
        st.dataframe(regions[["label", "kg_saved", "meals_estimated", "deliveries", "open_lots"]].rename(columns={
            "label": "Região", "kg_saved": "kg salvos", "meals_estimated": "Refeições estimadas",
            "deliveries": "Entregas", "open_lots": "Lotes abertos"}), hide_index=True, width="stretch")

    st.subheader("kg entregues por dia")
    daily = pd.DataFrame(kpis["daily_kg"])
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
        st.dataframe(alerts.rename(columns={"lot_id": "Lote", "category": "Categoria", "region": "Região",
                                            "status": "Situação", "risk_level": "Risco", "hours_left": "Horas restantes",
                                            "level": "Alerta"}), hide_index=True, width="stretch")
    s1, s2 = st.columns(2)
    s1.caption("Lotes por situação: " + ", ".join(f"{k} {v}" for k, v in kpis["lots_by_status"].items()))
    s2.caption("Lotes por risco: " + ", ".join(f"{RISK.get(k, k)} {v}" for k, v in kpis["lots_by_risk"].items()))

with tabs[1]:
    st.subheader("Publicar um lote de demonstração")
    if not client.can_write():
        st.info("Escrita desligada neste painel (ALIMENTA_WRITE_TOKEN não configurado). Só leitura.")
    donors = client.get("/donors")
    with st.form("new_lot"):
        a, b, c3 = st.columns(3)
        donor = a.selectbox("Doador", donors, format_func=lambda d: f"{d['name']} · {REGIONS[d['region']]['label']}")
        category = b.selectbox("Categoria", list(CATEGORIES), format_func=CATEGORIES.get)
        storage = c3.selectbox("Armazenamento", list(STORAGE), format_func=STORAGE.get)
        kg = a.number_input("Peso (kg)", min_value=0.1, max_value=5000.0, value=12.5, step=0.5)
        hours = b.number_input("Vence em quantas horas", min_value=-48.0, max_value=2000.0, value=8.0, step=1.0,
                               help="Valor negativo simula lote vencido (a API recusa com 422).")
        desc = c3.text_input("Descrição", "Lote de demonstração")
        sent = st.form_submit_button("Publicar lote", disabled=not client.can_write())
    if sent:
        expires = (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()
        try:
            lot = client.post("/lots", {"donor_id": donor["id"], "category": category, "storage": storage,
                                        "kg": kg, "expires_at": expires, "description": desc})
            st.session_state["lot_id"] = lot["id"]
            st.success(f"Lote {lot['id']} publicado.")
        except client.ApiError as exc:
            st.error(f"A API recusou ({exc.status}): {exc.detail}")

    lot_id = st.session_state.get("lot_id")
    if lot_id:
        lot = client.get(f"/lots/{lot_id}")
        st.markdown(f"**Lote {lot_id}** · risco de descarte **{RISK[lot['risk_level']]}** "
                    f"({br(lot['discard_proba'] * 100)}%, modelo {lot['model_version']}) · situação `{lot['status']}`")
        if lot["status"] == "open":
            try:
                recs = client.get(f"/lots/{lot_id}/recommendations")["recommendations"]
            except client.ApiError as exc:
                recs = []
                st.error(f"{exc.status}: {exc.detail}")
            if recs:
                table = pd.DataFrame([{"ONG": r["ngo_name"], "Região": REGIONS[r["ngo_region"]]["label"],
                                       "km": r["distance_km"], "Pontos": r["score"], **r["points"]} for r in recs])
                st.dataframe(table, hide_index=True, width="stretch")
                st.caption("Pontos vêm de regras (distância, mesma região, folga de capacidade, urgência), não do modelo.")
                choice = st.selectbox("ONG", recs, format_func=lambda r: f"{r['ngo_name']} · {r['score']} pontos")
                if st.button("Atribuir à ONG", disabled=not client.can_write()):
                    try:
                        st.session_state["match_id"] = client.post(f"/lots/{lot_id}/matches",
                                                                   {"ngo_id": choice["ngo_id"]})["id"]
                        st.rerun()
                    except client.ApiError as exc:
                        st.error(f"{exc.status}: {exc.detail}")
            elif not recs:
                st.warning("Nenhuma ONG elegível para este lote.")
        match_id = st.session_state.get("match_id")
        if match_id and lot["status"] in ("matched", "delivered"):
            match = next((m for m in client.get("/matches") if m["id"] == match_id), None)
            if match:
                st.markdown(f"Match **{match_id}** com **{match['ngo_id']}** · estado `{match['status']}`")
                cols = st.columns(4)
                for col, step, label in zip(cols, ("confirm", "collect", "deliver", "cancel"),
                                            ("ONG confirmou", "Coleta feita", "Entrega feita", "Cancelar")):
                    if col.button(label, key=f"{step}-{match_id}", disabled=not client.can_write()):
                        try:
                            done = client.post(f"/matches/{match_id}/{step}")
                            if done.get("ledger_sequence"):
                                st.success(f"Entrega gravada no livro da demo, evento {done['ledger_sequence']}.")
                            st.rerun()
                        except client.ApiError as exc:
                            st.error(f"{exc.status}: {exc.detail}")

with tabs[2]:
    st.subheader("Rota de coleta")
    st.caption("Ordem por vizinho mais próximo: sai da ONG, vai sempre ao doador mais perto ainda não visitado e "
               "volta à ONG. É uma heurística, não garante a menor rota. Distância em linha reta (haversine).")
    ngos = client.get("/ngos")
    r1, r2 = st.columns([3, 2])
    ngo = r1.selectbox("ONG", ngos, key="route_ngo",
                       format_func=lambda n: f"{n['name']} · {REGIONS[n['region']]['label']}")
    include_open = r2.checkbox("Incluir lotes abertos compatíveis", key="route_open",
                               help="Além dos confirmados e ainda não coletados: lotes abertos não vencidos, "
                                    "de categoria aceita, que cabem na capacidade de hoje, até 25 km.")
    route = client.get(f"/ngos/{ngo['id']}/route", include_open="true" if include_open else "false")
    if not route["stops"]:
        st.info("Nenhum lote para coletar nesta ONG agora. Marque a opção acima para ver os lotes abertos compatíveis.")
    else:
        st.markdown(f"**{len(route['stops'])} paradas**, {route['lots']} lotes · total "
                    f"**{br(route['total_km'], 2)} km** (com a volta de {br(route['return_leg_km'], 2)} km)")
        st.dataframe(pd.DataFrame([{
            "Ordem": s["order"], "Doador": s["donor_name"], "Região": REGIONS[s["donor_region"]]["label"],
            "Lotes": ", ".join(i["lot_id"] + (" (aberto)" if i["kind"] == "open" else "") for i in s["items"]),
            "kg": s["kg"], "Trecho (km)": s["leg_km"], "Acumulado (km)": s["cumulative_km"]}
            for s in route["stops"]]), hide_index=True, width="stretch")
        path = [[route["start"]["lon"], route["start"]["lat"]]] + [[s["lon"], s["lat"]] for s in route["stops"]]
        path.append(path[0])
        points = pd.DataFrame([{"lon": route["start"]["lon"], "lat": route["start"]["lat"], "label": "ONG",
                                "color": [200, 40, 40]}] +
                              [{"lon": s["lon"], "lat": s["lat"], "label": str(s["order"]), "color": [30, 90, 200]}
                               for s in route["stops"]])
        st.pydeck_chart(pdk.Deck(layers=[
            pdk.Layer("PathLayer", data=[{"path": path}], get_path="path", get_width=4, width_units="pixels",
                      get_color=[30, 90, 200]),
            pdk.Layer("ScatterplotLayer", data=points, get_position=["lon", "lat"], get_fill_color="color",
                      get_radius=120, radius_min_pixels=6),
            pdk.Layer("TextLayer", data=points, get_position=["lon", "lat"], get_text="label", get_size=16,
                      get_color=[20, 20, 20], get_pixel_offset=[0, -18]),
        ], map_style="light", initial_view_state=pdk.ViewState(latitude=route["start"]["lat"],
                                                               longitude=route["start"]["lon"], zoom=10.5)))
        st.caption("Linha: ONG → paradas na ordem → ONG. Pontos fictícios do seed.")

with tabs[3]:
    st.subheader("Modelo de risco de descarte")
    st.markdown(f"**Alvo:** {model['target']}  \n**Algoritmo:** {model['algorithm']} · versão `{model['model_version']}`"
                f" · seed {model['seed']}  \n**Split:** {model['split']['n_train']} treino / "
                f"{model['split']['n_test']} teste, estratificado antes de ajustar.")
    base = model["baselines"]
    comp = pd.DataFrame([
        {"Modelo": "HistGradientBoosting (principal)", "Acurácia": model["test"]["accuracy"], "AUC": model["test"].get("roc_auc")},
        {"Modelo": "Regressão logística (comparação)", "Acurácia": base["logistic_regression"]["accuracy"],
         "AUC": base["logistic_regression"].get("roc_auc")},
        {"Modelo": f"Regra só de prazo ({base['deadline_rule']['rule']})", "Acurácia": base["deadline_rule"]["accuracy"], "AUC": None},
        {"Modelo": "Classe majoritária", "Acurácia": base["majority_class"]["accuracy"], "AUC": None},
    ])
    st.dataframe(comp, hide_index=True, width="stretch")
    m1, m2 = st.columns(2)
    cm = model["test"]["confusion_matrix"]["rows_true_cols_pred"]
    m1.markdown("**Matriz de confusão (teste)**")
    m1.dataframe(pd.DataFrame(cm, index=["real: aproveitado", "real: descartado"],
                              columns=["previsto: aproveitado", "previsto: descartado"]), width="stretch")
    m2.markdown("**Métricas por classe**")
    m2.dataframe(pd.DataFrame(model["test"]["per_class"]).T.rename(index={"kept": "aproveitado", "discarded": "descartado"}),
                 width="stretch")
    st.caption(f"Artefato `{model['artifact']['file']}` · sha256 `{model['artifact']['sha256'][:16]}…`, conferido ao carregar.")

with tabs[4]:
    st.subheader("Saúde do CI (branch main)")
    ci = client.ci_status()
    if ci["error"]:
        st.warning(ci["error"])
    for wf in ci["workflows"]:
        if "conclusion" in wf:
            ok = wf["conclusion"] == "success"
            text = f"**{wf['name']}** · {wf['conclusion'] or wf['state']} · commit `{wf['sha']}` · {wf['updated_at']}"
            (st.success if ok else st.error)(text + (f" · [execução]({wf['url']})" if wf.get("url") else ""))
        else:
            st.info(f"`{wf['file']}`: {wf['state']}")
    st.caption(f"Fonte: API pública do GitHub, repositório {ci['repo']}, cache de 10 min.")

    st.subheader("Vulnerabilidades: linha de base e scan atual")
    summary = client.security_summary()
    if not summary:
        st.info("Ainda não há resumo de scan versionado (alimenta/seguranca/resumo.json).")
    else:
        v1, v2, v3 = st.columns(3)
        v1.metric("Achados na linha de base", summary["baseline"]["total"])
        v2.metric("Mitigados", summary["mitigated"]["total"])
        v3.metric("Abertos no scan atual", summary["current"]["total"])
        st.caption(f"Linha de base: commit `{summary['baseline']['commit']}` em {summary['baseline']['date']}. "
                   f"Scan atual: commit `{summary['current']['commit']}` em {summary['current']['date']}. "
                   "Mitigado = ID que aparecia na linha de base e sumiu no scan atual. Nenhuma falha foi plantada.")
        rows = [{"Ferramenta": tool, "Linha de base": data["baseline"], "Atual": data["current"],
                 "Mitigados": ", ".join(data["mitigated_ids"]) or "nenhum"}
                for tool, data in summary["tools"].items()]
        st.dataframe(pd.DataFrame(rows), hide_index=True, width="stretch")
        if summary.get("accepted"):
            st.markdown("**Aceitos com justificativa**")
            st.dataframe(pd.DataFrame(summary["accepted"]), hide_index=True, width="stretch")

with tabs[5]:
    st.subheader("Conferir livro da demo")
    st.markdown(
        f"Livro **{demo_ledger.LEDGER_NAME}**, separado do livro real do PontaPé. Cada entrega da demonstração "
        "vira um evento `field.food_delivered` no formato v1 do contrato público, com `quantity` em gramas e "
        "sem lugar, lote ou ONG. A conferência abaixo usa o mesmo `tools/conferir.py` que qualquer pessoa pode rodar.")
    document = client.get("/ledger")
    result = demo_ledger.verify_document(document)
    if result["ok"]:
        st.success(f"{result['message']} · cabeça `{result['head_hash'][:16]}…` · "
                   f"{br(result['total_grams'] / 1000, 1)} kg no livro")
    else:
        st.error(result["message"])
    st.download_button("Baixar livro da demo (JSON)", json.dumps(document, ensure_ascii=False, indent=1),
                       file_name="livro-demo-rede-alimenta.json", mime="application/json")
    st.code("python3 tools/conferir.py livro-demo-rede-alimenta.json", language="bash")
    upload = st.file_uploader("Ou envie um livro para conferir", type=["json"])
    if upload is not None:
        try:
            outside = json.loads(upload.getvalue().decode("utf-8"))
            res = demo_ledger.verify_document(outside)
            (st.success if res["ok"] else st.error)(res["message"])
        except (ValueError, UnicodeDecodeError) as exc:
            st.error(f"Arquivo não é JSON válido: {exc}")
    if document["events"]:
        st.dataframe(pd.DataFrame([{"Sequência": e["sequence"], "Dia": e["payload"]["occurredOn"],
                                    "Gramas": e["payload"]["quantity"], "Hash": e["hash"][:16] + "…"}
                                   for e in document["events"][-15:][::-1]]), hide_index=True, width="stretch")

st.divider()
st.caption(f"{DEMO_LABEL} · API {client.PUBLIC_API_URL} · Swagger em {client.PUBLIC_API_URL}/docs")
