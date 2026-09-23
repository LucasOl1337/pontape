# F31 · Diário

## 23/09/2026 · PR 1: como o caderno abre

Branch `prumo/f31-cadernos`, a partir da `main` em `13bba7d`. Li o BRIEF, o feedback do Lucas com o print, o DIARIO da F29 e o código dos cadernos (`Sheet.astro`, os cinco cadernos, `home.ts`, `site.css`). Bancada `prumo-f31`, workspace 6, Chromium com `lives_in: prumo-f31`.

### O que estava errado (medido na main, na bancada)

| Tamanho | O que acontecia |
|---|---|
| 1920 | O painel de 64rem fica preso à direita; a home escurecida aparece cortada na esquerda, com o título pela metade. O logo da home está em x=369 e o painel começa em x=882: nada se alinha. |
| 1440 | Mesmo corte. O caderno de tarefas pede 1,2 tela de rolagem dentro do painel, com a página de trás também rolável. |
| 960 | O painel tem `width:100vw`, que conta a barra de rolagem: ele fica **14 px pra fora da tela à esquerda** e a borda some. Tarefas: 2 telas de rolagem. |
| 360 | Tarefas: 2,8 telas. Oito filtros em quatro linhas antes do primeiro anúncio. |
| Todos | Cada anúncio empilha tipo, selo, título, resumo, módulo, "Destrava" e "Issue #": três linhas de texto miúdo com dois ou três links sublinhados. As colunas do jornal (`columns`) deixam os anúncios em alturas desencontradas e a ordem de leitura desce coluna por coluna. O menu fica escondido embaixo do escurecido. O botão Voltar do navegador sai do site em vez de fechar o caderno. Sem JS, os cinco cadernos aparecem empilhados no fim da home. |

Prints em `prints/antes-*`.

### O caminho: cada caderno vira uma página com endereço

| Caderno | Antes | Agora |
|---|---|---|
| Construir junto (a porta) | `/#construir` | `/construir` |
| As 9 partes do projeto | `/#modulos` | `/construir/pecas` |
| O que a gente ainda não sabe resolver | `/#gargalos`, `/#gargalo-<id>` | `/construir/gargalos`, `/construir/gargalos#<id>` |
| Tarefas abertas | `/#contribuicoes` | `/construir/tarefas` |
| Código aberto | `/#codigo-aberto` | `/construir/codigo-aberto` |

**Por que é o melhor pra quem é leigo:**

- É o jeito mais conhecido da internet: clicou, abriu uma página; apertou Voltar, voltou. No painel, o Voltar do navegador tirava a pessoa do site.
- Uma rolagem só, a da página. Acabou a rolagem dentro de um painel por cima de outra página que também rola.
- O menu fica sempre à vista, com "Construir junto" marcado. Acima do título, uma linha diz onde a pessoa está: "Construir junto › Tarefas", com o primeiro nome clicável.
- Nada atrás pra aparecer cortado. O título, os filtros, a lista e o rodapé começam na mesma linha vertical do logo, em todos os tamanhos (conferido: `h1.left == logo.left` em 1920, 1440, 960 e 360).

**Por que é o melhor pra quem chega por link:**

- `pontape.org/construir/tarefas` abre direto na página, com nome próprio na aba e na prévia do link. Antes, `/#contribuicoes` carregava a home inteira e só depois o JS abria o painel por cima.
- Funciona sem JS.
- Os links velhos continuam valendo: um script pequeno no `<head>` da home manda `/#modulos`, `/#contribuicoes`, `/#gargalo-escolha-justa` etc. pro endereço novo antes de pintar a home, mantendo `?cor=`. Conferido na bancada: `/?cor=noite#gargalo-escolha-justa` cai em `/construir/gargalos?cor=noite#escolha-justa`, com a pergunta 4 aberta e o foco nela.

**O que considerei e deixei de lado:** tela inteira por cima (resolve o corte, mas mantém o Voltar quebrado, o menu escondido, a rolagem dentro do painel e a chegada por link que passa pela home). A ficha da peça continua um diálogo pequeno no meio da tela: é uma olhada rápida a partir de um degrau, não corta nada e tem Anterior e Próxima.

