# F19 v1 · Prisma

Premium tecnológico, no nível Apple, Linear e Vercel. Porta `4341`.

## Conceito em 5 linhas

1. Um prisma de vidro no hero: entra um feixe (quem quer recomeçar), atravessa o PontaPé e sai em cinco raios: comida, roupa, higiene, trabalho e IA.
2. Vidro é transparência literal. Tudo que passa pelo meio fica à vista, e o espectro dos cinco raios vira a paleta do site inteiro.
3. Cada parte do projeto é um bloco de uma grade bento, com borda fina e luz que segue o ponteiro.
4. Escuro por padrão do aparelho e claro num toque, Geist e Geist Mono, muito respiro.
5. O movimento vem do scroll, em CSS puro, e as páginas passam uma pra outra com View Transitions.

## O que fiz diferente e por quê

- **Prisma no lugar da escada.** O "primeiro passo" virou luz que se divide em cinco apoios. Cada raio é um botão que abre o módulo; apontar num raio acende ele e apaga os outros.
- **Bento de verdade.** Módulos, transparência, gargalos, ajuda e código aberto são grades com blocos de tamanhos diferentes. O livro (M2) é o bloco grande, com as três últimas marcas reais dentro.
- **Jornada guiada pelo scroll.** Os sete passos ficam num trilho que enche conforme a pessoa lê; o nó de cada passo acende no meio da tela e o índice ao lado acompanha (`animation-timeline: view()` com `timeline-scope`). Zero JavaScript nisso; as abas antigas saíram.
- **Conferir ao lado da lista.** No livro, o painel Conferir fica fixo ao lado das 34 ações. Aperta e vê a corrente sendo conferida linha por linha; no exemplo, "Mudar uma linha escondido" quebra na hora.
- **View Transitions.** Entre home e livro (sem JS, `@view-transition`), os números Entrou, Saiu e Ações no livro viajam de uma página pra outra. Nos filtros de módulos e contribuições os blocos deslizam pro lugar novo. A troca de tema abre em círculo a partir do botão.
- **Fontes.** Geist e Geist Mono (OFL), variáveis, só latim: 46,2 KB no total contra 87,1 KB das três fontes do v1.
- **Nome.** PontaPé sai só do `PROJECT_NAME`. O "pontapé inicial" aparece na legenda do prisma e no rodapé.

## Regras que não caem

Faixa "Em construção" no topo, zero honesto no dinheiro (e a frase "aqui nunca vai ter número inventado"), selo de estado em cada módulo, nenhuma foto nem ilustração de pobreza, toda ação aparece e quem é a pessoa não, PT-BR sem travessão, contraste AA nos dois temas (conferido token a token, menor razão 4,79:1), teclado e foco visível, 360px e 320px sem rolagem lateral, botão Ouvir em toda seção. Tudo que mexe desliga com "reduzir movimento".

## Números

`npm run check` passa: lint, tipos, 127 testes, livro, build e orçamento.

| Página | Ao abrir | Com o Conferir | Limite |
|---|---|---|---|
| Home | 40,2 KB | 48,9 KB | 60 KB |
| Livro | 36,9 KB | 45,5 KB | 60 KB |

Altura: a home tem 14.775 px em 1440 (16 telas de 900) e 23.245 px em 360. É longa, e isso a rodada 2 resolve.

## Prints

`prints/`: `home-1440-topo.png`, `home-1440-claro-topo.png`, `home-360-topo.png`, e as páginas inteiras `home-1440-inteira.jpg`, `home-360-inteira.jpg`, `livro-1440-inteira.jpg`, `livro-360-inteira.jpg` (tema escuro, movimento reduzido pra mostrar o estado final).

## Arquivos

Estilos em `src/styles/` (`tokens`, `base`, `bento`, `home`, `ledger`, `motion`, e `legacy` só pra vestir a 404, que fica fora do que a F19 pode mexer). O prisma é `src/components/site/prism.ts` (geometria, larga e alta) e `PrismArt.astro`.
