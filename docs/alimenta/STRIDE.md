# STRIDE da Rede Alimenta

Esta matriz cobre o sistema real da Rede Alimenta no corte atual: **quem tem comida sobrando** (pessoa, empresa ou distribuidor) registra a doação, recebe uma recomendação de distribuidor do catálogo público, escolhe, leva e declara a entrega. Não há ONG cadastrada, oferta nem rota: os destinos são os 30 distribuidores públicos de `src/data/alimenta/distribuidores.json`, cada um com fonte. Não cobre o resto do PontaPé.

Base: [ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §2 (Supabase) e §6 (privacidade e segurança), riscos do [PRD.md](../PRD.md) §11, o contrato do livro em [CONTRATO.md](../transparencia/CONTRATO.md) e o [README](README.md) desta pasta.

Cada evidência aponta para um teste em `alimenta/tests/` ou para um arquivo do repositório. Os testes rodam no workflow "Rede Alimenta" a cada push.

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
| F1 | Login | Site → API → Supabase Auth: código de 6 dígitos por e-mail, JWT validado pelo JWKS do projeto |
| F2 | Cadastro mínimo | Tipo, cidade, UF, CNPJ opcional e aceites. Sem nome, CPF, endereço nem telefone |
| F3 | Doação | Categoria, conservação, kg, validade, cidade. Risco calculado pelo modelo |
| F4 | Recomendação com AI | Candidatos por regra, leitura das páginas públicas do catálogo, 9Router, validação dura da resposta |
| F5 | Banco | API → Postgres Supabase sa-east-1 pelo pooler, a partir do Render em Virginia |
| F6 | Livro público | `ledger_outbox` → `ledger-ingest.yml` → livro de pontape.org, uma ação por vez |
| F7 | Automação | GitHub Actions agendado chama `POST /ops/sweep` com `ALIMENTA_OPS_TOKEN` |
| F8 | Pipeline e imagem | `.github/workflows/alimenta.yml`: pytest, retreino conferido, Bandit, Trivy (fs, config, imagem), deploy hook |
| F9 | Artefato do modelo | `discard_risk-v1.joblib` e `metrics.json` |
| F10 | Painel público | `pontape.org/alimenta/painel`, `GET /kpis` e `GET /model`: só números agregados |

Escala. Impacto: baixo (atrapalha a operação), médio (decisão errada ou serviço fora do ar), alto (dado pessoal vazado, comida imprópria entregue, fato falso no livro público). Probabilidade: baixa, média ou alta, para um sistema aberto na internet.

## Ameaças principais do sistema real

Seis ameaças que a banca deve ouvir primeiro. As tabelas por letra, mais abaixo, trazem o detalhe.

| # | Ameaça | Letra | Mitigação | Evidência |
|---|---|---|---|---|
| A1 | Doador registra comida vencida ou imprópria | T | Validade no passado volta 422. Termo de doação aceito no cadastro. Operador suspende o doador. O distribuidor confere na entrega | `test_doacao.py::test_registration_refusals_and_limits`; `test_cadastro.py::test_consents_endpoint_and_legal_texts`; `test_doacao.py::test_suspended_donor_cannot_register` |
| A2 | Vazamento de dado de quem doa | I | Cadastro sem nome, CPF, endereço nem telefone; campo extra volta 422. Nenhuma rota pública traz e-mail, cidade de quem doa, id ou código da doação. O livro não tem pessoa nem local | `test_cadastro.py::test_extra_personal_fields_are_refused`; `test_publico.py::test_no_public_response_carries_personal_data` |
| A3 | A AI inventa um destino ou uma fonte | T | Só candidatos do catálogo por regra. A AI lê apenas URLs do próprio catálogo. Resposta com id ou URL fora das fontes daquele distribuidor é descartada inteira e vale a regra | `test_recomendacao.py::test_ai_answer_outside_catalog_falls_back_to_rule`; `test_recomendacao.py::test_reads_only_catalog_urls_and_never_other_domain` |
| A4 | Doação falsa ou de teste vira fato no livro e infla o painel | T, R | Conta de teste (`is_test`) nunca entra no livro nem no KPI. Uma ação por vez por doação, `eventId` estável. Limite de 5 abertas e 10 por dia por conta | `test_doacao.py::test_test_account_never_enters_outbox_nor_kpis`; `test_livro_fila.py::test_one_head_per_donation_then_confirm_then_next` |
| A5 | Sessão roubada ou token forjado | S, I | Validação de `iss`, `aud`, `exp`, `sub` e assinatura pela chave pública do Supabase. HS256 com chave pública recusado. Emissor local recusado em produção | `test_auth.py::test_bad_claims_are_rejected`; `test_auth.py::test_hs256_with_public_key_is_rejected`; `test_auth.py::test_local_issuer_is_refused_in_production` |
| A6 | Ataque à cadeia do CI (caso Trivy, março de 2026) | T, E | Trivy por binário de versão fixa com checksum; Actions fixadas por SHA; `permissions: contents: read` | `alimenta/seguranca/instalar-trivy.sh`; `uses:` em `.github/workflows/alimenta.yml` |

## S · Spoofing

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Alguém se passa por outra pessoa no login (A5) | Alto | Baixa | Código de 6 dígitos, de uso único, por e-mail. JWT validado pela chave pública | `test_auth.py::test_swapped_signature_and_unknown_kid` | Baixo. Quem controla o e-mail controla a conta |
| F1 | Alguém vira operador | Alto | Baixa | Operador só pela variável `ALIMENTA_OPERATOR_EMAILS`, nunca por cadastro | `test_auth.py::test_operator_only_from_env`; `test_cadastro.py::test_one_account_one_role_and_operator_cannot_signup` | Baixo. Falta MFA do operador |
| F2 | Empresa usa CNPJ inválido ou baixado | Médio | Média | Dígito verificador e situação ATIVA na BrasilAPI. Retrato privado sem sócios | `test_cadastro.py::test_cnpj_check_digits_numeric_and_alphanumeric`; `test_cadastro.py::test_company_with_cnpj_keeps_private_snapshot_without_partners` | Médio. Não prova que a pessoa trabalha na empresa |
| F2 | Distribuidor doa para si mesmo | Baixo | Baixa | A recomendação nunca sugere o próprio registro | `test_doacao.py::test_distributor_cannot_donate_to_itself` | Baixo |
| F5 | Serviço falso se passa pelo banco | Alto | Baixa | Pooler oficial do Supabase com TLS; URL só em variável de ambiente | `DATABASE_URL` no Render, nunca no git | Baixo |
| F7 | Alguém chama a varredura sem ser a automação | Baixo | Média | `ALIMENTA_OPS_TOKEN` exigido; sem a variável, 503 | `test_auth.py::test_ops_token_only_on_sweep`; `test_auth.py::test_sweep_without_env_is_503` | Baixo. A varredura repetida não muda o resultado |
| F8 | Action ou binário falso no CI (A6) | Alto | Média | Trivy por binário fixo v0.76.0 com checksum; Actions por SHA | Jobs `trivy-fs` e `imagem` em `alimenta.yml` | Baixo |

## T · Tampering

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F3 | Comida vencida (A1) | Alto | Média | 422 para validade no passado; termo; suspensão | `test_doacao.py::test_registration_refusals_and_limits` | Médio. Validade digitada errada não se detecta. A Lei 14.016/2020, art. 3º, limita a responsabilidade do doador a dolo |
| F3 | Destino fora do catálogo ou passos fora de ordem | Médio | Média | Id fora do catálogo volta 422; entrega antes do destino volta 409 | `test_doacao.py::test_destination_must_be_in_catalog_and_change_is_recorded`; `test_doacao.py::test_order_rules_are_409` | Baixo |
| F4 | A AI responde fora das fontes (A3) | Médio | Média | Validação dura; qualquer falha vale a regra (`mode: rule`) | `test_recomendacao.py::test_ai_ranking_is_validated_and_cites_source`; `test_recomendacao.py::test_ai_answer_outside_catalog_falls_back_to_rule` | Baixo |
| F4 | Página de distribuidor redireciona para site malicioso | Médio | Baixa | Redirecionamento só no mesmo domínio, até 3; timeout 6 s; até 400 kB | `test_recomendacao.py::test_fetch_limits_exact` | Baixo |
| F6 | Entrega falsa para inflar kg (A4) | Médio | Média | Entrega só depois do destino; limites por conta; operador suspende | `test_doacao.py::test_order_rules_are_409`; `test_doacao.py::test_registration_refusals_and_limits` | Médio. A entrega é declarada por quem doou, e o painel diz isso |
| F9 | Artefato do modelo trocado | Alto | Baixa | Carga só com sha256 igual ao do `metrics.json`; o CI retreina e confere | `test_model_data.py::test_artifact_sha256_is_checked`; passo "Retreino confere com metrics.json versionado" | Baixo |
| F8 | Dependência maliciosa no build | Alto | Baixa | Versões em `uv.lock` (`uv sync --locked`); Trivy fs e imagem com gate | `alimenta/uv.lock`; jobs `trivy-fs` e `imagem` | Médio. Trivy acha CVE conhecido, não pacote malicioso novo |

## R · Repudiation

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F3 | Doador nega ter registrado ou trocado o destino | Médio | Baixa | Cada troca de destino fica registrada; auditoria com autor, ação e hora | `test_doacao.py::test_destination_must_be_in_catalog_and_change_is_recorded` | Médio. A auditoria mora no mesmo banco |
| F2 | Doador nega ter aceito o termo | Médio | Baixa | `consents` com versão e data; sem os aceites, o cadastro volta 422 | `test_cadastro.py::test_signup_refusals` | Baixo |
| F6 | Alguém some com um passo do livro | Médio | Baixa | Livro de pontape.org com corrente de hash conferida no CI (`npm run ledger:verify`); envio uma ação por vez, confirmado antes do próximo | `test_livro_fila.py::test_one_head_per_donation_then_confirm_then_next`; `test_livro_fila.py::test_resend_after_window_and_failure` | Baixo |

## I · Information disclosure

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F2, F10 | Dado de quem doa vaza em rota pública ou no painel (A2) | Alto | Média | Painel e KPIs só agregados; agrupamento pela cidade do **distribuidor** (pública), nunca de quem doa | `test_publico.py::test_no_public_response_carries_personal_data`; `test_publico.py::test_production_starts_with_honest_zero` | Baixo |
| F2 | Cadastro guarda mais do que precisa | Médio | Média | Pessoa: só e-mail, tipo e cidade. Campo extra 422. Retrato do CNPJ sem quadro de sócios | `test_cadastro.py::test_person_signup_is_email_kind_city_only`; `test_cadastro.py::test_extra_personal_fields_are_refused` | Baixo |
| F4 | Dado pessoal vai para a AI | Médio | Baixa | Para a AI só vai a doação sem pessoa (categoria, kg, conservação, horas, risco, cidade, tipo) e textos públicos | `test_recomendacao.py::test_ai_ranking_is_validated_and_cites_source` | Baixo |
| F1 | E-mail de quem tenta entrar vaza por mensagem de erro | Baixo | Média | `POST /auth/code` responde igual com e sem conta; a auditoria não guarda o e-mail | `test_cadastro.py::test_auth_code_same_answer_and_no_audit_leak` | Baixo |
| F3 | Operador vê dado demais | Médio | Baixa | Visão do operador só com contagens, privada | `test_publico.py::test_operator_overview_is_not_public` | Baixo |
| F5 | Dado passa por servidor fora do Brasil | Médio | Alta | Banco em sa-east-1; declarado em [LIMITES.md](LIMITES.md) | `render.yaml` (`region: virginia`) | Médio. Transferência internacional (LGPD, art. 33). Sem região sul-americana no Render |
| F5 | `DATABASE_URL` vaza em log, commit ou resposta | Alto | Média | Segredo só em variável de ambiente; `.env` ignorado; `.env.example` sem valor | `.gitignore`; `alimenta/.env.example` | Médio. A API ainda usa o papel padrão do banco |
| F6 | Livro revela quem doou | Médio | Baixa | Evento sem pessoa, e-mail nem local; código público aleatório `AL…` | [CONTRATO.md](../transparencia/CONTRATO.md); `test_livro_fila.py::test_envelope_is_accepted_by_ts_schema_shape` | Baixo |
| F8 | Segredo do CI vaza por Action comprometida | Alto | Média | `permissions: contents: read`; Actions por SHA; jobs de scan sem segredo | `alimenta.yml` | Baixo |
| F8 | Imagem leva `.env`, venv ou banco local | Médio | Baixa | `.dockerignore` em lista branca | `.dockerignore`; `trivy image` | Baixo |

## D · Denial of service

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Alguém pede códigos sem parar | Médio | Média | Limite de envio do próprio Supabase Auth | [Rate limits](https://supabase.com/docs/guides/auth/rate-limits), acesso em 14/10/2026 | Alto enquanto não houver SMTP próprio: o mesmo limite trava o login legítimo |
| F3 | Doador cria muitas doações falsas | Médio | Baixa | 5 abertas e 10 por dia por conta; suspensão | `test_doacao.py::test_registration_refusals_and_limits` | Baixo |
| F4 | AI fora do ar ou lenta | Médio | Média | Modelo reserva; sem AI, vale a regra, sem chamada | `test_recomendacao.py::test_spare_model_when_main_fails`; `test_recomendacao.py::test_no_ai_config_means_rule_without_calls` | Baixo |
| F2 | BrasilAPI fora do ar trava o cadastro | Baixo | Média | Fora do ar não bloqueia; timeout honesto | `test_cadastro.py::test_brasilapi_down_does_not_block`; `test_cadastro.py::test_brasilapi_timeout_is_honest` | Baixo |
| F7 | Render dorme | Médio | Alta | Varredura agendada; o painel avisa e pede para recarregar | `.github/workflows/alimenta-varredura.yml` | Médio |
| F5 | Supabase free pausa após 1 semana parado | Alto | Baixa | A varredura agendada mantém atividade | [Supabase, preços](https://supabase.com/pricing), acesso em 14/10/2026 | Médio. Sem backup automático no free |

## E · Elevation of privilege

| Ativo | Ameaça | Impacto | Prob. | Mitigação | Evidência | Risco residual |
|---|---|---|---|---|---|---|
| F1 | Doador chama rota de operador | Alto | Média | Papel conferido em cada rota; negar por padrão; 403 | `test_auth.py::test_wrong_role_is_403` | Baixo |
| F3 | Doador mexe na doação de outro | Alto | Média | Toda rota de doação confere o dono | `test_doacao.py::test_any_city_registers_and_other_accounts_cannot_touch` | Baixo |
| F7 | Token de automação usado como usuário | Alto | Baixa | `ALIMENTA_OPS_TOKEN` só vale em `POST /ops/sweep` | `test_auth.py::test_ops_token_only_on_sweep` | Baixo |
| F2 | Operador apaga a conta de alguém pela API | Alto | Baixa | Só o próprio titular apaga (`DELETE /me`) | `test_apagar_conta.py::test_operator_cannot_delete_by_api` | Baixo |
| F5 | API com papel `postgres` pode tudo no banco | Alto | Baixa | Nenhum SQL dinâmico; SQLAlchemy com parâmetros; RLS ligado sem política para a Data API | `alimenta/db/session.py`; Bandit | Médio. Papel próprio com permissão mínima ainda não criado |
| F9 | `.joblib` malicioso executa código ao carregar | Alto | Baixa | Carga só depois de conferir o sha256 | `test_model_data.py::test_artifact_sha256_is_checked` | Baixo |
| F8 | Processo do container vira root | Alto | Baixa | Imagem com usuário não root | `alimenta/Dockerfile`; `trivy config` | Baixo |

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

## Vulnerabilidades corrigidas e achados aceitos

Comparação por identificador entre o primeiro scan e o atual, em `alimenta/seguranca/resumo.json` (também no painel): 11 achados do primeiro scan sumiram, entre eles o `DS-0013` do Trivy no Dockerfile e seis CVEs do `pip` na imagem. Nenhum achado novo.

| Ferramenta | Identificador | Onde | Motivo |
|---|---|---|---|
| Bandit | B301 (pickle) | `alimenta/model/predict.py` | O artefato só carrega depois de conferir o sha256 contra o `metrics.json` versionado |
| Bandit | B311 (random) | `alimenta/data/generate.py` | `random` com seed fixa só gera dado simulado reproduzível; não é segredo nem token |
| Trivy | CVEs do sistema sem correção | imagem `python:3.12-slim` | Sem versão corrigida publicada; o gate usa `--ignore-unfixed` e a imagem roda `apt-get upgrade` a cada build |

Não há `.trivyignore`. O gate do Trivy reprova HIGH e CRITICAL com correção disponível. Achado sem correção publicada aparece no relatório e não reprova. Isso não quer dizer zero vulnerabilidade.

## LGPD

A Rede Alimenta trata o mínimo de dado de quem doa. Nunca trata dado de quem recebe a comida.

| Dado | Por quê | Quem vê | Base legal |
|---|---|---|---|
| E-mail da conta | Login por código | Dono e operador | Execução de contrato a pedido do titular (art. 7º, V) |
| Tipo, cidade e UF | Achar distribuidores na cidade | Dono; o operador vê só contagens | Art. 7º, V |
| CNPJ (opcional, empresa e distribuidor) | Conferir a organização | Dono e operador | Art. 7º, V |
| Aceites (`consents`) | Provar o aceite do termo e do aviso | Operador | Art. 7º, V |

Fonte: [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm), acesso em 14/10/2026.

Regras:

- **D012.** Cadastro de fora fechado (`ALIMENTA_SIGNUP_OPEN=false`) até existir SMTP próprio e controlador nomeado ([DECISOES.md](../DECISOES.md)). A lista de onde doar funciona sem conta.
- O titular apaga a conta sozinho (`DELETE /me`); o livro não muda porque nunca teve dado pessoal (`test_apagar_conta.py`).
- Nenhum dado de quem recebe a comida, em tabela, livro ou log.
- Dado pessoal real nunca vai para Git, CI, seed ou print ([ARQUITETURA.md](../arquitetura/ARQUITETURA.md) §6). Teste e compose usam só dado simulado rotulado.
- Contas de teste são marcadas `is_test=true`, ficam fora de KPI e livro, e o script de ensaio as apaga depois (`test_ensaio.py::test_full_ensaio_passes_and_cleans`).
- **Transferência internacional.** O banco fica em sa-east-1, mas a API roda no Render em Virginia (LGPD, art. 33). Declarado em [LIMITES.md](LIMITES.md).
- Falta antes de abrir o cadastro: controlador nomeado, inventário de dados, prazo de retenção, canal do titular e plano de incidente.

## Riscos residuais mais altos

1. A entrega é declarada por quem doou; não há confirmação do distribuidor.
2. SMTP padrão do Supabase: login só para o time, poucos e-mails por hora.
3. API nos Estados Unidos com dado de brasileiros.
4. Papel padrão do banco em uso. Falta papel próprio com permissão mínima.
5. Sem MFA do operador.
6. O modelo foi treinado com dado simulado; com doação real, precisa ser retreinado e medido de novo.
