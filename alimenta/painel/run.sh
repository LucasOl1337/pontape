#!/bin/sh
# Sobe o painel Streamlit na porta $PORT (Render) ou 8501.
exec streamlit run alimenta/painel/app.py \
  --server.port "${PORT:-8501}" --server.address 0.0.0.0 --server.headless true \
  --browser.gatherUsageStats false
