# F21 · Comparativo objetivo das cinco variantes

Medição em 22/09/2026, nos commits da primeira rodada de F19: [Prisma #46](https://github.com/LucasOl1337/VidaNova/pull/46) `fae49f3`, [Crônica #47](https://github.com/LucasOl1337/VidaNova/pull/47) `42fa8c7`, [Ábaco #45](https://github.com/LucasOl1337/VidaNova/pull/45) `2d1870a`, [Maracatu #39](https://github.com/LucasOl1337/VidaNova/pull/39) `2e969ec` e [Pluma #38](https://github.com/LucasOl1337/VidaNova/pull/38) `e3cb5fa`. Cada commit foi instalado com `npm ci` e construído num worktree temporário separado. Os testes de navegador usaram os builds estáticos locais em `127.0.0.1:4441` a `:4445`, com o `_headers` gerado aplicado, numa bancada `agent-bench` exclusiva. Nenhum worktree das variantes foi alterado. A escolha visual pertence ao Lucas; esta tabela só registra comportamento mensurável.

| Régua | Prisma · v1 | Crônica · v2 | Ábaco · v3 | Maracatu · v4 | Pluma · v5 |
| --- | --- | --- | --- | --- | --- |
| `npm run check` no commit da PR | **Passou** · 127 testes | **Passou** · 127 testes | **Falhou no budget** · lint, tipos, 127 testes, livro e build passaram | **Passou** · 127 testes | **Passou** · 127 testes |
| Home, KB iniciais → com Conferir (limite 60 KB) | 40,2 → 48,9 | 35,5 → 60,0 | 35,3 → 59,5 | 37,1 → 45,7 | 17,0 → 17,0 |
| Livro, KB iniciais → com Conferir (limite 60 KB) | 36,9 → 45,5 | 32,8 → 57,3 | 43,9 → **68,2; falha** | 35,1 → 43,7 | 26,9 → 51,3 |
| Build servido: CSP, console JS, rotas | CSP presente; 0 violação/erro; home/livro 200, rota ausente 404 | Igual | Igual | Igual | Igual |
| Conferir livro real | **Passou**, 36 ações | **Passou**, 33 ações | **Passou**, 33 ações | **Passou**, 35 ações | **Passou**, 34 ações |
| Conferir exemplo e adulteração | Exemplo 20 ações passou; alteração da nº 2 detectada | Igual | Igual | Igual | Igual |
| Home 320 px, largura do conteúdo sem/com A+ | 305/308 px · passou | 305/319 px · passou | 305/305 px · passou | **335/354 px · falhou** | 305 px · passou; não há A+ |
| Livro 320 px, sem/com A+ | 305/305 px · passou | 305/307 px · passou | 305/305 px · passou | 305/313 px · passou | 305 px · passou; não há A+ |
| 360 px, home e livro, sem/com A+ | Passou em todas as combinações | Passou em todas as combinações | Passou em todas as combinações | Passou em todas as combinações | Passou; não há A+ |
| Zoom real 200%, janela física 640 px: home/livro | 312/312 px para viewport CSS 320 · passou | 312/312 · passou | 312/312 · passou | **335/312 · home falhou** | 312/312 · passou |
| Teclado completo e foco visível | 88/101 paradas home/livro; passou | 92/92; passou | 82/109; passou; buscas realçadas no contêiner | 89/96; passou | 31/96; passou |
| Movimento reduzido | **Parcial:** animações param, mas transições espaciais continuam | Passou | Passou | Passou | Passou |
| `forced-colors: active` a 360 px | Primeira dobra da home/livro legível; sem estouro | Igual | Igual | Igual | Igual |
| Contraste AA do texto principal | Passou nas amostras sólidas; texto gradiente grande passou pelo limite das cores de parada | Passou nas amostras sólidas | Passou nas amostras sólidas | Passou nas amostras sólidas | Passou nas amostras sólidas |
| 3G lento, home: `load` / bytes transferidos | 6.342 ms / 257.622 B | 7.063 ms / 304.177 B | 5.976 ms / 235.594 B | 6.894 ms / 284.309 B | 3.229 ms / 112.752 B |
| 3G lento, livro: `load` / bytes transferidos | 6.445 ms / 261.819 B | 7.446 ms / 313.092 B | 7.451 ms / 309.274 B | 7.106 ms / 293.078 B | 5.024 ms / 195.740 B |
| Downloads e robôs | Livro/checkpoint JSON e `robots.txt`: HTTP 200 | Igual | Igual | Igual | Igual |
| Regras comuns da F19 | Faixa “Em construção”, R$ 0,00, M1–M9 com estado, sem foto de pessoa nem travessão | Igual | Igual | Igual | Igual |

O budget acima é o valor do script do projeto para HTML, CSS e JS da página; fontes ficam fora dele. O teste de 3G mediu `load` com 400 ms de latência, 50.000 B/s de download, cache desligado e viewport de 360 px. O servidor estático local **não comprimia** as respostas: os bytes são transferências deste ensaio, úteis para comparar os cinco builds, e não uma promessa de tempo ou tráfego da hospedagem final. As fontes nos builds somavam respectivamente 46,2, 117,0, 87,1, 87,1 e 87,1 KB. A contagem do livro varia porque as PRs partiram de instantes diferentes do livro vivo; cada livro conferiu contra seu próprio checkpoint.

No teclado, além de percorrer a ordem de Tab e verificar o foco em cada alvo, Enter abriu e Escape fechou a ficha de módulo nas v1, v2 e v4. Nas v3 e v5, Enter expandiu o `details` do módulo. A busca da v3 destaca o contêiner, não o contorno nativo do campo.

O CI verde da [PR #45](https://github.com/LucasOl1337/VidaNova/actions/runs/35808429537) não contradiz a falha no commit isolado do Ábaco: o workflow fez checkout do merge temporário `df1395f` de `2d1870a` com `main` `fef6b67`. A `main` já continha a troca do verificador para Zod Mini (`a881453`), ausente do head da PR. Nesse merge o livro ficou em 45,0/53,5 KB e passou; no head medido, 43,9/68,2 KB. A tabela usa o **commit da PR**, como pede o brief, e registra o efeito do merge para orientar a integração.

O teste de contraste percorreu texto da home e do livro em 360 px e calculou WCAG AA quando o fundo sólido pôde ser determinado por CSS. Não encontrou amostras abaixo de AA. Na Prisma, quatro trechos de texto em gradiente são grandes (h1, h2 e frase de pelo menos 26 px com peso 600): mesmo a cor de parada menos contrastante no tema claro dá 3,76:1 contra o fundo claro, acima de 3:1 exigidos para texto grande. Gradientes decorativos atrás de outros textos não foram certificados pixel a pixel. Em forced-colors, o título principal foi preto sobre branco nas cinco, e a primeira dobra das duas páginas foi inspecionada após terminar a animação de entrada. Isto não substitui uma auditoria de acessibilidade da variante escolhida.

Sem `SITE_URL`, todos os builds locais mantêm `og:image` e `twitter:image` relativos (`/og.png`) e não têm canonical/`og:url` absolutos. É a condição de build já documentada no [ensaio F18](ENSAIO-LANCAMENTO.md), comum às cinco variantes; o endereço final deve entrar no build de lançamento.

### O que chamou atenção em cada variante

**Prisma**

1. O budget do livro ficou em 45,5 KB mesmo após carregar o verificador; o livro real, o exemplo e a adulteração responderam corretamente.
2. Com `prefers-reduced-motion: reduce`, a animação principal para, mas o caminho ainda usa `transition: transform .9s`, e menu, toast e setas conservam transições espaciais. O movimento reduzido está incompleto.
3. A tipografia em gradiente é aplicada só a texto grande; no tema claro a pior cor de parada calculada ficou em 3,76:1 sobre o fundo claro.

**Crônica**

1. A home chega a 60,0 KB com Conferir, no limite do budget; pequenas adições podem ultrapassá-lo.
2. Teve as maiores transferências do ensaio 3G na home e no livro (304.177 e 313.092 B); o build contém 117,0 KB de fontes.
3. O verificador encontra a adulteração nº 2, mas a mensagem diz “As 1 ações antes dela estão certas”; a concordância já está registrada na [issue #43](https://github.com/LucasOl1337/VidaNova/issues/43).

**Ábaco**

1. O head da PR excede o budget do livro com Conferir em 8,2 KB; o CI do merge temporário passa porque recebe Zod Mini da `main`.
2. O livro real (33 ações), o exemplo (20) e a adulteração nº 2 passaram no navegador do build isolado, apesar do budget.
3. Os campos de busca mostram foco no contêiner com borda verde e sombra de 3 px, mesmo sem contorno no próprio `input`; o livro levou 7.451 ms no 3G local.

**Maracatu**

1. A home ultrapassa 320 px por 15 px sem A+ e por 34 px com A+; a grade de números corta texto. [Captura da rolagem](comparativo/v4-home-320-overflow.png) e [captura dos números](comparativo/v4-home-320-contadores-centro.png).
2. O problema persiste em zoom real de 200% com viewport CSS de 320 px; o livro não estoura nessa largura.
3. CSP, Conferir, teclado, movimento reduzido e forced-colors passaram; o livro transferiu 293.078 B no 3G local.

**Pluma**

1. É a única sem botão A+; a exigência de 320/360 px foi medida no tamanho padrão, e o zoom real de 200% passou.
2. Registrou 3.229 ms/112.752 B na home e 5.024 ms/195.740 B no livro no mesmo 3G local.
3. O livro real (34 ações), o exemplo e a adulteração nº 2 passaram, assim como CSP, teclado, movimento reduzido e forced-colors.
