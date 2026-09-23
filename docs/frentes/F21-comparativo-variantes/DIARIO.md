# Diário · F21 · Comparativo das variantes

## 22/09/2026 · Preparação

- Criei `bruto/f21-comparativo` no worktree `.worktrees/bruto` a partir de `origin/main` (`b3e39d2`), depois de ler `AGENTS.md`, PRD, QUADRO e os briefs F21/F19.
- Régua objetiva: `npm run check` no commit de cada PR em worktree temporário próprio, budget inicial/com Conferir, CSP e console, livro real/exemplo/adulteração, responsividade, teclado, movimento reduzido, alto contraste, contraste AA, 3G e regras comuns da F19. Nenhuma edição nos worktrees de variante.
- PRs prontas no início: #39 Maracatu (v4) e #38 Pluma (v5). Portas 4341–4345 respondem, mas v1–v3 ainda não têm PR aberta. Começarei por v4 e v5 e acompanharei `gh-axi pr list` para as demais.
- Próximo passo: preparar os commits das duas PRs em worktrees temporários, levantar bancada exclusiva e coletar medidas no navegador isolado.

## 22/09/2026 · Base reproduzível de v4 e v5

- Fixei #39 em `2e969ec` e #38 em `e3cb5fa`, cada uma num worktree **temporário próprio** em `/tmp/vidanova-f21-v4` e `/tmp/vidanova-f21-v5`, sem tocar nos worktrees das variantes. `npm ci` e `npm run check` passaram com Node 24.21.0: 127 testes, livro válido e CSP com dois hashes em ambos.
- Budget do build v4 Maracatu: home 37,1 KB inicial / 45,7 KB com verificador; transparência 35,1 / 43,7 KB. Livro com 35 ações.
- Budget v5 Pluma: home 17,0 / 17,0 KB; transparência 26,9 / 51,3 KB. Livro com 34 ações no commit da PR. Os eventos divergem por antiguidade do branch, não por falha de integridade.
- Criei a bancada exclusiva `pontape-f21-comparativo` no workspace 7, display `:82`, controle `agente`; perfil próprio preparado e `browser-status` confirmou `lives_in` e `user_data_dir` da bancada. Abri abas próprias registradas da missão para 4344 e 4345.
- Próximo passo: medir rede, interações e acessibilidade dessas duas versões e recolher capturas só dos problemas encontrados.

## 22/09/2026 · Primeiras duas variantes medidas

- Em produção estática local com `_headers` gerado aplicado, v4/v5 responderam 200 na home e livro, 404 na rota ausente e não tiveram violação de CSP nem exceção JS (só o aviso de rede esperado da 404). Conferir no livro real deu “Tudo certo” (v4 35 ações, v5 34); no exemplo, ambas detectaram alteração na ação nº 2.
- Régua de 3G lento comum (400 ms, 50 kB/s, cache desligado, 360 px; servidor local sem compressão): v4 home 6.894 ms/284.309 B, livro 7.106 ms/293.078 B; v5 home 3.229 ms/112.752 B, livro 5.024 ms/195.740 B. Nenhuma requisição falhou. A diferença de HTML e fontes explica parte do tamanho; números servem à comparação local, não prometem produção.
- Em 320 px, v4 home tem 335 px de largura sem A+ e 354 px com A+; no livro 305/313 px. Em 360 px, ambas as páginas de v4 cabem, inclusive A+. Em zoom real de 200% numa janela de 640 px, v4 home tem viewport CSS 320 px e conteúdo 335 px; livro cabe. Capturei a grade de contadores cortada em `docs/operacao/comparativo/v4-home-320-contadores-centro.png`. V5 não tem A+; home/livro cabem a 320/360 px e no zoom de 200% (312 px de conteúdo para 320 px CSS).
- Tab percorreu 89/96 alvos na v4 (home/livro) e 31/96 na v5; todos os alvos reais percorridos tiveram foco com contorno sólido de 3 px. O único item sem contorno foi BODY ao voltar ao início da ordem. Pular pro conteúdo e setas das abas funcionaram na v4. `prefers-reduced-motion` zerou as transições longas nas duas. Auditoria de contraste calculado em fundos sólidos não achou texto abaixo de AA (v4 5 amostras sobre gradiente pedem inspeção visual; v5 nenhuma).
- Conteúdo comum: faixa “Em construção”, zero financeiro honesto, nove módulos com estado, nenhuma imagem `<img>` de pessoa e nenhum travessão no texto visível das páginas. A variante v4 usa ilustrações SVG sem foto; v5 é tipográfica.
- PRs #45 Ábaco, #46 Prisma e #47 Crônica abriram durante a medição. Próximo passo: fixar os commits das três e completar as colunas, depois revisar os achados e escrever a tabela final sem juízo estético.

## 22/09/2026 · Cinco builds e pausa da bancada

