# F37 · A escada começa pelo sistema

Dono: `design` (Design/UI · Claude Opus 5.5, esforço xhigh) · Branch: `design/f37-sistema-primeiro` a partir da `main` · Worktree: `.worktrees/design` · Começo: 23/09/2026

Você começou uma conversa nova às 13:04 (o Lucas pediu pra reiniciar todo mundo). O que você fez antes está nos DIARIOs da [F29](../F29-home-pra-leigo/DIARIO.md) (a home pro leigo) e da [F32](../F32-transparencia-pra-leigo/DIARIO.md) (a transparência). Leia a F29 antes de começar: é o mesmo tipo de trabalho.

## O que o Lucas disse

[Feedback das 13:15](../../fontes/2026-09-23-feedback-sistema-primeiro.md), com [print da home](../../fontes/prints/home-ordem-2026-09-23.png). D032.

- "A nossa lógica de ordem de prioridades está errada." A home abre com "A gente dá comida, roupa e higiene nos primeiros dias. E ajuda a achar trabalho."
- "O início de tudo é filtrar": escolher o candidato certo, "porque a gente não tem recursos infinitos". A IA ajuda "desde o começo a selecionar as pessoas que têm a maior capacidade e desejo de evolução", por parâmetros que a gente vai definir com muita pesquisa. No site, "resumido, pra continuar no formato que está".
- "Esse sistema, com a IA e com transparência, é a base de tudo." A IA e a transparência são os diferenciais.
- A escada começa nisso: "não seria bem escolha, mas seria tipo sistema".
- Depois vem achar a pessoa: "não vai ser Encontro, tem que ter outra palavra correta, mas é pra encontrar a pessoa mesmo".
- O fim do áudio embolou (ele falava de "pontos" onde a gente acha a pessoa). Eu pergunto pra ele; enquanto isso, trabalhe com o que está claro.

## Onde está hoje

- A ordem mora em `src/data/site/journey.ts` (`STEPS`): Encontro, Conversa, Escolha, Comida e roupa, Apoio da IA, Trabalho, Tudo à vista. Cada passo tem nome curto, título, texto e o "já funciona?" (`now`, com `NOW_LEAD`).
- A frase de abertura da home está no `Escada.astro`, no painel do degrau 0.
- O PRD §4 tem a mesma ordem (Descoberta, Entrevista, Seleção, Ponte inicial, Apoio da IA, Trabalho, Prova). O PRD é meu: a mudança vai proposta no DIARIO e eu edito.
- A seleção ainda não existe. Os parâmetros ainda vão ser pesquisados (F05, na fila) e quem decide a escolha no fim está em aberto (PRD §10, pergunta 6). Fale disso como "vai" ou "a gente está montando", nunca como coisa pronta.

## O que fazer

1. **Proposta curta primeiro**, em `docs/frentes/F37-sistema-primeiro/DIARIO.md`:
   - a ordem nova da escada, com o sistema no primeiro degrau;
   - três opções de nome no lugar do Encontro, com o critério do Lucas ("é pra encontrar a pessoa mesmo");
   - a frase de abertura nova da home, em que o sistema (a IA que escolhe com cuidado, e tudo à vista) é a base, e a comida, a roupa e o trabalho vêm depois;
   - o texto curto e o "já funciona?" de cada degrau que muda;
   - a mudança que você propõe no PRD §4.

   Mande `maestri ask "Regente" "F37 proposta: <resumo>"`. Eu levo a ordem e o nome pro Lucas; pode seguir pro código enquanto isso, mas a PR só entra com o OK dele.
2. **Formato igual.** A escada continua com os mesmos sete passos mais Início e Sua vez, o mesmo tamanho de texto e o degrau enxuto da F29. Muda a ordem, os nomes e as palavras, não o tamanho.
3. **Procure a ordem velha no site todo**, não só na home: `/transparencia`, as páginas do Construir, o texto `sr-only` da escada, a imagem de compartilhar, os testes (`site-data.test.ts`). Liste no DIARIO o que mudou em cada lugar.
4. **Divida o trabalho com o Prumo.** Ele está na [F36](../F36-escada-meio-termo/BRIEF.md) ao mesmo tempo, mexendo no layout da escada (`site.css`, a estrutura do `Escada.astro`, o enquadramento, os nomes e a linha da IA). Tua parte é o conteúdo: `journey.ts`, a frase de abertura, os textos. A linha da IA começa no passo da escolha; com o sistema no primeiro degrau, ela passa a começar lá. Combinem com `maestri ask "Prumo" "..."` como marcar isso no dado do passo, e não por posição. Quem abrir a PR depois faz rebase na `main`.

## Regras

- Texto público segue o `AGENTS.md`: frase curta, sem travessão, sem jargão, sem rebaixar ninguém. Escolher "o candidato certo" é critério do projeto; no site, fale de quem mais quer mudar de vida, sem fazer ninguém se sentir descartado.
- Cor só por token. AA, teclado, 360 sem rolagem lateral, `npm run check`, orçamento de 60 KB.
- O checkout `~/Projects/VidaNova` é do Regente: não commite, troque branch, faça stash ou reset nele.
- Prints na **tua bancada agent-bench** (workspaces 6 a 11). Ao terminar, pare teus servidores e tua bancada.

## Pronto quando

1. A escada abre pelo sistema, na ordem e com os nomes que o Lucas aprovou, e a frase de abertura da home diz primeiro que a IA ajuda a escolher com cuidado e que tudo fica à vista.
2. Nenhum lugar do site conta a ordem velha.
3. PR `F37 · A escada começa pelo sistema`, com prints de antes e depois em 1920×914 e em 360, e o report: `maestri ask "Regente" "F37 pronta: <PR>"`.
