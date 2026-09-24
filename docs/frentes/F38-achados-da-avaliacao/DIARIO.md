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

Lote 1 pronto. `lint`, `typecheck`, `test` (145), `ledger:verify`, `build` e `budget` passam, rodados um a um com o `astro dev` no ar. A parte técnica foi de 53,5 pra 54,7 KB (de 60) com o que carrega sob demanda. Lote 1 aprovado pelo Regente (PR #90).

## 24/09 · Lote 2 (UX e texto) pronto

Mesmo jeito de conferir (bancada `f38-medidas`, build local servido à parte). Prints agora fora do repo, em `/tmp/claude-1000/f38-prints/lote2-*` (celular 393 e desktop 1440 de cada item).

| Item | Causa | O que mudou | Commit |
|---|---|---|---|
| 1 · ficha com jargão | O alto dizia "Peça M7" e os botões "M6" e "M8", num passo chamado 5. | O alto diz "Peça do passo 5" (fora da home, "Peça do projeto"); o código M7 fica pequeno e cinza ao lado. Os botões levam o nome da peça vizinha, com "Anterior" e "Próxima" em cima; no celular um embaixo do outro. | `4adbd50` |
| 2 · estado da escada | A bolinha vermelha era o cursor do portal (lote 1). O hachurado cinza do degrau aberto repetia o que a bolinha já diz. No celular, a bolinha não tinha nome. | Sai o hachurado. O degrau aberto é marcado pela bolinha, pelo caminho cheio até ela e pontilhado depois, e no computador pelo nome em azul. "alguém" aparece em cima da bolinha no passo 1 também no celular. | `9c845d0` |
| 3 · "Sua vez" sem ação | Três dos quatro jeitos diziam "Ainda não abriu". | Abre com os dois que já funcionam, cada um com botão: "Mandar pra alguém" (folha de compartilhar do celular; sem ela, copia o link e avisa) e "Ver as tarefas". Doar, voluntário e vaga viram uma linha dizendo quando abrem. Nada coleta dado, nenhuma conta criada. | `7ffa1d9` |
| 4 · Conferir azul-claro | Única cor de botão do site que não aparecia em outro lugar. | Botão principal ao contrário: papel sobre tinta (16:1); no hover só contorno. /transparencia e parte técnica. | `e7d0545` |
| 5 · home ao rolar | No computador o texto do passo sobe primeiro e a escada fica sozinha até o rodapé preto. | Faixa curta depois da escada: uma linha sobre o que ela é e como usar, e três botões (mandar pra alguém, abrir o livro, construir junto). A primeira tela não muda. | `79803b9` |
| extra · #87 | O script embutido da home usava `Object.hasOwn` (Chrome 93); script embutido não passa pelo build. | Forma antiga equivalente. | `2ab6bcf` |

### Decisões propostas

- Item 5: a faixa explica a escada pra quem rolou, mas o texto do passo continua subindo junto com a página no computador. Prender o painel na tela ao rolar mexeria no layout da escada (D031); não fiz.
- Item 3: "Mandar pra alguém" também aparece na faixa do fim da home. Se parecer repetido, sai de um dos dois.

### Onde parei

Lote 2 pronto. `lint`, `typecheck`, `test` (145), `ledger:verify`, `build` e `budget` passam (home 23,7 KB, parte técnica 55,2 KB com o sob demanda, de 60). Próximo: lote 3, quando o Regente liberar.
