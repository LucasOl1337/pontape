# F42 · Diário do Lastro

## 24/09/2026 · Leitura e plano do E1

- Fast-forward da `lastro/f42-e1` até `a1d3183` (o brief ainda não estava no worktree). Checkout do Regente não foi tocado.
- Lidos AGENTS, QUADRO, BRIEF da F42, BRIEF e DIARIO da F08, BRIEF da F25 (não há DIARIO nessa pasta), DOACOES-E-TRANSPARENCIA, ARQUITETURA §4 e `src/lib/ledger`.
- `npm install` e `npm run check` na base, antes de mexer: 152 testes, livro com 97 ações válido. Aviso de engine (Node 26 no lugar de 24) já existia.
- Plano de 10 linhas enviado ao Claude Code #2 pelo Maestri, e o trabalho seguiu.
- O que já está no ar: cadeia SHA-256 no navegador, botão Conferir dentro de uma caixa preta, texto da F32. `trust.json` continua `not_configured` / `not_anchored`. A prova local do checkpoint 43 (chave pública e `.ots` em `~/.config/pontape/ancoras/`, só leitura) ainda é um carimbo pendente: o arquivo só aponta calendários, sem bloco de Bitcoin, e a cabeça do livro já é a ação 97.

## 24/09/2026 · E1 na página

- A primeira camada de `/transparencia` abre com três perguntas: o que fica no livro, como saber que ninguém mexeu, quem garante a data. Um desenho só: quatro elos, o último com o selo azul do que pode ir pro Bitcoin.
- Saiu a caixa preta. Entrou o selo creme, tinta e azul-anil, "Conferir agora". No clique, no próprio aparelho: baixou o livro, recalculou as marcas, assinatura, carimbo. "Ver detalhes" abre a parte técnica. Dá para baixar o livro e conferir um arquivo salvo.
- Cada ação recente tem "Conferir esta", até aquela ação. Na parte técnica, o mesmo texto leva de volta pra cá com `?ate=`. O Conferir de lá continua refazendo a corrente na lista.
- O selo não pinta de verde o que o livro não tem. Hoje a corrente fecha e os dois últimos passos ficam "ainda não". Um arquivo adulterado quebra na ação certa e não segue para assinatura verde. Teste com carimbo fictício cobre bloco, data e link https.

## Decisões propostas

- Não publicar o checkpoint 43 como se fosse a cabeça de hoje. A assinatura é real, o carimbo ainda não tem bloco, e já existem 54 ações depois. Quando a F25 retomar, o selo lê `trust.json`: se vier chave, bloco e data, os passos ficam verdes sem reescrever a página.
- A palavra "marca" volta no resultado do selo, como o brief pede. O texto parado da página continua sem ela.

## Onde parei

E1 conferido na bancada, computador e janela estreita: três perguntas, selo, "Baixou o livro" com 100 marcas (o rebase trouxe o livro novo), "Conferir esta" até uma ação do meio, `?ate=` vindo da parte técnica, arquivo adulterado quebrando na ação nº 2 sem pintar assinatura. O Conferir da parte técnica ainda fecha a corrente. `npm run check` verde. A página técnica ficou em 59,5 KB de 60: sobra pouca, o próximo evento do livro pode apertar. Não rodei nota numérica do Lighthouse. E2 e E3 não começaram. Nenhuma conta em serviço foi criada.

## 24/09/2026 · E1b, lista técnica sob demanda

- A parte técnica passava de 60 KB porque o HTML trazia cada ação. Agora entram só as últimas 30. "Ver as anteriores", a última página e o Conferir buscam `/livro/ledger.json` e montam o resto. O Conferir percorreu as 100, da nº 1 até a nº 100.
- O exemplo fictício continua inteiro na página. A camada leiga não foi mexida.
- O HTML também não leva o livro inteiro, só as 30 últimas com um lacre próprio. O livro completo entra na hora de conferir ou de pedir as anteriores.
- `TECHNICAL_LIMIT` de 96 KB saiu. A página técnica ficou em 52,1 KB de 60, com 103 ações no livro.
- Conferido na bancada: "Ver as anteriores" monta o resto, e o Conferir fecha as 103, da nº 1 até a nº 103, batendo com a marca publicada.

## Decisões propostas

- Sem Bitcoin e sem criptomoeda (pedido do Lucas, 24/09/2026). OpenTimestamps sai. O carimbo do E2 é Sigstore Rekor mais RFC 3161, com snapshot no Internet Archive só se não atrasar. A camada leiga fica com o Regente.

## 24/09/2026 · E2 começa

