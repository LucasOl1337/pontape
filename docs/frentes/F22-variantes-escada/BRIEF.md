# F22 · Variantes, rodada 2: a escada

Donos: os mesmos cinco agentes da F19, cada um no seu worktree · Branches `variante/r2-vN-<codinome>` a partir da `main` · Portas iguais às da F19

## O que o Lucas disse da rodada 1

Leia antes: [feedback da rodada 1](../../fontes/2026-09-22-feedback-f19-r1.md), com dois prints da Crônica.

- **Scroll longo demais.** O site tem que ser navegado e digerido fácil, sem descer e ler tanta coisa.
- **A escada da Crônica acertou o jeito de explicar**: ela vai mostrando as coisas degrau por degrau, e cada degrau representa uma coisa.
- **Mas o espaço da tela ficou mal usado**: texto pequeno num canto, escada pequena no outro e tela vazia no meio.

## O desafio desta rodada

Cada variante refaz o site com **a escada como o jeito principal de navegar e explicar**. Continua na tua identidade visual da rodada 1 (tua cor, tua tipografia, teu jeito); o que muda é a estrutura.

1. **Curto.** No desktop (1440×900), a home cabe em no máximo **3 telas** de altura, e o ideal é **uma tela só** com navegação dentro dela. No celular (360×780), no máximo 6 telas. O resto do conteúdo aparece **quando a pessoa pede**: degrau clicado, aba, painel que abre, página própria. Nada de ler tudo descendo.
2. **Cada degrau representa uma coisa.** Você decide o quê: os 7 passos da jornada, as seções do site, os módulos. Explique a escolha no README. Degrau é clicável e navegável pelo teclado (setas), e mostra o seu conteúdo **no mesmo lugar**, sem pular a página.
3. **Tela cheia de verdade.** Escada e conteúdo ocupam a tela, com texto grande e sem vão vazio. Em 1440px nada de coluna estreita perdida no meio. Em 360px a escada vira algo que cabe e funciona com o dedo.
4. **O que a página tem que mostrar**, mesmo curta: o que é o PontaPé e a intenção (hero), como funciona, os módulos com estado, a transparência (atalho claro pro livro, com o zero honesto e o número de ações), os gargalos, as contribuições abertas e como ajudar. Pode agrupar, resumir e mandar o detalhe pra um clique.
5. **O livro (`/transparencia`) também encurta**: o topo mostra o essencial numa tela (números, Conferir, últimas ações) e a lista completa fica paginada ou filtrável, não um rolo sem fim.

As regras da F19 continuam valendo ([BRIEF da F19](../F19-variantes-visuais/BRIEF.md), seção "O que é igual pra todas"): mesmos dados, o que pode e o que não pode mexer, faixa honesta, zero honesto, nenhuma foto de pessoa, AA e teclado, 360px sem rolagem lateral, Conferir funcionando, orçamento de 60 KB como meta.

## Cinco jeitos de fazer a escada

Pra não saírem cinco cópias da Crônica, cada um parte de uma ideia de escada diferente:

| N | Codinome | Ideia de escada |
|---|---|---|
| 1 | Prisma | **Escada de blocos.** Cada degrau é um bloco do bento que cresce quando escolhido; a home inteira é uma tela, e a escada é o próprio layout. |
| 2 | Crônica | **A tua escada, consertada.** Mesma ideia da rodada 1, agora curta e ocupando a tela: escada grande, texto grande, nada de vão. |
| 3 | Ábaco | **Escada com números.** Cada degrau mostra o dado vivo daquela etapa (ações no livro, dinheiro, módulos em cada estado), no estilo painel. |
| 4 | Maracatu | **Escada que se sobe.** Um personagem sem rosto sobe os degraus conforme a pessoa avança; cada degrau abre um cartão. Lúdico, com mola. |
| 5 | Pluma | **Escada em texto.** Degraus tipográficos, um passo por vez em letra grande, quase sem JavaScript: a escada é a própria hierarquia do texto. |

## Como entregar

1. Termine e commite a rodada 1 do jeito que estiver, com PR em rascunho se ainda não tem. Depois, no teu worktree: `git fetch -q && git switch -c variante/r2-vN-<codinome> origin/main`.
2. Mesma porta de antes, pro seletor em `localhost:4321` continuar funcionando: pare o servidor da rodada 1 e suba o da rodada 2 na mesma porta.
3. `design/variantes/r2-vN/README.md` com a ideia da escada em 5 linhas, **quantas telas a home ocupa em 1440 e em 360**, e prints desses dois tamanhos. Diário em `design/variantes/r2-vN/DIARIO.md`.
4. `npm run check` passando, PR em rascunho `F22 vN · <Codinome>`, e report: `maestri ask "Regente" "F22 vN pronta: <PR> + porta + telas em 1440/360"`.
