# F31 · Layout e UX, começando pelos cadernos

Dono: `prumo` (Prumo · Claude Opus 5.5, esforço xhigh) · Branches `prumo/f31-<assunto>` a partir da `main`, uma por PR · Worktree: `.worktrees/prumo` · Começo: 23/09/2026

## O que o Lucas disse

[Feedback de 23/09](../../fontes/2026-09-23-feedback-paletas-e-cadernos.md), com [print](../../fontes/prints/caderno-contribuir-2026-09-23.png): "o layout, o design da página e o UX ainda precisam de muito polimento, em muitos detalhes. Tem muita coisa que tá horrível ainda." O exemplo dele é o caderno de contribuições: "abre na metade da página, toda rasgada, com corte na página, com desalinhamento, com poluição de informação e densidade. E ainda exige um scroll terrível." D027.

## Onde está hoje

- A home acabou de ser limpa pra quem é leigo (F29, PR #66): um título, menu com quatro itens (Como funciona, Transparência, Como ajudar, Construir junto), a escada e o degrau enxuto. Leia `docs/frentes/F29-home-pra-leigo/DIARIO.md`: o que foi cortado, onde ficou cada coisa e duas decisões propostas.
- Direção visual: Crônica r2 (D018), a escada como home. O Lucas gosta dela. Você **melhora a execução**, não troca o estilo.
- Os cadernos são `dialog.sheet` (`src/components/cronica/Sheet.astro`, CSS `.sheet` no `site.css`): um painel de 64rem preso à direita, por cima da home escurecida. Em tela larga a home aparece cortada do lado esquerdo. São cinco: Construir junto, Peças (`#modulos`), Gargalos, Classificados (`#contribuicoes`) e Expediente (`#codigo-aberto`). Cada anúncio dos classificados empilha tipo, selo, título, resumo, módulo, "Destrava" e link de issue, com oito filtros em duas linhas.
- O Lucas usa navegador largo (o print dele tem uns 1920 px). Teste sempre em **1920×1080**, 1440×900, 960×600 e 360×780.

## O que fazer

1. **Primeira PR: como o detalhe abre.** Resolva o caderno pela raiz: nada de página cortada atrás, tudo alinhado numa grade só, o essencial na primeira tela do caderno e scroll curto. Você escolhe o caminho (tela inteira por cima, página própria com endereço, outro), e explica no DIARIO por que ele é o melhor pra quem é leigo e pra quem chega por link. Enxugue os anúncios: título, uma linha e uma ação, e o resto num clique. Os cinco cadernos seguem o mesmo padrão.
2. **Depois, a varredura.** Todas as páginas (home, cada degrau, cada caderno, `/transparencia`, 404) nos quatro tamanhos. Cada defeito vira uma linha no DIARIO com página, tamanho, o que está errado e a gravidade, e sai em PRs pequenas, pela ordem de gravidade. Alinhamento, espaçamento, hierarquia, densidade, rolagem e estados de foco e toque.
3. **Texto velho nas tarefas:** a issue #8 ainda fala de "A+" e a #7 fala de "convite por voz", e os dois saíram na D024. Reescreva as duas em `docs/contribuicoes/contribuicoes.json` e me mande o texto novo, que eu atualizo as issues no GitHub.

## Regras da frente

- **Cor só por token.** O Anil (F30, Fable) está refazendo as paletas em `src/styles/palettes.css` ao mesmo tempo. Esse arquivo é dele; se precisar de token novo, me avise. Confira teu trabalho também em `?cor=noite`, que inverte tudo.
- O botão "Cores · em teste" fica fixo embaixo à esquerda até o Lucas escolher a paleta. Não cubra ele nem deixe ele cobrir conteúdo.
- Texto público segue o `AGENTS.md`: frase curta, sem travessão, sem jargão na primeira camada.
- AA, teclado, `prefers-reduced-motion`, 360 sem rolagem lateral, `npm run check` e orçamento de 60 KB por página.
- Uma PR por causa, com prints de antes e depois nos tamanhos afetados, tirados na **tua bancada agent-bench** (workspaces 6 a 11). Nunca no navegador do Lucas.
- O checkout `~/Projects/VidaNova` é do Regente: não commite, troque branch, faça stash ou reset nele. DIARIO em `docs/frentes/F31-ux-cadernos/DIARIO.md`, atualizado a cada marco.

## Pronto quando

- **Por PR:** `npm run check` passa, os prints provam a melhora e o report chega: `maestri ask "Regente" "F31 <assunto> pronta: <PR>"`.
- **A frente:** o DIARIO não tem mais defeito de gravidade alta ou média aberto, e o Lucas abre qualquer caderno em 1920 e em 360 sem achar nada cortado, desalinhado ou denso.
