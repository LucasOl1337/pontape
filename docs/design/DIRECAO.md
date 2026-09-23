# Direção visual

F01 e F07 · dono: `design` · versão 0.2 · 22/09/2026

Protótipo que aplica tudo isto: [`design/prototipo/`](../../design/prototipo/) (home em `index.html`, livro público em `transparencia.html`). Mapa das páginas: [`MAPA-DO-SITE.md`](MAPA-DO-SITE.md).

Mudou na 0.2: selo "Precisa de ajuda" (D011), nenhuma coleta de dado (D012), livro público de todas as ações seguindo o contrato da F08 (D010), contribuições abertas.

## 1. Conceito: degrau por degrau, tudo à vista

Duas ideias carregam o site inteiro.

**Degrau.** Quem quer mudar de vida não precisa de um salto. Precisa do primeiro degrau, depois do próximo. Escolher com cuidado, ir até a pessoa, comida e roupa, IA, trabalho: cada um é um bloco, e os blocos empilhados viram escada. Isso casa com o pedido do Lucas ("por blocos, modular, cada parte bem separada"): a página é uma pilha de blocos, cada módulo do projeto é um bloco com número e estado, e a marca provisória são três blocos em escada.

**À vista.** Transparência é o motivo de alguém confiar. Toda ação do projeto entra num livro público: dinheiro, entrega na rua, passo de candidato e decisão. Cada linha fica presa na anterior por uma marca, e o botão **Conferir** refaz as contas no aparelho de quem olha. A regra que aparece escrita na tela: **toda ação aparece; quem é a pessoa, não.** Tudo que é dinheiro ou dado ganha cara de caderno: número em fonte mono, marca em mono, data em tudo. Tudo que é estado ganha selo com data. O site diz "ainda não" e "não sabemos" sem vergonha.

Dois registros visuais, cada um com sua função:

| Registro | Onde | Como |
|---|---|---|
| **Cartaz** | Títulos, chamadas, bloco do candidato | Letra grande e condensada, cor chapada, frase curta. Vem do cartaz de rua e do lambe-lambe. O mesmo desenho serve pro site, pro panfleto e pra placa do ponto público |
| **Caderno** | Livro público, dinheiro, estados, datas, marcas | Fonte mono, números alinhados, corrente tracejada ligando as linhas, tarja preta em dado pessoal |

O que o site **não** é: foto de mão estendida, criança triste, coração com moeda, degradê roxo de startup, ilustração 3D genérica.

## 2. Cor

Tokens em CSS. Nome em inglês, como todo identificador de código (D003); o apelido em português fica na tabela pra conversa da equipe.

### Base

| Apelido | Token | Hex | Uso |
|---|---|---|---|
| papel | `--color-paper` | `#F4F1EA` | Fundo da página |
| papel 2 | `--color-paper-2` | `#E9E4D8` | Bloco alternado |
| branco | `--color-white` | `#FFFFFF` | Cartão, painel, diálogo |
| tinta | `--color-ink` | `#16181D` | Texto, borda, sombra dura, bloco escuro |
| tinta 2 | `--color-ink-2` | `#4A4F5A` | Texto secundário |
| anil | `--color-indigo` | `#1F3FD1` | Marca, botão principal, link |
| anil escuro | `--color-indigo-dark` | `#1730A8` | Botão pressionado |
| anil claro | `--color-indigo-light` | `#DCE2FF` | Fundo de destaque, texto sobre anil |
| sol | `--color-sun` | `#FF6B3D` | Acento quente. Só como fundo com texto tinta ou como preenchimento com borda tinta |
| sol claro | `--color-sun-light` | `#FFD8CB` | Cartão sobre bloco sol, círculo do hero |

### Estado de módulo

Cor nunca aparece sozinha: todo estado tem cor, ícone, palavra e padrão.

| Estado | Chave no código | Token | Hex | Fundo | Ícone | Padrão |
|---|---|---|---|---|---|---|
| Funcionando | `live` | `--color-live` | `#12663C` | `#DDF3E6` | visto | borda cheia |
| Em construção | `building` | `--color-building` | `#F4C20D` | `#FFF3C4` | cone | listra amarela e preta |
| Precisa de ajuda | `bottleneck` | `--color-bottleneck` | `#C62A1F` (texto `#A31F16`) | `#FDE2DF` | exclamação | borda cheia |
| Planejado | `planned` | `--color-planned` | `#5B606B` | branco | relógio | borda tracejada |

