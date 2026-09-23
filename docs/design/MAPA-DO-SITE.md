# Mapa do site · home

F01 · dono: `design` · versão 0.1 · 22/09/2026

Os blocos da home em ordem. Cada um diz pra que serve, o que mostra, como se mexe nele e pra onde ele manda a pessoa. A cara de tudo está em [`DIRECAO.md`](DIRECAO.md) e funcionando em [`design/prototipo/index.html`](../../design/prototipo/index.html). O texto dos nove módulos (o que é, como funciona, como opera, ponto forte, o que falta, quem ajuda) vive no próprio protótipo, na lista `MODULES`, até a F07 levar pro código de verdade.

## Visão geral

| # | Bloco | Âncora | Fundo | Pra quem, principalmente |
|---|---|---|---|---|
| · | Faixa de estado | nenhuma | tinta com listra de obra | Todo mundo |
| · | Topo | nenhuma | papel | Todo mundo |
| · | Hero | `#inicio` | papel pontilhado | Quem nunca ouviu falar |
| 01 | Pra você | `#pra-voce` | sol | Candidato |
| 02 | O problema | `#problema` | branco | Doador |
| 03 | Como funciona | `#como-funciona` | tinta | Todo mundo |
| 04 | Módulos | `#modulos` | papel 2 | Doador, contribuidor |
| 05 | Transparência | `#transparencia` | branco | Doador |
| 06 | Gargalos | `#gargalos` | papel 2 | Contribuidor, especialista |
| 07 | Como ajudar | `#ajudar` | anil | Doador, voluntário, empregador, contribuidor |
| 08 | Código aberto | `#codigo-aberto` | tinta | Contribuidor |
| · | Rodapé | nenhuma | papel | Todo mundo |

Âncora fica em português porque aparece no endereço que as pessoas compartilham.

Mudanças em relação à ordem do PRD §7: entrou o bloco **01 Pra você** (proposta P2 no DIARIO) e o topo ganhou a **faixa de estado**. O resto segue a ordem do PRD.

## Selo de estado

Todo módulo, caminho e forma de ajudar leva um selo. O selo sempre tem cor, ícone e palavra, e perto dele aparece a data do estado.

| Selo | Quer dizer | Hoje (22/09/2026) |
|---|---|---|
| **Funcionando** | Já está no ar e dá pra usar | Nenhum |
| **Em construção** | A equipe está fazendo agora | M1 Site, M8 Código aberto, M9 Marca |
| **Gargalo aberto** | Ainda não sabemos resolver. Aqui a ajuda de fora vale mais | M2 Doação, M3 Captação, M4 Entrevista por voz |
| **Planejado** | Está no plano, ainda não começou | M5 Ponte inicial, M6 Rede de oportunidades, M7 IA contínua |

Quem muda o estado: o Regente, quando a frente correspondente muda de fase no `QUADRO.md`. No código de verdade o estado e a data vêm de um arquivo só, pra site e quadro nunca discordarem.

## Blocos

### Faixa de estado

- **Objetivo:** ninguém sai do site achando que o projeto já atende gente.
- **Conteúdo:** "Em construção. O projeto ainda não recebe doação nem atende ninguém." + link "Ver o que já existe".
- **Interação:** link pra `#modulos`.
- **Some quando:** doação e atendimento estiverem funcionando. Enquanto qualquer um dos dois não estiver, a faixa fica.

### Topo

- **Conteúdo:** marca (escada + nome), navegação (Como funciona, Módulos, Transparência, Gargalos, Ajudar), botão **A+** e, no celular, botão **Menu**.
- **Interação:** fica grudado no alto ao rolar e ganha borda. A+ aumenta o texto da página toda e fica lembrado no aparelho. Menu abre a lista em tela cheia de largura, com alvos de 56px; Esc fecha.

### Hero

- **Objetivo:** quem nunca ouviu falar entende o que é e pra que serve sem rolar.
- **Conteúdo:**
  - Selos "Sem fins lucrativos" e "Código aberto".
  - Título: "O primeiro passo pra quem quer mudar de vida."
  - Abertura: "A gente encontra quem quer recomeçar. Garante comida, roupa e higiene nos primeiros dias. E ajuda a chegar num trabalho, com apoio de inteligência artificial."
  - Promessa: "Quem doa vê cada real entrando e saindo, ao vivo."
  - Escada de cinco degraus: Comida, Roupa, Higiene, Trabalho, IA.
  - Placar: Entrou R$ 0,00 · Saiu R$ 0,00 · Pessoas atendidas 0, com a nota "Zerado porque a gente ainda não começou. Estado em 22/09/2026."
