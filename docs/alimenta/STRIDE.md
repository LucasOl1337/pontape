# STRIDE da Rede Alimenta

> **DEMONSTRAÇÃO · dados simulados.** Esta matriz cobre o módulo Rede Alimenta do projeto integrador FIAP Rede Alimenta IA. Não cobre o resto do PontaPé.

Base: [ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §2 (Supabase) e §6 (privacidade e segurança), riscos do [PRD.md](../PRD.md) §11 e o contrato do livro em [CONTRATO.md](../transparencia/CONTRATO.md).

STRIDE são seis tipos de ameaça:

| Letra | Ameaça | Pergunta |
|---|---|---|
| S | Spoofing (falsificar identidade) | Alguém finge ser quem não é? |
| T | Tampering (adulterar) | Alguém muda dado sem permissão? |
| R | Repudiation (negar autoria) | Alguém nega que fez algo e não há como provar? |
| I | Information disclosure (vazar) | Algum dado sai para quem não deveria? |
| D | Denial of service (derrubar) | Alguém tira o serviço do ar? |
| E | Elevation of privilege (subir privilégio) | Alguém ganha poder que não tem? |

## Ativos e fluxos

| ID | Ativo ou fluxo | Descrição |
|---|---|---|
| F1 | Doador → API | Cadastro de lote pela API (`POST /lots`) |
| F2 | Painel → API com token | O painel Streamlit chama a API com `X-Alimenta-Token`, guardado no servidor |
| F3 | API → Postgres Supabase | Conexão pelo Supavisor pooler, porta 5432, região us-east-1 |
| F4 | Livro da demo | Tabela `demo_ledger_events` e download `GET /ledger` |
| F5 | Pipeline CI e imagem | `.github/workflows/alimenta.yml`, Bandit, Trivy, `docker build` |
| F6 | Deploy Render | Dois web services, deploy hooks como segredo do GitHub |
| F7 | Artefato do modelo | `discard_risk-v1.joblib` e `metrics.json` |

Os caminhos de evidência seguem o contrato do corte 1 (nomes finais). Antes da banca, confira cada caminho no código integrado. Onde a evidência diz "teste de ...", anote o nome real do teste em `alimenta/tests/`.

Escala usada. Impacto: baixo (atrapalha a demo), médio (número errado no painel ou demo fora do ar), alto (vazamento de segredo ou dano fora da demo). Probabilidade: baixa, média ou alta, pensando numa demo pública por poucos dias.

## S · Spoofing

| Ativo | Ameaça | Impacto | Prob. | Mitigação implementada | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Qualquer pessoa usa o Swagger público para criar lotes falsos | Médio | Alta | Toda escrita exige `X-Alimenta-Token`; sem token a API recusa | `alimenta/api/main.py`; teste de escrita sem token em `alimenta/tests/` | Baixo. Quem tem o token pode escrever; leitura é aberta de propósito |
| F2 | Alguém se passa pelo painel chamando a API direto | Médio | Média | O token fica só no servidor do painel (variável de ambiente), nunca no navegador | `alimenta/painel/app.py`; `ALIMENTA_WRITE_TOKEN` em `.env.example` | Baixo. Um token só, sem usuário individual |
| F3 | Serviço falso se passa pelo banco | Alto | Baixa | Conexão ao pooler oficial do Supabase com TLS (`sslmode=require` na URL, a conferir); URL só em variável de ambiente | `DATABASE_URL` no Render, nunca no git | Baixo |
| F6 | Alguém dispara deploy chamando o hook | Médio | Baixa | Hooks guardados como segredo do GitHub (`RENDER_DEPLOY_HOOK_API`, `RENDER_DEPLOY_HOOK_PAINEL`) | Job `deploy` em `alimenta.yml` | Baixo. Quem tem o hook só redeploya o mesmo código da main |
| F5 | Action ou binário falso no CI (cadeia de suprimento) | Alto | Média | Trivy por binário de versão fixa v0.76.0 com checksum, nunca por tag móvel. Ver incidente abaixo | Jobs `trivy-fs` e `imagem` | Médio. Outras Actions ainda usam tag de versão |

## T · Tampering

| Ativo | Ameaça | Impacto | Prob. | Mitigação implementada | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Lote vencido entra como se fosse bom | Alto | Média | Regra fixa: validade no passado volta 422 | `alimenta/core/matching.py`; teste do 422 | Baixo |
| F1 | Mesmo lote atribuído a duas ONGs | Médio | Média | Índice único parcial em `matches.lot_id` (status diferente de `cancelled`); API volta 409 | `alimenta/db/models.py`; teste do 409 | Baixo. O banco barra mesmo com duas requisições ao mesmo tempo |
| F1 | Entrega repetida infla kg salvos | Médio | Média | `deliver` é idempotente; kg conta um por lote | `alimenta/core/kpis.py`; teste de entrega dupla | Baixo |
| F4 | Alguém altera um evento antigo do livro da demo | Médio | Baixa | Corrente JCS + SHA-256; tabela só recebe INSERT; `hash` único | `alimenta/ledger/demo_ledger.py`; `GET /ledger/verify`; `python3 tools/conferir.py` | Médio. Sem assinatura nem carimbo externo, quem controla o banco pode reescrever a corrente inteira |
| F7 | Artefato do modelo trocado por outro | Alto | Baixa | `predict.py` só carrega o `.joblib` se o sha256 bate com o `metrics.json` | `alimenta/model/predict.py`; teste com artefato alterado | Baixo |
| F5 | Dependência maliciosa entra no build | Alto | Baixa | Versões fixadas em `uv.lock`; Trivy fs e imagem com gate HIGH/CRITICAL | `alimenta/uv.lock`; jobs `trivy-fs` e `imagem` | Médio. Trivy acha CVE conhecido, não pacote malicioso novo |

## R · Repudiation

| Ativo | Ameaça | Impacto | Prob. | Mitigação implementada | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F4 | Alguém nega uma entrega registrada, ou some com ela | Médio | Baixa | Cada entrega gera um evento encadeado; apagar quebra a corrente e o conferidor aponta a linha | `GET /ledger`; aba "Conferir livro da demo" | Médio. Remover o último evento só aparece para quem guardou a cabeça antes |
| F2 | Ação feita pelo painel sem saber quem fez | Baixo | Média | Matches guardam `proposed_at`, `confirmed_at`, `collected_at`, `delivered_at` | Tabela `matches` | Médio. Um token só: não identifica pessoa. Aceito numa demo sem usuários reais |
| F5 | Discussão sobre qual código estava no ar | Médio | Baixa | Workflow roda em todo PR e push na main; relatórios ficam como artefato da execução, com commit | Aba Actions do GitHub; painel mostra data e commit do último run | Baixo |

<!-- continua -->
