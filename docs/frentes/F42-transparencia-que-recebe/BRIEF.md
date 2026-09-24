# F42 · Transparência que prova e recebe

**Dono:** `lastro` (Grok 4.7, sub-agente do Regente no Maestri) · **Worktree:** `~/Projects/VidaNova/.worktrees/lastro` · **Branch:** uma por etapa, `lastro/f42-e1`, `lastro/f42-e2`, `lastro/f42-e3` · **Revisão e merge:** Regente

## Por quê

Pedido do Lucas em 24/09/2026 ([fonte](../../fontes/2026-09-24-feedback-divulgar-hoje.md), segunda parte):

> A parte da transparência ainda não está bem explicada. A gente tem que explicar e provar melhor, e ter um botão melhor do que esse preto pra provar a nossa criptografia aberta com blockchain. A gente tem que criar esse sistema pra que de fato ele funcione, e aí conectar com algum sistema de pagamentos, pode ser a Stripe, ou outra alternativa. Tem que facilitar o pagamento e oferecer transparência absoluta.

Ele sabe que é grande, gasta token e demora. Por isso é uma frente só, com etapas que entram uma por vez.

## O que já existe (não refazer)

- **Livro público** (F08): eventos imutáveis em JSON canônico (JCS), SHA-256 encadeado, lista fechada de campos, verificador que roda na CLI (`npm run ledger:verify`) e no navegador. Código em `src/lib/ledger/` e `src/lib/ledger-view/`.
- **Assinatura e âncora** (F25): checkpoints assinados com Ed25519, chave pública publicada, chave privada fora do repo com o Regente. A âncora OpenTimestamps da F25 **sai** (D038): sem Bitcoin.
- **Página** `/transparencia` em duas camadas (D029): leiga primeiro, "Parte técnica" em `/transparencia/tecnico`. Botão "Conferir" preto: é o que o Lucas quer trocar.
- **ledger-bot**: registra no livro cada PR integrada e cada decisão, e a publicação é automática (D021).
- **Pesquisa** da F03: [DOACOES-E-TRANSPARENCIA.md](../../pesquisa/DOACOES-E-TRANSPARENCIA.md) (Asaas como primeira opção pra Pix e cartão de associação; Stripe e PayPal pro exterior, PayPal exige CNPJ) e [ESTRUTURA-JURIDICA.md](../../pesquisa/ESTRUTURA-JURIDICA.md).
- **Arquitetura**: [ARQUITETURA §4](../../arquitetura/ARQUITETURA.md).

Leia tudo isso antes de escrever uma linha. Depois leia `docs/frentes/F08-livro-publico/DIARIO.md` e `docs/frentes/F25-assinatura-ancora/DIARIO.md`.

## Regras que não mudam

- **Toda ação aparece; quem é a pessoa, não** (D010). Doação registra valor, tarifa, líquido, id da cobrança e hora. Nunca nome, CPF, e-mail.
- **Nenhum dado pessoal guardado** sem responsável legal (D012). O processador de pagamento guarda o que a lei dele exige; o nosso lado não copia.
- **Um livro só** (D014): a fonte continua sendo o repositório. Serviço nenhum vira "segunda verdade".
- **Dinheiro de verdade só com associação, CNPJ, conta própria e OK do Lucas** (PRD §10, pergunta 4). Esta frente entrega tudo em modo teste, com a chave de produção fora.
- **Conta em serviço (Stripe, Asaas, o que for) é o Regente quem cria**, com OK do Lucas. Você pede por `maestri ask`, com o que precisa e por quê. Enquanto não vem, trabalha com os payloads documentados e fixtures marcadas como fictícias.
- Segredo só em `.env` local e em Secret do Worker; `.env.example` documenta.
- Texto público: PT-BR, frase curta, sem jargão, sem travessão. O termo é **AI**, nunca "IA".
- **Sem Bitcoin nem criptomoeda (D038).** O carimbo de data é em registro público sem moeda: Sigstore Rekor e RFC 3161. No site, "registro público"; a palavra Bitcoin não aparece. Pode dizer "no estilo do blockchain, sem moeda nenhuma".
- Commit pequeno, mensagem em PT-BR; PR por etapa; `npm run check` verde.

## Custódia da chave (decidido 24/09, 18:19 UTC)

O escrevente roda no GitHub Actions, commita como o ledger-bot com o `GITHUB_TOKEN` e assina o checkpoint com o secret do repositório `LEDGER_SIGNING_PKCS8` (Ed25519, PKCS8 PEM). O Regente gerou a chave com `openssl genpkey` direto pro `gh secret set` e destruiu o arquivo; ela não existe em disco nem no repo. A chave pública (SPKI, base64) fica publicada no repo e no `trust.json`; a rotação entra no livro e a chave antiga da F25 continua publicada. Doação fictícia nunca entra no livro real: o teste do caminho usa livro temporário no repositório.

## Etapas

### E1 · Explicar e provar (primeira PR, 1 a 2 dias)

