# F19 v2 · Crônica

Rodada 1 das variantes visuais (F19). Porta local: `npx astro dev --host 127.0.0.1 --port 4342`.

## Conceito em 5 linhas

1. O site é um especial de jornal: papel, tinta preta, serifa grande e um vermelho só.
2. A home conta a história de uma virada que **ainda não aconteceu**, capítulo por capítulo.
3. A pessoa é só um ponto vermelho ("alguém") que sobe uma escada desenhada em traço, sem nome e sem rosto.
4. O traço se desenha enquanto a pessoa lê: seções presas (`position: sticky`) e linhas SVG que acompanham o scroll.
5. O livro público é o "caderno escuro": a mesma linha vira corrente, e o Conferir marca elo por elo.

## O que fiz diferente e por quê

- **Narrativa em vez de blocos soltos.** Capa com manchete ("O pontapé inicial pra quem quer mudar de vida"), cinco capítulos numerados, classificados, expediente e "Continua". Cada parte do PRD virou uma seção de jornal: gargalos são perguntas em aberto, contribuições são classificados ("Precisa-se"), código aberto é o expediente, regras do livro são o manual de redação.
- **Escada que se desenha.** No capítulo 2, os 7 passos da jornada (`src/data/site/journey.ts`) viram 7 degraus. O ponto sobe um degrau por passo lido e o ícone do degrau se desenha quando ele chega.
- **O nome no traço.** PontaPé virou a bola desenhada em linha que dá o pontapé no começo da escada, na capa e no fim.
- **Honestidade na própria história.** "Esta história ainda não aconteceu" abre o capítulo 2. Zero honesto na capa ("Hoje, em números"), selos em cada peça, faixa de em construção no topo.
- **Como conferir com o texto de verdade.** Na `/transparencia`, o scrollytelling mostra o texto canônico da última ação (o mesmo que entra na SHA-256), a marca dela e a corrente das três últimas.
- **Fontes:** Newsreader (OFL) em quatro instâncias fixas (título, texto 400/600 e itálico) + Atkinson Hyperlegible Next. Saíram Archivo e Atkinson Mono (hash usa a mono do sistema). Total 117 KB de 120.

## Números

- `npm run check` passa.
- Orçamento: home 35,5 KB ao abrir e 60,0 KB com o verificador carregado sob demanda (no limite; o JSON do livro embutido cresce a cada ação). `/transparencia` 32,8 KB / 57,3 KB.
- Home em 1440×860: umas 22 telas. Longo demais, e o Lucas disse isso no feedback da rodada 1 (ver F22).

## Prints

`prints/home-1440.jpg`, `prints/home-360.jpg`, `prints/livro-1440.jpg`, `prints/livro-360.jpg` (página inteira, com movimento reduzido pra mostrar os desenhos completos).
