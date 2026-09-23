# F29 · Diário

## 23/09/2026 · Proposta (passo 1)

Branch `design/f29-home-leigo`, a partir da `main` em `bff3aaf`. Li o BRIEF, o feedback do Lucas, os prints de antes (`~/relatorios/pontape-2026-09-23/antes/`) e o código da home (`Escada.astro`, `Edicao.astro`, `SiteHeader.astro`, `StatusStrip.astro`, `SiteFooter.astro`, `journey.ts`, `home.ts`).

A ideia em uma linha: **a escada continua sendo a home, mas quem chega vê só uma frase, um apoio, dois botões e a escada.** Todo o resto vira segunda camada: o degrau aberto, ou um caderno novo "Construir junto" onde ficam as palavras de quem constrói.

### Primeira tela

**1440×900** (4 blocos):

1. **Cabeçalho:** logo + 4 itens (abaixo). Sem a faixa preta.
2. **Título, um só** (`h1`, grande, no canto livre em cima à esquerda): "O primeiro passo pra quem quer *mudar de vida.*" É a mesma frase do cartão de compartilhar.
3. **Apoio + botões:**
   - "A gente dá comida, roupa e higiene nos primeiros dias. E ajuda a achar trabalho. Tudo o que a gente faz fica à vista de qualquer pessoa."
   - Linha de obra, a única do site na home: ícone de cone + "**Ainda em construção.** Por enquanto, ninguém é atendido e nenhuma doação é recebida."
   - Botão principal "Ver como funciona" (sobe pro degrau 1) e secundário "Quero ajudar" (vai pro topo, "Sua vez").
4. **A escada**, do jeito que está, sem o painel de números no canto de cima à direita. Aquele canto fica vazio de propósito.

**360×780** (5 blocos), na ordem: cabeçalho (logo + Menu), título, escada mais baixa (de 44svh pra uns 30svh, pra caber tudo), apoio com a linha de obra, os dois botões. Conta feita: uns 670 px, sobra folga.

Quando a pessoa sobe um degrau, o título encolhe pra uma linha fina em cima e o título do degrau assume. Nunca ficam dois títulos grandes na tela.

### Menu (4 itens)

| Hoje | Proposta | Leva pra |
|---|---|---|
| Como funciona | **Como funciona** | degrau 1 |
| Livro público | **Transparência** | `/transparencia` (palavra que o povo conhece do Portal da Transparência) |
| Contribuir | **Como ajudar** | degrau "Sua vez" |
| Módulos, Gargalos | **Construir junto** | caderno novo `#construir` |

### Degrau aberto

**Passo k de 7** (fica, é palavra de gente) + título + uma ou duas frases + **uma linha "já funciona?"** em palavras, com a cor do estado (token `--status-*`), + um link discreto "Mais detalhes" que abre a ficha da peça (segunda camada, ali o jargão pode). Setas de anterior e próximo continuam.

Sai do degrau: chip "M3 Captação de candidatos" com selo, "Quem faz / O que falta / Ajude aqui" e o link da issue.

A linha "já funciona?" vai escrita à mão por passo no `journey.ts`, não derivada da peça. A peça M2 está "precisa de ajuda" por causa da doação, mas o livro, que é o que o degrau 7 conta, já funciona.

| # | Degrau hoje | Proposta (rótulo · título) | Já funciona? |
|---|---|---|---|
| 0 | Pontapé | **Início** | (o chão é a primeira tela) |
| 1 | Encontro | Encontro · Encontro | Ainda não começou. A gente precisa de quem já trabalha na rua. |
| 2 | Conversa | Conversa · Conversa por voz | Ainda não funciona. A IA ainda aprende a entender sotaque, gíria e barulho de rua. |
| 3 | Escolha | Escolha · Escolha | Ainda não funciona. A gente está decidindo como escolher de um jeito justo. |
| 4 | Primeiros dias | **Comida e roupa** · Comida, roupa e higiene | Ainda não começou. Depende de receber doação, e isso ainda não abriu. |
| 5 | Trabalho | Trabalho · Trabalho | Ainda não começou. Está no plano. |
| 6 | IA junto | **Apoio da IA** · Uma IA pra acompanhar | Ainda não começou. Está no plano. |
| 7 | Prova | **Tudo à vista** · Tudo à vista | Já funciona. O livro está no ar e qualquer pessoa confere. |
| 8 | Sua vez | Sua vez · Sua vez. *Tem lugar aqui.* | (quatro jeitos, abaixo) |

