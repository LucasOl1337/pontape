# F36 · Diário

## 23/09/2026 · Proposta: a causa do enquadramento, o que volta e o que fica

Branch `prumo/f36-volta`, a partir da `main` em `77270c3`. Bancada `prumo-f36` (workspace 7). Medi o build do antes (`00624f1`, a `main` das 11:47, antes da F33) e o do agora (`77270c3`) lado a lado, com a home no degrau 0 e com o Encontro aberto. Tudo em px de CSS, salvo quando digo "da tela".

### A janela do Lucas não tem 1920×914 de CSS

O Brave dele segue a escala de texto do GTK (`text-scaling-factor` 1,1818), e o Chromium no Linux usa essa escala como zoom da tela. No print de agora, o chão tem 1805 px da tela e na página tem 1520: **escala 1,1875**. A janela de 1920×914 da tela é, pra página, **1602×769** (tirando a barra de rolagem). Conferi o modelo contra o print: o chão cai em 872 px da tela no cálculo e em 873 no print. Todo tamanho de teste daqui pra frente inclui essa janela ("janela do Lucas": 1617×769 com escala 1,1875).

O print de antes veio de uma janela de uns 1600×805 (sem a barra de favoritos).

### Medida

Distância entre o fim da escada (nomes ou linha da IA, o que vier por último) e a borda de baixo da janela. Negativo é o que fica abaixo da dobra.

| Janela | Antes: palco, ar | Agora: palco, ar |
|---|---|---|
| Lucas de antes (1600×805) | 669, **71** | 741, 14 |
| **Lucas hoje (1602×769)** | 664, **40** | 736, **−17** (nomes abaixo da dobra) |
| 1920×914 | 778, 71 | 850, 16 |
| 1920×1080 | 944, 71 | 1016, 17 |
| 1440×900 | 764, 71 | 836, 16 |
| 1366×768 | 664, 39 | 736, −18 |

Abrir o Encontro não muda nada disso nos dois builds (a escada fica fora do fluxo e o texto do degrau não rola por dentro).

### A causa, em três partes

1. **A F33 levou junto o ar de baixo.** Enquanto existia o botão Cores, a home reservava 4,5rem (72 px) embaixo pra ele: `body:has(.palette-switcher){ --dock-h:4.5rem }` e `.front{ padding-bottom:var(--dock-h) }`. Esse era o "ar embaixo" do print de antes. A F33 tirou o botão e a reserva, e o palco cresceu 72 px até a borda da janela.
2. **O mínimo de 46rem passou a valer pra escada inteira.** O `.front{ min-height:max(calc(100svh - header), 46rem) }` incluía os 72 px da reserva, então o palco nunca ficava abaixo de 41,5rem (664). Sem a reserva, o mínimo do palco virou 46rem (736). Com o cabeçalho, a página pede 801 px de altura: na janela do Lucas (769) e em 1366×768 ela passa da tela. Como o palco usa `100cqh` pra calcular a altura do degrau (`--u`), todo o crescimento foi pra escada.
3. **A F34 tirou a faixa que ficava embaixo dos nomes.** A #83 levou a linha da IA pra cima e apagou o `--rail-h` (29 a 41 px): o chão desceu esse tanto e os nomes passaram a ser a última coisa do palco, a 15 px da borda dele. A #82 cresceu o `--label-h` (de 50 pra 63 px em 736), mas isso só baixou a escada, não empurrou os nomes: eles ficam no pé do palco de qualquer jeito.

Resultado: em toda janela, o ar embaixo caiu de 71 pra 16 px; nas janelas com menos de 801 px de altura, a sobra negativa come os nomes.

### O que volta do antes

