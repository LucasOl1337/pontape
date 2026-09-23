# F33 · Diário

## 23/09/2026

- Branch `anil/f33-paleta-anil` a partir de `origin/main` (já com os briefs F33 e F34).
- `palettes.css` virou só o `:root` com os valores da Anil. Jornal e as outras quatro saíram; ficam no git e no `docs/pesquisa/PALETAS.md`.
- Seletor fora: `PaletteSwitcher.astro`, `src/scripts/palette.ts`, import e instância no `BaseLayout.astro`. O script inline do `<head>` ficou só com o `no-js` → `js`; a `meta theme-color` fixa em `#F4F1EA`. Sem `?cor=` nem `pontape-paleta`.
- `site.css`: saíram o `scroll-padding-bottom`, o `--dock-h` com o `padding-bottom` da `.front` e o toast levantado (os três blocos marcados D025).
- Imagens do build na Anil: `src/lib/share/palette.ts` guarda os mesmos valores do CSS (papel, papel 2 e 3, tinta, tinta 2, anil, anil claro, ocre de obra e seu fundo); `logo.ts` e `render.ts` usam só esses nomes, sem hex solto. O favicon virou anil claro, anil e tinta sobre papel; na imagem de compartilhar a faixa de obra é ocre sobre creme, os degraus vão de papel 2 a tinta passando pelo anil, e a tarja do destaque é anil claro. O teste de paleta confere que `palette.ts` e `palettes.css` batem, pra ninguém mudar um sem o outro.
- Teste de contraste passou a ler só o `:root`; o teste que amarrava seletor e script saiu com eles.
- Conferido na bancada `anil-f30` (agora no workspace 10, o navegador tinha fechado junto com a última aba): home em 1920, 1440, 960 e 360 e `/transparencia` em 1920 e 360, todas na Anil e sem botão; `?cor=pauta` na URL não muda nada nem quebra. `og.png`, `og-transparencia.png` e `apple-touch-icon.png` gerados pelo dev server e salvos em `prints/`.
- `npm run check` verde (lint, typecheck, testes, ledger, build, orçamento). `grep -rn "palette\|data-palette\|pontape-paleta" src` só acha `palettes.css`, seu teste e `lib/share/palette.ts`.

## Estado final

- PR [#80 · F33 · A Anil vira a paleta do site](https://github.com/LucasOl1337/pontape/pull/80) aberta pra `main`, rebaseada na main da hora. Report enviado ao Regente.
- Dev server parado; bancada `anil-f30` fica no ar sem abas próprias.

## Decisões propostas

- `--red` agora é azul. Renomear pra `--accent` numa passada coordenada com o Prumo, quando ele terminar a F34, pra não conflitar no `site.css`.
- A faixa de obra na imagem de compartilhar virou ocre sobre creme (as cores de "Em construção" do site) no lugar do amarelo e preto. Se o Lucas preferir a fita amarela de verdade, é um par de valores em `src/lib/share/palette.ts`.
