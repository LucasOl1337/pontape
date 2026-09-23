# F16 · Polimento pro lançamento

Dono: `design` (Design/UI) · Worktree: `.worktrees/design` · Branch: `design/f16-polimento` a partir da `main` atualizada

## Por que agora

O site v1 está na `main` (#32). Antes de ir pro ar, ele precisa se apresentar bem quando alguém compartilha o link no WhatsApp, abre numa aba ou cai num endereço errado. O nome definitivo ainda não existe: tudo usa o `PROJECT_NAME` num ponto só e a marca provisória de três blocos.

## Entregáveis

1. **Ícone do site**: favicon SVG e PNG (incluindo `apple-touch-icon`) a partir dos três blocos em escada.
2. **Prévia de compartilhamento**: imagem Open Graph 1200×630 gerada no build a partir do nome e da frase do hero (sem foto, sem pessoa), e as meta tags (`og:*`, `twitter:card`, `description`, `theme-color`) em cada página. Se o nome mudar, a imagem muda sozinha.
3. **404 com a cara do site**: a página do ExecutorBruto (`src/pages/404.astro`) ganha o layout, a faixa "Em construção" e um caminho de volta. Mantenha o texto dele se estiver bom.
4. **Prints** de como o link aparece compartilhado (simule o cartão) em 360px.

Diário no próprio `docs/frentes/F07-site-v1/DIARIO.md`, seção F16.

## Limites

Sem serviço externo pra gerar imagem. Tudo local e no build. Orçamento da DIRECAO §11 continua valendo.

## Pronto quando

`npm run check` passa (inclusive `budget`), o `dist` tem favicon, OG e 404 com layout, e a PR foi reportada ao Regente.
