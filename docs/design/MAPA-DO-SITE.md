# Mapa do site

F01 e F07 · dono: `design` · versão 0.2 · 22/09/2026

Duas páginas: a **home** e o **livro público** (`/transparencia`). Cada bloco diz pra que serve, o que mostra, como se mexe nele e pra onde manda a pessoa. A cara de tudo está em [`DIRECAO.md`](DIRECAO.md); funcionando em [`design/prototipo/`](../../design/prototipo/). O texto dos módulos e dos passos vive em `design/prototipo/home.js` até a F07 levar pra arquivos de dados.

Mudou na 0.2: D011 (selo "Precisa de ajuda", seção "Gargalos"), D012 (nada de formulário nem lista de aviso), D010 (livro de todas as ações, no contrato da F08), bloco novo de contribuições abertas com as 17 issues reais.

## Home

| # | Bloco | Âncora | Fundo | Pra quem, principalmente |
|---|---|---|---|---|
| · | Faixa de estado | nenhuma | tinta com listra de obra | Todo mundo |
| · | Topo | nenhuma | papel | Todo mundo |
| · | Hero | `#inicio` | papel pontilhado | Quem nunca ouviu falar |
| 01 | Pra você | `#pra-voce` | sol | Candidato |
| 02 | O problema | `#problema` | branco | Doador |
| 03 | Como funciona | `#como-funciona` | tinta | Todo mundo |
| 04 | Módulos | `#modulos` | papel 2 | Doador, contribuidor |
| 05 | Transparência | `#transparencia` | branco | Doador, imprensa, desconfiado |
| 06 | Gargalos | `#gargalos` | papel 2 | Especialista |
| 07 | Contribuições abertas | `#contribuicoes` | branco | Contribuidor |
| 08 | Como ajudar | `#ajudar` | anil | Doador, voluntário, empregador |
| 09 | Código aberto | `#codigo-aberto` | tinta | Contribuidor |
| · | Rodapé | nenhuma | papel | Todo mundo |

Âncora fica em português porque aparece no endereço que as pessoas compartilham.

### Faixa de estado

- **Objetivo:** ninguém sai achando que o projeto já atende gente.
- **Conteúdo:** "Em construção. O projeto ainda não recebe doação nem atende ninguém." + "Ver o que já existe".
- **Some quando:** doação e atendimento estiverem funcionando.

### Topo

- **Conteúdo:** marca, navegação (Como funciona, Módulos, Transparência, Gargalos, Contribuir), **A+** e, no celular, **Menu**.
- **Interação:** gruda no alto e ganha borda ao rolar. A+ aumenta o texto e fica lembrado no aparelho. "Transparência" leva pra página do livro.

### Hero

- **Objetivo:** quem nunca ouviu falar entende o que é e pra que serve sem rolar.
- **Conteúdo:** "O primeiro passo pra quem quer mudar de vida." + abertura (comida, roupa, higiene, trabalho, IA) + promessa "Tudo que a gente faz fica num livro público. Qualquer pessoa confere." + escada de cinco degraus + placar: Entrou R$ 0,00, Saiu R$ 0,00, Pessoas atendidas 0, **Ações no livro** (hoje 21, das ações reais do projeto).
- **Chamadas:** "Como funciona" e "Abrir o livro público".

### 01 · Pra você

Porta do candidato que chegou pelo panfleto. Botão Ouvir grande, os três jeitos de falar com a gente, cada um com "Ainda não abriu". Sem mudança na 0.2.

### 02 · O problema

"Dinheiro sozinho não resolve." Três cartões, a raiz, e a comparação **Ajuda solta** x **Caminho inteiro**. Sem mudança.

### 03 · Como funciona

Os sete passos da jornada em abas. O passo 7, Prova, agora diz que cada passo entra no livro **só como contagem**.

### 04 · Módulos

Nove cartões com selo e filtro. Selo público do gargalo agora é **"Precisa de ajuda"**. Contagem de hoje: Funcionando 0, Em construção 3 (M1, M8, M9), Precisa de ajuda 3 (M2, M3, M4), Planejado 3 (M5, M6, M7). M2 passou a se chamar "Doação e transparência total".

### 05 · Transparência (redesenhado)