### O padrão dos cinco

Todos usam `Caderno.astro` (no lugar de `Sheet.astro`): onde a pessoa está, título no estilo da Crônica (a frase com o final em itálico vermelho), uma frase de apoio, régua dupla, o conteúdo, e no fim "Mais por dentro do projeto" com as outras três portas. A porta (`/construir`) mostra as quatro com a descrição. Os nomes e endereços saem de um lugar só, `src/data/site/cadernos.ts`.

- **Tarefas:** cada anúncio agora tem uma linha miúda de tipo e "Boa pra começar", o título, uma frase e uma ação ("Ver a tarefa no GitHub"). O cartão inteiro é o link, com o foco desenhado em volta do cartão. As ações se alinham embaixo em cada linha da grade (grade de verdade, não colunas de jornal). Os oito filtros viram dois controles: "Todas / Boas pra começar" e um seletor "Assunto", que agora combinam (antes era um ou outro). Aparece quantas tarefas o filtro achou, falado pro leitor de tela. As boas pra começar vêm primeiro; "Todas" mostra seis e o botão "Mostrar as outras 10". Sem JS, tudo aparece e os filtros somem.
- **Peças:** sai a barra de cinco filtros e a nota embaixo dela. Com nove peças, a lista inteira já cabe em 1,15 tela em 1920. O que cada selo quer dizer foi pra "O que quer dizer cada selo" (um clique) e pra dentro da ficha. Entre 760 e 1200 px o selo desce pra baixo do resumo, pro nome não ficar espremido.
- **Gargalos:** as cinco perguntas começam fechadas, então a lista inteira cabe na primeira tela em 1920 e 1440. Aberta, cada pergunta mostra as tarefas dela ("Tarefas pra isso", cada uma com link) e "Tem uma ideia? Conte no GitHub", que abre o modelo de issue "Ideia para um gargalo".
- **Código aberto e a porta:** mesmo conteúdo, no molde novo.

### Onde ficou cada coisa

| O que | Onde está agora |
|---|---|
| Tipo e "bom primeiro passo" do anúncio | Linha miúda no topo do cartão, como antes |
| "Destrava: <gargalo>" | Invertido: cada pergunta em `/construir/gargalos` lista as tarefas dela. Também está na issue |
| Módulo (M1, M2…) do anúncio | Na issue, a um clique. No site era jargão sem explicação |
| "Issue #7" | Virou "Ver a tarefa no GitHub" |
| "Pegar uma tarefa abre junto com o repositório" (selo "Ainda não abriu") | Estava errado desde a D020: o repositório abriu. Virou "Pra pegar uma tarefa, deixe um comentário na página dela no GitHub. Toda mudança passa pela revisão de um admin antes de entrar." |
| "Dar uma ideia abre junto com o repositório" (gargalos) | Mesmo motivo. Virou o link "Conte no GitHub" |
| Filtros de estado das peças | Saíram; o resumo em frase ("uma funcionando, duas em construção…") fica no apoio |
| Significado de cada selo | "O que quer dizer cada selo" e na ficha da peça |
| Kicker de cada caderno ("Classificados", "Os módulos", "Expediente") | Virou "Construir junto › Peças / Gargalos / Tarefas / Código aberto" |

### Verificação

