# F33 · Diário

## 23/09/2026

- Branch `anil/f33-paleta-anil` a partir de `origin/main` (já com os briefs F33 e F34).
- `palettes.css` virou só o `:root` com os valores da Anil. Jornal e as outras quatro saíram; ficam no git e no `docs/pesquisa/PALETAS.md`.
- Seletor fora: `PaletteSwitcher.astro`, `src/scripts/palette.ts`, import e instância no `BaseLayout.astro`. O script inline do `<head>` ficou só com o `no-js` → `js`; a `meta theme-color` fixa em `#F4F1EA`. Sem `?cor=` nem `pontape-paleta`.
- `site.css`: saíram o `scroll-padding-bottom`, o `--dock-h` com o `padding-bottom` da `.front` e o toast levantado (os três blocos marcados D025).
- Imagens do build na Anil: `src/lib/share/palette.ts` guarda os mesmos valores do CSS (papel, papel 2 e 3, tinta, tinta 2, anil, anil claro, ocre de obra e seu fundo); `logo.ts` e `render.ts` usam só esses nomes, sem hex solto. O favicon virou anil claro, anil e tinta sobre papel; na imagem de compartilhar a faixa de obra é ocre sobre creme, os degraus vão de papel 2 a tinta passando pelo anil, e a tarja do destaque é anil claro. O teste de paleta confere que `palette.ts` e `palettes.css` batem, pra ninguém mudar um sem o outro.
- Teste de contraste passou a ler só o `:root`; o teste que amarrava seletor e script saiu com eles.