1. **Camada leiga de `/transparencia` reescrita.** Três perguntas, três respostas curtas: "O que fica no livro?", "Como eu sei que ninguém mexeu?", "Quem garante a data?". Um desenho só: a corrente de eventos, cada elo preso no anterior, o último carimbado no registro público.
2. **"Conferir agora" novo.** Sai o botão preto. Entra um selo (estilo do site: creme, tinta, azul-anil) que, ao apertar, mostra passo a passo com marca verde: baixou o livro (N ações), recalculou N marcas e todas batem, assinatura confere com a chave pública, carimbo no registro público, com data e link de conferência. Resultado em palavra de gente; "ver detalhes" abre o técnico. Roda inteiro no navegador, sem servidor, e funciona com o JSON baixado.
3. **Cada ação com "conferir esta"**: abre o mesmo passo a passo até aquele evento.
4. **Critério:** uma pessoa leiga lê e entende em 20 segundos; o verificador acusa adulteração nos casos de teste da F08; Lighthouse acessibilidade sem regressão; celular primeiro.

### E2 · Livro que recebe evento sozinho (segunda PR, 2 dias)

Hoje um evento entra por script e commit. Pagamento exige caminho automático e seguro:

1. **Entrada**: um envelope (`source`, `eventId`, `payload`) validado contra o schema da F08; campo fora da lista é recusado. Hoje entra por `workflow_dispatch`; no E3, um Worker recebe o webhook do processador e dispara o workflow com token de escopo mínimo.
2. **Escrevente no GitHub Actions** (`.github/workflows/ledger-ingest.yml`, feito no E2): pega o envelope, acrescenta ao livro, assina o checkpoint com o secret `LEDGER_SIGNING_PKCS8`, carimba e commita na `main` como ledger-bot. O site republica sozinho (D021). Um livro só; `intake.json` guarda as chaves já gravadas, então o mesmo evento não entra duas vezes.
3. **Checkpoint e carimbo automáticos** (E2 e E2b): o checkpoint assinado vai pro Sigstore Rekor (Ed25519ph sobre o SHA-512, porque o Rekor recusa Ed25519 puro) e recebe carimbo RFC 3161 da freetsa (D038). O `trust.json` publica registro, id da entrada, data e link. O E2b acrescenta o modo **carimbar**: sem evento novo, diário e por dispatch, assina e carimba a cabeça atual, pra o selo ficar verde de verdade. A custódia da chave hoje é do Regente, fora do repo: proponha no DIARIO como migrar (chave nova do Worker + rotação registrada no livro) e espere o OK.
4. **Idempotência e ordem**: mesmo webhook duas vezes não gera dois eventos; falha no meio não perde nem duplica.
5. **Critério:** evento fictício entra por webhook de teste e aparece no site publicado em menos de 10 minutos, verificável pelo E1.

### E3 · Pagamento em modo teste (terceira PR, 2 a 3 dias)

1. **Escolha com prova.** Comparar Stripe (Checkout hospedado, cartão, Pix no Brasil; conta BR ao vivo exige CNPJ), Asaas (Pix e cartão, aceita associação, extrato por API; recomendado pela F03) e Mercado Pago. Critério: Pix e cartão, webhook confiável, extrato por API pra reconciliar, tarifa pública, aceita associação, custo por doação de R$ 20. Tabela com link e data de acesso no DIARIO; proposta de decisão pro Regente.
2. **Fluxo em modo teste** com o escolhido: página `/doar` atrás de flag (fechada no ar), checkout hospedado, webhook → evento `finance` (bruto, tarifa, líquido, id, hora) → E2 → site. Estorno e transferência também viram evento.
3. **Painel de dinheiro** só a partir do livro: recebido, tarifas, saldo, gasto, e a hora da última atualização.
4. **Reconciliação**: job diário compara o extrato da API com o livro; divergência vira evento, não sumiço.
5. **Comprovante público com tarja** (issue #10): o que aparece e o que se cobre.
6. **Critério:** doação de teste de ponta a ponta, do checkout ao "conferir agora", sem nome de ninguém no livro.

### E4 · Ligar de verdade (fora desta frente)

Só depois de associação, CNPJ, conta e OK do Lucas. Deixe no DIARIO o checklist do que falta pra virar a chave.

## Memória e report

- A cada marco, `docs/frentes/F42-transparencia-que-recebe/DIARIO.md`: o que fez, o que achou, decisões propostas, onde parou, próximo passo. Depois de compactar, releia BRIEF e DIARIO.
- Report ao Regente por `maestri ask "Claude Code #2" "<resumo + link da PR>"` (é assim que ele aparece no `maestri list`). Só o Regente fala com o Lucas.
- Nunca commitar, trocar branch, fazer stash ou reset em `~/Projects/VidaNova`: aquele checkout é do Regente. Trabalhe só no seu worktree.

## Pronto quando

E1, E2 e E3 integradas, cada uma com PR revisada, DIARIO mostrando o estado final e o checklist do E4 escrito.
