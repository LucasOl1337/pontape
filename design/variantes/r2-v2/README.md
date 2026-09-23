# F22 v2 · Crônica, rodada 2: a escada, consertada

Porta local: `npx astro dev --host 127.0.0.1 --port 4342`. Mesma identidade da rodada 1 (papel, tinta preta, Newsreader, um vermelho só, o ponto "alguém"). O que mudou foi a estrutura.

## A escada em 5 linhas

1. A home é uma tela só: a escada ocupa o palco inteiro, de ponta a ponta, e o texto grande fica no canto que os degraus baixos deixam livre.
2. Cada degrau é uma coisa: o chão é **o pontapé** (o que é o projeto, com o convite por voz), os 7 degraus são **os 7 passos da jornada** e o topo é **sua vez** (como ajudar).
3. Clicou num degrau, ou apertou as setas, o conteúdo troca no mesmo lugar. O ponto vermelho pula de degrau em degrau; o caminho andado fica em linha cheia e o que falta, pontilhado.
4. Cada passo carrega tudo que é dele: a peça do projeto com o selo de estado, o que falta resolver (gargalo) e a tarefa aberta pra ajudar. O passo 7 (Prova) traz o livro: ações, zero honesto e o link.
5. O resto abre por cima, num "caderno", sem descer a página: as 9 peças, os 5 gargalos, os classificados (17 tarefas) e o código aberto. Os números de hoje ficam sempre à vista no canto de cima.

**Por que a jornada:** foi o que o Lucas gostou na rodada 1 ("cada degrau representa uma coisa"). A jornada explica o projeto na ordem em que ele acontece na vida da pessoa, e cada passo já aponta pra peça, pro gargalo e pra ajuda daquele ponto. As seções que não são passo da jornada (peças, gargalos, classificados, código aberto) viraram a faixa "Nesta edição", embaixo da escada.

## Quantas telas

| | 1440×900 | 360×780 |
|---|---|---|
| Home | **1 tela.** A escada, o texto do degrau, os números de hoje e a faixa "Nesta edição" cabem juntos na primeira tela. Abaixo só vem o rodapé (a página inteira dá 1,4 tela). | **2,8 telas**, com rodapé: título, escada, degrau escolhido, números de hoje, "Nesta edição". |
| Livro | 1ª tela: números, zero honesto, Conferir e as últimas ações (4 por página). Página inteira: 2,6 telas, com as abas embaixo. | 5,8 telas, com 3 ações por página e o detalhe técnico dobrado. |

Medido com a janela real na bancada. Em notebook mais baixo (1366×768, 1280×720), o palco nunca fica menor que 46rem pra nenhum degrau rolar por dentro; a home passa a ter 1,2 a 1,5 tela.

## O que mais mudou

- **Livro (`/transparencia`) curto:** a primeira tela tem números, Conferir e a lista paginada (4 por página no desktop, 3 no celular). Filtro por tipo e exemplo continuam. Quando o Conferir acha a quebra, a paginação pula sozinha pra página da ação quebrada. Embaixo, três abas no lugar: como conferir (com o texto canônico real da última ação), dinheiro e o que entra.
- **Teclado:** a escada é uma lista de abas. Setas (direita e cima sobem, esquerda e baixo descem), Home e End. Tab sai da escada e cai no conteúdo do degrau. As setas também andam quando o foco não está num controle.
- **Links antigos continuam:** `#como-funciona`, `#modulos`, `#gargalos`, `#gargalo-…`, `#contribuicoes`, `#m1`…`#m9` abrem o degrau ou o caderno certo.
- **Sem JS** tudo aparece em sequência na página: todos os degraus e os cadernos abertos no fim.
- `npm run check` passa. Orçamento: home 27,1 KB, livro 33,1 KB ao abrir e 41,7 KB com o verificador. Fontes 117 KB de 120.

## Prints

`prints/home-1440.jpg`, `prints/home-360.jpg`, `prints/livro-1440.jpg`, `prints/livro-360.jpg` (página inteira), mais `home-1440-degrau-2.jpg`, `home-1440-degrau-7.jpg`, `home-1440-caderno-pecas.jpg` e `home-360-degrau-4.jpg`.
