# F22 v1 · Prisma · a escada de blocos

Rodada 2 da variante Prisma. Mesma identidade da rodada 1 (escuro e claro, Geist, vidro, espectro), estrutura nova. Porta `4341`.

## A ideia em 5 linhas

1. A home é uma tela só. À esquerda, sete blocos do bento empilhados como uma escada que sobe pra direita: o degrau 1 embaixo, o 7 em cima.
2. O bloco escolhido cresce, acende na cor dele e se liga ao palco; o conteúdo aparece ali do lado, no mesmo lugar, sem pular a página.
3. Cada degrau é uma parte do site, na ordem de quem chega: O PontaPé, Como funciona, Módulos, Livro público, Gargalos, Contribuições, Como ajudar.
4. Setas sobem e descem (↑ e → sobem, ↓ e ← descem, Home e End vão pras pontas); clique, toque ou o endereço (`/#modulos`) também levam ao degrau.
5. Dentro dos degraus, a mesma escada em miniatura: os sete passos da jornada, os cinco gargalos e as quatro abas do livro.

## Por que os degraus são as seções

O BRIEF pede que a home curta mostre o que é o projeto, como funciona, os módulos, a transparência, os gargalos, as contribuições e como ajudar. Se os degraus fossem os 7 passos da jornada, o resto ficaria fora da escada. Com as seções como degraus, a escada vira o mapa do site inteiro, e a jornada ganha a sua própria escadinha dentro do degrau 2, como a Crônica explicava, degrau por degrau.

## Quantas telas

| Onde | Home | Livro (`/transparencia`) |
|---|---|---|
| 1440×900 | **1 tela.** Os 7 degraus cabem sem rolar nada (medido degrau por degrau: 0 px sobrando) | Topo essencial em 1 tela; página inteira 3,8 telas com a lista paginada |
| 1920×890 (o seletor do Lucas) | 1 tela, os 7 degraus | Topo em 1 tela |
| 1536×864 | 1 tela, os 7 degraus | Topo em 1 tela |
| 1366×768 | 1,2 a 1,4 tela: a página cresce um pouco e a escada fica presa ao lado | |
| 360×780 | 1,8 a 2,8 telas, conforme o degrau (O PontaPé: 2,2) | 5,9 telas, 5 linhas por página |

Sem rolagem lateral em 360 e 320.

## O que mudou da rodada 1

- **Home:** de 14.775 px (16 telas) pra uma tela. Cada seção virou um degrau; o detalhe fica a um clique (módulo abre no diálogo, gargalo na lista ao lado, contribuições em páginas de 6).
- **Celular:** a escada vira uma faixa de sete degrauzinhos crescentes presa no topo, com "Degrau 3 de 7 · Módulos" embaixo; o conteúdo do degrau fica logo abaixo e tem botões "Descer" e "Subir" no fim.
- **Livro:** o topo mostra o essencial numa tela (o que é, Conferir, os quatro números, as três últimas ações). O resto é uma escadinha de quatro abas: todas as ações (10 por página), dinheiro, como conferir, o que entra. Se o Conferir acha uma linha quebrada, abre a página dela.
- **Tela cheia:** o palco ocupa o espaço inteiro ao lado da escada; o vão que sobra no alto da escada guarda a dica das setas. No 1920 do seletor, as grades se abrem em mais colunas (container queries no palco).
- **Rodapé da home:** uma linha só. O texto completo de organização e privacidade continua no livro e nas outras páginas.

## Regras que não caem

Faixa "Em construção" no topo, zero honesto no dinheiro, selo de estado em cada módulo, nenhuma foto ou ilustração de pobreza, toda ação aparece e quem é a pessoa não, PT-BR sem travessão, contraste AA nos dois temas, teclado em tudo (a escada é uma lista de abas), botão Ouvir em todo degrau e aba. Movimento desliga com "reduzir movimento". Sem JavaScript, todos os degraus aparecem um embaixo do outro.

## Números

`npm run check` passa: lint, tipos, 127 testes, livro, build e orçamento. Home 40,8 KB ao abrir e 49,5 KB com o Conferir; livro 38,9 e 47,6 KB; fontes 46,2 KB.

## Prints

`prints/`: `home-1440-degrau1.png`, `home-1440-degrau2-jornada.png`, `home-1440-degrau3-claro.png`, `home-1440-degrau4-livro.png` (o degrau do meio crescido), `home-1920x890-degrau5.png`, `home-360-degrau1-inteira.png`, `home-360-degrau3-tela.png` (a faixa presa no topo), `livro-1440-topo.png`, `livro-1440-inteira.jpg`, `livro-360-inteira.jpg`.

## Arquivos

Escada: `src/pages/index.astro`, `src/components/stair/`, um componente por degrau em `src/components/steps/`, controle em `src/scripts/home.ts`, estilo em `src/styles/home.css`. Livro: `src/pages/transparencia.astro`, `src/scripts/ledger.ts`.
