# Rede Alimenta

Projeto integrador FIAP "Rede Alimenta IA" (tecnólogo, 1º ano, 2026). Dentro do PontaPé, o módulo se chama **Rede Alimenta**. Ele mora no passo 4 da escada, "Comida e roupa", que é o módulo M5 · Ponte inicial do [PRD](../PRD.md). No texto do PontaPé o termo é sempre AI.

A Rede Alimenta ajuda quem tem comida sobrando a levar até um distribuidor público que aceite. Quem doa registra a doação, o modelo estima o risco de descarte, a AI ordena os distribuidores do catálogo lendo as páginas-fonte de cada um e cita a fonte. Quem doa escolhe, leva e marca a entrega. Cada passo de doação real entra no livro público do pontape.org, sem dado pessoal.

Estado em 14/10/2026 (corte r6, branch `alimenta/dominio`):

- **Só doador.** Pessoa, empresa ou distribuidor. ONG, oferta, match, rota e painel Streamlit saíram do código. As tabelas antigas ficam no banco, vazias (migração 0002 só aditiva).
- A interface é o site `pontape.org/alimenta` (frente Vitrine). Esta pasta é a API.
- Cadastro de fora do time **fechado** (`ALIMENTA_SIGNUP_OPEN=false`) até existir SMTP próprio. O operador e as contas de teste funcionam.
- Dado sintético só existe na partida a frio do modelo e nos testes. Nunca na produção.

Outros documentos desta pasta: [STRIDE.md](STRIDE.md), [PITCH.md](PITCH.md), [LIMITES.md](LIMITES.md). Atenção: STRIDE, PITCH e LIMITES ainda descrevem o corte com ONG em vários pontos; a revisão deles está listada em "Pendências de documentação" abaixo.

## Problema

O enunciado da FIAP descreve o paradoxo: comida é jogada fora enquanto muita gente passa fome (`requisitos-fiap.pdf`, página 2). Quem doa não sabe qual distribuidor aceita aquele tipo de comida, em que horário, e se a informação pública ainda vale.

## Papéis

| Papel | Quem é | O que faz |
|---|---|---|
| `donor` | Pessoa, empresa ou distribuidor | Cadastro mínimo, registra doação, pede recomendação, escolhe destino, marca entrega ou cancela, apaga a conta |
| `operator` | Equipe do PontaPé, por `ALIMENTA_OPERATOR_EMAILS` | Suspende ou reativa doador, vê contagens e auditoria, apaga dados de teste |

Distribuidor não é papel com tela própria: é um registro do catálogo `src/data/alimenta/distribuidores.json` (30 registros, cada um com fonte pública). Um distribuidor que também doa pode dizer qual registro ele é; a recomendação não sugere que doe para si mesmo.

## Login

Supabase Auth com código de 6 dígitos no e-mail, sem senha. O site chama `POST /auth/code` e `POST /auth/verify` desta API; o FastAPI valida o JWT pela chave pública do projeto (JWKS), conferindo `iss`, `aud`, `exp` e `sub`. O SMTP padrão do Supabase só entrega ao time; abrir o cadastro depende de SMTP próprio.

## Cadastro mínimo

`POST /donors` com tipo (`person`, `company`, `distributor`), cidade, UF, CNPJ opcional (empresa e distribuidor) e os aceites `termo-de-doacao-v2` e `aviso-de-privacidade-v2`. Não pede CPF, nome, endereço nem telefone; campo extra volta 422. CNPJ informado precisa de dígito válido e situação ATIVA na BrasilAPI (fora do ar não bloqueia; o retrato fica privado em `doc_check`, sem sócios). Provas: `test_cadastro.py`.

## Fluxo de uma doação