- `npm run check` passa: lint, `astro check` sem erro, 137 testes (dois novos: todo link antigo leva a uma página que existe, e todo caderno mora em `/construir`), livro íntegro, build (8 páginas, CSP com 7 hashes), orçamento.
- **Peso da home: 26,8 KB → 22,6 KB** (gzip, HTML + CSS + JS). HTML cru: 78.903 → 45.912 bytes, porque os cinco cadernos saíram dela. Páginas novas entre 16,6 e 20,4 KB, todas no `check-budget.mjs`.
- Home sem mudança visível: em 1440, "Sua vez" aberto, zero pixel diferente da main; em 360, 21 pixels (a bolinha anima).
- Na bancada, 1920×1080, 1440×900, 960×600 e 360×780: nenhuma rolagem lateral em 360 (`scrollWidth` = 360); título alinhado com o logo em todos; filtros ("Todas" 6, "Boas pra começar" 5, "+ Jurídico" 0 com o aviso, "+ Design" 3); "Mostrar as outras" mostra as 16 e leva o foco pra primeira nova; Tab percorre os cartões com o foco em volta do cartão; sem JS, 16 tarefas e nenhum controle morto; ficha da peça abre na lista e por `/#m3`; `/transparencia` aponta pros endereços novos; menu marca "Construir junto" (`aria-current="page"` na porta, `"true"` dentro).
- Paleta Noite conferida em 1920 e 360: tudo por token, nada fixo. Nenhum token novo.

Quanto rola até o fim do caderno (sem o rodapé do site), em telas:

| Caderno | 1920 | 1440 | 960 | 360 |
|---|---|---|---|---|
| Tarefas | 1,07 | 1,28 | 2,23 | 2,95 |
| Porta | 0,60 | 0,72 | 1,13 | 1,35 |
| Peças | 1,15 | 1,38 | 2,50 | 2,74 |
| Gargalos | 0,92 | 1,10 | 1,66 | 1,56 |
| Código aberto | 0,98 | 1,18 | 1,82 | 2,06 |

Essas contas incluem a faixa preta, o cabeçalho e as três portas do fim, que o painel não tinha. Em 360 a faixa preta sozinha ocupa três linhas (uns 100 px): é o primeiro item da varredura.

Prints em `prints/`: `antes-*` é a main em `13bba7d`, `depois-*` é esta branch. Tarefas nos quatro tamanhos; os outros em 1920 e 360; mais filtro aplicado, ficha da peça, gargalo aberto por link e a paleta Noite.

### Defeitos anotados pra varredura (passo 2)

| Página | Tamanho | O que está errado | Gravidade |
|---|---|---|---|
| Home | 1920 | O título e a escada começam em x=40, e o logo do cabeçalho em x=369. A home não segue a grade do cabeçalho em tela larga | média |
| Todas menos a home | 360 | A faixa preta "Em construção" ocupa três linhas, uns 100 px da primeira tela | média |
| `/transparencia` | 1920 | O livro (`.book`) não tem largura máxima: ocupa a tela inteira enquanto o cabeçalho fica em 78rem. A conferir | média |
| Todas | ≤1440 | O botão "Cores" cobre o começo da coluna de conteúdo ao rolar; em 1440×900, a borda do "Mostrar as outras 10" fica embaixo dele na primeira tela | baixa (o botão é temporário) |

### Decisões propostas

- `docs/design/MAPA-DO-SITE.md` ainda lista `#modulos`, `#gargalos`, `#contribuicoes` e `#codigo-aberto`. Os links funcionam (redirecionam), mas o mapa devia ter os endereços novos. É da frente de design.
- O modelo de issue "Ideia para um gargalo" manda a pessoa escolher o gargalo no `MAPA-DO-SITE.md` do repositório antigo. Pode apontar pra `pontape.org/construir/gargalos`.
- As páginas novas usam a imagem de compartilhar da home. Se o Lucas quiser, dá pra desenhar uma pra "Construir junto" no mesmo gerador das outras duas.
- A F29 propôs trocar o "Ver o que já existe" da faixa preta pra `/#como-funciona`. Por ora ele aponta pra `/construir/pecas`, que é onde estava indo.

### Onde parei

PR #67 integrada pelo Regente. Ele consertou o modelo de issue "Ideia para um gargalo" e me passou o `MAPA-DO-SITE.md`. A home fora da grade em 1920 sobe pra gravidade **alta**: é a tela do Lucas.

## 23/09/2026 · PR 2: tarefas #7 e #8 e o mapa do site

Branch `prumo/f31-tarefas-mapa`, a partir da `main` em `511da33`.

