# STRIDE da Rede Alimenta

Esta matriz cobre o sistema real da Rede Alimenta: doações de comida de estabelecimentos com CNPJ para ONGs aprovadas. Não cobre o resto do PontaPé.

Base: [ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §2 (Supabase) e §6 (privacidade e segurança), riscos do [PRD.md](../PRD.md) §11, o contrato do livro em [CONTRATO.md](../transparencia/CONTRATO.md) e a proposta do corte real (14/10/2026).

Cada evidência aponta para um teste em `alimenta/tests/` (branch `alimenta/real`).

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
| F1 | Login | Painel → API → Supabase Auth: código de 6 dígitos por e-mail, JWT validado pelo JWKS do projeto |
| F2 | Cadastro | Doador e ONG com CNPJ, endereço, contato. CNPJ e CEP conferidos na BrasilAPI |
| F3 | Lote e oferta | Lote publicado, oferta com prazo para uma ONG por vez, aceite ou recusa |
| F4 | Coleta e confirmação | Rota de coleta da ONG, confirmação de retirada pelo doador e de recebimento pela ONG |
| F5 | Banco | API → Postgres Supabase sa-east-1 pelo pooler, a partir do Render em Virginia |
| F6 | Livro próprio | `ledger_events`, livro `pontape-alimenta`, download público em `GET /ledger` |
| F7 | Livro real | Envio opcional ao `ledger-ingest.yml` de pontape.org, desligado por `ALIMENTA_PUBLISH_REAL_LEDGER=false` |
| F8 | Automação | GitHub Actions agendado chama `POST /ops/sweep` com `ALIMENTA_OPS_TOKEN` |
| F9 | Pipeline e imagem | `.github/workflows/alimenta.yml`, Bandit, Trivy, `docker build`, deploy hooks |
| F10 | Artefato do modelo | `discard_risk-v1.joblib` e `metrics.json` |

Escala. Impacto: baixo (atrapalha a operação), médio (decisão errada ou serviço fora do ar), alto (dado pessoal vazado, comida imprópria entregue, fato falso no livro público). Probabilidade: baixa, média ou alta, para um sistema aberto na internet com poucas organizações.

## Ameaças principais do sistema real

Seis ameaças que a banca deve ouvir primeiro. As tabelas por letra, mais abaixo, trazem o detalhe.

| # | Ameaça | Letra | Mitigação | Evidência |
|---|---|---|---|---|
| A1 | Conta falsa de ONG para receber comida e revender ou desviar | S, E | CNPJ conferido na BrasilAPI: situação `ATIVA` e natureza jurídica sem fins lucrativos (grupo 3xx). ONG entra `pending` e só recebe oferta depois da aprovação humana do operador. Suspensão a qualquer hora. Cadastro de fora fechado (`ALIMENTA_SIGNUP_OPEN=false`) | `test_fluxo.py::test_pending_ngo_never_gets_offer_and_test_never_mixes_with_real`; `test_cadastro.py::test_signup_open_real_donor_with_cnpj_snapshot` |
| A2 | Doador mal-intencionado publica comida vencida ou imprópria | T | Lote com validade no passado volta 422. Caixa "dentro da validade e conservado como o fabricante manda" em todo lote. Termo de doação aceito no cadastro. Doador só com CNPJ. Operador suspende o doador. A ONG pode recusar com motivo | `test_expired_lot_is_422` em `alimenta/tests/test_api.py` e `test_expired_lot_is_blocked` em `test_matching.py`; `test_cadastro.py::test_consent_versions_required`; `test_cadastro.py::test_suspended_donor_cannot_publish` |
| A3 | Vazamento de endereço de doador ou ONG | I | Saíram do público `GET /donors`, `GET /ngos`, `GET /lots` e `GET /matches`. Endereço só para o dono, para a ONG com oferta daquele lote e para o operador. O aviso traz bairro, não endereço. O livro não tem local | `test_publico.py::test_no_public_response_carries_name_or_exact_coordinate`; `test_fluxo.py::test_others_cannot_touch` |
| A4 | Abuso de oferta: ONG segura lotes sem retirar, ou várias ONGs disputam o mesmo lote | T, D | Uma oferta `pending` por lote, por índice único parcial. Prazo de resposta entre 15 e 60 minutos. Vencido o prazo, a oferta passa para a próxima ONG. Capacidade da ONG no dia limita o aceite. Operador vê lotes `unclaimed` e reoferta | `test_fluxo.py::test_pending_offer_unique_index_blocks_second`; `test_fluxo.py::test_timeout_escalates_by_sweep` |
| A5 | Sequestro de sessão | S, I | JWT só na sessão do servidor do painel, nunca no navegador. Validação de `iss`, `aud`, `exp` e `sub` pela chave pública do Supabase. Código de uso único por e-mail, sem senha para vazar. Token de automação não vale em rota de usuário | `test_auth.py::test_bad_claims_are_rejected`, `test_auth.py::test_swapped_signature_and_unknown_kid`; `test_auth.py::test_ops_token_only_on_sweep` |
| A6 | Publicação indevida no livro: entrega falsa ou de teste vira fato público | T, R | Evento só com dupla confirmação, de duas contas diferentes. `is_test=true` nunca entra em livro. Publicação no livro real desligada por flag até o OK do Lucas. `eventId` estável impede duplicar. Evento sem pessoa, local nem estabelecimento | `test_fluxo.py::test_full_flow_double_confirmation`; `test_livro.py::test_test_accounts_never_reach_any_ledger`; `test_livro.py::test_flag_off_makes_no_network_call` |

## S · Spoofing

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F2 | Conta falsa de ONG (A1) | Alto | Média | BrasilAPI confere CNPJ, situação e natureza jurídica; retrato em `ngos.cnpj_check`; aprovação humana; cadastro de fora fechado | `test_cadastro.py::test_ngo_cnpj_snapshot_has_no_partners`, `test_fluxo.py::test_pending_ngo_never_gets_offer_and_test_never_mixes_with_real` | Médio. CNPJ ativo não prova que a ONG opera de verdade. O operador precisa de contato antes de aprovar |
| F2 | Alguém cadastra um doador com CNPJ de outra empresa | Médio | Média | CNPJ conferido na BrasilAPI. O e-mail da conta fica ligado ao doador. Operador suspende | `test_cadastro.py::test_inactive_cnpj_is_422` | Médio. Não há prova de que a pessoa trabalha naquela empresa |
| F1 | Alguém se passa por outra pessoa no login (A5) | Alto | Baixa | Código de 6 dígitos, de uso único, enviado ao e-mail. JWT validado pela chave pública do projeto | `test_auth.py::test_swapped_signature_and_unknown_kid` | Baixo. Quem controla o e-mail controla a conta |
| F1 | Alguém vira operador | Alto | Baixa | Operador só pela variável `ALIMENTA_OPERATOR_EMAILS` no Render, nunca por cadastro | `test_auth.py::test_operator_only_from_env` | Baixo. Falta MFA do operador ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6) |
| F5 | Serviço falso se passa pelo banco | Alto | Baixa | Pooler oficial do Supabase com TLS; URL só em variável de ambiente | `DATABASE_URL` no Render, nunca no git | Baixo |
| F8 | Alguém chama a varredura sem ser a automação | Baixo | Média | `ALIMENTA_OPS_TOKEN` exigido; a varredura só aplica regras de prazo, não escolhe ONG | `test_auth.py::test_ops_token_only_on_sweep` | Baixo. A varredura repetida não muda o resultado |
| F9 | Action ou binário falso no CI | Alto | Média | Trivy por binário fixo v0.76.0 com checksum; Actions fixadas por SHA | Jobs `trivy-fs` e `imagem`; `uses:` com SHA em `alimenta.yml` | Baixo |

