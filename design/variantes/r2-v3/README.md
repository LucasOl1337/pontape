# F22 v3 · Ábaco · escada com números

## A escada em 5 linhas

1. A home é uma tela só: a escada fica embaixo, larga, subindo da esquerda pra direita, e o degrau escolhido abre no painel acima, no mesmo lugar.
2. Cada degrau é **uma parte do projeto** e mostra o **número vivo** dela, tirado dos dados reais: O que é (0 pessoas apoiadas), Como funciona (7 passos), Módulos (0/9 funcionando), Livro público (37 ações), Dinheiro (R$ 0,00), Gargalos (5), Ajudar (17 tarefas).
3. Dentro de cada degrau, o painel repete o formato: o número grande à esquerda, o detalhe à direita (jornada, módulos, corrente e ábaco, fluxo do dinheiro, gargalos, tarefas).
4. Clique, setas do teclado (← →, Home, End) e os botões do próprio painel andam pela escada. O endereço acompanha (`#modulos`, `#m4`, `#gargalo-...`), então link direto funciona.
5. O livro público repete a ideia: primeira tela com números, Conferir, marca de controle e a corrente; depois uma escada própria de 6 degraus (todas as ações em páginas de 6, uma ação por dentro, dinheiro, linha do tempo, como conferir, o que entra).

**Por que as partes do projeto e não os 7 passos da jornada:** a jornada é uma parte só (e está lá, num degrau, como escadinha menor). O que a pessoa precisa entender numa visita é o projeto inteiro, e cada parte tem um número honesto pra mostrar. A escada sobe do "o que é" até o "ajudar": entender, ver como funciona, ver o estado, conferir, ver o dinheiro, ver o que falta, entrar.

## Quantas telas

| Página | 1440 × 900 | 360 × 780 |
|---|---|---|
| Home | **1 tela** de palco (escada + painel) e mais o rodapé: 1185 px, **1,3 telas** | **2,6 a 3,4 telas** conforme o degrau aberto (2264 px no degrau 1) |
| Livro público | 1 tela de essencial + 1 tela de escada: 1994 px, **2,2 telas** | 4551 px, **5,8 telas** |

Medido na bancada com viewport de verdade (CSS 1440×900 e 360×780). Em 1440×840 (a altura dentro do seletor) os 7 degraus cabem sem rolar dentro do painel; em 768 de altura, três degraus rolam uns 20 px dentro do painel.

## O que mudou da rodada 1

- A identidade é a mesma: fundo escuro, Atkinson Mono nos números, menta como cor de ação, a marca como impressão digital, corrente, ábaco e Sankey com os dados reais.
- A estrutura mudou: nada de ler descendo. No desktop o palco trava na altura da tela e a escada nunca sai do lugar; no celular a escada vira uma faixa que rola com o dedo, em cima do painel.
- Lista longa virou página: tarefas de 3 em 3 na home, ações de 6 em 6 no livro, sempre com filtro.
- O botão Conferir continua no degrau do Livro (home) e no topo do livro, com o verificador da F08.

## Números

- `npm run check` passa inteiro: lint, tipos, 127 testes, livro, build e orçamento.
- Orçamento: home **36,2 KB ao abrir, 44,7 KB** com o verificador; livro **50,5 KB ao abrir, 58,9 KB** com o verificador (de 60 KB). A home baixa o livro publicado (`/livro/ledger.json`) só no clique do Conferir.
- 360 px sem rolagem lateral em todos os degraus das duas páginas (medido).

## Prints

`prints/`: `home-1440` (a tela inteira da home), `home-1440-os-7-degraus` (folha com os sete), `home-1440-modulos`, `home-1440-livro-conferido`, `home-1440-dinheiro-exemplo`, `home-1440-inteira`, `home-360-topo`, `home-360-inteira`, `livro-1440-topo`, `livro-1440-escada`, `livro-1440-exemplo-quebra`, `livro-1440-inteira`, `livro-360-topo`, `livro-360-inteira`.
