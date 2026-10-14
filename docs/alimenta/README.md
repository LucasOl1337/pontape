# Projeto integrador FIAP Rede Alimenta IA

> **DEMONSTRAÇÃO · dados simulados.** Nenhum doador, ONG, lote ou entrega deste módulo é real.

Este é o projeto integrador da FIAP "Rede Alimenta IA" (Tecnólogo em Inteligência Artificial, 1º ano, 2026). Dentro do PontaPé, o módulo se chama **Rede Alimenta**. Ele mora no passo 4 da escada, "Comida e roupa", que é o módulo M5 · Ponte inicial do [PRD](../PRD.md). No texto do PontaPé o termo é sempre AI.

Outros documentos desta pasta:

- [STRIDE.md](STRIDE.md): matriz de ameaças e riscos, com LGPD.
- [PITCH.md](PITCH.md): roteiro da apresentação e da demo de 5 a 7 minutos.
- [LIMITES.md](LIMITES.md): o que é simulado, o que é estimado e o que ainda não está pronto.

## Problema

O enunciado da FIAP descreve o paradoxo: comida é jogada fora enquanto muita gente passa fome. A missão pedida é usar AI para ligar o excedente de quem doa à necessidade real de ONGs, com foco em impacto social e logística urbana (enunciado `requisitos-fiap.pdf`, página 2).

Na prática, o lote de comida tem prazo. Se ninguém decide rápido para onde ele vai, ele estraga. Quem doa não sabe qual ONG aceita aquele tipo de comida, tem espaço naquele dia e está perto.

## Solução

A Rede Alimenta faz quatro coisas, nesta ordem:

1. O doador cadastra um lote: categoria, kg, validade, armazenamento e região.
2. Um modelo de AI estima a chance de o lote ser descartado sem uso. A tela mostra risco baixo, médio ou alto.
3. Regras de logística ordenam as ONGs: tipo de comida aceito, capacidade do dia, distância e urgência. Lote vencido é bloqueado.
4. A ONG escolhida confirma, coleta e entrega. Cada entrega vira um evento num livro com hash que qualquer pessoa confere.

O painel mostra o efeito: kg salvos, refeições estimadas por região, acurácia do modelo, tempo médio de match e a saúde do pipeline de segurança.

## Como rodar

### Com Docker (caminho do avaliador)

Na raiz do repositório:

```bash
docker compose up --build
```

Sobem três serviços: `db` (Postgres 16), `api` e `painel`. O seed simulado carrega sozinho na primeira subida.

| O quê | Endereço local |
|---|---|
| API e Swagger | http://localhost:8000/docs |
| Saúde da API | http://localhost:8000/health |
| Painel Streamlit | http://localhost:8501 |

Para voltar ao estado inicial antes de um ensaio:

```bash
curl -X POST http://localhost:8000/demo/reset -H "X-Alimenta-Token: $ALIMENTA_WRITE_TOKEN"
```

### Sem Docker, com uv

Requer Python 3.12 (a FIAP pede 3.10 ou mais) e [uv](https://docs.astral.sh/uv/). Sem `DATABASE_URL`, o banco é um SQLite local (`alimenta.db`).

```bash
cp alimenta/.env.example alimenta/.env              # defina ALIMENTA_WRITE_TOKEN
uv sync --project alimenta                           # instala as dependências fixadas no uv.lock
uv run --project alimenta python -m alimenta.data.generate   # gera o dataset simulado (seed 20261015)
uv run --project alimenta python -m alimenta.model.train     # treina, avalia e grava metrics.json
uv run --project alimenta uvicorn alimenta.api.main:app --port 8000
uv run --project alimenta streamlit run alimenta/painel/app.py --server.port 8501
uv run --project alimenta python -m pytest alimenta/tests
```

### Variáveis de ambiente

Documentadas em `alimenta/.env.example`. Segredo nunca entra no git.

| Variável | Para quê | Valor local |
|---|---|---|
| `DATABASE_URL` | Banco. SQLite nos testes, Postgres no compose, pooler do Supabase em produção | `sqlite:///./alimenta.db` |
| `ALIMENTA_WRITE_TOKEN` | Token exigido em toda escrita na API (cabeçalho `X-Alimenta-Token`) | qualquer texto longo e aleatório |
| `ALIMENTA_API_URL` | Endereço da API que o painel chama | `http://localhost:8000` |
| `ALIMENTA_SEED_ON_START` | Carrega o seed simulado na subida, sem duplicar | `true` |
| `ALIMENTA_MODEL_PATH` | Caminho do artefato do modelo | `alimenta/model/artifacts/discard_risk-v1.joblib` |
| `ALIMENTA_GITHUB_REPO` | Repositório lido para mostrar a saúde do pipeline | `LucasOl1337/pontape` |
| `PORT` | Porta do serviço no Render | definida pelo Render |

<!-- continua -->
