# F22 v1 · Prisma · diário (rodada 2: a escada)

Dono: Prisma (Claude Opus 5.5) · branch `variante/r2-v1-prisma` · worktree `.worktrees/var-1` · porta 4341

## 22/09/2026 · marco 0: leitura e plano

Li o feedback do Lucas (scroll longo demais, a escada da Crônica explica bem, tela mal usada) e o BRIEF da F22. Rodada 1 fechada na PR #46.

**Ideia: escada de blocos.** A home é uma tela só. À esquerda, sete blocos do bento empilhados como uma escada que sobe pra direita: o degrau 1 embaixo e largo, o 7 em cima e recuado. À direita, um palco grande. O bloco escolhido cresce e se liga ao palco, e o conteúdo dele aparece ali, no mesmo lugar. Setas sobem e descem.

**Cada degrau é uma parte do site**, na ordem de quem chega: 1 O PontaPé, 2 Como funciona, 3 Módulos, 4 Livro público, 5 Gargalos, 6 Contribuições, 7 Como ajudar. Escolhi as seções, e não os 7 passos da jornada, porque a home curta precisa mostrar tudo que o BRIEF pede; a jornada vira uma escada menor dentro do degrau 2.

**Celular.** A escada vira uma faixa de sete degrauzinhos crescentes presa no topo; o conteúdo fica embaixo.

**Livro.** Topo numa tela (números, Conferir, últimas ações) e o resto em abas: todas as ações paginadas, dinheiro, como conferir, o que entra.

Base: identidade da rodada 1 trazida da `variante/v1-prisma` (tokens, Geist, componentes).

## 22/09/2026 · marco 1: a escada de pé

- Home com a escada à esquerda (flex em coluna invertida, cada degrau recuado `--i × --indent`) e o palco à direita. O degrau escolhido tem `flex-grow` maior, então ele cresce de verdade na escada, e uma ponte na cor dele liga o bloco ao palco.
- A escada é `role="tablist"` vertical com roving tabindex; ↑ e → sobem, ↓ e ← descem. Hash de cada degrau no endereço, e os links antigos (`#modulos`, `#gargalo-...`, `#m3`) caem no degrau certo.
- Medi o transbordo de cada degrau no palco em 1440×900, 1920×890 e 1536×864 e fui enxugando até zero: título do degrau 1 com `cqi`, números embaixo do prisma, cadeia compacta no livro, contribuições em 6 por página, navegação de rodapé só no celular.
- Telas baixas (menos de 800 px de altura): a página cresce e a escada fica presa ao lado, em vez de esconder conteúdo rolando dentro do palco.
- Livro: topo numa tela, quatro abas em escadinha, lista em páginas de 10 (5 no celular). O `verify.ts` avisa a página qual linha quebrou (`verify:broken`), e o livro abre a página dela antes de rolar.

## 22/09/2026 · marco 2: fechamento

- `npm run check` passa. As fontes antigas da main tinham voltado com o checkout da rodada 1 (133 KB); removi, ficaram 46,2 KB.
- Conferir testado: livro real (37 conferidas), exemplo com linha mudada (quebra na nº 2 e a lista pula pra página 2 de 2) e na home.
- Teclado testado na escada, na escadinha da jornada e nos gargalos; links do menu do topo trocam o degrau sem pular a página.
- Telas: home 1 tela em 1440×900 (e em 1920×890 e 1536×864); 1,8 a 2,8 telas em 360. Livro com topo em 1 tela; 3,8 telas no total em 1440 e 5,9 em 360.

**Decisão proposta:** o rodapé da home virou uma linha. Organização e privacidade continuam no rodapé completo do livro; se o Lucas quiser esse texto na home, cabe no degrau 7.