### Tarefas #7 e #8 (passo 3 do brief)

As duas falavam de coisas que saíram na D024: a #7 do "convite por voz" e a #8 do "A+". Em `docs/contribuicoes/contribuicoes.json`:

- **#7** mantém o título. Resumo novo: "Ler a home e os degraus em voz alta e propor frases mais curtas onde a leitura trava." O gargalo vira `null`: desde a D024, a voz pra quem não lê está na entrevista (M4), não no site, e em `/construir/gargalos` a tarefa aparecia embaixo de "Conversar com quem não lê", o que confundia.
- **#8** muda o título pra "Verificar o site só com teclado e com zoom" (o catálogo exige título idêntico ao da issue). Resumo: "Usar a home, o livro e as páginas de Construir junto só pelo teclado e com zoom de 200%."

Texto pro Regente atualizar as issues no GitHub. Labels continuam as mesmas.

**#7 · Revisar o texto da home lendo em voz alta**

```markdown
## Contexto

- A home é uma escada: o Início, sete passos e "Sua vez". Cada passo tem um título, uma ou duas frases e uma linha que diz se já funciona.
- O texto precisa servir pra quem lê pouco. Se trava lido em voz alta, está difícil.
- Nenhuma frase pode prometer o que ainda não abriu.

## Como ajudar

Leia em voz alta o Início, os sete passos e "Sua vez". Onde a leitura travar, anote o degrau, o texto de hoje e uma versão mais curta. Use só exemplos inventados.

## Pronto quando

A revisão cobre os nove degraus, com o motivo de cada troca, sem mudar o estado real das peças.

## Documentos

- https://github.com/LucasOl1337/pontape/blob/main/docs/design/MAPA-DO-SITE.md
- https://github.com/LucasOl1337/pontape/blob/main/src/data/site/journey.ts

> Use somente exemplos fictícios e não publique dados pessoais, contatos, voz, fotos ou comprovantes originais.
```

**#8 · Verificar o site só com teclado e com zoom**

```markdown
## Contexto

- O site tem a escada da home (anda com as setas, Home e End), a ficha de cada peça, o livro público com filtros e o botão Conferir, e as páginas de Construir junto, com filtros e perguntas que abrem e fecham.
- Tudo isso precisa funcionar sem mouse e com o texto grande.

## Como ajudar

Percorra a home, `/transparencia` e as páginas de `/construir` só com o teclado. Depois repita com zoom de 200% no navegador e no celular. Pra cada problema, anote a página, o componente, os passos, o que você esperava e o que aconteceu. Um print sem dado pessoal ajuda.

## Pronto quando

Existe uma lista do que foi verificado e uma issue que dá pra reproduzir pra cada problema. Em tela estreita, nada some e todo controle mostra onde está o foco.

## Documentos

- https://github.com/LucasOl1337/pontape/blob/main/docs/design/MAPA-DO-SITE.md

> Use somente exemplos fictícios e não publique dados pessoais, contatos, voz, fotos ou comprovantes originais.
```

### Mapa do site

`docs/design/MAPA-DO-SITE.md` reescrito do zero, versão 0.3, curto: as páginas com endereço e pra quem são, o que vale em todas, a escada degrau por degrau, o livro, os cinco de Construir junto num molde só, as âncoras de cada página, a tabela dos endereços antigos que redirecionam, os selos e as regras. A versão 0.2 (blocos empilhados, Ouvir, A+, "Ainda não abriu" no repositório) ficou no histórico do git. Tirei a coluna "Hoje" dos selos: o estado de cada peça mora em `modules.ts` e a tabela ficava velha.

`docs/contribuicoes/README.md` apontava o campo `bottleneck` pra seção 06 do mapa antigo e as issues pro endereço do repositório antigo. Agora aponta pra `/construir/gargalos` e `bottlenecks.ts`, e pro `LucasOl1337/pontape`.

### Onde parei

PR #68 integrada; o Regente atualizou as issues #7 e #8 com o texto acima.