- Desenho aprovado. Ponto 4 mudou no mesmo dia: o escrevente roda no GitHub Actions e assina com o secret `LEDGER_SIGNING_PKCS8`, criado pelo Regente às 18:19 UTC. A privada não está em disco nem no repo.
- Primeiro corte: o recibo aceita só envelope fechado e a mesma chave de fonte não entra duas vezes.

## 24/09/2026 · E2, fila e carimbo

- Chave pública nova `e332cae4d252fca11d48f183027c134e565b908a099e94a1a112a5ed41ecb0b6`, em `signing-public.pem` e no `trust.json`. A antiga `ab8b5cfb6bf0f218e2514fe47fa9a014827376ec9f0c556bcb1df3a3c3d81dc6` continua publicada. A troca entrou no livro como ação 107 (`signing_key_rotated`).
- O `trust.json` desta entrega continua `not_configured` / `not_anchored`. O selo só fica verde quando um carimbo de verdade gravar registro, id, data e link.
- Fila em memória mais `intake.json` com as chaves já gravadas. O commit do escrevente é o que torna o evento durável. A mesma fonte não entra duas vezes. Doação fictícia não vai pro livro real: o teste usa livro temporário.
- Workflow `.github/workflows/ledger-ingest.yml`, identidade do ledger-bot, lê o secret e commita na main. Sem dry-run.
- O Rekor recusa Ed25519 puro. A entrada `hashedrekord` exige Ed25519ph e o SHA-512 do checkpoint. O carimbo RFC 3161 segue em SHA-256, na `https://freetsa.org/tsr`. Conferido com chave descartável: o registro público devolveu 201. A chave de produção não foi lida.
- Internet Archive fica de fora desta entrega.

## Decisões propostas

- Atualizar o BRIEF e o Quadro: a chave não nasce no Worker. Nasce no secret do repositório, e o escrevente é o GitHub Actions.

## 24/09/2026 · E2 integrada, E2b

- A PR #108 entrou. O Regente juntou a main na branch: o livro já tinha 110 ações, e a rotação foi escrita de novo como ação 111, com `ledger:append`. Este worktree voltou pra `origin/main` antes do E2b. O livro não é reescrito.
- Sem doação fictícia não havia o que disparar, e o selo ficava cinza. O modo carimbar (`npm run ledger:stamp -- --apply`, ou o workflow sem envelope) assina o checkpoint que já está no livro, manda pro Rekor e pra freetsa, e grava só `trust.json` e `checkpoint-signed.json`.
- O dispatch sem evento e o schedule das 12:15 em São Paulo usam esse modo. O mesmo checkpoint de novo reaproveita a entrada que o Rekor já tem (409). O livro não é tocado.
- O selo fica verde quando esse `trust.json` real entra no site. Quem dispara depois do merge é o Regente. A chave de produção não foi lida daqui.

## 24/09/2026 · E2c, carimbo junto da ação

- Depois do fetch, o livro está na ação 116 e o carimbo em 114. Cada merge novo espera o schedule do dia seguinte, e o selo não cobre a cabeça.
- O `ledger-project.yml` agora, no mesmo push, roda `ledger:stamp` quando entrou ação nova ou quando o carimbo está atrás da cabeça. Grava `trust.json` e `checkpoint-signed.json` junto do livro. Não dispara um segundo workflow: o push do token não abriria outro job, e um segundo commit deixaria a cabeça descoberta por um tempo.
- A PR #112 entrou. Se o carimbo cair, a ação entra mesmo assim e o carimbo fica pra próxima tentativa.

## 24/09/2026 · E3, escolha do pagamento

Consulta às páginas públicas em 24/09/2026. Conta de verdade continua fora: sem CNPJ, sem dinheiro real. Números abaixo são a conta da tarifa publicada em cima de R$ 20,00, não um orçamento fechado.