1. `POST /donations`: categoria, conservação, kg, validade, cidade e UF. Validade no passado volta 422. O modelo calcula o risco. Nasce um código público `AL` + 8 caracteres (ex.: `AL7K2M9QXP`), aleatório.
2. `POST /donations/{id}/recommend`: lista ordenada de distribuidores com justificativa curta e fonte (ver "Recomendação com AI").
3. `POST /donations/{id}/destination`: escolhe um distribuidor do catálogo. Id fora do catálogo volta 422. Pode trocar enquanto a doação estiver aberta. `choice: ai_top` só quando a pessoa escolhe o primeiro de uma lista feita pela AI (`from_recommendation: true`); qualquer outro caso, inclusive o primeiro da lista por regra, é `other`.
4. `POST /donations/{id}/delivered`: quem doou declara a entrega. Só depois de escolher destino (409 antes).
5. `POST /donations/{id}/cancel` a qualquer momento antes da entrega.
6. Vencimento pela varredura: sem destino, vence na validade; com destino, 48 h depois. Vira `donation_cancelled` no livro.

Limites, porque cada passo real vira um commit na main: 5 doações abertas por conta e 10 registros por dia. Provas: `test_doacao.py`.

## Recomendação com AI

1. **Candidatos por regra**: catálogo ativo, mesma cidade (sem acento e sem caixa), aceita a categoria (categoria não informada entra depois), recebe do tipo de quem doa. Ordem: aceita a categoria declarada, horário publicado, confiança da pesquisa, nome. Máximo 6.
2. **Leitura ao vivo** só das URLs do próprio catálogo (`sources` e `public_contact_url`) dos 4 primeiros: timeout 6 s, até 400 kB, redirecionamento só no mesmo domínio (3 no máximo). Nenhuma URL fora do catálogo é lida. URL repetida entre unidades é lida uma vez.
3. **AI**: 9Router `/v1/chat/completions`, `cc/claude-haiku-4-5-20251001`, reserva `cx/gpt-5.6-luna`, temperatura 0, resposta JSON. Vai para a AI só a doação sem pessoa (categoria, kg, conservação, horas até vencer, risco, cidade, tipo de quem doa) e os textos públicos.
4. **Validação dura**: id fora dos candidatos, URL fora das fontes daquele distribuidor, ranking vazio, justificativa vazia ou acima de 200 caracteres. Qualquer um recusa a resposta inteira e vale a regra (`mode: "rule"`, com a mensagem "Sem AI agora"). Travessão vira vírgula e "IA" vira "AI".
5. **Busca web aberta** só com `ALIMENTA_AI_WEB_SEARCH=true` (desligada).
6. Tudo fica em `recommendations` (privada), com a escolha depois (`accepted_top` ou `picked_other`). Limite de 5 por doação.

Provas: `test_recomendacao.py` (9Router e páginas falsos) e a prova real em `provas-r6/recomendacao-ai-real.txt` do relatório da rodada.

## Livro público

Cada passo de doação real (`donation_registered`, `destination_chosen`, `donation_delivered`, `donation_cancelled`) vira um envelope `{source: "alimenta", eventId: "<donationRef>:<n>:<ação>", payload}` na tabela `ledger_outbox`, na mesma transação. O envio é `workflow_dispatch` do `ledger-ingest.yml`, uma ação por vez por doação: a próxima só sai quando a anterior aparece em `src/data/ledger/intake.json` da main. A varredura confirma, reenvia depois de 20 minutos e grava o número da ação no livro. Conta de teste nunca entra. Com `ALIMENTA_PUBLISH_REAL_LEDGER=false` nada sai e a doação mostra "entrando no livro". O formato da família está em [CONTRATO.md](../transparencia/CONTRATO.md) e o conferidor independente é `tools/conferir.py`. Provas: `test_livro_fila.py` e `src/lib/ledger/donation.test.ts`.

## Apagar a conta

`DELETE /me` cancela as doações abertas, apaga e-mail, aceites, CNPJ, cidade e recomendações, troca o autor na auditoria por "conta apagada" e chama o admin do Supabase Auth com `SUPABASE_SECRET_KEY`. Sem a chave, o pedido fica `pending` em `account_deletions` e a varredura tenta de novo. O mesmo login não volta (403). As doações ficam sem dono identificável e o livro não muda: ele nunca teve dado pessoal. Provas: `test_apagar_conta.py`.

