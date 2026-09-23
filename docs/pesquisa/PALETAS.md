# Paletas de cor: referências e candidatas da rodada 2

F30 · dono: `anil` (Anil · Claude Fable 5.1) · 23/09/2026

Este documento junta o que foi lido e visto fora do projeto antes de desenhar as cinco candidatas novas, e o porquê de cada uma. Todas as afirmações factuais têm link e data de acesso. Nenhuma paleta copia marca de ninguém: as referências servem pra entender **por que** certas combinações de papel, tinta e acento funcionam em texto longo.

## 1. Por que a Jornal funciona e onde as cinco da rodada 1 erraram

Medido em OKLCH (L = claridade percebida, C = croma, H = matiz), com script próprio sobre o `palettes.css`:

| Paleta | Papel | Tinta | Acento | Diagnóstico |
|---|---|---|---|---|
| **Jornal** | `#F3EEE4` L 0,95 C 0,014 H 85 | `#17140F` L 0,19 C 0,011 H 80 | `#B23A1B` L 0,52 C 0,16 H 35 | Papel e tinta no mesmo matiz quente, croma quase zero. Parece papel e tinta |
| Mata | L 0,97 C 0,011 H 129 | L 0,26 C 0,039 H 161 | L 0,47 C 0,11 H 149 | Papel, tinta e acento no mesmo verde: um filtro, não uma paleta |
| Mar | L 0,97 C 0,007 H 234 | L 0,26 C 0,049 H 249 | L 0,52 C 0,13 H 46 | Papel azulado + tinta marinho + laranja complementar: cara de banco |
| Ipê | L 0,97 C 0,010 H 355 | L 0,27 C 0,061 H 325 | L 0,50 C 0,17 H 355 | Rosa + roxo + magenta: bala, perde a seriedade |
| Sol | L 0,97 C 0,037 H 95 | L 0,27 C 0,066 H 262 | L 0,45 C 0,17 H 264 | Papel amarelo saturado (post-it) com tinta e acento azuis: time de futebol |
| Noite | L 0,22 C 0,021 H 255 | L 0,96 C 0,018 H 86 | L 0,79 C 0,12 H 33 | Ardósia fria com creme quente e salmão: tema de terminal |

Em cinco linhas:

1. A Jornal acerta porque papel e tinta são **neutros do mesmo matiz**: o creme parece papel e o quase-preto parece tinta, e a diferença entre eles é só claridade (0,95 contra 0,19).
2. Um acento só, escuro (L 0,52) e terroso, usado como tinta vermelha de rubrica: números, itálicos, etiquetas. Nunca como fundo grande.
3. As faixas escuras e o caderno do livro são o papel **invertido**: os mesmos dois valores trocados de lugar. Nada de terceira cor de fundo.
4. As cinco reprovadas giraram o papel pra um matiz e tingiram a tinta no mesmo matiz com croma 4 a 6 vezes maior que a da Jornal e L mais alta (0,26 contra 0,19): tinta lavada sobre papel que virou tela.
5. Todas seguiram a mesma fórmula (papel tingido + tinta tingida + acento no matiz ou no complementar), então parecem o mesmo site com cinco filtros. Nenhuma partiu de um material.

## 2. Referências de fora

### 2.1 Sistemas de cor publicados