## 23/09/2026 · PR 3: uma grade só em tela larga

Branch `prumo/f31-home-grade`. Primeiro defeito da varredura, gravidade **alta** (é a tela do Lucas).

### O que estava errado

O cabeçalho, os cadernos, o rodapé e o 404 ficavam numa coluna central de 78rem. A home e o livro ocupavam a tela toda. Em 1920 o logo ficava em x=369 e o título da home e do livro em x=40; em 1440, 129 contra 40. Cada página tinha a própria margem.

### O que testei na bancada (CSS injetado, antes de escrever)

| Opção | Em 1920 | Veredito |
|---|---|---|
| A · escada presa na coluna de 78rem | Escada estreita e íngreme, "Comida e roupa" em duas linhas, título em três, e o degrau 3 **rolando por dentro** | Não |
| B · a grade do site inteiro em 100rem, com a escada dentro | Título, escada e menu alinhados; escada ainda larga; nenhum degrau rola; tarefas em três colunas folgadas | **Sim** |
| C · grade em 90rem | Meio-termo, sem ganho sobre a B | Não |

### O que mudou

- `--page` de 78rem pra **100rem** (1600 px), em `tokens.css`. Vale pra cabeçalho, faixa preta, cadernos, rodapé e 404.
- A escada (`.stage`) e o livro (`.book`, `.book-more`) passam a respeitar `--page`.
- Acima de 100rem, a escada também fica dentro da grade: o piso começa embaixo do logo e termina embaixo do último item do menu. Abaixo disso ela continua indo até a borda da tela, como antes.

Medido em 1920: logo, título da home, título do livro, título das tarefas e do 404 em x=193; escada de 193 a 1713; menu termina em 1713. Em 1440: tudo em x=40 (o cabeçalho estava em 129). Home em 960 e 360: zero pixel diferente da main. Nenhum degrau rola por dentro em 1920, 1440 e 1280 (medido depois da animação). `npm run check` passa.

### Anotado na varredura

| Página | Tamanho | O que está errado | Gravidade |
|---|---|---|---|
| Home | 960×600 | Os degraus 7 e 8 rolam por dentro do painel (42 e 91 px), igual na main | média |
| Todas | ≤1600 | O botão "Cores" cobre o começo da coluna de conteúdo ao rolar. Com a grade nova, as páginas de Construir junto em 1440 também começam em x=40, como a home e o livro já começavam, e o "Mostrar as outras 10" das tarefas cai embaixo dele na primeira tela | baixa, mas pede decisão |

**Decisão proposta:** o botão "Cores" ir pro canto de baixo à **direita** enquanto durar o teste. O texto do site é todo alinhado à esquerda, então o canto direito quase nunca tem conteúdo. O brief manda ele ficar à esquerda; por isso não mexi.

Prints `prints/grade-antes-*` (main em `534096f`) e `prints/grade-depois-*`.

PR #69 integrada. Botão "Cores" pro canto direito aprovado pelo Regente; vai numa PR própria depois da escada.

## 23/09/2026 · PR 4: a ordem da escada e o trilho da IA (D028)

Branch `prumo/f31-ordem-escada`, a partir da `main` em `0c24494`. Pedido do Regente, prioridade sobre a varredura. Fonte: [feedback do Lucas](../../fontes/2026-09-23-feedback-ordem-da-jornada.md), D028 e PRD §4.

### Ordem nova

Encontro, Conversa, Escolha, Comida e roupa, **Apoio da IA**, **Trabalho**, Tudo à vista.

| Degrau | Texto novo | "Já funciona?" |
|---|---|---|
| 2 Conversa | Acrescenta "Daqui em diante, a IA vai junto." | igual |
| 5 Apoio da IA | "A IA conversa com a pessoa pra entender o que ela sabe fazer e o que ela quer. Depois ajuda a se preparar pra buscar trabalho." Título vira "Apoio da IA" (era "Uma IA pra acompanhar") | Ainda não começou. Está no plano. |
| 6 Trabalho | "Sabendo o que quer, a pessoa é apresentada pra quem oferece vaga, sem expor quem ela é. Depois disso, a IA segue junto, sem prazo e de graça." | Ainda não começou. Está no plano. |

