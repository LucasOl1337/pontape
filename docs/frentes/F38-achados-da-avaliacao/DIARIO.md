# F38 · Diário

## 24/09 · Lote 1 (layout e celular) pronto

Como conferi: Chromium 151 numa bancada própria (agent-bench `f38-medidas`), por CDP, com medição da largura do documento e de todo elemento e texto que passa da borda. "Letra maior" é o `html` em 118,75%, o tamanho do antigo A+, que também simula a letra do navegador aumentada. Os portais do Maestri pararam de desenhar no meio da sessão (janela minimizada), por isso os prints vieram da bancada.

| Item | Causa | O que mudou | Commit |
|---|---|---|---|
| 1 · #54 404 em 320 px | Sem o A+ o 404 já cabia. Com letra maior, o nome "Trabalho", na última coluna da escadinha (menos de 60 px), passava 1 px da tela. | Abaixo de 400 px os nomes ficam em 11 px e com menos margem lateral. | `01394e0` |
| 2 · #56 livro em 320 px | A parte técnica já cabia em todos os estados (três abas, exemplo, Conferir, mudar uma linha, filtro, página). Quem transbordava era a primeira camada, `/transparencia`: as três contagens com número que não quebra somavam 334 px em 320 (394 px com letra maior). | Abaixo de 400 px o número segue a largura da tela e o respiro entre as colunas diminui. | `b6ac717` |
| 3 · #87 Chrome antigo | O build (lightningcss, Vite 8) reescrevia toda media query como faixa, `(width>=960px)`, que só existe do Chrome 104 em diante. No Chrome 83 nenhuma media query valia: menu do celular sumido, nomes da escada à mostra quebrando letra por letra. Além disso: `not (...)` em media query, `svh`, `cqh`/`cqw`, `color-mix()`, `inset`, `:is()`, `:has()`, `margin/padding-inline/-block`, `border-block`, `overflow-x:clip`, `gap` em flexbox, e `??=` no JS da parte técnica. | Alvo de build e de CSS inclui Chrome 83 (`astro.config.mjs`); unidades novas por variável (`--svh`, `--cqh`, `--cqw`) com reserva em vh/vw; `rgba(var(--ink-rgb), x)` no lugar de `color-mix`; formas longas; `@supports` para `:has()`, `clip` e o gap de flexbox. | `ea93856`, `3e34133` |
| 4 · abas em 2 linhas | Letra de 23 px e 32 px entre as abas pediam uns 400 px. | Até 599 px a letra segue a tela (16 a 22 px) e o espaço encurta: numa linha de 320 a 599 px. Com letra bem maior a fileira rola de lado, com esmaecido no lado que ainda tem aba. | `c21fe51` |
| 5 · "M" do Menu vermelho | Não é do site: é o marcador de clique do portal do Maestri, uma bolinha vermelha de 12 px (`rgba(255,59,48,.6)`, `#__maestri_cursor`, fica 3 s) desenhada onde o `portal click` toca. A "bolinha vermelha" no degrau do lote 2 deve ser a mesma coisa. Conferido com o menu aberto sobre a escada e sobre o livro rolado: nada da página passa por cima do cabeçalho (z-index 50). | Nada. | sem commit |
| 6 · degraus com 40 px | Nove degraus dividem a tela: 34 px em 320, 40 em 375, 42 em 393. A área de toque era só o bloco desenhado (50 a 180 px de altura). | Cada degrau responde na coluna inteira, do alto da escada até a faixa da IA (195 px em 320, 231 em 393), e o primeiro e o último vão até a borda (cerca de 46 e 49 px em 393; os do meio ficam em 42). Desenho igual. | `df73c88` |

### Conferência de que o Chrome novo não mudou (#87)

Build antes (commit do brief) e depois, servidos lado a lado, prints de página inteira no Chromium 151 em 320, 393, 768, 820, 1024, 1280, 1440 e 1920 px, nas 9 páginas e com os degraus 3 e 8 abertos. Diferença só onde os itens 1 e 2 mexeram de propósito, e 1 nível de cor (em 255) no hachurado do degrau escolhido e da escadinha do "Como conferir" (rgba no lugar de color-mix). Chrome antigo não há aqui: o CSS gerado foi lido propriedade por propriedade contra o Chrome 83.

### Prints finais (build de produção)

Em `prints/`: `lote1-404-*`, `lote1-transparencia-*`, `lote1-abas-*`, `lote1-home-*`, `lote1-menu-aberto-celular-393.png`. Celular em 393 e 320 (com letra maior), desktop em 1440.

### Decisões propostas

- Item 6: 44 px de largura pra todos os degraus não cabe sem mudar o desenho (9 × 44 = 396 px de tela). O que dá, sem tocar a D031, está feito. A altura passou de 44 com folga, e o WCAG 2.5.8 (24 px, nível AA) é atendido.
- Item 5: se o Regente quiser, o botão Menu pode mostrar que está aberto (fundo tinta, como os filtros). Não fiz porque não era o achado.

### Onde parei

Lote 1 pronto. `lint`, `typecheck`, `test` (145), `ledger:verify`, `build` e `budget` passam, rodados um a um com o `astro dev` no ar. A parte técnica foi de 53,5 pra 54,7 KB (de 60) com o que carrega sob demanda. Próximo: lote 2, quando o Regente liberar.