"Planejado" e "Precisa de ajuda" foram aprovados em D011. A seção da home continua chamada **Gargalos**, que é a palavra do Lucas; o selo público é "Precisa de ajuda" porque diz o que é e já convida.

### Tipo de ação no livro público

Quatro famílias, as mesmas do contrato da F08. A cor só ajuda a achar; o tipo sempre vem escrito com ícone.

| Tipo | Chave | Texto | Fundo | Ícone | Contraste |
|---|---|---|---|---|---|
| Dinheiro | `finance` | `--color-type-finance` `#9A3412` | `#FFE4D6` | moeda | 6,0 |
| Vida real | `field` | `--color-type-field` `#1730A8` | `#DCE2FF` | caixa | 8,1 |
| Candidato | `candidate` | `--color-type-candidate` `#5B21B6` | `#EDE4FB` | pessoa | 7,3 |
| Projeto | `project` | `--color-type-project` `#16181D` | `#E9E4D8` | bandeira | 14,0 |

### Contraste medido (WCAG 2.2)

| Par | Razão | Passa |
|---|---|---|
| tinta em papel | 15,7 | AAA |
| tinta-2 em papel | 7,3 | AAA |
| branco em anil | 7,8 | AAA |
| anil em papel (link) | 6,9 | AA |
| tinta em sol | 6,3 | AA |
| tinta em amarelo obra | 10,6 | AAA |
| verde funcionando em papel | 6,2 | AA |
| texto gargalo no fundo gargalo | 6,2 | AA |
| cinza planejado em papel | 5,6 | AA |
| papel em tinta (bloco escuro) | 15,7 | AAA |

Sol em branco dá 2,8: nunca usar sol como cor de texto nem como único contorno.

## 3. Tipografia

| Papel | Família | Pesos | Por quê |
|---|---|---|---|
| Cartaz (títulos) | **Archivo**, largura 75 a 85% | 800 | Condensada e pesada, lê de longe, cabe muito em tela de 360px. Tem eixo de largura, então uma fonte só cobre título e selo |
| Texto | **Atkinson Hyperlegible Next** | 400, 700 | Desenhada pelo Braille Institute pra quem enxerga ou lê com dificuldade. Letra que não se confunde (I, l, 1; O, 0) |
| Números | **Atkinson Hyperlegible Mono** | 400, 600 | Mesma família do texto, dígitos alinhados pro livro-caixa |

Todas no Google Fonts com licença OFL. No site de verdade (F07): hospedar no próprio servidor, só subset latino, `font-display: swap`. Orçamento: até 120 KB de fonte no total.

### Escala

Fluida entre 360px e 1280px. Base 18px, não 16: o público inclui quem lê devagar.

| Token | Tamanho | Altura de linha | Uso |
|---|---|---|---|
| `--text-display` | 40 → 88px | 0,95 | Título do hero |
| `--text-h2` | 32 → 56px | 1,0 | Título de bloco |
| `--text-h3` | 21 → 26px | 1,15 | Título de cartão |
| `--text-lead` | 20 → 24px | 1,45 | Abertura de bloco |
| `--text-body` | 18px | 1,55 | Texto corrido |
| `--text-small` | 15px | 1,45 | Legenda, selo, data. Nada abaixo disso |

Famílias: `--font-poster` (Archivo), `--font-text` (Atkinson Hyperlegible Next), `--font-mono` (Atkinson Hyperlegible Mono).

Regras:

- Frase em caixa baixa, sempre. Caixa alta só em rótulo de até duas palavras (EXEMPLO, M4). Palavra em minúscula tem forma, e forma ajuda quem lê devagar.
- Linha de texto com no máximo 62 caracteres.
- Número sempre em algarismo e em mono: R$ 1.240,00, 7 passos, 22/09/2026.

## 4. Grid e espaço

- Unidade de 4px. Escala: 4, 8, 12, 16, 24, 32, 48, 64, 96.
- Conteúdo com no máximo 1200px. Margem lateral: 16px no celular, 24px no tablet, 32px no desktop.
- Colunas: 4 no celular, 8 a partir de 600px, 12 a partir de 960px. Espaço entre colunas: 16px, depois 24px.
- Pontos de quebra: 600px, 960px, 1280px. CSS mobile-first, só `min-width`.
- **Bloco** é a unidade da página: caixa com borda 2px tinta, canto 24px (16px no celular), espaço interno 20px no celular e 56px no desktop, 12px de distância entre blocos. Cada bloco tem etiqueta de número e nome no topo e botão Ouvir.
- Fundos dos blocos alternam pra separar as partes: branco, papel-2, tinta, anil, sol. Nunca dois blocos seguidos com o mesmo fundo.