Saiu do Trabalho "A equipe acompanha os primeiros meses": continua na ficha da peça M6 ("Como opera"), e o degrau ficaria com três ideias. O "já funciona?" segue amarrado ao estado da peça pelo teste da F29. Teste novo: a IA (M7) vem depois da comida (M5) e antes do trabalho (M6).

M7 em `modules.ts`: resumo "Uma IA simples, por voz, que acompanha a pessoa do começo ao fim, sem prazo e de graça." e "O que é" com a vocação antes do trabalho, sem jargão.

Também invertidos, pela mesma lógica: a escada do 404 (IA antes de Trabalho) e os dois últimos degraus do cartão de compartilhar (`og.png`).

### O trilho da IA

**O desenho:** uma linha vermelha por baixo dos nomes dos degraus. Nasce embaixo da Conversa com o ícone da IA por voz, passa por baixo de todos os degraus e termina numa seta depois do "Sua vez": continua. Em cima da linha, "a IA vai junto, sempre e de graça", em itálico vermelho, igual ao "alguém" da bolinha. Linha cheia do começo ao fim, enquanto os degraus que faltam são pontilhados: a IA está em todos, a pessoa ainda não.

**Por que embaixo e não um corrimão em diagonal:** um corrimão por cima dos degraus passaria pelo canto de cima à esquerda, onde fica o texto do degrau aberto, até o degrau 3. Ia cruzar os botões. Embaixo, a linha lê como uma linha do tempo, que é o que quem é leigo entende de primeira.

- A altura do trilho (`--rail-h`) entra na conta dos degraus, da bolinha e do espaço do painel. Em 1920 os degraus perdem uns 5 px de altura cada.
- No celular a escada cresce 1,6rem pra caber o trilho. Em 360×780 os botões do Início continuam acima da barra do "Cores", com 22 px de folga (eram 30).
- O trilho é só desenho (`aria-hidden`); o leitor de tela ouve uma frase escondida logo depois da escada.
- Sem rolagem lateral em 1920 e 360. Paleta Noite conferida.

### Verificação

`npm run check` passa (138 testes). Prints `prints/escada-antes-*` (main em `0c24494`) e `prints/escada-depois-*`, em 1920 e 360: Início, Conversa, degrau 5 e degrau 6; mais Noite e o 404.

### Anotado

- 960×600, degrau 8 ("Sua vez"): a rolagem dentro do painel foi de 91 pra 109 px com o trilho. O defeito já estava na lista (média) e é o próximo da varredura, junto com o degrau 7.

### Onde parei

PR aberta e report mandado. Próximo: o botão "Cores" pro canto direito (PR pequena), depois a varredura pelo 960×600.

PR #71 integrada. A PR #70 do Anil trocou as paletas: a Noite saiu e a escura agora é a Carvão (`?cor=carvao`). Daqui em diante confiro nela.

## 23/09/2026 · PR 5: botão "Cores" no canto direito

Branch `prumo/f31-cores-direita`. Aprovado pelo Regente enquanto durar o teste de paletas. Mexi só nas linhas de posição do `<style>` do `PaletteSwitcher.astro`: a lista de paletas é do Anil.

- Desktop: botão e painel em `right` no lugar de `left`.
- Celular (<600 px): a barra continua de ponta a ponta; o botão dentro dela vai pra direita e o painel abre alinhado à direita.
- O aviso que aparece embaixo (toast) encostava no botão em 360 e, com texto longo, entre 600 e 850 px. Agora, quando o botão existe, ele sobe e aparece logo acima (`bottom: var(--dock-h) + .5rem`, em `site.css`).

Conferido na bancada, medindo retângulos: o botão não cobre o aviso nem o "Mostrar as outras 10" em 1920, 1440, 960, 700 e 360, nem o trilho da IA ou o "Sua vez" da home; o painel de cores abre inteiro dentro da tela em 1920, 1440 e 360. Carvão conferida. `npm run check` passa.

