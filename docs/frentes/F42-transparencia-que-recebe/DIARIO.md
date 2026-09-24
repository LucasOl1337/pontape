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

## Próximo passo

PR da E1b: https://github.com/LucasOl1337/pontape/pull/102. Em seguida o E2: worker, fila, escrevente, Rekor e carimbo RFC 3161. A chave nova nasce no Worker. Conta em serviço não crio.
