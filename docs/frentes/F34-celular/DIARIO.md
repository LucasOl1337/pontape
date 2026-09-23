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

Diagnóstico mandado pro Regente. Esperando o aviso da F33.
