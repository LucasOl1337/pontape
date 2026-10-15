# Limites da Rede Alimenta

Esta página diz o que a Rede Alimenta ainda não faz, o que é estimativa e onde o dado passa fora do Brasil. Vale para o projeto integrador FIAP Rede Alimenta IA e para o módulo no PontaPé. Estado em 15/10/2026 (corte só doador: os destinos são os distribuidores públicos do catálogo; não há ONG cadastrada, oferta nem rota).

## Cadastro fechado (D012)

O **registro** de doação está pronto e **fechado** para contas de fora do time. A lista de onde doar (`/alimenta/distribuidores`) e o fluxo "quem recebe" funcionam sem conta, para qualquer pessoa.

- `ALIMENTA_SIGNUP_OPEN=false` em produção.
- Motivo: a D012 proíbe guardar dado pessoal antes de existir um controlador legal dos dados ([DECISOES.md](../DECISOES.md)). A associação ainda não tem CNPJ (D041).
- O termo de doação e o aviso de privacidade estão marcados "rascunho para revisão".
- Funcionam hoje: a conta do operador e as contas de teste do time.
- Para abrir falta: controlador nomeado, OK do Lucas nos textos legais, inventário de dados, prazo de retenção, canal do titular e plano de incidente ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6).

## Onde ainda existe dado sintético

A produção não tem dado simulado. O banco começa vazio e o bloco "Impacto real" do painel mostra zero honesto. Dado sintético só existe aqui, sempre marcado:

| Onde | O quê | Rótulo |
|---|---|---|
| Treino do modelo | `alimenta/data/lots_history.csv`, 6.000 lotes gerados com seed fixa `20261015` | "Partida a frio, dado sintético" em `GET /model`; selo "Modelo" no painel |
| Cenário do painel | `src/data/alimenta/painel.json`, gerado do mesmo dataset por `alimenta/scripts/painel.py` (o CI confere) | Selo "Simulado" em cada bloco: mapa de calor, refeições por região, descarte por tipo, alertas de validade |
| Modo exemplo do site | `/alimenta/doar/?exemplo=1` | Faixa "Exemplo" o tempo todo; nada é enviado à API |
| Testes automáticos | Doadores e doações inventados em `alimenta/tests/` | Só no CI e na máquina de quem roda |
| `docker compose` local | Seed de `alimenta/data/seed/` com `ALIMENTA_ENV=local` | "Exemplo" |

O ensaio da banca usa o modo exemplo do site e, quando precisa da API, contas de teste do time, marcadas `is_test=true`, que ficam fora dos KPIs públicos e do livro e são apagadas no fim.

## O modelo nasceu de dado sintético

Ainda não existe histórico de doações reais. O modelo `discard_risk-v1` foi treinado com dado sintético.

- Nenhum parâmetro do gerador foi calibrado com fonte pública (FAO, IBGE, Embrapa). Os valores são escolhas do time, escritas em `alimenta/data/DICIONARIO.md`.
- A acurácia de 0,789 no teste reservado mostra que o pipeline de treino e avaliação está certo. Ela não mostra quanto o modelo acerta com doações reais.
- Cada lote real grava as entradas e o desfecho em `lot_outcomes`. O retreino com dado real só roda com volume. Proposta: 300 desfechos e as duas classes com 50 ou mais.
- Até lá, o risco que a tela mostra é uma ordem de prioridade aproximada, não uma medida.

## O que é estimativa

