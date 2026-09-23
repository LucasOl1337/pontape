# F34 · Diário

## 23/09/2026 · Diagnóstico

Branch `prumo/f34-diagnostico`, a partir da `main` em `00624f1`. Bancada `prumo-f31`. Nada de CSS até a F33 (o Anil tirando o botão Cores) entrar na `main`.

Reproduzi as três coisas do [print do Lucas](../../fontes/prints/escada-trilho-numeros-2026-09-23.png) na paleta Anil, em 1750×950 e 1750×850 (a largura do print) e em 1920×1080, 1440×900, 1280×720, 960×600, 390×844 e 360×780, medindo com o degrau 5 aberto, como no print.

### 1. Os números em cima da linha do chão (causa provada)

Folga entre o topo do número e a linha do chão: **1 a 3 px no computador** (1280 a 1920), 6 px em 960, 11 px no celular. O número em itálico encosta ou passa da linha.

**Causa:** o rótulo de cada degrau centraliza verticalmente o número e um nome que reserva duas linhas (a reserva é minha, da F31, pra alinhar os números quando um nome quebra). A altura do rótulo (`--label-h`, entre 3rem e 4,5rem conforme a altura da tela) fica justa pra esse conteúdo, e o número, que é o primeiro, sobe até a borda de cima, que é o chão. Em 960 e no celular o rótulo tem folga e o problema some.

### 2. Os números invadidos (causa provada)

O ícone do degrau 1 (o alfinete do Encontro) entra de **2 a 9 px dentro do "1"**, em todos os tamanhos; no celular é o mais visível, porque ali o ícone cruza o chão e para em cima do número.

**Causa:** nos degraus baixos o bloco do degrau é mais curto que o ícone (no celular o degrau 1 tem 14 px de altura e o ícone com a margem pede 24). Na F31 deixei o bloco encolher (`min-height:0`) pra o ícone não empurrar o rótulo; o ícone passou a transbordar por baixo, direto pro número.

### 3. O trilho solto e a seta embaixo do Cores

O trilho fica numa faixa própria, **19 a 36 px abaixo dos nomes**, e lê como legenda. Em 1280×720 ele sai da tela (9 px) e fica embaixo do botão Cores. O botão sai com a F33; a legenda solta continua.

### 4. O texto claro por trás da escada, à direita (causa provada: não é o site)

É o conteúdo de **outra janela do computador do Lucas**, aparecendo através da janela do navegador. A regra padrão do Omarchy pra navegadores Chromium (Brave incluído), em `/usr/share/omarchy/default/hypr/apps/browser.lua`, é `opacity = "1.0 0.985"`: a janela fica 100% opaca quando está ativa e **98,5% quando está inativa**, que é como ela fica na hora de tirar o print. O 1,5% que passa mostra a janela de trás, bem de leve, nas áreas claras e na hachura do degrau aberto.

Provas: ampliando o contraste do print, o texto é uma conversa ditada, com botões de tocar e copiar no canto direito, sem nada do PontaPé (não transcrevo aqui porque é conversa pessoal). E ele atravessa a escada e o chão sem respeitar nenhuma caixa da página. `hyprctl -j getoption decoration:active_opacity` e `inactive_opacity` dão 1,0 (padrão), então a transparência vem da regra por janela do Omarchy, não de um ajuste global. Nada a mudar no site. Se o Lucas quiser prints sem isso, é tirar com a janela do navegador ativa ou mudar a regra do Brave no Hyprland, que é config pessoal dele.

### 5. Celular de ponta a ponta (360×780 e 390×844)

Home com os 9 degraus, os cinco de `/construir`, `/transparencia`, `/transparencia/tecnico` e 404.

