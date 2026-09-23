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

## 22/09/2026 · marco 1: home e livro de pé

- Merge da main com o nome PontaPé (D016). O nome sai só do `PROJECT_NAME`; "pontapé inicial" entrou na legenda do prisma e no rodapé.
- Home inteira em bento: Pra você (orbe de voz), O problema (comparação ajuda solta x caminho inteiro), jornada em trilho guiado pelo scroll, nove módulos com o livro como bloco grande, transparência com contadores e Conferir, gargalos, contribuições com filtro que desliza, como ajudar, código aberto.
- Livro: hero com a corrente das quatro últimas marcas reais, números que viajam da home (View Transition), Conferir fixo ao lado da lista.
- Achado: a bancada herdou zoom de 110% pra 127.0.0.1 no perfil semente. Zerei na minha bancada (Ctrl+0) antes dos prints; sem isso o "1440" era 1309 px de CSS.

## 22/09/2026 · marco 2: fechamento da rodada 1

- `npm run check` passa. Orçamento: home 40,2 KB ao abrir e 48,9 KB com o Conferir; livro 36,9 e 45,5 KB. Antes do merge da main dava 64,5 KB porque o verificador antigo pesava 24,5 KB; o novo da main pesa 8,7 KB.
- Conferir testado: livro real (34 conferidas), exemplo com linha mudada (quebra na nº 2) e home.
- Sem rolagem lateral em 360 e 320 nas duas páginas.
- Plural corrigido no resultado do Conferir ("A ação antes dela está certa").

**Decisão proposta:** o repositório ainda diz "Abre quando: nome e licença decididos". O nome foi decidido (D016); talvez fique só "licença decidida". Não mexi porque é texto que vem do v1.

Estado final da rodada 1: PR em rascunho `F19 v1 · Prisma`. O Regente abriu a rodada 2 (F22) antes do report; a rodada 2 segue em `design/variantes/r2-v1/`.
