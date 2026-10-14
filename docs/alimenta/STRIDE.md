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
| F1 | Mesmo lote atribuído a duas ONGs | Médio | Média | Índice único parcial `uq_matches_active_lot` em `matches.lot_id` (status diferente de `cancelled`); API volta 409 | `alimenta/db/models.py`; teste do 409 | Baixo. O banco barra mesmo com duas requisições ao mesmo tempo |
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

## I · Information disclosure

| Ativo | Ameaça | Impacto | Prob. | Mitigação implementada | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F3 | `DATABASE_URL` com senha vaza em log, commit ou resposta | Alto | Média | Segredo só em variável de ambiente; `.env` ignorado no git; `.env.example` sem valor; a string nunca é impressa | `.gitignore`; `alimenta/.env.example` | Médio. O projeto ainda usa o papel padrão do banco; papel próprio com permissão mínima está na fila |
| F2 | Token de escrita aparece no navegador | Médio | Média | O painel chama a API pelo servidor; o token não vai para o HTML | `alimenta/painel/app.py` | Baixo |
| F1, F3 | Dado pessoal de doador ou ONG exposto | Alto | Baixa | Não existe dado pessoal: nomes inventados ("Doador Exemplo 03"), pontos sorteados dentro de 5 macrorregiões, nunca endereço real | `alimenta/data/generate.py`; `alimenta/data/DICIONARIO.md` | Baixo. Ver LGPD abaixo |
| F4 | Livro da demo revela onde ou para quem foi a comida | Baixo | Baixa | Evento v1 da família `field` não tem pessoa, endereço, estabelecimento nem localização | [CONTRATO.md](../transparencia/CONTRATO.md), família field | Baixo |
| F5 | Segredo do CI vaza por Action comprometida | Alto | Média | `permissions: contents: read`; Trivy por binário fixo com checksum; jobs de PR não recebem segredo de deploy | `alimenta.yml` | Médio |
| F5 | Imagem leva arquivo que não devia (`.env`, venv, banco local) | Médio | Baixa | `.dockerignore` em lista branca: só `alimenta/` e `tools/conferir.py` | `.dockerignore` na raiz; `trivy image` | Baixo |

## D · Denial of service

