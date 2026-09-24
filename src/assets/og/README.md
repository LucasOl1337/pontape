# Fontes só pro build

Cópias TTF estáticas das fontes do site, usadas só pra desenhar o ícone e as prévias de compartilhamento no build (`src/lib/share/render.ts`). Não vão pro site: o navegador usa os woff2 de `public/fonts/`.

- `newsreader-display-500.ttf`: Newsreader de título, peso 500 (o nome e o título da prévia). Convertido de `public/fonts/newsreader-display-500.woff2` (F38).
- `newsreader-italic-400.ttf`: Newsreader itálico, peso 400 (a virada do título, em anil). Convertido de `public/fonts/newsreader-italic-400.woff2` (F38).
- `atkinson-next-700.ttf`: Atkinson Hyperlegible Next, peso 700 (a linha de baixo).

As duas Newsreader são o mesmo subconjunto latino dos woff2 do site. Licença SIL Open Font License 1.1, a mesma dos woff2. Os textos estão em `public/fonts/OFL-*.txt`.
