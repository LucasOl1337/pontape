# F30 · Diário

## 23/09/2026

### Contexto lido

- `AGENTS.md`, `BRIEF.md` da F30, feedback do Lucas de 23/09, `palettes.css`, `palettes.test.ts`, `PaletteSwitcher.astro`, script inline do `BaseLayout.astro`, `site.css` (só pra ver onde cada token entra), diário da F28 e `docs/design/DIRECAO.md`.
- Bancada `anil-f30` no workspace 7, Chromium próprio preparado a partir do seed (`lives_in: anil-f30`, `user_data_dir` exclusivo). Dev server local em `127.0.0.1:4330`. Prints por CDP com script próprio no scratchpad (compensa o zoom 110% do perfil quando aparece; aqui veio 1.0).

### Por que a Jornal funciona e onde as cinco erraram (medido em OKLCH)

- Jornal: papel `#F3EEE4` L 0,95 C 0,014 H 85; tinta `#17140F` L 0,19 C 0,011 H 80; acento `#B23A1B` L 0,52 C 0,16 H 35. Papel e tinta no **mesmo matiz** quente com croma quase zero: parece papel e tinta, não tela colorida. Um acento só, escuro e terroso, que age como tinta vermelha de rubrica. Faixa escura é o papel invertido (mesmos dois valores). Estados com cor de pigmento apagado.
- As cinco reprovadas giraram o papel pra um matiz (verde, azul, rosa, amarelo, azul-escuro) com croma 0,01 a 0,04, e tingiram a tinta no mesmo matiz com croma 0,04 a 0,07 (4 a 6 vezes a da Jornal) e L 0,26 a 0,27 (mais clara que 0,19). Resultado: tinta lavada, papel que vira "tema de app", acento ou no mesmo matiz (Mata, Ipê) ou no complementar de manual (Mar, Sol). Todas seguiram a mesma fórmula, então parecem o mesmo site com cinco filtros. Noite ainda trocou o quente pelo ardósia frio.

### Método desta rodada

- Cada candidata parte de um **material** (papel + tinta + segunda tinta) e não de um matiz. Papel com croma baixo ou croma de material real (kraft, pêssego). Tinta neutra, L ≤ 0,23. Uma segunda tinta escura com croma de pigmento (0,12 a 0,17). Caderno e faixas escuras como inversão do papel. Estados como pigmento apagado no mesmo clima.
- Gerador no scratchpad converte OKLCH → hex e roda os mesmos pares do `palettes.test.ts` antes de eu olhar qualquer print.

### Onde parei

- Primeira leva gerada (Anil, Pauta, Kraft e variante vinho, Pêssego e variante verde-garrafa, Carvão). Todas passam 4,5:1 em todos os pares. Prints da home em 1440 em andamento pra autocrítica.

### Primeira autocrítica (home em 1440, sete candidatas lado a lado com a Jornal)

- **Anil** (creme da direção original, tinta neutra, segunda tinta azul-anil `#294EB2`): parece caneta azul em papel; fica.
- **Pauta** saiu com papel azulado (C 0,006 no matiz 240 já lê como "Mar clarinha"). Papel refeito quase neutro (C 0,003). Tinta azul-preta e margem vermelha ficam.
- **Kraft**: papel pardo funciona como material, mas o carimbo verde vira "cheque de banco" e briga com o verde de "Funcionando". A variante vinho (`#8E2E45`) lê como carimbo em envelope pardo. Fica a vinho, papel um pouco menos amarelo, e o nome vira **Envelope** (papel pardo de envelope; "Pardo" sozinho tem outro sentido no Brasil e "Kraft" não é português).
- **Pêssego**: a segunda tinta ameixa puxa pro clima da Ipê reprovada. A variante verde-garrafa (`#00633F`) fica fresca e séria. Fica a verde, papel um pouco menos rosado.
- **Carvão**: carvão quente (H 70) com tinta creme e brasa `#FF8D64`; o botão principal vira creme com texto escuro por inversão. Lê como modo de leitura noturno de papel, não como terminal. Caderno como cartão creme sobre o escuro, a conferir no `/transparencia`.
- Nomes no seletor: Jornal, Anil, Pauta, Envelope, Pêssego, Carvão. O teste agora deriva a lista do CSS e confere que o seletor e a regex do `<head>` conhecem exatamente as mesmas paletas.

### Segunda autocrítica (seis lado a lado: home 1440 e 360, degrau 4 aberto, caderno Classificados aberto, /transparencia 1440 e 360)

- Tudo passa sem rolagem horizontal em 360. Cadernos e degrau seguem a paleta sem cor solta.
- O ponto fraco apareceu no caderno do livro (`Confira você mesmo`): a segunda tinta clareada pro fundo escuro. Na Envelope, o vinho clareado (`#FFA6B4`) virou rosa-chiclete: barato. Refeito como coral queimado `#F89177` (mesma família quente do papel pardo, lê como lacre). Na Pêssego o verde do caderno estava menta demais; um pouco mais fundo (`#6BD3A3`). Na Anil o azul do caderno perdeu um pouco de croma (`#9CBEFC`) pra não parecer botão de sistema. Na Carvão a rubrica do cartão creme desceu pra `#A83111` (5,5:1 em vez de 4,8:1).
- Cortei de vez: Kraft com carimbo verde (cheque) e Pêssego com ameixa (Ipê de novo). Nenhuma das seis finais me pareceu barata depois do ajuste; a mais arriscada segue sendo a Carvão, por ser escura, mas ela resolve o que a Noite errou (matiz quente, caderno como papel).

## Estado final

- Rebase sobre `origin/main` já com a [PR #67](https://github.com/LucasOl1337/pontape/pull/67) do Prumo (o caderno virou página); prints refeitos depois do rebase e `npm run check` repetido e verde (CSP com 4 hashes).
- PR [#70 · F30 · Paletas, rodada 2](https://github.com/LucasOl1337/pontape/pull/70) aberta pra `main`, com os links `?cor=` das seis, os prints e o passo pra remover ou promover uma paleta. Report enviado ao Regente.
- Bancada `anil-f30` (workspace 7) fica no ar sem abas próprias abertas, pronta pra uma rodada de ajuste se o Lucas pedir. Dev server local parado. Gerador OKLCH → hex e conferidor de contraste ficaram no scratchpad da sessão; se precisar refazer uma paleta, o caminho está descrito na seção "Método desta rodada".

## Decisões propostas

- Nenhum token novo foi necessário. Se o Lucas escolher a Carvão, vale uma passada do Prumo nas sombras duras (`box-shadow` com `--ink`) e nos hachurados do degrau, que em papel escuro ficam mais fortes do que no creme.
- Depois da escolha, renomear `--red` pra `--accent` (proposta da F28, mantida).
