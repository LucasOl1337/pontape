# F36 · Escada: meio termo entre o antes e o agora

Dono: `prumo` (Prumo · Claude Opus 5.5, esforço xhigh) · Branches `prumo/f36-<assunto>` a partir da `main`, uma por PR · Worktree: `.worktrees/prumo` · Começo: 23/09/2026

Você começou uma conversa nova às 13:04 (o Lucas pediu pra reiniciar todo mundo). O que você fez antes está nos DIARIOs da [F31](../F31-ux-cadernos/DIARIO.md) e da [F34](../F34-celular/DIARIO.md); leia a F34 inteira antes de mexer.

## O que o Lucas disse

[Feedback das 13:05](../../fontes/2026-09-23-feedback-escada-meio-termo.md), com dois prints dele no computador: o [de antes](../../fontes/prints/escada-antes-2026-09-23.png) (11:47, antes da F34) e o [de agora](../../fontes/prints/escada-enquadramento-2026-09-23.png) (13:02). D031.

- "O layout anterior era melhor do que esse que tá agora." As mudanças não estão aprovadas.
- "Antes ficava bem definido o que era cada etapa, escrito desde o começo. Agora tá ficando oculto."
- "O enquadramento da página ficou terrível, não tem o espaço igual tinha antes." É o que ficou pior de todos.
- A IA que vai junto "conceitualmente estava melhor" antes: "começava na parte da escolha já, a indicação".
- "Tem que achar um meio termo entre o anterior e esse."

## O que mudou entre os dois prints

A F34 mexeu na escada em três PRs (mais o rename da F35):

| PR | Commit | O que fez |
|---|---|---|
| #81 | `d30a41c` | Limite de tela baixa de 700 pra 800 px de altura do palco |
| #82 | `48e6a30` | Número a distância fixa embaixo do chão, `--label-h` maior (`--label-pad` + número + 2,2 linhas de nome), ícone limitado pela altura do degrau; no celular, ícone embaixo do chão |
| #83 | `0553750` | A linha da IA saiu de baixo dos nomes e virou corrimão em cima dos degraus, da Conversa em diante, com a frase no alto à direita; o `--rail-h` saiu do palco |
| #85 | `50f4b61` | `--red` virou `--accent` (só o nome); qualquer revert precisa se adaptar a isso |

O que o Regente mediu nos prints do Lucas:

- **Agora:** janela útil de 1920×914 (Brave com a barra de favoritos). O chão da escada fica em 874 px dos 914. Só os números aparecem; os nomes dos passos ficam abaixo da dobra.
- **Antes:** janela útil de uns 1897×952, sem barra de favoritos. Chão em 775, nomes em 810, linha da IA em 850, e uns 100 px de ar embaixo.
- A escada cresceu uns 100 px enquanto a janela dele encolheu 38. Com a linha da IA no alto e os treads em pontilhado, o corrimão azul por cima virou linha dupla.

A causa exata do enquadramento é tua pra provar, no DIARIO, antes de mexer no código. Olhe o `--label-h` da #82, o `--rail-h` que saiu na #83, o `.front{min-height:max(calc(100svh - …), 46rem)}` e o `100cqh` do palco.

## O meio termo

A base é o **antes**. Do que a F34 fez, só fica o conserto que o Lucas pediu ao meio-dia: os números sem invadir o chão, os ícones e os botões.

1. **Enquadramento, o mais grave.** Em 1920×914 (a janela real do Lucas), 1920×1080, 1440×900 e 1366×768, a primeira tela mostra a escada inteira: todo degrau, o nome de todo passo e a linha da IA, com ar embaixo, como no print de antes. Abrir um degrau não empurra nada pra fora da tela.
2. **O nome de cada passo à vista desde o começo**, embaixo de cada degrau, como antes (INÍCIO, ENCONTRO … SUA VEZ). No tablet também. Se no celular de 360 não couber, explique no DIARIO e proponha.
3. **A IA volta pra baixo dos nomes:** a linha com o ícone, a frase "a IA vai junto, sempre e de graça" e a seta, como no print de antes, e nada de corrimão em cima dos degraus. Ela **começa na Escolha**, a indicação, como o Lucas lembra, e segue até depois do topo. Ajuste junto a frase `sr-only` ("Da escolha em diante…") e o comentário do `RAIL_FROM` no `Escada.astro`.
4. **Os números** ficam perto do nome e longe do chão e dos ícones, em todo tamanho. Os alvos de 44 px da #84 ficam.

## Como fazer

1. **Proposta curta primeiro**, em `docs/frentes/F36-escada-meio-termo/DIARIO.md`: a causa medida do enquadramento, o que volta do antes e o que fica da F34. Mande `maestri ask "Regente" "F36 proposta: <resumo>"`, e pode seguir enquanto eu leio.
2. Rota sugerida, que você pode trocar se explicar: uma PR rápida que volta a escada do antes (revert da #83 e da parte da #82 que cresceu o palco, adaptado ao `--accent`), pra o site parar de mostrar o que o Lucas reprovou. Depois, uma PR com o conserto dos números na medida do antes e a linha da IA começando na Escolha.
3. Prints de antes e depois na **tua bancada agent-bench** (workspaces 6 a 11), com a home no degrau 0 e com o Encontro aberto, como no print do Lucas, em 1920×914, 1920×1080, 1440×900, 1366×768, 390 e 360. Ponha o print de antes do Lucas do lado na PR.

## Regras

- Cor só por token (`palettes.css`, já com a Anil). Texto público segue o `AGENTS.md`.
- AA, teclado, `prefers-reduced-motion`, 360 sem rolagem lateral, `npm run check` e orçamento de 60 KB por página.
- O checkout `~/Projects/VidaNova` é do Regente: não commite, troque branch, faça stash ou reset nele. Rebase na `main` antes da PR.
- Ao terminar, pare teus servidores locais e tua bancada.

## Pronto quando

1. Nos quatro tamanhos de computador, a primeira tela mostra a escada inteira, com o nome de todo passo e a linha da IA, e com ar embaixo, com a home no degrau 0 e com um degrau aberto.
2. A linha da IA fica embaixo dos nomes, começa na Escolha e tem a seta depois do topo.
3. Nenhum número encosta no chão ou num ícone, em tamanho nenhum.
4. PR `F36 · Escada: meio termo` com os prints e o report: `maestri ask "Regente" "F36 pronta: <PR>"`.