Texto novo do 7: "Tudo o que a gente faz fica anotado num livro aberto. Ninguém é exposto: aparece a conta, nunca o nome." E **os dois únicos números da home** ficam aqui, numa frase: "Até hoje: 47 ações anotadas e R$ 0 recebido. Abrir o livro."

"Sua vez": Doar, Ser voluntário e Oferecer vaga dizem "Ainda não abriu." com o motivo em uma frase. O quarto, "Contribuir", vira **"Construir junto: já dá pra ajudar"** e leva pro caderno novo. Some a palavra "classificados".

### Caderno novo "Construir junto" (`#construir`)

Uma porta com quatro entradas, cada uma abre o caderno que já existe:

- As 9 partes do projeto → `#modulos`
- O que a gente ainda não sabe resolver → `#gargalos`
- Tarefas abertas (hoje 17, 6 boas pra começar; o número vem dos dados) → `#contribuicoes`
- Código aberto → `#codigo-aberto`

Mais a nota técnica que hoje está no rodapé (licença, fontes, data do estado das peças). Os quatro cadernos de dentro não mudam.

### Vai pra um clique (ou dois)

| O que | Onde fica |
|---|---|
| Painel "Hoje, em números" | Os dois números no degrau 7; o resto já está no livro (`/transparencia`) |
| Faixa "Nesta edição" | Vira o caderno "Construir junto" |
| Chip da peça, Quem faz, O que falta, issue | Ficha da peça, pelo "Mais detalhes" do degrau (2 cliques) ou pelo caderno |
| Módulos, gargalos, tarefas, código | Menu → Construir junto → caderno (2 cliques) |
| Nota do rodapé (licença, fontes) | Caderno "Construir junto" |

### Sai de vez (repetido)

- O `h2` "A gente dá o primeiro passo *junto.*": repete o `h1`.
- A linha de etiquetas "O pontapé · Sem fins lucrativos · Código aberto · Tudo à vista": "tudo à vista" já está no apoio e "sem fins lucrativos" está no rodapé.
- A dica "Ou toque num degrau. No teclado, use as setas.": a escada já diz isso pro leitor de tela; pro leigo é ruído.
- "Quem faz" de cada degrau: repete o texto do degrau.
- A faixa preta "Em construção" **só na home**: a linha de obra no hero diz o mesmo. Em `/transparencia` e na 404 ela fica até a frente do livro.
- Rodapé: "Quando tiver CNPJ" vira "Quando tiver registro oficial, o número aparece aqui".

### Teste do leigo (onde está cada resposta)

1. **O que é isso?** O título e a primeira frase do apoio.
2. **Por que confiar?** A segunda frase do apoio ("fica à vista de qualquer pessoa") e o item "Transparência" do menu.
3. **O que eu faço agora?** Os dois botões: "Ver como funciona" e "Quero ajudar".
4. **Já funciona?** A linha de obra, colada nos botões.

### Pro código, quando a F27 entrar

- Cor só por token (F28). Nada fixo no canto de baixo à esquerda.
- Arquivos: `Escada.astro`, `SiteHeader.astro`, `home.ts` (hash `construir`), `journey.ts` (rótulos e `now`), `Edicao.astro` vira `Construir.astro`, `SiteFooter.astro`, `BaseLayout.astro` (prop pra esconder a faixa na home), `site.css`.
- Peso da home tem que cair: sai o painel de números, a faixa e o bloco de voz.

### Onde parei

Proposta mandada pro Regente. Próximo passo: esperar o OK e o aviso da F27, fazer `git fetch && git rebase origin/main` e começar pelo `journey.ts` e pelo caderno "Construir junto", que a F27 não toca.
