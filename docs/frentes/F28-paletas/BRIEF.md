# F28 · Paletas de cor com seletor no site

Dono: `bruto` (ExecutorBruto) · Branch: `bruto/f28-paletas` a partir da `main` · Worktree: `.worktrees/bruto` · Começo: 23/09/2026

## O que o Lucas pediu

[Feedback de 23/09](../../fontes/2026-09-23-feedback-home.md): "adicionar mais opções de paleta de cores, com um seletor fácil no site, até eu decidir qual é a melhor. Umas 5 variações." Decisão D025: o seletor é **temporário** e vai pro site no ar; quando o Lucas escolher, a escolhida vira a padrão e o seletor sai.

## O que fazer

**Seis paletas:** a atual e cinco novas. Mesma tipografia, mesmo layout; só cor muda.

| Nome | Ideia |
|---|---|
| Jornal | A atual (`src/styles/tokens.css`): papel creme, tinta preta, um vermelho. Continua sendo a padrão |
| Mata | Papel quase branco puxado pro verde, tinta verde bem escura, acento verde-folha forte; caderno do livro verde-musgo escuro |
| Mar | Branco frio, tinta azul-marinho, acento laranja-queimado; caderno azul-noite |
| Ipê | Papel rosado bem claro, tinta berinjela, acento rosa-ipê escuro; caderno roxo |
| Sol | Papel amarelo-manteiga claro, tinta azul-noite, acento azul-cobalto; caderno cobalto escuro |
| Noite | Fundo escuro, texto creme, acento coral. O caderno do livro fica um tom **mais claro** que o fundo, pra não sumir |

Pode ajustar tom, mas as seis têm que ser bem diferentes entre si. Todas passam AA: texto comum ≥ 4,5:1 contra o papel onde aparece (inclusive o acento, que vira texto em `em` e link, e as cores de estado), e o mesmo dentro do caderno escuro.

**Como funciona:**

1. Cada paleta sobrescreve só os tokens de cor em `html[data-palette="<nome>"]`. Sem atributo, vale a Jornal do `tokens.css`. O token `--red` continua com esse nome, mesmo quando não é vermelho: renomear agora quebraria o trabalho do Design/UI no `site.css`. Anote a troca de nome como proposta no DIARIO.
2. Todo lugar com cor fixa passa a usar token: as oito cores soltas do `site.css` (linhas com `#F7EBC6`, `rgba(23,20,15,…)`, `#5FC98A`, `#FF7A6B`) e o `#B23A1B` do `LogoMark.astro`. `meta theme-color` acompanha a paleta.
3. Um script inline curto no `<head>` do `BaseLayout.astro` aplica a paleta antes da primeira pintura: lê `?cor=<nome>` na URL (e guarda) ou `localStorage` (`pontape-paleta`), sempre dentro de try/catch. O hash do script entra sozinho na CSP pelo `scripts/csp-headers.mjs`; confira que o build passa.
4. **Seletor:** componente próprio (`PaletteSwitcher.astro` + `src/scripts/palette.ts`) montado no `BaseLayout`, fixo no canto de baixo à esquerda, fora do cabeçalho (o cabeçalho é do Design/UI na F29). Um botão pequeno "Cores" que abre as seis amostras com nome, marcado como "em teste". Grupo de rádio com teclado, Esc fecha, foco visível, alvo de 44 px, não cobre conteúdo em 360 px, some na impressão. Vale em todas as páginas: home, `/transparencia`, livro e 404.
5. **Fácil de tirar:** tudo do seletor num componente, num script e num arquivo de paletas. Explique na PR os passos pra remover e pra promover uma paleta a padrão.
6. Uma fonte só pras cores das paletas, e um teste no Vitest que lê essa fonte e confere o contraste de cada par acima em todas as paletas.

## Pronto quando

1. `npm run check` passa, com o teste de contraste novo; peso da home dentro dos 60 KB.
2. Fora dos tokens e das paletas, `grep -nE '#[0-9a-fA-F]{3,8}\b|rgba?\(' src/styles/site.css src/components` não acha cor (as imagens de prévia em `src/pages/*.png.ts` e o favicon ficam como estão).
3. Na tua bancada agent-bench: prints da home em 1440 nas seis paletas, e home + `/transparencia` em 360 em duas delas (uma clara, a Noite). Trocar de paleta não pisca a Jornal ao recarregar.
4. PR `F28 · Paletas com seletor` com os prints e o link `https://pontape.org/?cor=<nome>` de cada uma pra quando entrar no ar. Report: `maestri ask "Regente" "F28 pronta: <PR>"`.

## Regras

A F27 (EngenheiroFino) tira o Ouvir e o A+ e a F29 (Design/UI) reorganiza a home ao mesmo tempo que você: mexa no `site.css` só nas linhas de cor, e antes de abrir a PR faça rebase na `main`. Nada de `src/lib/ledger/**`, `scripts/**`, `.github/**`. DIARIO em `docs/frentes/F28-paletas/DIARIO.md`.