## Modelo de AI

### O que ele prevê

Alvo binário `discarded`: o lote foi descartado sem aproveitamento (1) ou não (0).

### Partida a frio com dado sintético

Ainda não existe histórico real de doações. Por isso o modelo atual `discard_risk-v1` foi **treinado com dado sintético**. Isso é uma partida a frio, e o sistema diz isso em `GET /model`.

O gerador `alimenta/data/generate.py` (seed fixa `20261015`) calcula, para cada lote, uma probabilidade escondida. Ela combina horas até vencer, armazenamento, perecibilidade da categoria, kg, hora do dia, fim de semana e demanda da região. Depois o gerador sorteia o rótulo dessa probabilidade, com ruído. O processo completo está em `alimenta/data/DICIONARIO.md`. O rótulo não sai de uma regra de prazo. Se saísse, o modelo só copiaria a regra.

### Retreino com dado real

Cada doação real grava as entradas do modelo congeladas (`lots.features`) e, no fim, o desfecho em `lot_outcomes`: `delivered`, `expired` ou `cancelled`. O rótulo de retreino é `discarded = desfecho expired`. Doação `cancelled` não entra no rótulo.

O retreino com dado real (`python -m alimenta.model.train --source real`) só roda quando houver volume. Proposta: 300 desfechos e as duas classes com 50 ou mais. Registros `is_test=true` ficam de fora. Provas: `test_doacao.py::test_real_donation_full_cycle_goes_to_outbox_in_order` e `test_doacao.py::test_expiry_cancels_and_grace_after_destination`.

### Como treina

1. Split estratificado 80/20 **antes** de qualquer ajuste: 4.800 lotes de treino e 1.200 de teste.
2. Modelo principal: `HistGradientBoostingClassifier`, escolhido antes de olhar o teste. `LogisticRegression` entra só como comparação.
3. Duas baselines no mesmo teste: classe majoritária (sempre "não descartado") e regra só de prazo (descartado se faltam 30,7 horas ou menos, limiar escolhido só com o treino).
4. O modelo precisa vencer as duas baselines (`beats_baselines: true` no `metrics.json`).
5. `python -m alimenta.model.train --check` retreina com a mesma seed e compara com o `metrics.json` versionado. O CI roda esse passo.

Entradas: `category`, `storage`, `region`, `kg`, `hours_to_expiry`, `published_hour`, `weekday`.

A tela mostra risco baixo (menor que 0,33), médio (de 0,33 a menos de 0,66) ou alto (0,66 ou mais). É um limiar sobre a probabilidade, não outro modelo.

### Métricas da partida a frio

Valores de `alimenta/model/artifacts/metrics.json`, commit `55280f4`, 14/10/2026. Todos medidos em dado sintético.

| Métrica no teste (1.200 lotes) | Modelo `discard_risk-v1` | Baseline majoritária | Baseline de prazo |
|---|---|---|---|
| Acurácia | 0,789 | 0,581 | 0,722 |
| Precisão, classe `discarded` | 0,778 | 0,000 | 0,680 |
| Recall, classe `discarded` | 0,696 | 0,000 | 0,634 |
| F1, classe `discarded` | 0,735 | 0,000 | 0,656 |

- ROC AUC: 0,855.
- Matriz de confusão (linha = verdade, coluna = previsão; ordem "não descartado", "descartado"): `[[597, 100], [153, 350]]`.
- Teto prático: quem conhecesse a probabilidade escondida, sem o ruído, acertaria 79,9% no mesmo teste. Acurácia perto de 100% seria sinal de vazamento.
- sha256 do artefato: `830dbe466ca635a4b8b5446b8f03888183ac512d2a06971cfbe60dd622af03d1`.
- Versões: Python 3.12.14, scikit-learn 1.9.1, pandas 3.0.6, numpy 2.5.4.

Estes números provam que o pipeline de treino e avaliação está certo. Eles não dizem quanto o modelo acerta com doações reais. Isso só se mede depois do retreino.

