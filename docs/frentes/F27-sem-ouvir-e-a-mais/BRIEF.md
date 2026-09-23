# F27 · Tirar o Ouvir e o A+ do site

Dono: `fino` (EngenheiroFino) · Branch: `fino/f27-sem-ouvir` a partir da `main` · Worktree: `.worktrees/fino` · Começo: 23/09/2026

## O que o Lucas pediu

[Feedback de 23/09](../../fontes/2026-09-23-feedback-home.md): "a parte de ouvir não é necessária no site, pode tirar tudo" e "o A+ também pode remover". Decisão registrada na D024.

Esta frente é **só a remoção**, pequena e limpa, pra entrar na `main` rápido. A F29 (Design/UI) reorganiza a home logo depois, em cima do teu resultado. A F28 (ExecutorBruto) faz as paletas em paralelo. Não mexa na estrutura nem no texto além do que a remoção exige.

## O que sai

- **Ouvir:** `src/components/site/ListenButton.astro`, o bloco `panel-voice` da `Escada.astro` (o "Você quer mudar de vida? Aperte e escute"), o texto `forYou`, todo atributo `data-speech`/`data-listen` e toda prop `speech` (inclusive em `Sheet.astro`, `BlockHead.astro`, `LivroTopo.astro`, `LivroMais.astro`), o código de `speechSynthesis` em `src/scripts/site.ts`, o CSS `.voice-btn`/`.listen-btn`/`.panel-voice` e os ícones `speaker` e `stop` se ninguém mais usar.
- **A+:** o botão `#text-size-btn` do `SiteHeader.astro`, o `setLargeText` e a chave `large-text` do `site.ts`, `html.large-text` no `site.css` (inclusive a regra da 404 que a PR #62 acabou de pôr).
- Testes, comentários e o cabeçalho do `site.ts` que citam os dois.

Pode sobrar um espaço vazio onde o bloco de voz estava no degrau 0: feche o buraco do jeito mais simples, sem redesenhar. O resto é da F29.

## Pronto quando

1. `grep -rnE "speechSynthesis|data-speech|data-listen|ListenButton|text-size-btn|large-text|voice-btn|listen-btn" src` não acha nada.
2. `npm run check` passa, e o peso por página não sobe (anote antes e depois).
3. Na tua bancada agent-bench, home, `/transparencia` e a 404 em 1440 e 360: nenhum buraco, nenhum botão órfão, o menu no celular continua abrindo, teclado continua navegando a escada.
4. PR `F27 · Tira o Ouvir e o A+ do site` com prints depois (1440 e 360 da home) e report: `maestri ask "Regente" "F27 pronta: <PR>"`.

## Regras

Uma PR, uma causa. Só `src/` e testes. Nada de `src/lib/ledger/**`, `scripts/**`, `.github/**`. DIARIO em `docs/frentes/F27-sem-ouvir-e-a-mais/DIARIO.md`.
