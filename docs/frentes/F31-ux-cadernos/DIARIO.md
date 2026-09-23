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

PR aberta e report mandado. Próximo: a varredura, começando pela home em 1920 (alta).