### O que é modelo, o que é regra e o que é AI generativa

| Parte | Tipo |
|---|---|
| Probabilidade de descarte (`discard_proba`) | Modelo aprendido (scikit-learn) |
| Faixa baixo, médio ou alto | Limiar fixo (0,33 e 0,66) |
| Bloqueio de doação vencida | Regra fixa. Nenhum modelo decide se comida vencida pode ser doada |
| Candidatos a destino (cidade, categoria aceita, quem doa) | Regra fixa sobre o catálogo |
| Ordem dos candidatos e justificativa com fonte | AI generativa (9Router), validada; se falhar, regra |
| Vencimento da doação | Regra fixa (validade; 48 h depois com destino escolhido) |

A previsão não é certificado sanitário. A sugestão de destino não substitui confirmar com o distribuidor.

## Lei e LGPD

**Lei 14.016/2020** ([Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14016.htm), acesso em 14/10/2026): doação de excedente dentro da validade e conservado, gratuita (art. 1º); responsabilidade só com dolo e até a primeira entrega ao intermediário (art. 3º). No sistema: termo de doação v2 aceito no cadastro e bloqueio de doação vencida (422).

**LGPD**: dado pessoal mínimo (e-mail para o login; CNPJ e cidade opcionais ou de cadastro), nada de beneficiário final, nada pessoal no livro, apagamento por `DELETE /me`. Textos em `alimenta/legal/` servidos em `GET /legal/donation_terms` e `GET /legal/privacy_notice`.

## Como rodar

```bash
uv sync --project alimenta
uv run --project alimenta python -m alimenta.data.generate --check
uv run --project alimenta python -m alimenta.model.train --check
uv run --project alimenta python -m pytest alimenta/tests
uv run --project alimenta uvicorn alimenta.api.main:app --port 8000
alimenta/scripts/ensaio.sh --local-sqlite          # sobe a API, roda o fluxo com contas de teste e limpa
```

Com Docker: `docker compose up --build` (Postgres + API). Os testes não falam com rede: Supabase, BrasilAPI, 9Router, páginas-fonte e GitHub são falsos.

Variáveis: `alimenta/.env.example` e `render.yaml`.

## Rotas

| Grupo | Rotas |
|---|---|
| Público | `GET /health`, `/kpis`, `/model`, `/distributors?city=`, `/legal/{kind}` |
| Conta | `POST /auth/code`, `POST /auth/verify`, `GET /me`, `POST /me/consents`, `DELETE /me` |
| Doador | `POST /donors`, `GET /donors/me`, `POST /donations`, `GET /donations/mine`, `GET /donations/{id}`, `POST /donations/{id}/recommend`, `/destination`, `/delivered`, `/cancel` |
| Operador | `POST /ops/donors/{id}/suspend\|activate`, `GET /ops/overview`, `GET /ops/audit`, `POST /ops/test-data/purge` |
| Automação | `POST /ops/sweep` (só `X-Alimenta-Ops-Token`) |

A lista exata é testada em `test_publico.py::test_old_ngo_and_offer_routes_are_gone`.

## KPIs

Só registros reais (`is_test` fora); produção vazia mostra zero. `GET /kpis`: doações, entregas declaradas, kg entregues, refeições estimadas (kg / 0,544, fator da Feeding America, ver LIMITES), por situação, escolha `ai_top` x `other` e entregas por distribuidor do catálogo.

## Pendências de documentação

STRIDE.md, PITCH.md e LIMITES.md ainda citam ONG, oferta, rota e painel do corte anterior. Os pontos certos para este corte estão neste README; a revisão daqueles três fica para a próxima rodada.

## Integrantes

| Nome | RM | Frente |
|---|---|---|
| [nome] | [RM] | [frente] |
| [nome] | [RM] | [frente] |
| [nome] | [RM] | [frente] |

O site pontape.org não nomeia ninguém (D036). Os nomes aparecem só aqui, na entrega acadêmica.
