# Limites da Rede Alimenta

Esta página diz o que a Rede Alimenta ainda não faz, o que é estimativa e onde o dado passa fora do Brasil. Vale para o projeto integrador FIAP Rede Alimenta IA e para o módulo no PontaPé. Estado em 14/10/2026.

## Cadastro fechado (D012)

O sistema está pronto e **fechado** para doadores e ONGs de fora do time.

- `ALIMENTA_SIGNUP_OPEN=false` em produção.
- Motivo: a D012 proíbe guardar dado pessoal antes de existir um controlador legal dos dados ([DECISOES.md](../DECISOES.md)). A associação ainda não tem CNPJ (D041).
- O termo de doação e o aviso de privacidade estão marcados "rascunho para revisão".
- Funcionam hoje: a conta do operador e as contas de teste do time.
- Para abrir falta: controlador nomeado, OK do Lucas nos textos legais, inventário de dados, prazo de retenção, canal do titular e plano de incidente ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6).

## Onde ainda existe dado sintético

A produção não tem dado simulado. O banco começa vazio e o painel público mostra zero honesto. Dado sintético só existe aqui:

| Onde | O quê | Rótulo |
|---|---|---|
| Treino do modelo | `alimenta/data/lots_history.csv`, 6.000 lotes gerados com seed fixa `20261015` | "Partida a frio, dado sintético" em `GET /model` e no painel |
| Testes automáticos | Doadores, ONGs e lotes inventados em `alimenta/tests/` | Só no CI e na máquina de quem roda |
| `docker compose` local | Seed de `alimenta/data/seed/` com `ALIMENTA_ENV=local` | "Exemplo" |

O ensaio da banca não usa dado sintético. Ele usa contas de teste do time, marcadas `is_test=true`, que ficam fora dos KPIs públicos e do livro e são apagadas no fim.

## O modelo nasceu de dado sintético

Ainda não existe histórico de doações reais. O modelo `discard_risk-v1` foi treinado com dado sintético.

- Nenhum parâmetro do gerador foi calibrado com fonte pública (FAO, IBGE, Embrapa). Os valores são escolhas do time, escritas em `alimenta/data/DICIONARIO.md`.
- A acurácia de 0,789 no teste reservado mostra que o pipeline de treino e avaliação está certo. Ela não mostra quanto o modelo acerta com doações reais.
- Cada lote real grava as entradas e o desfecho em `lot_outcomes`. O retreino com dado real só roda com volume. Proposta: 300 desfechos e as duas classes com 50 ou mais.
- Até lá, o risco que a tela mostra é uma ordem de prioridade aproximada, não uma medida.

## O que é estimativa

