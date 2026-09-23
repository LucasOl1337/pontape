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