| Ativo | Ameaça | Impacto | Prob. | Mitigação implementada | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F6 | Render free dorme após 15 min parado; a primeira abertura leva cerca de 1 min | Médio | Alta | Abrir as duas URLs alguns minutos antes da banca; gravação de reserva | [PITCH.md](PITCH.md), plano B | Médio. É limite do plano free ([Render](https://render.com/docs/free), acesso em 14/10/2026) |
| F3 | Supabase free pausa o projeto após 1 semana sem uso | Alto | Média | Abrir a demo na véspera e no dia; `docker compose up` local como reserva | [LIMITES.md](LIMITES.md) | Médio ([Supabase, preços](https://supabase.com/pricing), acesso em 14/10/2026) |
| F1 | Enxurrada de requisições derruba a API | Médio | Baixa | Escrita só com token. Sem limite de taxa por IP | `alimenta/api/main.py` | Médio. Aceito para a demo |
| F1 | Dados de teste lotam a demo e confundem o painel | Baixo | Média | `POST /demo/reset` com token volta ao seed | Rota `/demo/reset` | Baixo |
| F5 | CI quebra e bloqueia o deploy na véspera | Médio | Média | Deploy só roda depois de testes e gates verdes; o compose local não depende do CI | `alimenta.yml` | Baixo |

## E · Elevation of privilege

| Ativo | Ameaça | Impacto | Prob. | Mitigação implementada | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Quem só lê consegue escrever | Médio | Média | Rotas de escrita checam o token antes de qualquer outra coisa | `alimenta/api/main.py`; teste sem token | Baixo |
| F5 | Processo dentro do container vira root no host | Alto | Baixa | Imagem `python:3.12-slim` com usuário não root | `alimenta/Dockerfile`; `trivy config` | Baixo |
| F3 | API com papel `postgres` pode tudo no banco | Alto | Baixa | Nenhum SQL dinâmico; SQLAlchemy com parâmetros | `alimenta/db/`; Bandit | Médio. Papel próprio com permissão mínima ainda não criado |
| F7 | Arquivo `.joblib` malicioso executa código ao carregar (pickle) | Alto | Baixa | Carga só depois de conferir o sha256 do artefato versionado | `alimenta/model/predict.py` | Baixo |
| F5 | Workflow ganha permissão de escrita no repositório | Alto | Baixa | `permissions: contents: read` no workflow | `alimenta.yml` | Baixo |

## Incidente de cadeia do Trivy (19/03/2026)

Em 19/03/2026, alguém com credenciais roubadas publicou uma release maliciosa do Trivy (v0.69.4). Também repontou 76 de 77 tags do `aquasecurity/trivy-action` e as 7 tags do `aquasecurity/setup-trivy` para código que roubava credenciais. Em 22/03/2026 saíram imagens maliciosas v0.69.5 e v0.69.6 no Docker Hub. Fonte: [GHSA-69fq-xp46-6x23](https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23), acesso em 14/10/2026.

O que isso ensina: a ferramenta de segurança também é ativo. Um `uses: aquasecurity/trivy-action@v0.x` rodaria qualquer código que a tag apontasse naquele dia, com acesso aos segredos do job.

Mitigação aplicada no workflow `alimenta.yml`:

- O Trivy é baixado como binário da versão fixa v0.76.0.
- O checksum SHA-256 do arquivo é conferido antes de rodar. Se não bate, o job falha.
- Nenhuma Action do Trivy é usada.
- O workflow tem `permissions: contents: read` e os jobs de scan não recebem segredo de deploy.

Evidência: passos de instalação nos jobs `trivy-fs` e `imagem` de `.github/workflows/alimenta.yml`.

Risco residual: as outras Actions do workflow (checkout, setup do uv) ainda usam tag de versão. Fixar por SHA de commit é o próximo passo.

## Achados aceitos

Achado que o time decide aceitar vai para `.trivyignore` ou `# nosec`, sempre com motivo, e é listado aqui.

| Ferramenta | Identificador | Onde | Motivo | Data |
|---|---|---|---|---|
| [preencher após o scan final] | | | | |

Se a tabela ficar vazia, é porque nenhum achado foi aceito. Isso não quer dizer zero vulnerabilidade: quer dizer que nenhum achado passou do gate sem correção.

## LGPD

A Rede Alimenta não trata dado pessoal.

- Doadores e ONGs são fictícios, com nomes como "Doador Exemplo 03" e "ONG Exemplo 07".
- Coordenadas são pontos sorteados dentro da caixa de 5 macrorregiões de São Paulo (Centro, Norte, Sul, Leste, Oeste). Nunca são endereço real.
- Lotes, histórico de 30 dias e rótulos de descarte são gerados pelo `alimenta/data/generate.py` com seed fixa.
- Não há login de pessoa, e-mail, telefone, CPF ou CNPJ.
- O livro da demo segue a família `field` do contrato v1: sem pessoa, endereço, estabelecimento nem localização.
- Todo painel e download traz o rótulo "DEMONSTRAÇÃO · dados simulados".

Isso segue a regra do PontaPé: dado real nunca entra no repositório, seed usa dado fictício marcado como fictício ([AGENTS.md](../../AGENTS.md)). O livro real do PontaPé não recebe evento simulado (D040).

Se um dia a rede operar com doador e ONG reais, a [ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6 já lista o que falta antes: controlador e base legal definidos, inventário de dados, papéis com acesso mínimo, retenção e plano de incidente. Também seria preciso mover o banco para sa-east-1 (São Paulo). Hoje ele está em us-east-1 porque o pooler de sa-east-1 não respondeu na criação. Com dado simulado isso não pesa; com dado real, transferência internacional exige cuidado próprio ([LGPD, Lei 13.709/2018, art. 33](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), acesso em 14/10/2026).

## Riscos residuais mais altos

1. Livro da demo sem assinatura nem carimbo externo: quem controla o banco pode reescrever a corrente inteira.
2. Papel padrão do banco em uso: falta papel próprio com permissão mínima.
3. Planos free: Render dorme e Supabase pausa. A demo depende de abrir as URLs antes.
4. Um único token de escrita: não diferencia pessoas.
5. Actions de terceiros ainda por tag, não por SHA.