## T · Tampering

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F3 | Doador publica comida vencida ou imprópria (A2) | Alto | Média | 422 para validade no passado; caixa de conferência; termo de doação; ONG recusa com motivo | `test_expired_lot_is_422`; `test_fluxo.py::test_lot_requires_terms_and_blocks_expired` | Médio. Validade digitada errada não se detecta. A ONG confere na retirada. A Lei 14.016, art. 3º, limita a responsabilidade a dolo |
| F3 | Mesmo lote vai para duas ONGs (A4) | Médio | Média | Índice único parcial: uma oferta `pending` e um match ativo por lote; 409 | `test_double_assignment_is_409` (corte 1); `test_fluxo.py::test_pending_offer_unique_index_blocks_second` | Baixo. O banco barra mesmo com duas requisições ao mesmo tempo |
| F3 | Doador mexe no lote depois da oferta | Médio | Baixa | Só cancelar (`POST /lots/{id}/cancel`); entradas do modelo congeladas em `lots.features` | `test_fluxo.py::test_lot_has_no_patch_after_offer` (não existe PATCH de lote: a API responde 405 ou 404) | Baixo |
| F4 | Entrega falsa para inflar kg (A6) | Médio | Média | Dupla confirmação por duas contas de papéis diferentes; `delivered` só com as duas | `test_fluxo.py::test_full_flow_double_confirmation` | Médio. Doador e ONG combinados podem mentir juntos. O operador vê padrões na auditoria |
| F6 | Alguém altera um evento antigo do livro próprio | Médio | Baixa | Corrente JCS + SHA-256; tabela só com INSERT; `hash` único | `test_chain_verifies_and_tampering_fails`; `tools/conferir.py` | Médio. Sem assinatura, quem controla o banco reescreve a corrente inteira |
| F10 | Artefato do modelo trocado | Alto | Baixa | Carga só com sha256 igual ao do `metrics.json` | `test_artifact_sha256_is_checked` | Baixo |
| F9 | Dependência maliciosa no build | Alto | Baixa | Versões em `uv.lock`; Trivy fs e imagem com gate | `alimenta/uv.lock`; jobs `trivy-fs` e `imagem` | Médio. Trivy acha CVE conhecido, não pacote malicioso novo |

