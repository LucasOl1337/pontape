# Rede Alimenta · uma imagem para a API e o painel (DEMONSTRAÇÃO · dados simulados).
# Build a partir da RAIZ do repositório: docker build -f alimenta/Dockerfile .
# O .dockerignore da raiz é lista branca: só alimenta/ e tools/conferir.py entram.

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    PATH="/opt/venv/bin:$PATH"

# uv fixado por versão (binário oficial copiado da imagem publicada).
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /usr/local/bin/uv

WORKDIR /app
COPY alimenta/pyproject.toml alimenta/uv.lock alimenta/.python-version alimenta/
RUN cd alimenta && uv sync --locked --no-dev --no-install-project --python /usr/local/bin/python3.12

COPY tools/conferir.py tools/conferir.py
COPY alimenta/ alimenta/

RUN groupadd --system app && useradd --system --gid app --home-dir /app --no-create-home app \
    && chown -R app:app /app
USER app

ENV PORT=8000 \
    ALIMENTA_SEED_ON_START=true \
    DATABASE_URL=sqlite:////tmp/alimenta.db

EXPOSE 8000 8501
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/health', timeout=4)" || \
        python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/_stcore/health', timeout=4)"

# Padrão: API. O painel usa o mesmo binário com o comando de alimenta/painel/run.sh.
CMD ["sh", "-c", "uvicorn alimenta.api.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
