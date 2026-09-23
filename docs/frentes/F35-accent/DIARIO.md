# F35 · Diário

## 23/09/2026

- Branch `anil/f35-accent` a partir de `origin/main` (já com a F34 do Prumo integrada, PR #84).
- Inventário antes de mexer: `--red` e `--night-red` só aparecem em `src/styles/palettes.css` (definição), `src/styles/site.css` (59 usos), `src/components/site/LogoMark.astro` (o ponto da marca) e `src/styles/palettes.test.ts`. As imagens do build já chamavam a cor de `accent` e `accentLight` em `src/lib/share/palette.ts`; nada a renomear ali.
- Prints de "antes" tirados na bancada `anil-f30` com a main intacta, antes de qualquer edição: home e `/transparencia` em 1920 e 360.
- Renomeado: `--red` → `--accent` e `--night-red` → `--night-accent`, com `sed` de palavra inteira (o `--night-red` primeiro, pra não sobrar `--night-accent` meio trocado), em `palettes.css`, `site.css`, `LogoMark.astro` e `palettes.test.ts`. Dois comentários que falavam em "red dot" passaram a falar no ponto na cor de destaque. `grep -rn -- "--red\b\|--night-red" src` vazio.
- Prints de "depois" tirados com a mesma bancada, mesmo servidor e mesmos tamanhos. Comparação pixel a pixel (`ImageChops.difference`): home em 360, `/transparencia` em 1920 e em 360 idênticos de primeira; a home em 1920 saiu com 34 pixels diferentes perto da linha pontilhada da escada no primeiro print, e as duas recapturas seguintes saíram idênticas ao "antes" (ruído de quadro da animação, não do CSS). Ficou a recaptura em `prints/depois/`.
- `npm run check` verde (lint, typecheck, testes, ledger, build, orçamento).

## Estado final

- PR [#85 · F35 · --red vira --accent](https://github.com/LucasOl1337/pontape/pull/85) aberta pra `main`. Report enviado ao Regente.
- Dev server parado; bancada `anil-f30` (workspace 8 nesta rodada) fica no ar sem abas próprias.
