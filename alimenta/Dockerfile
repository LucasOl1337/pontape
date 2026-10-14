# Rede Alimenta · uma imagem para a API e o painel (DEMONSTRAÇÃO · dados simulados).
# Build a partir da RAIZ do repositório: docker build -f alimenta/Dockerfile .
# O .dockerignore da raiz é lista branca: só alimenta/ e o catálogo src/data/alimenta/distribuidores.json entram.

# --- Estágio 1: instala as dependências travadas no uv.lock -------------------
FROM python:3.12-slim AS deps

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv

# uv fixado por versão; fica só neste estágio (não vai para a imagem final).
COPY --from=ghcr.io/astral-sh/uv:0.12.5 /uv /usr/local/bin/uv

WORKDIR /app/alimenta
COPY alimenta/pyproject.toml alimenta/uv.lock alimenta/.python-version ./
RUN uv sync --locked --no-dev --no-install-project --python /usr/local/bin/python3.12

# --- Estágio 2: imagem final, sem uv e sem pip ---------------------------------
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Aplica correções publicadas do Debian e remove o pip do sistema (o venv não
# usa pip; menos superfície). Antes/depois em alimenta/seguranca/.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip uninstall -y pip \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app --no-create-home app

WORKDIR /app
# Código fica do root (só leitura para o usuário app); o banco local vai para /tmp.
COPY --from=deps /opt/venv /opt/venv
COPY src/data/alimenta/distribuidores.json src/data/alimenta/distribuidores.json
COPY alimenta/ alimenta/
USER app

ENV PORT=8000 \
    ALIMENTA_ENV=production \
    DATABASE_URL=sqlite:////tmp/alimenta.db

EXPOSE 8000
# A API responde /health (o painel saiu no corte r6).
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ.get(\"PORT\",\"8000\")}/health', timeout=4)"

CMD ["sh", "-c", "exec uvicorn alimenta.api.main:app --host 0.0.0.0 --port ${PORT} --proxy-headers --forwarded-allow-ips='*'"]
