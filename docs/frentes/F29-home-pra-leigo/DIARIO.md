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

### Onde parei (manhã)

Proposta mandada pro Regente. Próximo passo: esperar o OK e o aviso da F27, fazer `git fetch && git rebase origin/main` e começar pelo `journey.ts` e pelo caderno "Construir junto", que a F27 não toca.

## 23/09/2026 · OK do Regente

Aprovada. "Transparência" no menu e a faixa preta saindo só da home, os dois confirmados. Três cuidados pedidos: o `h1` que encolhe não pode empurrar a escada; "Escolha" sem cara de peneira; a frase de "já funciona?" tem que bater com o estado da peça em `modules.ts`, amarrada por teste. Depois vieram mais dois avisos: a F28 (paletas) entrou e o botão "Cores" fica fixo embaixo à esquerda; e a issue #6 (testar o botão Ouvir) fechou com a D024.

## 23/09/2026 · Feito

Rebaseado em cima da F27 (#63) e da F28 (#64). Um conflito só, no `site.css`, entre a faixa "Nesta edição" (que a F28 tinha passado pros tokens novos) e o caderno novo; ficou o caderno.

**O que mudou em relação à proposta**

- **Degrau 7 diz "Precisa de ajuda", não "Já funciona".** A frase de cada degrau agora começa com as palavras do estado da peça (`NOW_LEAD` em `journey.ts`), e o teste em `site-data.test.ts` falha se não bater ou se aparecer a palavra de outro estado. A M2 está "precisa de ajuda" por causa da doação, então o 7 ficou: "Precisa de ajuda. O livro já está no ar. Falta poder receber doação, e isso pede uma conta oficial." Outro teste barra o jargão de quem constrói no texto da jornada.
- **Escolha:** "A pessoa escolhe se quer participar. Depois da conversa, alguém da equipe confirma a entrada, com ajuda da IA." e "Precisa de ajuda. Como fazer essa escolha de um jeito justo ainda está em decisão." Sem "filtra", sem "quem está pronto".
- **Título sem empurrar a escada:** no largo a escada fica fora do fluxo (posição absoluta) e o título e o degrau correm por cima dela; o título encolhe ao subir e só o degrau sobe junto. No estreito o título não muda de tamanho, então a escada embaixo dele nunca pula.
- **Botão "Cores" (F28):** a primeira tela termina 4,5rem acima do fim da janela quando o botão existe (`--dock-h`). Em 1440 o "Início" fica acima do botão; em 360 os dois botões ficam acima da barra, com uns 30 px de folga. Na main de hoje o botão cobre o começo da faixa "Nesta edição" (print `antes-1440-inicio.png`).
- **Issue #6** saiu de `docs/contribuicoes/contribuicoes.json`. Agora são 16 tarefas, 5 boas pra começar. O caderno lê o número dos dados.
- **"Sua vez":** "Contribuir" virou "Construir junto", com "Já dá pra ajudar." e o link "Ver como" pro caderno. Os três que não abriram dizem "Ainda não abriu." e quando abre.
- Some o `STATUS_DATE_SPOKEN` de `project.ts`, que era do Ouvir (pedido do Regente). O campo `who` saiu de `journey.ts`.

**Cortado de vez (repetido)**

| O que | Por quê |
|---|---|
| `h2` "A gente dá o primeiro passo *junto.*" | Repetia o `h1` |
| Etiquetas "O pontapé · Sem fins lucrativos · Código aberto · Tudo à vista" | "Tudo à vista" está no apoio e no degrau 7; "sem fins lucrativos" está no rodapé; "código aberto" no caderno |
| Dica "Ou toque num degrau. No teclado, use as setas." | O rótulo da escada já diz isso pra leitor de tela |
| "Quem faz" de cada degrau | Repetia o texto do degrau |
| "Aqui nunca vai ter número inventado." | O livro já diz "Zero real porque a doação ainda não abriu" |
| Link "Por quê" do Doar (ia pro gargalo da doação) | O motivo agora está na própria frase ("Abre quando tiver conta oficial") |
| Faixa preta na home | A linha de obra do chão diz o mesmo |

**Continua alcançável (nada sumiu sem registro)**

| O que | Como chegar |
|---|---|
| Entrou, ações no livro | Degrau 7, numa frase (os dois únicos números da home) |
| Saiu, marca mais recente | `/transparencia` (menu "Transparência"), 1 clique |
| Pessoas atendidas: 0 | A linha de obra: "ninguém é atendido" |
| Peça do degrau, estado, o que falta, quem pode ajudar | "Mais detalhes" no degrau, 2 cliques |
| As 9 peças, gargalos, tarefas, código aberto | Menu "Construir junto" e o caderno, 2 cliques; também pelo link do rodapé |
| Link da issue de cada degrau | Construir junto → Tarefas abertas, 2 cliques |
| Licença, fontes, data do estado das peças | Rodapé do caderno "Construir junto" |

**Teste do leigo, na primeira tela (1440 e 360)**

1. **O que é isso?** Título "O primeiro passo pra quem quer *mudar de vida.*" e a primeira frase: "A gente dá comida, roupa e higiene nos primeiros dias. E ajuda a achar trabalho."
2. **Por que confiar?** "Tudo o que a gente faz fica à vista de qualquer pessoa." e o item "Transparência" do menu.
3. **O que eu faço agora?** "Ver como funciona" e "Quero ajudar".
4. **Já funciona?** "Ainda em construção. Por enquanto, ninguém é atendido e nenhuma doação é recebida.", colado nos botões.

Blocos: 1440 tem quatro (cabeçalho, título, apoio com obra e botões, escada). 360 tem cinco (cabeçalho, título, escada, apoio com obra, botões).

**Verificação**

- `npm run check` passa: lint, `astro check` sem erro, 135 testes, livro íntegro, build, orçamento.
- Peso da home (gzip, HTML + CSS + JS): **27,1 KB na main → 26,7 KB**. HTML cru: 81.476 → 78.825 bytes.
- Na bancada `pontape-f29-design` (workspace 7), 1440×900 e 360×780: `document.body.innerText` da home inteira, rodapé incluso, sem nenhuma palavra da lista do brief e sem travessão. Em 360, `scrollWidth` = 360 (sem rolagem lateral). Setas, Home e End andam na escada (0→1→2→3, End→8, ←7, Home→0) com o foco no degrau certo. Menu do celular abre com os quatro itens. "Mais detalhes" abre a ficha da peça. `#construir` abre o caderno.
- Paleta Noite (`?cor=noite`) conferida em 1440 e 360: tudo por token, nada fixo. As cores da linha "já funciona?" são as `--status-*`, que o teste da F28 já cobre com 4,5:1 em todas as paletas.
- `/transparencia` com o menu novo, "Transparência" marcado e a faixa preta mantida.

Prints em `prints/`: `antes-*` é a main com F27 e F28, `depois-*` é esta branch; 1440 e 360, primeira tela (`inicio`) e degrau 2 aberto (`degrau2`).

### Decisões propostas

- Quando entrar o primeiro real, voltar uma frase de número pro chão ("R$ X recebido, R$ Y gasto até hoje"). Hoje, com tudo zero, ela só pesava.
- A faixa preta das outras páginas ainda aponta "Ver o que já existe" pra `/#modulos`, que abre um caderno de quem constrói. Na frente do livro vale trocar pra `/#como-funciona`.

### Onde parei

PR aberta pra `main` e report mandado pro Regente. Próximo passo, se ele pedir: ajustes da revisão. Depois disso, o topo do livro passa pelo mesmo teste (fila do BRIEF).