A bancada `prumo-f31` foi encerrada às 10:40 por um `stop` normal (Super+W na viewer, pelo jeito); subi de novo com `agent-bench ensure` e o perfil estava preservado.

Prints `prints/cores-antes-*` e `prints/cores-depois-*`.

PR #72 integrada.

## 23/09/2026 · Varredura sistemática

Na `main` em `286fe8d`, na bancada: a home com os 9 degraus, os cinco de Construir junto, o livro com as três abas, o 404, a ficha da peça e o menu do celular, em 1920×1080, 1440×900, 960×600 e 360×780 (81 prints). Pra cada um, medida automática de rolagem lateral, elemento saindo da tela, caixa rolando por dentro e alvo de toque abaixo de 40 px no celular, e revisão no olho por folhas de prints.

**Nenhuma rolagem lateral e nenhum elemento fora da tela, em nenhuma página e tamanho.**

| # | Página | Tamanho | O que está errado | Gravidade | Estado |
|---|---|---|---|---|---|
| 1 | Home | 960×600, 1024×768, 1100×700 | Abaixo de uns 1180 px a coluna de texto da escada fica estreita (4/9 da largura) e os degraus longos rolam por dentro dela: em 960×600 o 4 (15 px), o 7 (60) e o 8 (109); em 1024×768 o 8 (88). E em 960×600 a base da escada (nomes, trilho) fica abaixo da dobra | média | PR 6 |
| 2 | Home | todos, mais visível em 360 e no tablet | Nos degraus baixos o bloco é mais curto que o ícone, o ícone empurra o rótulo e o "1" fica mais baixo que os outros; nome em duas linhas ("Comida e roupa") levanta o número dele; "Início" e "Sua vez" fora da linha dos outros nomes | média | PR 6 |
| 3 | Ficha da peça | 1920 (+25 px), 1440 (+47), 960, 360 | A ficha rola por dentro até em 1920, onde falta pouco pra caber | média | próxima |
| 4 | Todas menos a home | 360 | Faixa preta "Em construção" em três linhas, uns 100 px da primeira tela | média | próxima |
| 5 | Home | 1180 a 1366 × até 720 de altura | A escada tem altura mínima de 46rem e passa da tela; o botão "Cores" cobre a ponta dela ("Sua vez", seta do trilho). Baixar o mínimo faz o "Sua vez" rolar por dentro (testado: 40rem dá 35 px em 1180×700), então fica assim enquanto o botão existir | baixa (o botão é temporário) | aceito |
| 6 | Todas | 360 | O link do logo tem 27 px de altura: passa no mínimo AA (24 px), abaixo dos 44 recomendados | baixa | depois |
| 7 | Livro | 360 | O texto da prova em "Como conferir" rola por dentro (65 px). É de propósito (`max-height` desde a F22) | — | não é defeito |

## 23/09/2026 · PR 6: escada em tablet e rótulos alinhados

Branch `prumo/f31-varredura`.

**Tablet e laptop pequeno (abaixo de 1180 px):** a home passa a usar o layout em fluxo, que já era o do celular: título, escada, degrau, um embaixo do outro, e a página rola. Com três ajustes pra essa largura: os nomes dos degraus voltam a aparecer, a escada fica mais alta (34% da tela, até 18rem) e o texto do degrau para em 46rem de largura. Testei antes deixar a coluna de texto com 5 degraus em vez de 4: melhorou (o 8 em 960×600 foi de 109 pra 46 px), mas não zerou, e a base da escada continuava abaixo da dobra.

Medido: nenhum degrau rola por dentro em 960×600, 1024×768, 1100×700, 768×1024 e 600×900; em 960×600 o Início inteiro cabe na primeira tela (botões terminam em 561 de 600). De 1180 pra cima nada muda.

