# F19 · Cinco variantes visuais

Donos: cinco agentes novos, um por variante · Branches `variante/vN-<nome>` · Worktrees `.worktrees/var-N`

## Por que agora

O Lucas olhou o site v1 e disse: não ficou ruim, mas **não atende ao estilo que a gente queria**. Em vez de ajustar o que existe, a gente abre cinco caminhos bem diferentes, cada um com abordagem, técnica e estilo próprios, pra ele achar o que acerta. Ganha quem acertar a direção, não quem fizer mais coisa.

O pedido original dele pro site: **interativo, bonito, por blocos, modular, cada parte do projeto bem separada, simples e fácil de entender**. Um hero que explica o projeto e a intenção, depois os módulos, como funciona, pontos fortes, gargalos, transparência total em primeiro lugar e as contribuições abertas ([PRD §7](../../PRD.md#7-site-v1), [spec 01](../../fontes/2026-09-22-spec-01.md) itens 23 a 25, [spec 02](../../fontes/2026-09-22-spec-02.md)).

## O que é igual pra todas

**Conteúdo e dados são os mesmos; muda o visual, o layout e a interação.**

- Páginas: home (`/`) e livro público (`/transparencia`). Pode mudar a ordem, o agrupamento e a forma dos blocos à vontade.
- Use os dados que já existem: `src/data/site/*.ts` (módulos, jornada, gargalos, contribuições, decisões, estados) e o livro real via `src/lib/ledger-view/source.ts`. O botão **Conferir** tem que continuar funcionando com o verificador da F08 (`src/scripts/verify.ts` mostra como).
- Pode mexer em: `src/components/**`, `src/styles/**`, `src/layouts/**`, `src/scripts/**`, `src/pages/index.astro`, `src/pages/transparencia.astro`, `public/fonts/**` (fonte OFL, servida do próprio site).
- **Não mexa** em `src/data/**`, `src/lib/**`, `scripts/**`, `.github/**`, `package.json` (se precisar de dependência, justifique no README da variante e me pergunte antes).
- Regras que não caem: faixa honesta de "em construção"; zero honesto no dinheiro; selo de estado em cada módulo; **nenhuma foto de pessoa, nada de mão estendida, papelão ou pobreza como ilustração**; toda ação aparece, quem é a pessoa não; PT-BR simples, sem travessão; contraste AA, teclado funcionando, 360px sem rolagem lateral; botão Ouvir onde fizer sentido.
- Orçamento de 60 KB por página é meta, não trava: se passar, diga quanto e por quê.

## As cinco direções

Cada uma tem que parecer de outro estúdio. Se durante o trabalho você achar uma saída melhor dentro da sua direção, vá, mas não escorregue pra direção de outra variante.

| N | Codinome | Agente | Direção | Técnica que a define |
|---|---|---|---|---|
| 1 | Prisma | Claude Opus 5.5 | **Premium tecnológico.** Nível Apple, Linear, Vercel. Grade *bento* de blocos, que é o "por blocos" literal, profundidade com luz e vidro sutil, tipografia sem serifa precisa, muito respiro, escuro e claro. | Bento grid, animações guiadas por scroll em CSS (`animation-timeline`), View Transitions entre home e livro |
| 2 | Crônica | Claude Opus 5.5 | **Editorial e narrativo.** A página conta a história de uma virada, em ritmo de revista (The Pudding, NYT, Folha especial). Serifa grande, ilustração em traço, sem foto. O leitor entende o projeto porque acompanha o caminho de alguém anônimo, degrau por degrau. | *Scrollytelling* com seções presas (`position: sticky`), ilustração SVG em linha que se desenha no scroll |
| 3 | Ábaco | Claude Opus 5.5 | **O livro é a página.** Transparência primeiro de verdade: a home abre com o livro vivo e os números, e a ideia se explica em volta dele. Estética de explorador de dados feita com gosto (Stripe, Etherscan, painel de status). Escuro, monoespaçada nos números. | Visualização de dados em SVG com os dados reais: fluxo do dinheiro (entrada até categorias), linha do tempo das ações, corrente de hashes navegável |
| 4 | Maracatu | Codex GPT-6-Astra | **Brasil vivo, pop e lúdico.** Cor quente e vibrante, formas geométricas brasileiras, personagens geométricos sem rosto, energia de marca como Nubank ou Duolingo. Alegre sem ser infantil. | Sistema de ilustração em SVG próprio, escada interativa que a pessoa "sobe", micro-interações com mola |
| 5 | Pluma | Codex GPT-6-Sol | **Claro e humano, mínimo.** Branco, uma cor de destaque, tipografia grande e calma, clareza de gov.uk ou das docs da Stripe. Confiança pela simplicidade: quase só texto, ícones de linha, voz em primeiro plano. | Tipografia fluida como estrutura, quase zero JavaScript, hierarquia só com tamanho, peso e espaço |

## Como trabalhar

1. Teu worktree já existe: `~/Projects/VidaNova/.worktrees/var-N`, na branch `variante/vN-<codinome>`. Rode `npm ci` nele.
2. Deixe o site rodando pro Lucas ver: `npx astro dev --host 127.0.0.1 --port 434N` (Prisma 4341, Crônica 4342, Ábaco 4343, Maracatu 4344, Pluma 4345). Se o servidor cair, suba de novo.
3. Pra olhar e tirar print, use **a tua bancada agent-bench** (workspaces 6 a 11), nunca o navegador do Lucas.
4. Anote no `design/variantes/vN/DIARIO.md` a cada marco. No fim, `design/variantes/vN/README.md` com o conceito em 5 linhas, o que você fez diferente e por quê, e prints 360px e 1440px da home e do livro em `design/variantes/vN/prints/`.
5. `npm run check` tem que passar (se o budget estourar, explique).
6. Commit, push e PR **em rascunho** pra `main`, com título `F19 vN · <Codinome>`. Ninguém integra até o Lucas escolher.
7. Reporte: `maestri ask "Regente" "F19 vN pronta: <PR> + porta + conceito em 2 linhas"`.

## Pronto quando

Home e `/transparencia` completas na tua direção, rodando na tua porta, Conferir funcionando, prints e README no lugar, PR em rascunho aberta e o Regente avisado.