| | Pix em R$ 20 | Cartão à vista em R$ 20 | Webhook | Extrato | Associação |
|---|---|---|---|---|---|
| Asaas | R$ 1,99 (promoção de 3 meses: R$ 0,99). Líquido R$ 18,01, ou R$ 19,01 na promoção. [preços](https://www.asaas.com/precos-e-taxas) | Padrão: 2,99% + R$ 0,49 = R$ 1,088. Líquido R$ 18,91. Promoção: 1,99% + R$ 0,49 = R$ 0,888. | POST com `id` do evento, entrega pelo menos uma vez, token no header `asaas-access-token`. [webhooks](https://docs.asaas.com/docs/sobre-os-webhooks) | `GET /v3/financialTransactions`. Recebimento e tarifa são lançamentos separados (`PAYMENT_RECEIVED` e `PAYMENT_FEE`). [extrato](https://docs.asaas.com/reference/recuperar-extrato) | Pede estatuto ou ata registrada e documento da diretoria. [documentos](https://central.ajuda.asaas.com/hc/pt-br/articles/32091607871387-Quais-documentos-s%C3%A3o-necess%C3%A1rios-para-validar-minha-conta) |
| Mercado Pago, Checkout | 0,99% = R$ 0,198. Líquido R$ 19,80, na hora. A página avisa que a taxa da conta pode ser outra. [checkout](https://www.mercadopago.com.br/ajuda/33399) | Na hora: 4,98% = R$ 0,996. Em 30 dias: 3,98% = R$ 0,796. | A pesquisa de 22/09 achou notificação de pagamento. Não reabri essa página hoje. | Não reabri a API de relatórios hoje. | Não reabri o material de abertura de ONG hoje. |
| Stripe | 1,19% = R$ 0,238. Conta no Brasil: Pix avulso só por convite, e a lista do Pix veta entidade sem fins lucrativos e caridade. [Pix](https://docs.stripe.com/payments/pix), [preços](https://stripe.com/br/pricing) | Cartão nacional: 3,99% + R$ 0,39 = R$ 1,188. Internacional soma 2%. | Checkout e webhook existem na mesma página de preços. | Não reabri a API de balance transactions hoje. | O veto do Pix a nonprofit basta pra tirar a Stripe deste caminho. |

Sandbox do Asaas, sem valor real: [docs](https://docs.asaas.com/docs/sandbox), cadastro em [sandbox.asaas.com](https://sandbox.asaas.com/). A conta de teste é separada da de produção. API em `https://api-sandbox.asaas.com/v3`.

## Decisões propostas

- Escolher **Asaas sandbox** pro fluxo de teste. Pix e cartão estão publicados, sem convite. O extrato separa recebimento e tarifa, que é o que o livro precisa pra não somar webhook como se fosse saldo. Associação tem lista de documento. O custo do Pix em R$ 20 é o ponto fraco: R$ 1,99 fixo, quase 10%. Na promoção de três meses, R$ 0,99.
- Não escolher a Stripe pra doação em Pix no Brasil. O próprio manual veta nonprofit e caridade, e o Pix da conta brasileira é por convite.
- Mercado Pago é mais barato no Pix de R$ 20 (R$ 0,20 contra R$ 1,99). A taxa publicada pode não ser a da conta. Se o critério for só o preço do Pix pequeno, ele ganha. Eu não escolho ele agora porque o extrato do Asaas encaixa no livro e a tarifa pública não vem com a ressalva de "pode ser outra".
- Conta que falta pedir ao Lucas: sandbox do Asaas, nada de produção. A chave de API fica em secret, fora do repositório. Sem nome, CPF ou e-mail de pessoa real no teste.

## 24/09/2026 · E3, fluxo fechado

- D041 cravou Asaas sandbox. Mercado Pago continua anotado acima como o Pix mais barato, se um dia o critério for só o preço.
- Se o Rekor ou a freetsa caem, o `ledger-project` grava a ação mesmo assim e avisa no log. O carimbo fica pra próxima tentativa, inclusive o schedule diário.
- `/doar` existe, sem entrada no menu e fora do sitemap, com `noindex`. O texto diz que está fechada. O botão só aparece com `PUBLIC_DONATIONS_OPEN=1`, e o Worker ainda exige `DONATIONS_OPEN=1`. No ar os dois ficam desligados.
- O checkout é o hospedado do Asaas, sem dados de pessoa. O webhook exige `asaas-access-token` e manda só bruto, tarifa, líquido, id e data pro escrevente. Nome, CPF e e-mail não entram no livro.
- O painel de `/doar` soma o livro: recebido, tarifas, gasto e saldo. Comprovante segue pendente.
- A reconciliação diária lê `/v3/financialTransactions`. Sem `ASAAS_SANDBOX_KEY`, não grava nada. Linha do extrato que falta no livro vira evento. Linha do livro que o extrato não mostra continua no livro, com aviso.
- Conta sandbox ainda não existe. Os testes usam pagamento fictício. A chave, quando o Lucas criar a conta, vai no secret `ASAAS_SANDBOX_KEY`.

## Checklist do E4

- Associação criada e CNPJ no nome dela.
- Conta bancária da associação, não de pessoa.
- OK do Lucas pra dinheiro real.
- Trocar o sandbox pela API de produção e abrir as duas flags.
- Conferir uma doação real no livro, com tarifa separada e sem nome.

## Próximo passo

PR aberta: https://github.com/LucasOl1337/pontape/pull/113. A conta sandbox continua com o Lucas.
>>>>>>> a3df63c (Registra a comparação de pagamento do E3)