**Refeições.** O painel divide os kg entregues por 0,544 kg. O número vem da Feeding America: "each meal is roughly 1.2 pounds" ([About our claims](https://www.feedingamerica.org/ways-to-give/faq/about-our-claims), acesso em 14/10/2026). O fator é dos Estados Unidos e mede comida de banco de alimentos, não refeição servida no Brasil. Por isso o painel sempre escreve "refeições estimadas". Trocar por fonte brasileira é mudar `KG_PER_MEAL` em `alimenta/core/domain.py`.

**kg entregues.** São kg de doações que quem doou marcou como entregues. O sistema não tem confirmação do distribuidor e não sabe se a comida seria mesmo jogada fora sem a doação.

**Tempo de match.** Média, em minutos, entre registrar a doação e escolher o destino, só com doações reais (`GET /kpis`, campo `match`). Não mede o tempo até a entrega.

**Alertas de validade do painel.** Lotes simulados que vencem em até 48 horas, ordenados pelo risco do modelo. É demonstração do que o operador veria, não fila real.

## O que é regra e não modelo

São duas AIs. O modelo local estima a probabilidade de descarte. A recomendação lê as páginas públicas dos candidatos e ordena, citando a fonte. O resto é regra, cálculo ou decisão humana.

| Parte | Tipo | Onde |
|---|---|---|
| Probabilidade de descarte | Modelo (scikit-learn) | `alimenta/model/` |
| Faixa baixo, médio, alto | Limiar fixo (0,33 e 0,66) | `alimenta/model/predict.py` |
| Doação vencida bloqueada | Regra fixa (422) | `alimenta/core/donations.py` |
| Candidatos: cidade, categoria aceita, quem recebe de quem | Regra fixa | `alimenta/core/recommend.py` |
| Ordem dos candidatos com justificativa e fonte | AI (9Router), validada; sem AI, ordem por regra | `alimenta/core/recommend.py` |
| Vencimento de doação parada | Regra fixa, pela varredura | `alimenta/core/donations.py` |
| Escolha do destino | Decisão de quem doa | `POST /donations/{id}/destination` |
| Suspender doador | Decisão humana do operador | Rotas `/ops/donors/...` |

A previsão não é certificado sanitário. Quem decide se a comida está boa é o doador, que responde pela Lei 14.016/2020, e o distribuidor, que confere na entrega.

## Onde o dado fica

**Banco em São Paulo.** O Supabase do sistema real fica em sa-east-1, porque o dado é de brasileiros. O projeto antigo `rede-alimenta` (us-east-1) só teve seed simulado e sai depois. Confirmado em 14/10/2026: projeto `rede-alimenta-sp` em sa-east-1, Postgres 17, migração `0001_corte_real` aplicada pelo pooler de sessão e fumaça verde (13 tabelas, RLS ligado em todas, zero política).

**API nos Estados Unidos.** A API roda no Render na região Virginia. O site e o painel ficam na Cloudflare. O Render só tem Oregon, Ohio, Virginia, Frankfurt e Singapore ([Render regions](https://render.com/docs/regions), acesso em 14/10/2026). Consequências:

- Todo dado de quem doa passa por servidor nos Estados Unidos. É transferência internacional de dado pessoal ([LGPD, Lei 13.709/2018, art. 33](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), acesso em 14/10/2026). O aviso de privacidade precisa dizer isso antes de abrir o cadastro.
- Cada consulta ao banco cruza Estados Unidos e São Paulo, uma ida e volta. A API faz poucas consultas por requisição para não somar atraso.

**Supabase Auth.** O login usa o mesmo projeto Supabase. O código por e-mail sai do servidor de e-mail do Supabase.

## Login por e-mail limitado

O código de login sai pelo SMTP padrão do Supabase. Ele só envia para membros do time do projeto e tem limite de cerca de 2 e-mails por hora ([Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) e [Rate limits](https://supabase.com/docs/guides/auth/rate-limits), acesso em 14/10/2026).

- Hoje só o time consegue entrar. Isso combina com o cadastro fechado.
- Na banca, as contas de teste entram antes e mantêm a sessão aberta.
- Para abrir o registro a todos, falta SMTP próprio (Resend ou Brevo, remetente `@pontape.org`). Conta e DNS ficam com o regente e o Lucas. O passo está no fim de `alimenta/.env.example`.

## O que não está pronto

| Item | Estado |
|---|---|
| Análise semântica de validade e tipo com Hugging Face | Fora deste corte. A categoria vem de uma lista, não de texto livre |
| Retreino com dado real | Espera volume. O código grava os desfechos desde o primeiro lote |
| Publicação no livro real de pontape.org | Pronta no código: fila `ledger_outbox`, uma ação por vez por doação (`test_livro_fila.py`). Só doação real entra |
| Confirmação do distribuidor | Não existe. A entrega é declarada por quem doou, e o painel diz isso |
| Tela do operador | Pela API e pelo Swagger (`/ops/overview`, suspender doador, auditoria). Não há tela no site |
| Foto do lote | Na fila. Precisa de armazenamento privado com quarentena |
| Área fora do catálogo | O catálogo tem 30 distribuidores com fonte. Cidade sem distribuidor recebe resposta honesta, sem sugestão inventada |
| Região no modelo | O modelo foi treinado com 5 macrorregiões simuladas de São Paulo. Na doação real a região entra como "desconhecida", porque o sistema não guarda endereço |
| MFA do operador | Na fila |
| Papel de banco próprio com permissão mínima | Na fila. A API usa o papel padrão do projeto |
| Backup e restauração testados | Na fila. O Supabase free não tem backup automático |
| Limite de requisições por conta ou IP | Não existe |
| Prazo depois da escolha do destino | 48 horas; depois disso a varredura cancela a doação e o livro registra |
| Varredura de madrugada | A varredura agendada roda das 7h às 22h. Fora disso, só quando alguém abre o sistema |
| Domínio `alimenta.pontape.org` | Na fila do regente |

## Hospedagem gratuita

**Render free dorme.** Um web service free para depois de 15 minutos sem tráfego. A próxima requisição acorda o serviço em cerca de 1 minuto. As 750 horas por mês valem para o workspace inteiro ([Render, plano free](https://render.com/docs/free), acesso em 14/10/2026). O painel avisa quando a API está acordando e pede para recarregar.

**Supabase free pausa.** O projeto é pausado depois de 1 semana sem atividade ([Supabase, Pricing](https://supabase.com/pricing), acesso em 14/10/2026). Quem reativa é o regente.

## O que a Rede Alimenta não é

- Não recebe dinheiro. Só comida.
- Não entrega comida a pessoa física. O destino é sempre um distribuidor público do catálogo, e o sistema não guarda nada de quem come.
- Não certifica comida. A previsão do modelo não diz se a comida está boa.
- Não inventa destino: só sugere distribuidores do catálogo, cada um com fonte pública.
- O passo 4 do PontaPé ("Comida e roupa") aparece como "em construção": a parte da comida funciona, roupa e higiene dependem de doações em dinheiro, que ainda não abriram.