- Sem rolagem lateral em nenhuma.
- **Alvos de toque abaixo de 44 px, fora de frase** (a regra de alvo isenta link dentro de texto corrido): "Abrir o livro" (26 px de altura), os links de tarefa e o "Conte no GitHub" nas perguntas dos gargalos (23), "Ver todas, na parte técnica" (20), e no livro técnico "Ver a fonte" (20), "marca inteira" (18) e a lista de links de "No seu computador" (22).
- **Degraus da escada:** 39 px de largura em 360. Nove colunas não cabem com 44 px em 360 (9 × 44 = 396). Passam no mínimo AA (24 px) e dá pra andar pelos botões anterior e próximo de cada degrau. Fica anotado, sem mexer.
- A primeira tela muda quando a barra do Cores sair; meço de novo depois da F33.

### Proposta pro trilho da IA

Protótipo só com CSS injetado na bancada (nada no repositório): **o trilho sobe junto com a escada**. Uma linha na cor de destaque corre colada logo acima do topo de cada degrau, a partir da Conversa, passa por todos e segue depois do último com a seta; a frase "a IA vai junto, sempre e de graça" fica no alto, à direita, acima do último degrau, onde não tem nada. É o corrimão da escada: não é mais uma legenda embaixo, é parte do desenho. Não cruza o texto nem os botões do degrau aberto (o texto fica no canto de cima à esquerda, acima do degrau 3), e a bolinha de "alguém" anda em cima dele. Some a faixa que o trilho ocupava embaixo dos nomes, o que devolve altura pra escada. Prints: `prints/proposta-trilho-1750.png` e `prints/proposta-trilho-360.png`; antes: `prints/diag-antes-1750.png` e `prints/diag-antes-360.png`.

### Plano, quando a F33 entrar

1. **Números e ícones** (PR 1): rótulo com o número no alto e folga fixa do chão; ícone que nunca passa do bloco (margem menor no computador; no celular, a escada fica mais alta com o espaço que a barra do Cores deixa).
2. **Trilho** (PR 2): o desenho acima.
3. **Celular** (PRs seguintes, por gravidade): alvos de 44 px nos links soltos da lista acima; primeira tela da home e dos cadernos sem a barra.

### Onde parei