- **Objetivo:** mostrar em segundos que tudo está à vista, e mandar pro livro.
- **Conteúdo:**
  - "Tudo que a gente faz, à vista." + faixa da regra "Toda ação aparece. Quem é a pessoa, não."
  - Quatro contadores por tipo, cada um leva pro livro já filtrado: Dinheiro (R$ entrou), Vida real (entregas), Candidato (contagem), Projeto (ações). O zero de cada um vem com o motivo.
  - As três ações mais recentes, no desenho da corrente.
  - **Conferir**, que confere o livro inteiro no aparelho.
- **Chamadas:** "Abrir o livro público" e "Ver um exemplo com dinheiro" (abre o livro no modo exemplo).

### 06 · Gargalos

Cinco itens que abrem e fecham. O botão "Dar uma ideia" virou selo **"Ainda não abriu"** com "Dar uma ideia abre junto com o repositório" (D012).

### 07 · Contribuições abertas (novo)

- **Objetivo:** transformar vontade de ajudar em tarefa concreta.
- **Dados:** `docs/contribuicoes/contribuicoes.json` (F13), 17 issues, da #6 à #22. O protótipo lê uma cópia gerada por `sync-contributions.mjs`.
- **Cartão:** tipo (Código, Design, Pesquisa, Campo, Jurídico, Conteúdo), selo "Bom primeiro passo" quando é, título, resumo, módulo, "Destrava: [gargalo]" com o nome público do gargalo, e o número da issue (com cadeado: o repositório ainda é fechado).
- **Interação:** filtros com contagem (Todas, Bom primeiro passo, e um por tipo). "Todas" mostra 6 e um botão "Mostrar as 17 contribuições".
- **Honestidade:** "Cada tarefa já é uma issue no GitHub. Pegar uma abre junto com o repositório."

### 08 · Como ajudar

Quatro cartões. Doar, Ser voluntário e Oferecer vaga mostram **"Ainda não abriu"** com o motivo e **nenhum botão de aviso** (D012). Contribuir leva pras contribuições abertas. No fim: "A gente não guarda contato de ninguém por enquanto. Lista de aviso e formulário só quando existir um responsável legal pelos dados."

### 09 · Código aberto

Três passos (olhe, escolha uma contribuição ou proponha, um admin revisa), o cartão do repositório (agora com o livro público na lista) e uma faixa com o número de contribuições abertas.

### Rodapé

Marca, link pro livro público, organização (sem registro formal, sem canal oficial de contato), privacidade ("Nenhum dado pessoal é coletado por enquanto").

## Página `/transparencia` · livro público

Base: [contrato da F08](../transparencia/CONTRATO.md) e `src/lib/ledger/schema.ts`. Quatro famílias com campos fechados, sem descrição nem URL livre. O protótipo gera o seu livro com esse formato e valida com o schema de verdade (`design/prototipo/ledger/build-ledger.mjs`).

| # | Bloco | Âncora | Fundo |
|---|---|---|---|
| · | Topo do livro | `#livro` | papel pontilhado |
| 01 | Conferir | `#conferir` | tinta |
| 02 | Todas as ações | `#acoes` | branco |
| 03 | Dinheiro | `#dinheiro` | papel 2 |
| 04 | Como conferir | `#como-conferir` | branco |
| 05 | O que entra | `#o-que-entra` | papel 2 |

### Topo do livro

- "Tudo que o projeto faz, à vista." + a faixa da regra.
- Placar: Ações no livro, Entrou, Saiu, Marca mais recente.
- **"Ao vivo" honesto:** "Livro estático. Última ação registrada em 22/09/2026, às 21:36. A página é refeita sempre que entra uma ação nova." Nada pisca.
- No desktop, à direita, as quatro últimas ações empilhadas como blocos ligados (ilustração, escondida do leitor de tela).

### 01 · Conferir

- Botão grande **Conferir**. Refaz, no aparelho, a conta SHA-256 de cada ação e a ligação com a anterior. Barra de progresso; cada linha da lista fica verde quando passa.
- Resultado em uma frase: "Tudo certo. Nada foi apagado nem mudado desde o começo." Ou, se quebrar: "A corrente quebrou na ação nº 14. Alguém mudou essa linha depois que ela foi registrada." (também "não se prende à anterior" e "falta a ação nº N").
- "Roda no seu aparelho. Nada é enviado pra gente."
- **Troca fácil:** o protótipo usa um verificador próprio, com o mesmo resultado que a interface espera. Na etapa 1 ele é trocado pelo verificador da F08.

### 02 · Todas as ações