- **Flexoki** (Steph Ango). "An inky color scheme for prose and code", inspirado em tintas analógicas e tons quentes de papel. Papel `#FFFCF0`, preto `#100F0F`, fundo claro `#F2F0E5`, escuro `#1C1B1A`; acentos escuros pra texto (vermelho `#AF3029`, laranja `#BC5215`, azul `#205EA6`, verde `#66800B`). Derivado em Oklab "to maintain those perceptual relationships at the light and dark ends of the spectrum". É a referência mais próxima do que a Jornal já faz. [stephango.com/flexoki](https://stephango.com/flexoki), acesso em 23/09/2026.
- **Solarized** (Ethan Schoonover). Claridades definidas em CIELAB, "symmetric CIELAB lightness differences, so switching from dark to light mode retains the same perceived contrast". Fundo claro `#FDF6E3` (creme), escuro `#002B36`. Mostra que um tema escuro sério precisa de relação de claridade planejada, não só inverter. [ethanschoonover.com/solarized](https://ethanschoonover.com/solarized/), acesso em 23/09/2026.
- **USWDS** (governo dos EUA). Escala de "grades" 0 a 100 regularizada por claridade; diferença de 50 graus garante AA pra texto, 70 garante AAA ("magic number"). Tokens de sistema separados dos tokens de tema por papel (theme tokens). [designsystem.digital.gov/design-tokens/color/overview](https://designsystem.digital.gov/design-tokens/color/overview/), acesso em 23/09/2026.
- **Stripe, "Designing accessible color systems"**. "The way HSL calculates lightness is flawed"; trabalharam em CIELAB pra que "any two colors are guaranteed to have sufficient contrast for small text if they are at least five levels apart". Justifica gerar as candidatas em espaço perceptual e conferir depois. [stripe.com/blog/accessible-color-systems](https://stripe.com/blog/accessible-color-systems), acesso em 23/09/2026.
- **Evil Martians, "OKLCH in CSS"**. L do OKLCH é "perceived lightness (0-1)... consistent lightness for our eyes, unlike L in hsl()"; mudar matiz mantendo L não muda o contraste. Foi o espaço usado aqui. [evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl), acesso em 23/09/2026.
- **Radix Colors**. Escala de 12 passos com função fixa por passo (1-2 fundo, 3-5 componente, 6-8 borda, 9-10 sólido, 11-12 texto); os passos de texto são garantidos em Lc 60 e Lc 90 (APCA) sobre o passo 2. Amarelo, âmbar, lima, menta e céu exigem texto escuro. [radix-ui.com/colors/docs/palette-composition/understanding-the-scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), acesso em 23/09/2026.
- **GOV.UK Design System**. Texto `#0B0C0C`, texto secundário `#484949`, link `#1A65A6`, erro `#CA3535`, sucesso `#0F7A52`, fundo `#FFFFFF`. Exige WCAG 2.2 AA e proíbe copiar o hex fora do papel funcional. Serviço público lido por todo mundo: preto no branco, um azul, e as cores de estado apagadas. [design-system.service.gov.uk/styles/colour](https://design-system.service.gov.uk/styles/colour/), acesso em 23/09/2026.
- **Wikimedia Codex** (fundação sem fins lucrativos). Texto `#202122`, sutil `#54595D`, fundo `#FFF`, progressivo `#36C`, destrutivo `#BF3C2C`, sucesso `#177860`, aviso `#886425`. "Link text can appear on top of any of the background color options while maintaining enough contrast to satisfy the WCAG Level AA". [doc.wikimedia.org/codex/latest/design-tokens/color.html](https://doc.wikimedia.org/codex/latest/design-tokens/color.html), acesso em 23/09/2026.
- **Mozilla Protocol** (fundação). Preto `#161616` em vez de `#000`, branco `#FAFAFA` em vez de `#FFF`, e a regra "avoid using colors outside this palette unless you have a good reason". [protocol.mozilla.org/docs/fundamentals/color](https://protocol.mozilla.org/docs/fundamentals/color), acesso em 23/09/2026.
- **The Guardian, Source** (paleta gerada no repositório `guardian/csnx`). Neutros de `#121212` a `#F6F6F6` sem tingir; marca `#052962`; news `#C70000`; sucesso `#22874D`. Cada editoria tem uma escala, mas a base de leitura é cinza neutro com uma cor por seção. [github.com/guardian/csnx (libs/@guardian/source/src/foundations/__generated__/palette.ts)](https://github.com/guardian/csnx/blob/main/libs/%40guardian/source/src/foundations/__generated__/palette.ts), acesso em 23/09/2026.

### 2.2 Sites editoriais e de organizações, vistos na bancada em 23/09/2026 (1440 px)

| Site | O que faz com cor | Amostra medida no print |
|---|---|---|
| [Financial Times](https://www.ft.com/) | Papel salmão com preto e dois acentos (claret e teal). O salmão é a marca desde 1893, quando "it was cheaper not to bleach the paper" ([Wikipedia, Financial Times](https://en.wikipedia.org/wiki/Financial_Times), acesso em 23/09/2026) | teal `#0D7680` nos links |
| [piauí](https://piaui.folha.uol.com.br/) | Papel creme `#FFFCEF`, tinta `#252422`, um vermelho só no botão de assinar, foto preto e branco | creme e tinta medidos |
| [Nexo Jornal](https://www.nexojornal.com.br/) | Branco, preto, um azul de editoria, foto colorida contida | fundo `#FFFFFF` |
| [ProPublica](https://www.propublica.org/) | Branco `#FFFFFF` e bloco `#F2F1ED`, preto, quase nenhuma cor fora do botão de doar | medidos |
| [The Marshall Project](https://www.themarshallproject.org/) | Papel `#F6F6F4`, tinta preta, um vermelho de marca e um bordô `#3C0B15` em bloco | medidos |
| [GOV.UK](https://www.gov.uk/) | Azul `#1D70B8` só na faixa de cabeçalho, resto preto no branco | medido |
| [Aeon](https://aeon.co/) | Branco, preto, um vermelho no logotipo e nos rótulos | visto |
| [The Public Domain Review](https://publicdomainreview.org/) | Branco, preto, um azul-marinho nos botões e rótulos; cor fica pras gravuras | visto |
| [Wikimedia Foundation](https://wikimediafoundation.org/) | Branco, preto, azul e verde institucionais em faixas e botões | visto |
| [Flexoki](https://stephango.com/flexoki) | Papel `#FFFCF0`, tinta `#100F0F`, acentos escuros e apagados | visto |

O padrão que se repete: **papel branco ou creme, tinta quase preta e neutra, uma cor só de marca, cores de estado apagadas.** Ninguém tinge o papel de verde, azul ou rosa. Quem tinge (FT) tinge pra um tom de papel real, com história, e mantém a tinta preta.

### 2.3 Teoria aplicada a texto longo e a papel

- **WCAG 2.2, 1.4.3**: 4,5:1 pra texto comum e 3:1 pra texto grande (18 pt, ou 14 pt em negrito); o 4,5 "compensated for the loss in contrast sensitivity usually experienced by users with vision loss equivalent to approximately 20/40 vision", acuidade típica aos 80 anos. É o piso do teste automático do projeto. [w3.org/WAI/WCAG22/Understanding/contrast-minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), acesso em 23/09/2026.
- **APCA** (Myndex): a conta do WCAG 2 "far overstates contrast for dark colors to the point that 4.5:1 can be functionally unreadable when a color is near black", e letra fina pede mais diferença. Recomenda Lc 90 pra coluna de texto, Lc 75 mínimo. Por isso as candidatas escuras têm tinta e acento bem mais claros que o mínimo do teste. [github.com/Myndex/SAPC-APCA (WhyAPCA.md)](https://github.com/Myndex/SAPC-APCA/blob/master/documentation/WhyAPCA.md), acesso em 23/09/2026.
- **Butterick, Practical Typography**: "on screen, dark-gray text can be more comfortable to read than black text" porque a tela emite luz; "multiple shades of one color are usually better than multiple contrasting colors"; "when everything is emphasized, nothing is emphasized". [practicaltypography.com/color.html](https://practicaltypography.com/color.html), acesso em 23/09/2026.
- **Tufte CSS**: fundo `#FFFFF8` e texto `#111111`, porque cores levemente fora do puro "dial down the harsh contrast". [edwardtufte.github.io/tufte-css](https://edwardtufte.github.io/tufte-css/), acesso em 23/09/2026.
- **Refactoring UI**: "you can't rely purely on math to craft the perfect color palette"; escolher a base, o mais escuro e o mais claro, e preencher o meio olhando. [refactoringui.com/previews/building-your-color-palette](https://www.refactoringui.com/previews/building-your-color-palette), acesso em 23/09/2026.
- **Erik Kennedy**: variações escuras se fazem baixando brilho e subindo saturação; claras, o contrário. Foi a regra pra derivar `--paper-2`, `--paper-3` e os acentos do caderno. [learnui.design/blog/color-in-ui-design-a-practical-framework.html](https://www.learnui.design/blog/color-in-ui-design-a-practical-framework.html), acesso em 23/09/2026.
- **Josef Albers, Interaction of Color** (1963): cor é relativa, se percebe na relação com a vizinha; "learning by direct perception, not by theories or color systems". Por isso a autocrítica foi feita em print, seis lado a lado, e não só em tabela. [yalebooks.yale.edu/book/9780300179354/interaction-of-color](https://yalebooks.yale.edu/book/9780300179354/interaction-of-color/), acesso em 23/09/2026.

### 2.4 Os materiais de cada candidata

- **Papel jornal**: "usually has an off-white cast", amarela com o tempo pela lignina. [Wikipedia, Newsprint](https://en.wikipedia.org/wiki/Newsprint), acesso em 23/09/2026.
- **Tinta ferrogálica**: "a purple-black or brown-black ink", padrão europeu do século V ao XIX, exigida por lei em registros oficiais porque não se apaga. [Wikipedia, Iron gall ink](https://en.wikipedia.org/wiki/Iron_gall_ink), acesso em 23/09/2026.
- **Rubrica**: texto em tinta vermelha "for emphasis", de *ruber*; o vermelho marca títulos e começos ao lado do preto desde o Egito. [Wikipedia, Rubrication](https://en.wikipedia.org/wiki/Rubrication), acesso em 23/09/2026.
- **Caderno pautado**: linhas azuis "with a (sometimes red) vertical line for a margin on the left hand of every page". [Wikipedia, Exercise book](https://en.wikipedia.org/wiki/Exercise_book), acesso em 23/09/2026.
- **Papel kraft**: marrom porque não é branqueado, do alemão *kraft*, força; usado em sacos, envelopes e embrulho. [Wikipedia, Kraft paper](https://en.wikipedia.org/wiki/Kraft_paper), acesso em 23/09/2026.
- **Anil e cal**: nas casas coloniais "as pinturas das paredes geralmente eram caiadas... dentre os corantes usados, estavam o anil ou índigo (azul), o sangue de drago e urucum (vermelho), a açafroa (amarelo), a braúna (preto)". [Wikipédia, Arquitetura colonial do Brasil](https://pt.wikipedia.org/wiki/Arquitetura_colonial_do_Brasil), acesso em 23/09/2026.
- **Papel salmão**: o FT imprime em rosa claro desde 2 de janeiro de 1893. [Wikipedia, Financial Times](https://en.wikipedia.org/wiki/Financial_Times), acesso em 23/09/2026.

## 3. As candidatas

Todas em `src/styles/palettes.css`, com o mesmo conjunto de 22 tokens da Jornal. Nenhuma foi feita girando o matiz da Jornal: cada uma parte de um material (papel + tinta + segunda tinta), e o caderno, as faixas escuras e os estados vêm depois, pensados nesse clima. O teste `palettes.test.ts` confere 22 pares em 4,5:1 nas seis.

| Nome | Material | Papel | Tinta | Segunda tinta | Caderno | Por quê, numa linha |
|---|---|---|---|---|---|---|
| **Jornal** (padrão) | Papel jornal e tinta preta, rubrica vermelha | `#F3EEE4` | `#17140F` | `#B23A1B` | tinta, invertida | A que o Lucas gosta; referência de acabamento |
| **Anil** | O creme da direção original (F01) com a segunda tinta em azul-anil, o pigmento que dava cor à cal das casas | `#F4F1EA` | `#18191D` | `#294EB2` | tinta, invertida; acento `#9CBEFC` | A mais perto da Jornal: mesmo papel e tinta neutra, troca só a rubrica vermelha por caneta azul; sem cara de link de site porque o azul é escuro (L 0,46) e a tinta fica preta |
| **Pauta** | Caderno pautado: papel branco, tinta azul-preta (ferrogálica), margem vermelha | `#F2F4F6` | `#161D2B` | `#B3363D` | tinta azul-preta, invertida; acento `#FF907E` | Outra temperatura de papel (branco frio, croma 0,003) e a única com tinta tingida, mas em croma 0,03 e L 0,23, como tinta de caneta e não como filtro |
| **Envelope** | Papel pardo de envelope e embrulho (kraft), tinta marrom-preta, carimbo vinho | `#E8D7BB` | `#1B150F` | `#8E2E45` | tinta, invertida; acento `#F89177` | A mais longe entre as claras: papel com croma de material real (0,042), o mais escuro que ainda dá 12,8:1 com a tinta e 4,5:1 com o cinza de apoio; o vinho é carimbo, não marca |
| **Pêssego** | Papel pêssego (parente do salmão do FT, mais fundo e menos rosa), tinta preta quente, verde-garrafa | `#F6E7D8` | `#1B1511` | `#00633F` | tinta, invertida; acento `#6BD3A3` | Papel quente com tinta neutra; a segunda tinta verde escura (L 0,44) tira o clima de bala que reprovou a Ipê e não copia o claret e o teal do FT |
| **Carvão** | Papel carvão quente, tinta creme, brasa; o caderno é um cartão de papel creme sobre o escuro | `#1F1C19` | `#ECE7DD` | `#FF8D64` | cartão creme `#ECE7DD` com tinta `#1F1C19` e rubrica `#A83111` | A única escura: matiz quente (H 67) em vez do ardósia frio da Noite, tinta creme em 13,8:1 e acento em 7,5:1 (folga pedida pelo APCA em fundo escuro); o caderno vira papel de verdade em cima da mesa escura |

O que muda em cada uma além do papel, da tinta e do acento:

- **Faixas escuras** (`--inverse-*`, cabeçalho de estado e rodapé): sempre o papel invertido. Na Carvão, a inversão dá faixa creme com texto escuro, que é o que se espera de uma faixa de papel numa página escura.
- **Caderno do livro** (`--night-*`): nas claras é a tinta da própria paleta, com a segunda tinta clareada pra L 0,76 a 0,80 (Erik Kennedy: clarear é subir brilho e baixar saturação). Na Carvão o caderno é o cartão creme, com a rubrica escura da Jornal.
- **Estados**: verde, ocre, vermelho e cinza de pigmento, todos entre L 0,44 e 0,50 nas claras; na Envelope o verde de "Funcionando" e o vinho do acento ficam em matizes diferentes de propósito (150 contra 10), e na Pêssego o verde de estado fica um pouco mais frio que a segunda tinta pra não competir.

Prints das seis (home em 1440 e 360, degrau aberto, caderno aberto e `/transparencia`) em [`docs/frentes/F30-paletas-fable/prints/`](../frentes/F30-paletas-fable/prints/).