- **Interação:** Ouvir. Cada degrau é botão e abre o módulo dele (Comida, Roupa e Higiene abrem M5; Trabalho, M6; IA, M7). No celular a escada deita e vira barras que crescem.
- **Chamadas:** "Como funciona" (principal) e "Ver pra onde vai o dinheiro".

### 01 · Pra você

- **Objetivo:** porta de entrada do candidato que chegou pelo panfleto ou por alguém. Funciona sem ler.
- **Conteúdo:** "Você quer mudar de vida?" / "Aperte o botão e escute. Não precisa ler." / botão redondo grande **Ouvir** / os três jeitos de falar com a gente (aqui no site, com um voluntário na rua, num ponto perto de você), cada um com selo "Ainda não abriu" / "É de graça. A conversa é por voz."
- **Interação:** o botão lê um texto escrito pra ouvido, que diz o que é o projeto, que é de graça, que não precisa ler e que a conversa ainda não abriu.
- **Chamada futura:** quando a entrevista por voz abrir (F09), o botão "Aqui no site" vira "Conversar agora" e abre a conversa.
- **Por que é o primeiro bloco:** é o único que fala direto com quem mais precisa. Se ficar lá embaixo, quem lê pouco nunca chega nele.

### 02 · O problema

- **Objetivo:** explicar por que doar dinheiro solto não basta.
- **Conteúdo:** "Dinheiro sozinho não resolve." e três cartões: falta o mínimo pro primeiro passo; ajuda solta não vira caminho; quem doa não vê o dinheiro. Depois, a raiz: "Acertar a pessoa e dar um caminho inteiro."
- **Interação:** comparação com dois botões, **Ajuda solta** e **Caminho inteiro**. Na primeira, só o degrau da comida fica cheio e os outros ficam tracejados. Na segunda, os cinco enchem um depois do outro.

### 03 · Como funciona

- **Objetivo:** a jornada do candidato (PRD §4) em sete passos.
- **Conteúdo:** Encontro, Conversa por voz, Escolha, Primeiros dias, Trabalho, IA que acompanha, Prova. Cada passo tem ícone, texto curto, "Quem faz" e o módulo ligado a ele com o selo.
- **Interação:** trilha numerada em abas (setas do teclado andam entre os passos), painel do passo com Anterior e Próximo, botão do módulo que abre o detalhe. No celular a trilha rola de lado e centraliza o passo escolhido.
- **Honestidade:** o passo Escolha diz que quem confirma ainda está em decisão (PRD §10.6).

### 04 · Módulos

- **Objetivo:** mostrar o projeto quebrado em partes, cada uma com estado. É o pedido central do Lucas.
- **Conteúdo:** nove cartões, M1 a M9, com número, selo, nome, resumo e "Ver o bloco". A faixa no alto do cartão repete o estado em padrão (listra de obra, vermelho, tracejado).
- **Interação:**
  - Filtros por estado com contagem (Todos 9, Funcionando 0, Em construção 3, Gargalo aberto 3, Planejado 3). Escolher um filtro mostra o que aquele selo quer dizer.
  - Filtro **Funcionando** mostra o estado vazio: "Nenhum bloco funcionando ainda. É cedo: o projeto começou em setembro de 2026."
  - Cartão abre um diálogo (folha de baixo no celular) com: O que é, Como funciona, Como opera, Ponto forte, **O que falta resolver** (em vermelho) e **Quem pode ajudar** (em anil). Tem Ouvir e setas pro módulo anterior e o próximo.
  - O diálogo aberto vira endereço (`#m1` a `#m9`) pra mandar por mensagem.

### 05 · Transparência

- **Objetivo:** o motivo de alguém confiar. Mostra o dinheiro inteiro, inclusive quando não tem.
- **Conteúdo:**
  - "Cada real à vista. Ao vivo."
  - Totais: Entrou, Saiu, Em caixa.
  - Pra onde foi: barras por categoria (Comida, Roupa, Higiene, Transporte, Operação), com valor e porcentagem escritos. Operação aparece de propósito: o custo de manter o projeto também é público.
  - Últimas movimentações: data, descrição, categoria, valor, comprovante.
  - "Como garantir que ninguém mexe escondido?": a corrente de marcas explicada em duas frases.
