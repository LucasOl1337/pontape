# F29 · Home que um leigo entende

Dono: `design` (Design/UI) · Branch: `design/f29-home-leigo` a partir da `main` · Worktree: `.worktrees/design` · Começo: 23/09/2026

## O que o Lucas disse

[Feedback de 23/09](../../fontes/2026-09-23-feedback-home.md), com [print](../../fontes/prints/home-2026-09-23.png): "tá muito poluído ainda. Uma pessoa leiga, uma alta porcentagem da população, não vai entender quando entrar aqui. Muita densidade." Ele quer polir o visual **e a lógica do que está sendo apresentado e como**.

A direção continua a da D018 (Crônica r2): a escada é a home, grande, com o detalhe num caderno por cima. Não é trocar de estilo, é **limpar e reordenar**.

## O que o Regente viu no site no ar

Prints em 1440 e 360 em `~/relatorios/pontape-2026-09-23/antes/`. Na primeira tela em 1440 tem uns doze blocos brigando:

- faixa preta "Em construção" + menu com cinco itens de jargão (Módulos, Livro público, Gargalos) + A+;
- **dois títulos**: o `h1` "PontaPé: o pontapé inicial…" e logo abaixo o `h2` gigante "A gente dá o primeiro passo junto", com uma linha de etiquetas no meio ("O PONTAPÉ · SEM FINS LUCRATIVOS · CÓDIGO ABERTO · TUDO À VISTA");
- bloco do Ouvir (sai na F27), botão + dica em itálico;
- painel "Hoje, em números" com quatro zeros e uma nota;
- a escada com nove degraus rotulados;
- faixa "Nesta edição" com 9 peças, 5 gargalos, 17 tarefas, livro e código.

Cada degrau aberto soma: "Passo 1 de 7", um chip "M1 Site público" com selo, título, texto e uma lista "Quem faz / O que falta / Ajude aqui" com link de issue. É conteúdo de quem constrói o projeto, na frente de quem só quer entender.

## O que tem que dar certo

**O teste do leigo:** alguém que lê pouco olha a primeira tela por dez segundos (ou ouve alguém ler em voz alta) e sabe responder:

1. O que é isso? (ajuda quem quer recomeçar a vida: comida, roupa, higiene, trabalho)
2. Por que confiar? (tudo fica à vista de qualquer um)
3. O que eu faço agora? (ver como funciona, ou ajudar)
4. Já funciona? (ainda não; está sendo construído)

Direção pra chegar lá, que você pode refinar:

- **Um título só**, uma frase de apoio, um botão principal e um secundário. Um jeito só de dizer "ainda em construção", curto.
- **Palavras de gente**, não de projeto. Na primeira camada (sem clicar) não aparece: módulo, peça, M1…M9, gargalo, edição, classificados, expediente, issue, repositório, hash, CNPJ. Quem precisa dessas palavras (quem vai construir junto) acha com um clique, num lugar próprio tipo "Pra quem quer construir junto".
- **Degrau aberto = título + uma ou duas frases + se já funciona**, em palavras. "Quem faz / O que falta / Ajude aqui", chip do módulo e link de issue saem da primeira camada.
- **Números:** no máximo dois na home, numa frase que um leigo entende; o resto fica no livro.
- **Menu com três ou quatro itens** de linguagem simples. Os cadernos de módulos, gargalos, tarefas e código aberto continuam existindo, só saem do caminho de quem é leigo.
- O resto do que já existe continua alcançável em até dois cliques. Cortar conteúdo de vez é permitido quando for repetido; liste no DIARIO o que cortou.

## Como fazer

1. **Proposta primeiro, curta:** no DIARIO, o mapa da nova home (o que fica na primeira tela em 1440 e em 360, o que vai pra um clique, o que sai) e as palavras novas do menu e dos degraus. Mande o resumo: `maestri ask "Regente" "F29 proposta: <resumo>"`. O Regente responde rápido; enquanto isso, pode seguir.
2. **Código depois que a F27 entrar na `main`** (o EngenheiroFino está tirando o Ouvir e o A+ agora; o Regente avisa). Faça `git fetch && git rebase origin/main` antes de mexer em `Escada.astro`, `SiteHeader.astro` e `site.ts`.
3. **Cor só por token.** A F28 (ExecutorBruto) está fazendo paletas trocáveis por `html[data-palette]` ao mesmo tempo; nenhuma cor nova escrita direto no CSS ou no componente, senão ela não troca. O seletor de paletas fica fixo no canto de baixo à esquerda, fora do cabeçalho; não ponha nada fixo ali.
4. Texto público segue o `AGENTS.md`: frase curta, sem travessão, sem jargão, sem rebaixar ninguém.

## Pronto quando

1. Primeira tela em 1440×900 e em 360×780 com **no máximo cinco blocos** (contando cabeçalho), um título só, e nenhuma das palavras da lista acima visível sem clicar.
2. O teste do leigo escrito no DIARIO: as quatro perguntas e onde, na primeira tela, está cada resposta.
3. Nada do que existe ficou inalcançável sem registro no DIARIO; escada navegável por teclado e toque; AA; 360 sem rolagem lateral; `npm run check` passando; peso da home menor ou igual ao de hoje.
4. PR `F29 · Home que um leigo entende` com prints antes e depois em 1440 e 360 (primeira tela e um degrau aberto) e report: `maestri ask "Regente" "F29 pronta: <PR>"`.

## Fila depois desta

O topo do livro (`/transparencia`) passa pelo mesmo teste do leigo, numa frente própria, depois que o Lucas aprovar a home.