Diagnóstico aprovado pelo Regente, com o corrimão. A F33 entrou (#80, `5a70ad0`): o botão Cores e os restos dele saíram e a Anil virou o `:root`.

## 23/09/2026 · PR 1: o ajuste de tela baixa voltou a valer

Branch `prumo/f34-tela-baixa`. Achado conferindo a PR dos números: na `main`, logo depois da F33, o "Sua vez" rola **39 px por dentro** em 1180×700 (na F31 era zero).

**Causa:** o ajuste de tela baixa (`@container (max-height:700px)`, que esconde a nota "A gente não guarda contato..." e diminui o texto e os botões do degrau) só valia porque a caixa da escada descontava a altura da barra do Cores: o palco ficava com 664 px. Sem a barra, o palco nunca fica abaixo da altura mínima de 46rem (736 px), e o ajuste parou de valer em qualquer tela.

**Correção:** o limite sobe pra 800 px. Volta a valer onde valia antes da F33 (laptop de 720 e 768 de altura) e continua desligado em 1440×900 pra cima.

| Tamanho | `main` (degraus 0, 4, 7, 8) | Depois |
|---|---|---|
| 1180×700 | 0, 0, 0, 39 | 0, 0, 0, 1 |
| 1280×720 | 0, 0, 0, 0 | igual |
| 1366×657 | 0, 0, 0, 0 | igual |

`npm run check` passa. Prints `prints/tela-baixa-antes-1180-d8.png` e `prints/tela-baixa-depois-1180-d8.png`.

## 23/09/2026 · PR 2: números longe do chão e dos ícones

Branch `prumo/f34-numeros`, empilhada em cima da `prumo/f34-tela-baixa` (as duas escrevem neste diário).

**No computador:** o rótulo de cada degrau alinha pelo alto, com o número a uma distância fixa do chão (`--label-pad`), e o nome embaixo; um nome que quebra cresce pra baixo e não levanta o número. A altura do rótulo agora sai do próprio conteúdo (tamanho do número, mais duas linhas de nome, mais as folgas), em vez de um intervalo fixo que ficava justo. E o ícone de cada degrau nunca passa do degrau mais baixo: o tamanho fica limitado a `--u` menos as duas margens.

**No celular e no tablet:** o degrau 1 tem uns 14 px de altura e nenhum ícone cabe nele. O ícone sai do bloco e desce pra baixo do chão, em cima do número; o degrau fica só com o desenho. No tablet vem ícone, número e nome, nessa ordem, e a escada ganha 1rem pra compensar o rótulo mais alto.

Medido com o degrau 5 aberto, paleta Anil:

| Tamanho | Número ↔ chão, antes → depois | Ícone ↔ número, antes → depois |
|---|---|---|
| 1750×950 | 2 → 9 px | entrava 4 → 17 px de folga |
| 1920×1080 | 3 → 8 | 4 → 17 |
| 1440×900 | 1 → 8 | entrava 5 → 15 |
| 1280×720 | 1 → 8 | entrava 5 → 14 |
| 960×600 | 6 → ícone entre os dois | entrava 9 → 4 |
| 390×844 e 360×780 | 11 → ícone entre os dois | entrava 2 → 5 |

Nenhum degrau passa a rolar por dentro (medido em 1280×720, 1366×657, 1440×900, 1750×850 e 1920×1080, todos os degraus); em 1180×700 o "Sua vez" fica com 8 px, que somem com a PR do corrimão, quando sai a faixa de baixo. Primeira tela do celular: os botões do Início terminam em 700 de 780 (360) e 673 de 844 (390). Carvão conferida. `npm run check` passa.

Prints `prints/numeros-antes-*` (`main` depois da F33) e `prints/numeros-depois-*`.

PRs #81 e #82 integradas.

## 23/09/2026 · PR 3: o corrimão da IA

Branch `prumo/f34-corrimao`. Desenho aprovado pelo Regente a partir do protótipo do diagnóstico.

**O que era:** o trilho ficava numa faixa própria, de 19 a 36 px abaixo dos nomes dos degraus, e lia como legenda solta.

**O que ficou:** o trilho é o corrimão da escada. Uma linha na cor de destaque corre colada logo acima do topo de cada degrau, a partir da Conversa (onde a IA entra na jornada), sobe junto com a escada e termina numa seta depois do último degrau: continua. A frase "a IA vai junto, sempre e de graça", com o ícone da IA por voz, fica no alto à direita, em cima do último degrau, onde não tem mais nada. A bolinha de "alguém" anda em cima do corrimão. É cheio do começo ao fim, enquanto os degraus que faltam são pontilhados: a IA já está em todos, a pessoa ainda não.

- Cada degrau desenha o seu pedaço (`.tread.on-rail .tread-block::after`): o degrau de cima e o espelho à esquerda, deslocados `--rail-d` pra cima e pra esquerda. Não precisa de SVG nem de script.
- Some a faixa de baixo (`--rail-h`). No computador a escada ganha essa altura; no celular a escada ficou 0,5rem mais baixa no total, com mais espaço em cima do último degrau pra frase.
- No computador o texto do degrau aberto termina acima do corrimão nos degraus 2 e 3 (a margem de baixo inclui `--rail-d`).

Conferido na bancada, com os degraus 0, 3 e 8 abertos, em 1920, 1750, 1440, 1280, 1180, 1024, 960, 390, 360 e 320:

- a frase não encosta no título (13 px no celular; no computador ficam em lados opostos), nem no ícone do "Sua vez", nem na bolinha;
- o corrimão não encosta no texto nem nos botões do degrau aberto;
- sem rolagem lateral (a seta fica dentro da escada).

E nenhum degrau rola por dentro em 1180×700, 1280×720, 1366×657, 1440×900, 1750×950 e 1920×1080: o "Sua vez" em 1180×700, que tinha 8 px depois da PR dos números, zerou. No celular os botões do Início terminam em 692 de 780 (360) e 665 de 844 (390).

A F33 deixou uma paleta só (Anil no `:root`, sem seletor nem `?cor=`), então não há mais Carvão pra conferir. `npm run check` passa. Prints `prints/corrimao-antes-*` (`main` depois da #82) e `prints/corrimao-depois-*`.