## R · Repudiation

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F4 | Doador ou ONG nega a retirada ou o recebimento | Médio | Média | Cada confirmação é uma linha em `confirmations` com conta e hora, única por match e tipo | `test_fluxo.py::test_purge_removes_only_test_data` (2 linhas em `confirmations` por entrega) | Baixo |
| F2 | Operador nega ter aprovado uma ONG | Médio | Baixa | `audit_log` com autor, ação, alvo e hora; `ngos.approved_by` e `approved_at` | `test_cadastro.py::test_approval_flow_and_audit` | Médio. O `audit_log` mora no mesmo banco. Quem controla o banco pode apagar a linha |
| F2 | Doador nega ter aceito o termo de doação | Médio | Baixa | `consents` com versão e data, só INSERT | `test_cadastro.py::test_consent_versions_required` | Baixo |
| F3 | ONG nega ter recebido a oferta | Baixo | Média | `lot_offers` com `offered_at`, `respond_by`, `responded_at`; `notifications` com canal e hora | `test_fluxo.py::test_notification_records_channel_and_wa_link` | Médio. O link de WhatsApp é tocado por uma pessoa e o sistema não sabe se a mensagem saiu |
| F6 | Alguém some com uma entrega do livro | Médio | Baixa | Apagar quebra a corrente; o conferidor aponta a linha | `test_chain_verifies_and_tampering_fails` | Médio. Tirar o último evento só aparece para quem guardou a cabeça antes |

## I · Information disclosure

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F2, F3 | Endereço de doador ou ONG vaza (A3) | Alto | Média | Rotas públicas sem nome, endereço nem coordenada; endereço só para dono, ONG com oferta do lote e operador; aviso só com bairro | `test_publico.py::test_no_public_response_carries_name_or_exact_coordinate`; `test_fluxo.py::test_others_cannot_touch` | Médio. A ONG que aceita vê o endereço de retirada. É necessário para coletar |
| F1 | Sessão roubada no navegador (A5) | Alto | Baixa | JWT só em `st.session_state`, no servidor do painel; cookie do Streamlit não carrega o JWT; HTTPS do Render | `test_painel.py::test_jwt_never_rendered_on_page` | Médio. Quem acessa o servidor do painel acessa as sessões abertas |
| F1 | E-mail de quem tenta entrar vaza por mensagem de erro | Baixo | Média | `POST /auth/code` devolve a mesma resposta para e-mail com e sem conta | `test_cadastro.py::test_auth_code_same_answer_and_no_audit_leak` | Baixo |
| F2 | Retrato da BrasilAPI guarda mais do que o necessário | Médio | Média | `cnpj_check` guarda situação, natureza jurídica, data e fonte. Não guarda o quadro de sócios | `test_cadastro.py::test_ngo_cnpj_snapshot_has_no_partners` | Baixo |
| F5 | Dado passa por servidor fora do Brasil | Médio | Alta | Banco em sa-east-1; poucas consultas por requisição; declarado em [LIMITES.md](LIMITES.md) | `render.yaml` (`region: virginia`) | Médio. Transferência internacional (LGPD, art. 33). Sem região sul-americana no Render |
| F5 | `DATABASE_URL` vaza em log, commit ou resposta | Alto | Média | Segredo só em variável de ambiente; `.env` ignorado; `.env.example` sem valor | `.gitignore`; `alimenta/.env.example` | Médio. A API ainda usa o papel padrão do banco |
| F6, F7 | Livro revela quem doou, quem recebeu ou onde | Médio | Baixa | Evento v1 da família `field`: sem pessoa, endereço, estabelecimento nem localização | [CONTRATO.md](../transparencia/CONTRATO.md); `test_event_shape_and_hash_exact` | Baixo. Data e kg de uma entrega única, numa cidade com poucas ONGs, podem indicar quem foi. O livro real usa `quantity: "1"`, sem kg |
| F9 | Segredo do CI vaza por Action comprometida | Alto | Média | `permissions: contents: read`; Actions por SHA; jobs de PR sem segredo de deploy | `alimenta.yml` | Baixo |
| F9 | Imagem leva `.env`, venv ou banco local | Médio | Baixa | `.dockerignore` em lista branca | `.dockerignore`; `trivy image` | Baixo |

