# F19 v5 · Pluma · diário

## 22/09/2026 · direção

- Li `AGENTS.md`, PRD, quadro e brief da F19. Branch `variante/v5-pluma`, worktree próprio limpo.
- Direção: branco, tinta quase preta e azul como única cor de destaque. Tipografia e espaço organizam a leitura. Voz logo no primeiro bloco, conteúdo acessível sem JavaScript, detalhes nativos para aprofundar.
- Vou preservar os dados e o verificador F08. O livro continua mostrando zero real e distinguindo o livro oficial do exemplo fictício.
- Próximo passo: implementar home e livro, conferir em 360 e 1440 na bancada, rodar `npm run check`.

## Decisões propostas

- Nenhuma.

## 22/09/2026 · implementação e revisão

- Fiz merge fast-forward de `origin/main` para receber D016. O nome PontaPé vem de `PROJECT_NAME`; a marca no cabeçalho usa sua inicial.
- Reescrevi a home em seções de leitura direta. Os nove módulos e cinco gargalos abrem com `<details>` nativo. Todas as contribuições existentes aparecem sem filtragem que esconda tarefas.
- A página do livro continua usando dados reais de `getPublicLedger`, os eventos, o exemplo fictício e o verificador F08. Reestilizei seus blocos na linguagem da variante.
- `npm run check` passou antes da última revisão visual: 127 testes, livro real com 34 ações válidas, home 16,9 KB e livro 51,3 KB incluindo carregamento sob demanda.
- Bancada `f19-pluma` no workspace 10, Chromium isolado validado com `lives_in: f19-pluma`. Conferi visualmente home e livro em 360 e 1440 px, sem rolagem lateral. Capturas completas salvas em `prints/`.
- O botão Conferir validou as 34 ações reais. O exemplo fictício validou 20 ações; ao alterar uma linha sem refazer sua marca, acusou a quebra na ação nº 2.
- Ajustei a posição inicial do botão Ouvir e escondi o aviso temporário enquanto vazio. Próximo passo: check final, commit, PR em rascunho e reporte ao Regente. O servidor deve ficar na porta 4345 para Lucas revisar.
- Check final passou após os ajustes: 127 testes, CSP válido, home 17,0 KB e livro 51,3 KB com verificador sob demanda. Abrir os 14 detalhes na largura de 360 px também não criou rolagem lateral.
