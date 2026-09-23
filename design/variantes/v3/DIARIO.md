# F19 v3 · Ábaco · DIARIO

Dono: Ábaco (Claude Opus 5.5) · Branch `variante/v3-abaco` · Worktree `.worktrees/var-3` · Porta 4343

## 22/09/2026 · Marco 1: leitura e conceito

**Li:** AGENTS.md, BRIEF da F19, PRD, os dados do site (`src/data/site/*`), o livro real (33 ações depois do merge da main, todas de projeto, dinheiro zerado), o exemplo da F08 (20 ações com dinheiro, entrega e candidato), `verify.ts`, `ledger.ts`, `home.ts` e todos os blocos da v1.

**Achados que mudam o desenho:**
- O livro real só tem ações de projeto. Dinheiro, vida real e candidato estão vazios. Então toda visualização precisa ficar bonita e honesta com zero, e mostrar como fica cheia só no modo exemplo, marcado como fictício.
- O livro cresce sozinho (F17, ledger-bot). Nada pode depender de 33: tudo é desenhado pra N ações.
- D007: nunca chamar de "ao vivo" o que é estático. Uso "refeito a cada ação nova" e mostro a hora da última ação.
- `eventHash`/`canonicalize` da F08 existem, então dá pra mostrar a marca refeita do lado da guardada quando alguém mexe numa linha.
- Nome agora é PontaPé (D016), só via `PROJECT_NAME`. Merge da main feito sem conflito.

**Conceito:** o livro é a página. A home abre como um explorador de dados: números do livro, busca por nº ou marca, a corrente das últimas ações e o botão Conferir no primeiro olhar. A ideia do projeto se explica em volta disso.

**Sistema visual:**
- Fundo quase preto azulado, painéis com linha fina de 1px, cantos de 12px. Nada de sombra dura nem papel (isso era a v1).
- Atkinson Hyperlegible Mono em títulos, números, marcas e rótulos; Atkinson Hyperlegible Next no texto corrido. As duas já estão no site (OFL) e seguram leitura fácil pra quem lê pouco. Tirei a Archivo.
- Uma cor de ação: verde menta (`#7EE2A8`), que também quer dizer "confere".
- Quatro cores dos tipos de ação, validadas com o script de daltonismo da skill de dataviz no fundo escuro (passa nos pares vizinhos): Dinheiro ouro `#c98500`, Vida real água `#199e70`, Candidato laranja `#d95926`, Projeto azul `#3987e5`. Sempre com ícone e nome junto, nunca só cor.

**Peças que definem a variante:**
1. **Impressão digital da marca:** cada hash vira uma onda de 16 barras. Mudou um caractere, a onda muda inteira. Aparece na corrente, no inspetor e no Conferir quando a corrente quebra (guardada x refeita).
2. **Corrente navegável:** blocos ligados, do mais novo pro mais antigo, cada um apontando pro anterior. No livro, selecionar um bloco abre o inspetor (tipo página de transação do Etherscan), com setas do teclado e link pra anterior.
3. **Ábaco (linha do tempo):** quatro varetas, uma por tipo de ação, e cada ação é uma conta na vareta. Vareta vazia diz por quê.
4. **Fluxo do dinheiro:** Sankey de doações até as categorias e o que ficou em caixa. Real = esqueleto com R$ 0,00; exemplo = cheio.
5. **Conferir em console:** o verificador da F08 roda e o log desce linha por linha.

**Próximo passo:** tokens + CSS base, peças do explorador, home, depois `/transparencia`.

## 22/09/2026 · Marco 2: rodada 1 pronta

**Feito:** home e `/transparencia` completas na direção. Peças novas em `src/components/ledger/` (ChainStrip, ChainMap, HashPrint, Abacus, MoneyFlow, ActionTable, labels) e blocos reescritos. Scripts: `verify.ts` (Conferir com log e marca refeita), `explorer.ts` (setas, ligação entre blocos, busca), `ledger.ts` (modo real/exemplo, inspetor, filtros, mudança escondida), `home.ts`.

**Achados no caminho:**
- O Sankey com slots fixos quebrava quando "Em caixa" era grande. Troquei por barras empilhadas proporcionais e rótulos que se afastam com linha-guia.
- O servidor de dev travou o Conferir (504 no zod) depois de rodar `astro check` com ele no ar: cache do Vite. Reiniciar resolve; não é bug do site.
- Orçamento: home cabe (35,0 KB ao abrir) baixando o livro publicado só no clique. `/transparencia` fica 7,8 KB acima; explicado no README.
- Concordância herdada da v1: "As 1 ações antes dela". Corrigido.

**Decisões propostas (pro Regente):**
- Se o Lucas escolher esta direção, vale publicar o livro de exemplo como arquivo (`/livro/exemplo.json`) pra `/transparencia` baixar sob demanda também e caber nos 60 KB.

**Estado:** PR em rascunho `F19 v3 · Ábaco`. Porta 4343. Rodada 2 (F22) começa em `design/variantes/r2-v3/`.