## 5. Forma e componentes

- Borda 2px tinta em tudo que é bloco, cartão, botão e selo.
- Canto: 24px bloco, 16px cartão, 12px botão, pílula no selo e no filtro.
- **Sombra dura**: `4px 4px 0 tinta`, só em coisa clicável. Quem não tem intimidade com tecnologia aprende rápido: se tem sombra, aperta. Ao apertar, o botão desce 2px e a sombra encolhe.
- Botão principal: anil, texto branco. Secundário: branco, texto tinta. Em bloco escuro, o principal vira sol com texto tinta.
- Link no meio do texto: sublinhado, sempre.
- Selo de estado: pílula com ícone e palavra, mais a data do estado quando ficar sozinho.
- **Corrente** (linha do livro): número da ação num quadrado à esquerda, ligado ao de baixo por uma linha tracejada. Cartão com tipo, dia, frase, valor e situação do comprovante quando é dinheiro, e a marca curta (`7ca9 c1d8`) com "presa na nº N". A marca inteira abre num detalhe. Conferida, o quadrado fica verde; quebrada, vermelho cheio, e as de depois ficam tracejadas.
- **Conferir**: cartão branco com botão grande, barra de progresso e uma frase de resultado ("Tudo certo. Nada foi apagado nem mudado desde o começo." ou "A corrente quebrou na ação nº 14.").
- **Faixa da regra**: tarja escura com escudo e "Toda ação aparece. Quem é a pessoa, não." Aparece na home e no topo do livro.

## 6. Movimento e interação

| Duração | Uso |
|---|---|
| 120ms | Apertar botão |
| 200ms | Troca de estado, hover |
| 400ms | Bloco entrando na tela (sobe 16px e aparece) |
| 600ms | Degraus do hero montando, um por um |

Curva padrão: `cubic-bezier(.2, .8, .2, 1)`.

Regras:

- Movimento explica alguma coisa: um degrau se somando, um passo escolhido, um real chegando no painel. Nada de enfeite girando.
- Com `prefers-reduced-motion`, nada se move: o conteúdo só aparece.
- **"Ao vivo" honesto.** Enquanto o livro for estático, nada pisca e nada se chama "ao vivo": a página mostra quando foi registrada a última ação e diz que é refeita quando entra uma nova. Se um dia algo atualizar sozinho, ganha botão de pausar (WCAG 2.2.2).
- A demonstração do modo exemplo só anda quando a pessoa aperta ("Simular uma ação chegando", "Mudar uma linha escondido").
- Tudo funciona no teclado. Abas andam com as setas, diálogo fecha com Esc e devolve o foco.
- Módulo aberto vira endereço (`#m4`), dá pra mandar o link.
- No site de verdade, o HTML chega pronto do servidor e o JS só enriquece. Sem JS, dá pra ler tudo.

### Ouvir

Cada bloco tem um botão **Ouvir** que lê o bloco em voz alta com a voz do próprio navegador, em pt-BR, sem custo. O texto falado é escrito pra ouvido (frases curtas, sem sigla, sem símbolo), guardado em `data-speech`. Se o aparelho não tiver voz em português, o botão avisa isso em vez de ficar mudo. É o princípio "voz primeiro" do PRD aplicado ao próprio site.

## 7. Acessibilidade

Meta: WCAG 2.2 AA inteira, com três pontos acima do mínimo.

- **Alvo de toque de 48px** (a regra pede 24px). Mão tremendo, tela rachada, luva.
- **Texto base de 18px** e botão **A+** no topo que aumenta tudo em 12,5%, lembrado no aparelho.
- **Ouvir** em todo bloco.
- Contraste: tabela da seção 2. Nada abaixo de 4,5 em texto, 3 em ícone e borda.
- Zoom de 200% e tela de 320px sem rolagem lateral.
- Foco visível: contorno 3px anil com 3px de folga, também em bloco escuro (lá vira sol).
- `lang="pt-BR"`, link "pular pro conteúdo", um `h1`, títulos em ordem, marcos (`header`, `main`, `nav`, `footer`).
- Estado sempre com palavra, nunca só cor. Gráfico sempre com número escrito ao lado.
- Modo de alto contraste do sistema (`forced-colors`) respeitado: as bordas são borda de verdade, não sombra.