- Fixei #46 Prisma em `fae49f3`, #47 Crônica em `42fa8c7` e #45 Ábaco em `2d1870a`, também em worktrees temporários próprios. Prisma/Crônica passaram `npm run check`. Ábaco passou lint, tipos, 127 testes, ledger e build, mas `npm run check` falhou no `budget`: transparência 68,2 KB com Conferir contra 60 KB (home 59,5 KB). Sem alterar a variante.
- Budgets v1: home 40,2/48,9 KB, livro 36,9/45,5 KB; v2: 35,5/60,0 e 32,8/57,3; v3: 35,3/59,5 e 43,9/68,2. O livro dos commits tem respectivamente 36, 33 e 33 ações. As diferenças de contagem vêm da data de cada branch.
- Em 3G simulado igual ao das v4/v5: v1 home 6.342 ms/257.622 B, livro 6.445 ms/261.819 B; v2 7.063/304.177 e 7.446/313.092; v3 5.976/235.594 e 7.451/309.274. Sem requisições falhas.
- CSP aplicada do build local: zero violações e exceções nas três, home/livro/404. Em 320/360 px, as páginas das v1/v2/v3 cabem sem A+; com A+ também cabem (v2 home em 319 px para viewport 320). Tab percorreu home/livro com foco visível; na v3, os dois campos de busca não têm contorno no próprio input, mas o pai `.search-row:focus-within` muda borda de `rgb(51,65,84)` para `rgb(126,226,168)` e adiciona sombra de 3 px. Todas as nove fichas M1–M9, faixa honesta, zero financeiro, sem `<img>`/foto e sem travessão aparecem nas cinco homes.
- Em v1, `prefers-reduced-motion` zerou animações, mas deixou 141 elementos com transições longas, inclusive `transform .9s` em `.path::after` e transições espaciais no menu/toast. Vou classificar isso com cuidado, separando cor de movimento. A auditoria de contraste de fundos sólidos não encontrou violações AA; Prisma usa muitos gradientes e precisa de inspeção adicional.
- Ao iniciar a conferência visual seguinte, o MCP informou controle humano da bancada. Suspendi navegador/CDP. Logo depois o serviço `agent-bench@pontape-f21-comparativo` parou com resultado `success`; não executei `resume`. Continuei somente verificações estáticas. Faltam na bancada: Conferir/exemplo das v1–v3, zoom 200% delas, revisão de gradientes/forced-colors e eventuais prints de falhas.

## 22/09/2026 · Régua completa e interpretação do CI

- O supervisor devolveu automaticamente `control_mode: agente` à bancada, sem `resume` meu. Reabri o Chromium do **mesmo** perfil e validei `lives_in: pontape-f21-comparativo` antes de navegar. Registrei novas abas próprias da missão e completei os ensaios pendentes.
- Na primeira tentativa automatizada de Conferir em v1–v3, abas em segundo plano ficaram em `running`; não classifiquei como falha. Ativei cada aba, recarreguei e esperei o resultado final: livro real passou com 36/33/33 ações, exemplo fictício passou com 20 ações em cada, adulteração detectada na nº 2 em cada. A Crônica mostra plural incorreto “As 1 ações”, já coberto pela issue #43.
- Zoom real de 200% em janela física de 640 px deu viewport CSS 320 px nas v1–v3; home e livro tiveram `scrollWidth` 312 px. `forced-colors: active` foi aplicado nas cinco a 360 px; título preto sobre branco, controles/texto legíveis nas capturas e sem rolagem horizontal. Na Prisma, os trechos de gradiente são texto grande; a pior parada clara contra `#F6F6F7` dá 3,76:1, acima do limiar AA de 3:1 para texto grande.
- O CI verde da #45 testou o merge temporário `df1395f` (head `2d1870a` + main `fef6b67`) e obteve livro 45,0/53,5 KB. A main tem o commit `a881453` que migra o verificador para Zod Mini; o head isolado não tem, por isso 43,9/68,2 KB e falha. A tabela seguirá o brief e mostrará o head, com a diferença do CI explicada.
- Downloads `/livro/ledger.json` e `/livro/checkpoint.json` e `/robots.txt` deram HTTP 200 nas cinco. Sem `SITE_URL`, OG/Twitter usam imagem relativa em todas, mesma condição de build local registrada na F18. Consolidei medidas e limites em `docs/operacao/COMPARATIVO-VARIANTES.md`. Próximo passo: revisar o relatório, remover print redundante, validar diff e abrir PR.
- Revi a primeira dobra da home e do livro em forced-colors nas cinco; aguardei o fim da animação de entrada da Prisma antes de julgar seu texto. A medição de contraste em forced-colors não encontrou texto abaixo de AA sobre fundo sólido. No teclado real da bancada, Enter abriu e Escape fechou diálogos de módulo em v1/v2/v4; Enter expandiu os `details` de módulo em v3/v5. Removi um print redundante; ficaram as duas capturas que mostram a falha de 320 px do Maracatu.