**Refeições.** O painel divide os kg entregues por 0,544 kg. O número vem da Feeding America: "each meal is roughly 1.2 pounds" ([About our claims](https://www.feedingamerica.org/ways-to-give/faq/about-our-claims), acesso em 14/10/2026). O fator é dos Estados Unidos e mede comida de banco de alimentos, não refeição servida no Brasil. Por isso o painel sempre escreve "refeições estimadas". Trocar por fonte brasileira é mudar `KG_PER_MEAL` em `alimenta/core/domain.py`.

**kg salvos.** São kg de lotes com dupla confirmação. O sistema sabe que a ONG recebeu. Não sabe se a comida seria mesmo jogada fora sem a doação.

**Distância.** Haversine, em linha reta, sem rua e sem trânsito.

## O que é regra e não modelo

O modelo de AI faz uma coisa: estima a probabilidade de descarte. O resto é regra, cálculo ou decisão humana.

| Parte | Tipo | Onde |
|---|---|---|
| Probabilidade de descarte | Modelo (scikit-learn) | `alimenta/model/` |
| Faixa baixo, médio, alto | Limiar fixo (0,33 e 0,66) | `alimenta/model/predict.py` |
| Lote vencido bloqueado | Regra fixa | `alimenta/core/service.py`, `alimenta/core/matching.py` |
| ONG aprovada, tipo aceito, refrigeração, raio, janela, capacidade | Regra fixa | `alimenta/core/matching.py` |
| Ordem das ONGs | Pontos das regras, com urgência | `alimenta/core/matching.py` |
| Prazo da oferta e escalonamento | Regra fixa | `alimenta/core/offers.py` |
| Rota de coleta | Heurística de vizinho mais próximo | `alimenta/core/route.py` |
| Aprovação de ONG | Decisão humana do operador | Rotas `/ops/ngos/...` |

A previsão não é certificado sanitário. Quem decide se a comida está boa é o doador, que responde pela Lei 14.016/2020, e a ONG, que confere na retirada.

## Onde o dado fica

**Banco em São Paulo.** O Supabase do sistema real fica em sa-east-1, porque o dado é de brasileiros. O projeto antigo `rede-alimenta` (us-east-1) só teve seed simulado e sai depois. Confirmado em 14/10/2026: projeto `rede-alimenta-sp` em sa-east-1, Postgres 17, migração `0001_corte_real` aplicada pelo pooler de sessão e fumaça verde (13 tabelas, RLS ligado em todas, zero política).

**API e painel nos Estados Unidos.** Os dois serviços rodam no Render na região Virginia. O Render só tem Oregon, Ohio, Virginia, Frankfurt e Singapore ([Render regions](https://render.com/docs/regions), acesso em 14/10/2026). Consequências:

- Todo dado de doador e ONG passa por servidor nos Estados Unidos. É transferência internacional de dado pessoal ([LGPD, Lei 13.709/2018, art. 33](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), acesso em 14/10/2026). O aviso de privacidade precisa dizer isso antes de abrir o cadastro.
- Cada consulta ao banco cruza Estados Unidos e São Paulo, uma ida e volta. A API faz poucas consultas por requisição para não somar atraso.

**Supabase Auth.** O login usa o mesmo projeto Supabase. O código por e-mail sai do servidor de e-mail do Supabase.

## Login por e-mail limitado

O código de login sai pelo SMTP padrão do Supabase. Ele só envia para membros do time do projeto e tem limite de cerca de 2 e-mails por hora ([Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) e [Rate limits](https://supabase.com/docs/guides/auth/rate-limits), acesso em 14/10/2026).

- Hoje só o time consegue entrar. Isso combina com o cadastro fechado.
- Na banca, as contas de teste entram antes e mantêm a sessão aberta.
- Para abrir a doadores e ONGs, falta SMTP próprio (Resend ou Brevo, remetente `@pontape.org`). Conta e DNS ficam com o regente e o Lucas. O passo está no fim de `alimenta/.env.example`.

## O que não está pronto

| Item | Estado |
|---|---|
| Análise semântica de validade e tipo com Hugging Face | Fora deste corte. A categoria vem de uma lista, não de texto livre |
| Retreino com dado real | Espera volume. O código grava os desfechos desde o primeiro lote |
| Publicação no livro real de pontape.org | Pronta no código e desligada (`ALIMENTA_PUBLISH_REAL_LEDGER=false`) até o Lucas autorizar a primeira. Feito: cliente em `alimenta/ledger/public.py`, fonte `alimenta` aceita em `src/lib/ledger/ingest.ts` e `test_livro.py::test_flag_off_makes_no_network_call`. |
| E-mail automático de oferta | Depende do SMTP próprio. Hoje o aviso é a caixa de ofertas e o link de WhatsApp |
| Tela do operador no painel | Pronta: aba "Operação" no painel (aprovar ou recusar ONG, reoferecer lote sem ONG). O resto da operação (suspender doador, auditoria) fica pela API e pelo Swagger. |
| Foto do lote | Na fila. Precisa de armazenamento privado com quarentena |
| Doador pessoa física (CPF, produtor rural) | Na fila. Lançamento só com CNPJ |
| Área fora da cidade de São Paulo | Na fila. O modelo conhece 5 macrorregiões da capital |
| MFA do operador | Na fila |
| Papel de banco próprio com permissão mínima | Na fila. A API usa o papel padrão do projeto |
| Backup e restauração testados | Na fila. O Supabase free não tem backup automático |
| Limite de requisições por conta ou IP | Não existe |
| Prazo automático depois do aceite | Não existe. Se a ONG aceita e não retira, o lote vence e vira `expired`. O operador acompanha |
| Escalonamento de madrugada | A varredura agendada roda das 7h às 22h. Fora disso, só quando alguém abre o sistema |
| Domínio `alimenta.pontape.org` | Na fila do regente |
| Assinatura e carimbo do livro próprio | Não existe. O livro `pontape-alimenta` tem hash encadeado. A assinatura e o carimbo ficam com o livro real |

## Hospedagem gratuita

**Render free dorme.** Um web service free para depois de 15 minutos sem tráfego. A próxima requisição acorda o serviço em cerca de 1 minuto. As 750 horas por mês valem para o workspace inteiro ([Render, plano free](https://render.com/docs/free), acesso em 14/10/2026). São dois serviços, então os dois podem estar dormindo.

**Supabase free pausa.** O projeto é pausado depois de 1 semana sem atividade ([Supabase, Pricing](https://supabase.com/pricing), acesso em 14/10/2026). Quem reativa é o regente.

## O que a Rede Alimenta não é

- Não recebe dinheiro. Só comida.
- Não entrega comida a pessoa física. O destino é sempre uma ONG aprovada, e o sistema não guarda nada de quem come.
- Não certifica comida. A previsão do modelo não diz se a comida está boa.
- Não aponta nenhuma ONG real enquanto o cadastro estiver fechado.
- Não muda o estado do passo 4 do PontaPé. Ele continua "Ainda não começou" até a primeira entrega real.