- **Dois modos, escolhidos por botão:**
  - **Agora (padrão).** O zero honesto: totais em R$ 0,00, todas as categorias listadas com R$ 0,00 e 0%, livro vazio com "Nenhuma movimentação ainda. [...] Aqui nunca vai ter número inventado." e a caixa "Por que está zerado?" com link pro gargalo da doação.
  - **Ver um exemplo.** Mostra como o painel vai ficar. Faixa listrada "EXEMPLO · números, pessoas e lojas inventados. Nada disso aconteceu." no alto, fundo hachurado, e a cada 4 segundos chega um movimento novo, com os totais e as barras se ajustando. Tem Pausar (WCAG 2.2.2). A demonstração só roda com o painel na tela.
- **Comprovante:** abre um recibo com a faixa "COMPROVANTE FICTÍCIO", os dados, o documento da pessoa coberto por tarja e as duas marcas (esta e a anterior), com a explicação da corrente.
- **Pessoa no livro-caixa:** aparece como "pessoa #014", nunca pelo nome.
- **No código de verdade (F08):** o modo Agora lê o livro-caixa público; o modo Exemplo continua existindo enquanto o livro estiver vazio, pra quem quiser entender o painel antes da primeira doação.

### 06 · Gargalos

- **Objetivo:** dizer em público o que ainda não sabemos resolver e chamar quem sabe.
- **Conteúdo:** cinco itens que abrem e fecham, cada um com número, título, módulo, "Por que é difícil", "O que já está andando", "Quem pode ajudar" e o botão "Dar uma ideia".
  1. Achar a pessoa certa (M3)
  2. Conversar com quem não lê (M4)
  3. Receber doação do jeito certo (M2)
  4. Escolha justa (M3 · M4)
  5. Segurança no encontro (M3)
- **Chamada:** "Dar uma ideia". Destino ainda não existe; proposta: discussão no GitHub quando o repositório abrir.

### 07 · Como ajudar

- **Objetivo:** um caminho pra cada tipo de pessoa, sem prometer o que ainda não existe.
- **Conteúdo:** quatro cartões com o que a pessoa faz, o selo e quando abre.

| Cartão | Selo hoje | Quando abre | Botão hoje |
|---|---|---|---|
| Doar | Ainda não abriu | Quando a conta oficial existir | Entender por quê → gargalos |
| Ser voluntário | Ainda não abriu | Com o piloto na primeira cidade | Quero ser avisado |
| Oferecer vaga | Ainda não abriu | Quando as primeiras pessoas forem escolhidas | Quero ser avisado |
| Contribuir | Em construção | Quando nome e licença forem decididos | Ver como contribuir → código aberto |

- **Fecho:** "Quer ajudar hoje? É nos gargalos que falta gente que entende do assunto." + botão pros gargalos.
- **Pendência:** "Quero ser avisado" precisa de uma lista de aviso, e isso é serviço externo. Pergunta pro Regente.

### 08 · Código aberto

- **Objetivo:** mostrar que dá pra ver e ajudar, e que tem curadoria.
- **Conteúdo:** "Aberto pra ver. Aberto pra ajudar." / três passos (olhe, proponha, um admin revisa) / cartão do repositório com os documentos principais e três fatos: Licença a definir, Quem aprova: admins, Abre quando nome e licença forem decididos.

### Rodapé

- **Conteúdo:** marca grande + "Um degrau de cada vez. Tudo à vista." / Contato (ainda não tem canal oficial) / Organização (sem registro formal; o CNPJ aparece aqui quando existir) / Privacidade (nada de foto, nome ou história sem autorização por escrito; dado pessoal nunca vai pro código aberto).

## Regras que valem pra todos os blocos

- Etiqueta com número e nome no topo, e botão **Ouvir** com texto escrito pra ouvido.
- Um título curto, uma abertura de até duas frases.
- Todo número que ainda não existe aparece como zero ou como "ainda não", nunca inventado. Exemplo só com a faixa de exemplo.
- Todo botão de algo que não abriu diz que não abriu e por quê.
- Nenhuma foto. Só pictograma, bloco e número.

## O que fica pra F07

- Levar o texto dos módulos e dos passos pra dados (JSON ou conteúdo do CMS escolhido na F02), com o estado e a data num lugar só.
- HTML pronto do servidor, JS só pra interação.
- Fontes hospedadas no próprio site, com subset.
- Canal de "Dar uma ideia" e lista de aviso, quando o Regente liberar os serviços.
