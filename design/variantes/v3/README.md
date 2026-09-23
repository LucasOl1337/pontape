# F19 v3 · Ábaco

## Conceito em 5 linhas

1. O livro é a página: a home abre nos números do livro público e na corrente das ações, com Conferir e busca por nº ou marca no primeiro olhar.
2. A ideia do projeto (problema, jornada, módulos, gargalos, como ajudar) vem depois, em volta do livro, cada bloco com o dado vivo dele.
3. Estética de explorador de dados escuro (Etherscan, painel de status, Stripe): painéis de linha fina, números e marcas em mono, uma cor de ação só (menta = confere).
4. Três visualizações em SVG com os dados reais: corrente navegável, ábaco (linha do tempo por tipo) e fluxo do dinheiro (Sankey), todas honestas com zero.
5. Cada marca vira uma impressão digital de 16 barras; quando alguém mexe numa linha, o Conferir mostra a guardada do lado da refeita, e a diferença salta aos olhos.

## O que fiz diferente e por quê

- **Home abre no livro, não num slogan.** Números (ações, entrou, saiu, em caixa, pessoas apoiadas, marca da ponta, última ação), busca e a corrente das 7 ações mais novas até a nº 1, "o pontapé inicial". Conferir ali mesmo: as contas acendem uma por uma.
- **Corrente navegável** em `/transparencia`: blocos ligados do mais novo pro mais antigo; passar o mouse num bloco acende a marca dele no bloco seguinte. Clicar abre o **inspetor** (tipo página de transação): marca inteira, anterior com link, texto exato que vira a marca e botão "Refazer a conta desta ação".
- **Ábaco:** quatro varetas (Dinheiro, Vida real, Candidato, Projeto), uma conta por ação. Hoje só a vareta de Projeto tem contas, e as vazias dizem por quê. É o retrato honesto do projeto.
- **Fluxo do dinheiro:** Sankey das doações até cada categoria e o que ficou em caixa. Com o livro real zerado vira esqueleto tracejado com R$ 0,00; o modo exemplo (fictício, marcado) mostra ele cheio. Tabela com os números logo abaixo.
- **Módulos como página de status** (barra de proporção + linhas que abrem), **gargalos como problemas em aberto**, **contribuições como lista de issues**, **jornada como pipeline** com contador do livro em cada passo (zero honesto).
- **Paleta dos tipos validada pra daltonismo** no fundo escuro (script da skill de dataviz): ouro, água, laranja, azul, sempre com ícone e nome.
- **Fontes:** só Atkinson Hyperlegible Mono (títulos, números, marcas) e Next (texto corrido), já servidas pelo site. Tirei a Archivo.

## Números

- `npm run check`: lint, tipos, testes, livro e build passam. O orçamento passa na home e estoura no livro:
  - Home: **35,0 KB ao abrir**, 59,2 KB com o verificador (ok). O livro publicado (`/livro/ledger.json`, uns 4 KB) só desce quando a pessoa aperta Conferir, junto com o verificador; o script de orçamento não conta esse download.
  - `/transparencia`: **43,6 KB ao abrir**, 67,8 KB com o verificador (7,8 KB acima). É o explorador inteiro: carrega os dois livros completos em linha (real, 33 ações, e exemplo, 20) pra o Conferir checar exatamente o que aparece, e cada um em quatro vistas (corrente, tabela, dinheiro, ábaco). Cortei o que dava: CSS separado por página, fala dos módulos lida dos próprios campos, inspetor lendo as frases da tabela, 6 ícones sem uso.
- Fontes: 87,1 KB de 120 KB.
- 360 px sem rolagem lateral nas duas páginas (medido). Teclado: uma parada de Tab por corrente e por ábaco, setas andam, Enter abre.

## Prints

`prints/`: `home-1440-topo`, `home-1440-inteira`, `home-360-topo`, `home-360-inteira`, `livro-1440-topo`, `livro-1440-inteira`, `livro-360-topo`, `livro-360-inteira`, e três de interação: `home-1440-conferido` (Conferir da home), `livro-1440-exemplo-quebra` (linha mudada escondido, marca guardada x refeita), `livro-1440-exemplo-dinheiro` (Sankey cheio no exemplo).