## D · Denial of service

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Alguém pede códigos sem parar | Médio | Média | Limite de envio do próprio Supabase Auth; SMTP padrão já limita a cerca de 2 por hora | [Rate limits](https://supabase.com/docs/guides/auth/rate-limits), acesso em 14/10/2026 | Alto enquanto não houver SMTP próprio: o mesmo limite trava o login legítimo |
| F3 | ONG aceita lotes e não retira (A4) | Médio | Média | Capacidade do dia limita o aceite; operador vê lotes parados e suspende a ONG | `test_fluxo.py::test_capacity_checked_on_accept` | Médio. Não há prazo automático depois do aceite. O lote pode vencer na mão da ONG e vira `expired` |
| F3 | Doador cria muitos lotes falsos | Médio | Baixa | Conta com CNPJ; operador suspende; cadastro fechado | `test_cadastro.py::test_suspended_donor_cannot_publish` | Médio. Sem limite de taxa por conta |
| F8 | Render dorme e o escalonamento atrasa | Médio | Alta | Checagem a cada leitura; varredura a cada 30 min, das 7h às 22h | `.github/workflows/alimenta-varredura.yml`, `test_seed_padrao.py::test_sweep_workflow_uses_only_ops_token` | Médio. De madrugada, oferta vencida só escala quando alguém abre o sistema |
| F5 | Supabase free pausa após 1 semana parado | Alto | Baixa | Sistema em uso diário; varredura agendada mantém atividade | [Supabase, preços](https://supabase.com/pricing), acesso em 14/10/2026 | Médio. Sem backup automático no free |
| F2 | BrasilAPI fora do ar trava o cadastro | Baixo | Média | Cache do CEP; sem resposta do CNPJ, o cadastro vai para revisão manual | `test_cadastro.py::test_brasilapi_down_goes_to_manual_review`, `test_cadastro.py::test_brasilapi_timeout_is_honest` | Baixo |

## E · Elevation of privilege

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F2 | ONG `pending` age como aprovada (A1) | Alto | Média | Ranking e ofertas filtram `approval_status = approved`; rotas de ONG conferem o estado | `test_fluxo.py::test_pending_ngo_never_gets_offer_and_test_never_mixes_with_real` | Baixo |
| F1 | Doador chama rota de ONG ou de operador | Alto | Média | Papel conferido em cada rota; negar por padrão; 403 | `test_auth.py::test_wrong_role_is_403` | Baixo |
| F3 | ONG aceita oferta feita a outra ONG | Alto | Média | `POST /offers/{id}/accept` confere que a oferta é da ONG da conta | `test_fluxo.py::test_others_cannot_touch` | Baixo |
| F8 | Token de automação usado para escrever como usuário | Alto | Baixa | `ALIMENTA_OPS_TOKEN` só vale em `POST /ops/sweep`; o painel não tem o token | `test_auth.py::test_ops_token_only_on_sweep` | Baixo |
| F7 | Publicação no livro real ligada sem autorização (A6) | Alto | Baixa | Flag `ALIMENTA_PUBLISH_REAL_LEDGER=false`; token do GitHub só com o regente; `source: "alimenta"` precisa entrar em `ingest.ts` por PR | `test_livro.py::test_flag_off_makes_no_network_call` | Baixo. Quem tem acesso às variáveis do Render liga a flag |
| F5 | API com papel `postgres` pode tudo no banco | Alto | Baixa | Nenhum SQL dinâmico; SQLAlchemy com parâmetros; RLS ligado sem política para a Data API | `alimenta/db/session.py`; Bandit | Médio. Papel próprio com permissão mínima ainda não criado |
| F10 | `.joblib` malicioso executa código ao carregar | Alto | Baixa | Carga só depois de conferir o sha256 | `test_artifact_sha256_is_checked` | Baixo |
| F9 | Processo do container vira root | Alto | Baixa | Imagem com usuário não root | `alimenta/Dockerfile`; `trivy config` | Baixo |

## Incidente de cadeia do Trivy (19/03/2026)

Em 19/03/2026, alguém com credenciais roubadas publicou uma release maliciosa do Trivy (v0.69.4). Também repontou 76 de 77 tags do `aquasecurity/trivy-action` e as 7 tags do `aquasecurity/setup-trivy` para código que roubava credenciais. Em 22/03/2026 saíram imagens maliciosas v0.69.5 e v0.69.6 no Docker Hub. Fonte: [GHSA-69fq-xp46-6x23](https://github.com/aquasecurity/trivy/security/advisories/GHSA-69fq-xp46-6x23), acesso em 14/10/2026.

A ferramenta de segurança também é ativo. Um `uses: aquasecurity/trivy-action@v0.x` rodaria o código que a tag apontasse naquele dia, com acesso aos segredos do job.

Mitigação no workflow `alimenta.yml`:

- O Trivy é baixado como binário da versão fixa v0.76.0.
- O checksum SHA-256 do arquivo é conferido antes de rodar. Se não bate, o job falha.
- Nenhuma Action do Trivy é usada.
- As outras Actions (checkout, setup-uv, upload-artifact) estão fixadas por SHA de commit.
- O workflow tem `permissions: contents: read` e os jobs de scan não recebem segredo de deploy.

Evidência: `alimenta/seguranca/instalar-trivy.sh` e os passos `uses:` de `.github/workflows/alimenta.yml`.

## Achados aceitos

| Ferramenta | Identificador | Onde | Motivo | Data |
|---|---|---|---|---|
| Bandit | B301 (pickle) | `alimenta/model/predict.py`, `joblib.load` com `# nosec B301` | O artefato só carrega depois de conferir o sha256 contra o `metrics.json` versionado. Teste `test_artifact_sha256_is_checked` | 14/10/2026 |

Não há `.trivyignore`. O gate do Trivy reprova HIGH e CRITICAL com correção disponível. Achado sem correção publicada aparece no relatório e não reprova (`--ignore-unfixed`). Isso não quer dizer zero vulnerabilidade.

## LGPD

A Rede Alimenta trata dado pessoal de contato de organizações. Nunca trata dado de beneficiário final.

| Dado | Por quê | Quem vê | Base legal |
|---|---|---|---|
| E-mail da conta | Login por código | Dono e operador | Execução de contrato a pedido do titular (art. 7º, V) |
| Nome e telefone de contato | Combinar a retirada | Dono, ONG com oferta do lote, operador | Art. 7º, V |
| CNPJ, razão social, endereço da organização | Verificar a organização e calcular distância e rota | Dono, ONG com oferta do lote (só endereço de retirada), operador | Art. 7º, V |
| Aceites (`consents`) | Provar o aceite do termo e do aviso | Operador | Art. 7º, V |

Fonte: [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), acesso em 14/10/2026.

Regras:

- **D012.** Sem controlador legal definido, nenhum cadastro real é aceito ([DECISOES.md](../DECISOES.md)). Por isso `ALIMENTA_SIGNUP_OPEN=false` em produção. O sistema fica pronto e fechado. Operador e contas de teste do time funcionam.
- Termo de doação e aviso de privacidade estão marcados "rascunho para revisão" até o Lucas aprovar. O aviso precisa nomear o controlador e o contato do encarregado.
- Doador só com CNPJ. CPF de produtor rural fica na fila.
- Nenhum dado de beneficiário final, em tabela, aviso, livro ou log.
- Dado pessoal real nunca vai para Git, CI, seed ou print ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6). Teste, seed e compose usam só dado sintético rotulado.
- Contas de teste são marcadas `is_test=true`, ficam fora de KPI e livro, e o script de ensaio as apaga depois.
- **Transferência internacional.** O banco fica em sa-east-1, mas a API roda no Render em Virginia. Todo dado passa por servidor nos Estados Unidos (LGPD, art. 33). Está declarado em [LIMITES.md](LIMITES.md).
- Falta antes de abrir o cadastro: controlador nomeado, inventário de dados, prazo de retenção, canal do titular e plano de incidente ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6).

## Riscos residuais mais altos

1. CNPJ ativo não prova que a ONG opera. A aprovação depende do operador conferir por fora.
2. Doador e ONG combinados podem confirmar uma entrega que não houve.
3. SMTP padrão do Supabase: login só para o time, cerca de 2 e-mails por hora.
4. API nos Estados Unidos com dado de brasileiros.
5. Livro próprio sem assinatura: quem controla o banco reescreve a corrente. A camada assinada é o livro real, ainda desligado.
6. Papel padrão do banco em uso. Falta papel próprio com permissão mínima.
7. Sem MFA do operador.
