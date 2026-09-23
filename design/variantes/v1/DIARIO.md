# F19 v1 · Prisma · diário

Dono: Prisma (Claude Opus 5.5) · branch `variante/v1-prisma` · worktree `.worktrees/var-1` · porta 4341

## 22/09/2026 · marco 0: leitura e conceito

Li AGENTS.md, o BRIEF da F19, o PRD, as specs 01 e 02, todos os blocos, os dados e os scripts do v1.

**Conceito.** Um prisma de vidro. Entra um feixe de luz (quem quer recomeçar), atravessa o VidaNova, que é transparente, e sai em cinco raios: comida, roupa, higiene, trabalho e IA. Vidro é transparência literal: tudo que passa pelo meio fica à vista. Esse prisma é a assinatura do hero e o espectro dos cinco raios vira a paleta do site inteiro.

**Linguagem.** Escuro por padrão (segue o aparelho) e claro no botão do topo. Grade bento de blocos com borda fina, luz que segue o ponteiro, vidro só onde tem algo por trás (topo e diálogo). Geist e Geist Mono, sem serifa precisa. Muito respiro.

**Técnica.**
- Bento em CSS grid com `grid-auto-flow: dense`, pra os filtros reorganizarem sem buraco.
- Animação guiada por scroll em CSS puro (`animation-timeline: view()` e `scroll()`): barra de leitura, entrada dos blocos, trilho da jornada que enche conforme lê, topo que ganha vidro ao rolar. Sem suporte, tudo aparece parado.
- View Transitions entre páginas (`@view-transition`, sem JS) com os números do livro passando de uma página pra outra. Nos filtros, `document.startViewTransition` reorganiza os blocos com movimento.
- Tudo desliga com `prefers-reduced-motion`.

**Fontes.** Troco Archivo e Atkinson por Geist (26,5 KB) e Geist Mono (20,8 KB), variáveis, só latim, OFL. Total de fonte cai de 89 KB pra 47 KB.

**Decisão de escopo.** Não mexo em `src/data`, `src/lib`, `scripts`, `.github` nem `package.json`. A 404 não está na lista do que pode mexer, então só dou estilo às classes dela.

Próximo passo: tokens, base e o hero com o prisma.