- Escolha do livro: **Livro de verdade** (padrão) ou **Ver um exemplo**.
- Filtros por tipo com contagem.
- Lista da mais nova pra mais antiga, no desenho da corrente. Cada linha: número, tipo, dia (`occurredOn`), frase, valor e situação do comprovante quando é dinheiro, link "Ver a fonte" quando é projeto, marca curta e "presa na nº N". A marca inteira e a hora de registro abrem num detalhe. Correção e estorno aparecem nas duas pontas ("Estorno da ação nº 4" e "Estornada pela nº 16").
- **Frases** (mapa fixo, nenhum texto vem do dado): "Decisão D006 registrada", "PR #26 integrada", "Repositório do projeto criado", "Doação recebida", "Gasto com comida", "Tarifa", "Estorno da ação nº N", "5 entregas de comida", "1 kit de higiene entregue", "2 entrevistas concluídas", "1 encaminhamento pra vaga", "1 apoio dos primeiros dias concluído".
- **Estados vazios** no livro de verdade: Dinheiro ("Nenhum real entrou nem saiu ainda."), Vida real ("Nenhuma entrega na rua ainda."), Candidato ("Nenhum passo de candidato ainda. [...] aparece aqui só a contagem").
- **Livro de verdade, hoje:** 21 ações do projeto (D001 a D012, criação do repositório, PRs #2, #3, #4, #5, #23, #24, #25, #26). Dinheiro zerado. O livro oficial semeado vem da F08; o do protótipo é uma prévia com os mesmos fatos.
- **Modo exemplo:** faixa "EXEMPLO · ações, valores e datas inventados", cartões hachurados, e dois botões: **Simular uma ação chegando** (a ação nova entra no topo, presa na anterior) e **Mudar uma linha escondido** (muda o valor de um gasto sem refazer a marca; o Conferir pega na hora). "Desfazer a mudança" volta ao normal. Na etapa 1 o exemplo usa a fixture da F08.

### 03 · Dinheiro

Entrou, Saiu, Em caixa; "Pra onde foi" por categoria do contrato (comida, roupa, higiene, operação, tarifas, devoluções), com valor e porcentagem escritos. No livro de verdade: zero honesto e "Por que está zerado?". Somas com BigInt, como pede o contrato.

### 04 · Como conferir

Três passos em linguagem simples (texto padrão, marca SHA-256, cada marca segura a anterior), o quadro **"O que o livro não prova"** (não prova que tudo foi registrado; extrato do banco e auditoria de fora; assinatura e carimbo de tempo em estudo), e os botões "Baixar o livro inteiro" (JSON), "Verificador aberto" e "Passo a passo" (os dois últimos esperam a F08).

### 05 · O que entra

Quatro cartões, um por tipo, com "Entra" e "Nunca entra". Candidato: "Só contagens [...] Nunca entra nome, rosto, apelido, lugar, história, o caminho de uma pessoa."

## Selo de estado

| Selo | Quer dizer | Hoje |
|---|---|---|
| **Funcionando** | Já está no ar e dá pra usar | Nenhum |
| **Em construção** | A equipe está fazendo agora | M1, M8, M9 |
| **Precisa de ajuda** | Ainda não sabemos resolver | M2, M3, M4 |
| **Planejado** | Está no plano, ainda não começou | M5, M6, M7 |
| **Ainda não abriu** | Existe no plano, mas ninguém de fora consegue usar ainda | Doar, voluntário, vaga, dar ideia, pegar tarefa |

## Regras que valem pra todas as páginas

- Etiqueta com número e nome no topo de cada bloco, e botão **Ouvir** com texto escrito pra ouvido.
- Número que ainda não existe aparece como zero com o motivo. Exemplo só com faixa de exemplo.
- Nada de formulário, lista de aviso ou campo que colete dado (D012).
- Nenhuma foto. Só pictograma, bloco e número.

## O que fica pra etapa 1 (código)

- Home e `/transparencia` em Astro, um componente por bloco em `src/components/blocks/`, tokens em `src/styles/tokens.css`.
- Módulos, passos, gargalos e mapa de frases em arquivos de dados; contribuições lidas de `docs/contribuicoes/contribuicoes.json` no build.
- Livro com os tipos de `src/lib/ledger/schema.ts`; fixture da F08 só no modo exemplo; Conferir ligado a uma interface que troca pro verificador da F08 quando ele entrar.
- HTML pronto no build, JS só nas ilhas (Ouvir, filtros, diálogo, Conferir). Fontes no próprio site.
