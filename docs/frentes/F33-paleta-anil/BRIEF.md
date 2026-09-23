# F33 · A Anil vira a paleta do site

Dono: `anil` (Anil · Claude Fable 5.1, xhigh) · Branch: `anil/f33-paleta-anil` a partir da `main` · Worktree: `.worktrees/anil` · Começo: 23/09/2026

## O que o Lucas disse

"Escolhemos a Anil. Pode confirmar ela." ([feedback](../../fontes/2026-09-23-feedback-anil-e-celular.md), D030). Pela D025, a escolhida vira a padrão e o seletor sai.

## O que fazer

1. Os valores da Anil passam pro bloco `:root` de `src/styles/palettes.css`. As outras cinco saem, e a Jornal também, porque o histórico fica no git.
2. O seletor sai inteiro: `PaletteSwitcher.astro`, `src/scripts/palette.ts`, a instância e o import no `BaseLayout.astro`, e a parte de paleta do script inline do `<head>` (o `no-js` → `js` fica). A `meta theme-color` fixa no `--paper` da Anil.
3. Tudo que existia só por causa do botão também sai: `--dock-h`, o `scroll-padding-bottom`, o `padding-bottom` do corpo e o toast levantado. Procure por `palette-switcher` e `D025` no `site.css`. Sem o botão, a primeira tela da home ganha altura: confira que ela continua certa em 1920, 1440, 960 e 360.
4. As cores fixas que ficaram fora dos tokens passam pra Anil: o favicon, o ícone da tela inicial do celular e as imagens de compartilhar (`src/pages/*.png.ts`, `src/lib/share/render.ts`), que hoje usam o vermelho da Jornal.
5. O teste de contraste continua, agora cobrindo a Anil no `:root`. O teste que amarrava seletor e script sai junto com eles.

## Pronto quando

`npm run check` passa; `?cor=` na URL não faz mais nada e não quebra; nenhum resto do seletor em `src/` (`grep -rn "palette\|data-palette\|pontape-paleta" src`); prints da home e do `/transparencia` em 1920 e 360 e da imagem de compartilhar, na tua bancada. PR `F33 · A Anil vira a paleta do site`, report: `maestri ask "Regente" "F33 pronta: <PR>"`.

O Prumo (F34) mexe no layout do celular ao mesmo tempo e espera a tua PR entrar antes de mexer no código. Faça pequena e rápida. O checkout `~/Projects/VidaNova` é do Regente.