**Rótulos:** o bloco do degrau pode ficar menor que o ícone sem empurrar o rótulo; todo nome reserva duas linhas; "Início" e "Sua vez" põem o nome na mesma linha dos outros. Medido em 1920, 1440, 1180, 1024, 960 e 360: todos os números na mesma altura e todos os nomes começando na mesma linha (1 px de diferença no Início, pela borda do degrau).

`npm run check` passa. Prints `prints/tablet-antes-*` (main em `286fe8d`) e `prints/tablet-depois-*`.

PR #75 integrada. O "Cores" cobrindo a ponta da escada em laptop baixo foi aceito pelo Regente.

## 23/09/2026 · PR 7: a ficha da peça cabe na tela

Branch `prumo/f31-ficha`. Item 3 da varredura (média).

A ficha era uma caixa de 42rem com os seis campos empilhados; rolava por dentro até em 1920. De 760 px pra cima ela passa a 54rem e os campos vão em duas colunas, linha por linha (O que é | Como funciona, Como opera | Ponto forte, O que falta resolver | Quem pode ajudar). No celular continua uma coluna, com menos respiro em volta e o texto um pouco menor.

Quanto a ficha rola por dentro, medido na bancada (M2, a mais longa, e M4):

| Tamanho | Antes | Depois |
|---|---|---|
| 1920×1080 | 86 e 25 px | 0 |
| 1440×900 | 108 e 47 | 0 |
| 1280×720 | 270 e 209 | 0 |
| 960×600 | 374 e 313 | 84 e 33 |
| 360×780 | 670 e 488 | 371 e 240 |

No celular a ficha continua rolando por dentro: é a ficha inteira de uma peça num diálogo de 90% da tela, com o cabeçalho e o fechar sempre à vista. `npm run check` passa. Prints `prints/ficha-antes-*` e `prints/ficha-depois-*`.

PR #76 integrada.

## 23/09/2026 · PR 8: faixa preta em duas linhas no celular

Branch `prumo/f31-faixa`. Item 4 da varredura (média).

No celular os três pedaços da faixa ("Em construção.", a frase e "Ver o que já existe") ficavam cada um numa linha. Abaixo de 600 px eles correm como uma frase só, com a letra um pouco menor, e o link não quebra no meio. Texto igual.

Altura da faixa, medida em `/construir/tarefas`, `/transparencia/tecnico` e no 404:

| Tamanho | Antes | Depois |
|---|---|---|
| 360 | 102 px | 55 |
| 414 | 81 | 55 |
| 320 | 102 | 75 |
| 600 e acima | igual | igual |

Sem rolagem lateral. A F32 (Design) tirou a faixa do `/transparencia` e criou `/transparencia/tecnico`, que tem a faixa; conferi nela também. O livro agora é da F32, então a parte dele na tabela da varredura (item 7) fica pra ela. `npm run check` passa. Prints `prints/faixa-antes-*` e `prints/faixa-depois-*`.

## 23/09/2026 · Onde parei: itens médios fechados

Com a PR 8, a varredura não tem mais defeito de gravidade alta ou média aberto na parte da F31 (home, Construir junto, 404, ficha, faixa). O que sobrou:

| Página | Tamanho | O que está errado | Gravidade |
|---|---|---|---|
| Todas | 360 | O link do logo tem 27 px de altura: passa no mínimo AA (24 px), abaixo dos 44 recomendados pra toque | baixa |
| Home | 1180 a 1366 × até 720 | O botão "Cores" cobre a ponta da escada; aceito pelo Regente enquanto o botão existir | baixa, aceito |
| Ficha da peça | 960×600 e 360 | Ainda rola por dentro (33 a 84 px em 960×600, 240 a 371 em 360); no celular é o esperado num diálogo com a ficha inteira | baixa |
| Todas | todos | Falta uma passada só de teclado e foco (Tab em cada página, anel de foco visível e sem corte), pedida no brief e ainda não feita de forma sistemática | a medir |

Fora da F31: o livro (`/transparencia` e `/transparencia/tecnico`) é da F32 agora.

Em espera, a pedido do Regente. Próximo, quando ele liberar: a passada de teclado e foco.
