# F28b · Diário

## 23/09/2026

- Criei `bruto/f28b-theme-color` a partir de `origin/main` após a integração da F28.
- `BaseLayout.astro`: `meta theme-color` nasce com `#F3EEE4`, papel da paleta Jornal. O script inline agora roda numa IIFE, sem expor `valid`, `palette` e `fromUrl` no escopo global.
- `npm run check` passou: 133 testes, CSP gerada e verificada com quatro hashes, home de 27,1 KB. Conferi `dist/index.html`, `dist/transparencia/index.html` e `dist/404.html`: os três saem com a meta inicial correta.

## Estado

- Aguardando abrir a PR e avisar o Regente.
