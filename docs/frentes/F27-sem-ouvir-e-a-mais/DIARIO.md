# DIARIO · F27

23/09/2026 · EngenheiroFino

## Feito

- Criei `fino/f27-sem-ouvir` a partir de `origin/main`, no worktree `.worktrees/fino`.
- Removi o botão Ouvir, as narrações, os atributos e props de fala, o bloco de voz do degrau inicial, o sintetizador, o CSS e os ícones sem uso.
- Removi o A+ do cabeçalho, sua preferência no armazenamento local e a regra correspondente da 404.
- Mantive a entrevista por voz como parte futura do produto. Essa remoção só atinge a leitura em voz alta do site.

## Peso do build

Bytes dos arquivos gerados, antes → depois:

| Arquivo | Antes | Depois |
|---|---:|---:|
| `index.html` | 91.989 | 76.603 |
| `transparencia/index.html` | 152.829 | 150.368 |
| `404.html` | 13.489 | 13.029 |
| CSS compartilhado | 46.455 | 44.647 |
| JS compartilhado do site | 2.864 | 1.110 |

O orçamento comprimido depois da remoção ficou em 24,5 KB na home e 34,9 KB na abertura do livro. Nenhuma página aumentou.

## Verificação

- `rg` dos termos pedidos no `src/`: zero ocorrências.
- `npm run check`: passou, com 127 testes. Astro mostrou só um hint preexistente em `design/prototipo/ledger.js`.
- Na bancada `pontape-f27-fino` (workspace 11, Chromium e CDP próprios), conferi home, `/transparencia` e 404 em viewports CSS de 1440 e 360 px. Sem controle órfão nem transbordamento horizontal.
- Em 360 px, cliquei no menu: abriu e fechou com Escape, devolvendo o foco ao botão. Nos dois tamanhos, ArrowRight selecionou o próximo degrau e moveu o foco.
- Capturas da home em 1440 e 360 px: `/tmp/f27-prints/home-1440.png` e `/tmp/f27-prints/home-360.png`; também há capturas do livro e da 404 na mesma pasta.

## Decisões propostas

Nenhuma.

## Próximo passo

Abrir a PR para `main`, anexar as duas capturas da home e avisar o Regente. A F29 pode partir da `main` após o merge.