## 8. Imagem e dignidade

A regra de ouro: **ninguém vira ilustração da própria pobreza.**

Não usar:

- Foto de candidato, mesmo com rosto coberto, de costas ou "com autorização verbal".
- Foto de banco de imagem de pessoa na rua, mão estendida, papelão, criança.
- Antes e depois.

Usar:

- **Pictograma de objeto**: prato, camiseta, sabonete, maleta, microfone, balão de fala. Traço 2px, grade de 24px, ponta redonda, uma ideia por ícone. Feitos pra este projeto, em SVG no próprio HTML.
- **Blocos e degraus** abstratos nas cores da marca.
- **Número e comprovante**: o resultado se prova com dado, não com rosto.
- Se um dia precisar de gente: figura geométrica simples, sem rosto e sem traço que identifique cor, idade ou classe.

Relato de resultado só com consentimento escrito, sem rosto por padrão e com o nome trocado. Comprovante publicado tem tarja em nome, CPF, endereço e qualquer coisa que leve à pessoa. Pelo contrato da F08, comprovante público ainda não existe: a linha diz "Comprovante pendente" ou "não publicado".

No livro público, **candidato é só contagem** ("2 entrevistas concluídas"): sem apelido, sem trajetória de uma pessoa, sem lugar. Nenhum texto livre entra no livro: a frase de cada linha sai de um mapa fixo de ação pra frase, e o único link é o da fonte do projeto.

**Nenhuma coleta de dado pessoal** (D012): sem formulário, lista de aviso ou e-mail até existir responsável legal pelos dados. O que ainda não abriu mostra o selo "Ainda não abriu" e o motivo.

## 9. Texto de interface

- "A gente" e "você". Frase de até 15 palavras. Um assunto por frase.
- Teste antes de publicar: ler em voz alta pra alguém. Se a pessoa pedir pra repetir, reescreve.
- Sem sigla sem explicar. LGPD vira "lei de proteção de dados".
- Sem travessão, sem jargão, sem palavra que rebaixa.

| Em vez de | Escreva |
|---|---|
| morador de rua, mendigo | pessoa em situação de rua (só quando precisar dizer) |
| carente, necessitado | quem quer recomeçar |
| resgatar, salvar | ajudar, andar junto |
| dar dignidade | (a pessoa já tem) |
| beneficiário | pessoa |
| em breve | ainda não abriu, com o motivo |

- "Ainda não" e "não sabemos" são bem-vindos. Promessa sem data, não.
- Candidato é palavra interna. Na tela pro candidato, é "você".

## 10. Marca provisória

- Marca: três blocos em escada (sol, anil, tinta) + o nome em Archivo condensado 800.
- O nome aparece num ponto só do código (`const PROJECT_NAME` no protótipo). Trocar ali troca a página inteira, o título da aba e o texto falado.
- Quando o nome definitivo vier (PRD §10.1), a marca refaz só o desenho da palavra. A escada fica.

## 10b. Ícone e prévia de compartilhamento

- **Ícone:** os três blocos sobre um quadrado de papel com canto arredondado, pra não sumir em aba escura. Sai em SVG, ICO (16, 32, 48) e `apple-touch-icon` (180), tudo gerado no build a partir de `src/lib/share/logo.ts`, que também desenha a marca do topo.
- **Prévia (Open Graph), 1200×630:** fundo de papel pontilhado, a listra de obra no alto, a marca e o nome, o título do hero com o grifo sol na última linha, e à direita a escada (home) ou a corrente (livro). Rodapé com uma frase curta. Sem foto, sem pessoa.
- O nome sai de `PROJECT_NAME` e encolhe se for comprido. O título escolhe o maior tamanho que cabe em até quatro linhas acima do rodapé. Trocou o nome, a imagem muda no próximo build.
- As URLs da prévia viram absolutas quando o build recebe `SITE_URL`. Sem domínio, ficam relativas.

## 11. Desempenho

O público usa celular barato e internet ruim.

- Página inicial: até 60 KB de HTML, CSS e JS somados (comprimidos), mais até 120 KB de fonte.
- Nenhuma foto na home. Ícone e ilustração em SVG no próprio HTML.
- Sem framework de carrossel, sem biblioteca de animação, sem rastreador de anúncio.
- Tem que abrir em menos de 3 s num 3G lento.