- O ar embaixo, agora fixo e sem botão: `--air` de 4,5rem, que encolhe até 2,5rem quando a janela é baixa, e o palco com o mesmo mínimo de 41,5rem de antes. O palco fica **do mesmo tamanho do antes em toda janela**, e a página cabe na tela sem rolar em todas as janelas de 768 px de altura pra cima (na do Lucas, 40 px de ar).
- A linha da IA embaixo dos nomes, com o ícone, a frase e a seta, e a faixa dela (`--rail-h`). Sai o corrimão de cima dos degraus.
- O rótulo de antes (número e nome no pé de cada degrau, com o nome à vista no computador e no tablet).
- O limite de tela baixa de volta a 700 px (a #81 só subiu pra 800 porque a reserva tinha sumido).

### O que fica da F34

- **Números:** a uma distância fixa do chão, colados no nome. Pra não crescer o rótulo como na #82, ele reserva uma linha de nome, não duas: no computador nenhum nome quebra (medi de 1180 a 2560 de largura, todos numa linha). O rótulo fica do tamanho do de antes ou menor (46 px em vez de 50 no palco de 664; 60 em vez de 71 no de 944), então a escada não perde altura.
- **Ícones:** nunca maiores que o degrau mais baixo, com margem (o `--icon` da #82).
- **Alvos de 44 px** da #84 (não mexem na escada).

### A linha da IA começa no passo da escolha, marcada no dado

Com a F37 (D032), o sistema de escolha vira o primeiro degrau. A linha começa no passo que tiver a marca no `journey.ts` (um campo no próprio passo, não a posição nem o módulo), segue até depois do topo e termina na seta. O `sr-only` e o comentário do `RAIL_FROM` passam a usar o nome desse passo. Combino o campo com o Design/UI antes da PR 2.

### Celular

Em 360 cada degrau tem 40 px de largura: nem "COMIDA E ROUPA" nem "TRABALHO" cabem, nem em duas linhas, com letra que dê pra ler (o antes também escondia os nomes no celular). Proposta: o celular fica com os números embaixo do chão, e o nome do degrau aberto aparece no título do texto, logo embaixo da escada, como hoje; o nome de todo passo fica no tablet e no computador. Se o Regente quiser nome em todo degrau no celular, a saída é a escada em pé (uma coluna, um degrau por linha), que é outra frente.

### Rota

1. **PR 1, `prumo/f36-volta`:** a escada do antes em todos os tamanhos (revert da #83, do rótulo da #82 e da #81, com `--accent`), mais o ar de baixo no lugar da reserva do Cores. Tira do ar o que o Lucas reprovou e conserta o enquadramento.
2. **PR 2, `prumo/f36-numeros`:** números a distância fixa do chão, ícones limitados, linha da IA a partir do passo marcado no dado, tablet com o nome de todo passo.

Prints dos dois em 1920×914, janela do Lucas, 1920×1080, 1440×900, 1366×768, 390 e 360, degrau 0 e Encontro aberto.

### Fica anotado

Uma janela de laptop 1366×768 de verdade tem uns 1366×657 de página (com as barras do navegador). Lá, antes e agora, a escada passa da tela (antes, a linha da IA e os nomes ficavam 72 px abaixo). Não está no brief; meço na PR 1 se dá pra descer o mínimo do palco sem o texto do degrau rolar por dentro.

### Onde parei

Proposta escrita, report pro Regente e combinação do campo com o Design/UI. Próximo passo: PR 1.

## 23/09/2026 · Proposta aprovada, e o campo combinado com o Design/UI

- **Regente:** proposta aprovada. No celular de 360 ficam só os números por enquanto, com o nome do degrau aberto no título; o print de 360 vai na PR 2 pra ele mostrar ao Lucas. Na PR 1, o print de antes do Lucas lado a lado com o meu na janela dele.
- **Design/UI (F37):** o campo é `aiFrom?: true` no `JourneyStep`; o `Escada.astro` acha o passo com `STEPS.findIndex(s => s.aiFrom)` e um teste exige exatamente um passo marcado. Na F37 a marca vai no passo 1, o sistema; ela põe o mesmo campo na PR dela, e quem rebasear depois resolve uma linha no `journey.ts`. O `sr-only` fica "Desde o passo N, <nome>, a IA vai junto da pessoa em todos os passos e continua depois do trabalho, sem prazo e de graça." O "Daqui em diante, a IA vai junto" da Conversa sai na F37. Ela só mexe na frase do degrau 0 no `Escada.astro` (vira `OPENING` no `journey.ts`) e não toca no `site.css`. Os nomes novos têm até 12 letras (o maior hoje, "Comida e roupa", tem 14); a frase de abertura nova terá uns 150 caracteres contra 136: se somar uma linha em 1920×914, eu aviso.

## 23/09/2026 · PR 1: a escada do antes, com ar embaixo

Branch `prumo/f36-volta`.

- O bloco da escada no `site.css` e o `Escada.astro` voltaram ao que eram em `00624f1` (a `main` das 11:47): linha da IA na faixa embaixo dos nomes, rótulo e ícone de antes, limite de tela baixa em 700. Só com `--accent` no lugar de `--red`. Isso desfaz a #83, a parte da escada da #82 e a #81.
- No lugar da reserva do Cores, o ar embaixo (só no computador, onde a escada ocupa a tela): `--air` = de 2,5rem a 4,5rem, conforme a altura da janela, e o mínimo da primeira tela passa a ser 41,5rem de palco mais o ar. O palco fica igual ao de antes em toda janela.

Medido na bancada, com os degraus 0, 1, 7 e 8 abertos (px de CSS):

| Janela | Palco | Nomes terminam | Linha da IA | Ar embaixo |
|---|---|---|---|---|
| Lucas de antes (1600×805) | 669 | 707 | 705 a 734 | 71 |
| **Lucas hoje (1602×769)** | 664 | 703 | 700 a 729 | **40** |
| 1920×914 | 778 | 813 | 812 a 843 | 71 |
| 1920×1080 | 944 | 970 | 971 a 1009 | 71 |
| 1440×900 | 764 | 800 | 798 a 829 | 71 |
| 1366×768 | 664 | 703 | 700 a 729 | 39 |

Idêntico ao antes em palco e posição de tudo; a página agora cabe na tela sem rolar de 768 de altura pra cima. Nenhum degrau rola por dentro. Em 1280×720 a linha da IA passa 9 px da borda (antes também) e em 1366×657 a escada passa 72 px (antes também): fica pra depois, como anotado.

Conferência de que a medida vale: o print da `main` na bancada, na janela do Lucas, reproduz o print das 13:02 dele (chão, números e nomes cortados no mesmo lugar): `prints/lado-a-lado-agora-lucas-e-main.png`. E o desta PR bate com o print das 11:47: `prints/lado-a-lado-antes-lucas-e-pr1.png`.

Celular e tablet voltam ao antes também. E volta o problema do meio-dia, em todo tamanho: no computador o número encosta no chão ou passa até 2 px dele, e o ícone do Encontro entra de 1 a 8 px no "1" (8 no tablet de 960×600). É o que a PR 2 conserta. Sem rolagem lateral em 360 e 390.

`npm run check` passa (home com 21,8 KB de 60). Prints `prints/volta-antes-*` (`main` em `74628ca`, já com a F37) e `prints/volta-depois-*`, degrau 0 e passo 1 aberto, na janela do Lucas, 1920×914, 1920×1080, 1440×900, 1366×768, 390 e 360.

**Rebase na F37 (#88, `ffff034`).** A F37 já tinha trazido o `aiFrom` pro `journey.ts` (marcado no Sistema, o passo 1), o `RAIL_FROM` a partir dele, o `sr-only` com o nome do passo e a frase de abertura como `OPENING`. Tudo isso ficou; do `Escada.astro` saíram só as classes do corrimão, e o `--rail-from` voltou pra linha. Com o Sistema no passo 1, a linha da IA começa embaixo dele, com o ícone e a frase, e segue até a seta depois do Sua vez. Medida e prints refeitos depois do rebase: a mesma de antes, com a linha começando no Sistema.

### Onde parei

PR 1 aberta. Próximo passo: PR 2 (`prumo/f36-numeros`), com os números, os ícones, a linha a partir do passo com `aiFrom` e o nome de todo passo no tablet.
