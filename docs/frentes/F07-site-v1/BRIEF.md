# F07 · Site v1 em código

Dono: `design` (Design/UI) · Worktree: `.worktrees/design` · Branches: `design/f07-prep` (etapa 0), `design/f07-site` (etapa 1)

## Por que agora

É a prioridade número 1 do Lucas ([PRD, Ordem de execução](../../PRD.md#ordem-de-execução)): a plataforma e a parte visual primeiro. A página tem que apresentar bem a ideia, os gargalos, as contribuições abertas e a transparência total.

## Etapa 0 · Protótipo e direção atualizados (agora, sem esperar a base)

PR própria, `design/f07-prep`, mexendo só em `design/` e `docs/design/`:

1. **Decisões da F01 aprovadas** (D011): P1 a P8. Na P5, o selo público vira **"Precisa de ajuda"** e a seção continua chamada **"Gargalos"**, que é a palavra do Lucas.
2. **Sem coleta de dado pessoal** (D012): "Quero ser avisado" vira selo "Ainda não abriu" com o motivo, sem formulário. "Dar uma ideia" diz "abre junto com o repositório".
3. **Transparência total** (D010). Redesenhe o bloco 05 e desenhe a página própria **`/transparencia`**: o livro público de **todas as ações**, não só dinheiro.
   - Tipos de ação: **dinheiro**, **vida real** (ex.: kit entregue), **candidato** (sempre sem identidade), **projeto** (decisão registrada, PR integrada, domínio registrado).
   - Cada linha mostra data, tipo, descrição, valor quando houver, comprovante quando houver, e o **selo criptográfico** (hash curto) com a ligação ao anterior.
   - Botão **"Conferir"**, que roda a verificação no próprio navegador e explica o resultado em uma frase ("Nada foi apagado nem mudado desde o começo").
   - Uma explicação em linguagem simples de como qualquer um confere, e link pro verificador aberto.
   - "Ao vivo" honesto: mostre quando foi a última atualização. Enquanto o livro for estático, nada de "ao vivo" piscando.
   - As primeiras linhas **reais** são as ações do próprio projeto (decisões D001 em diante, PRs integradas). Então o livro já nasce com conteúdo verdadeiro, e o dinheiro aparece zerado.
   - Tire o "pessoa #014" do exemplo. Evento de candidato sai sem apelido até o Lucas decidir (PRD §10, pergunta 10).
4. **Contribuições abertas:** bloco na home e seção na página de código aberto. Cartão por contribuição com tipo (código, design, pesquisa, campo, jurídico), se é bom primeiro passo, e o gargalo ligado. Os dados vêm da F13 (ExecutorBruto) em `docs/contribuicoes/contribuicoes.json`; até lá, use 3 exemplos marcados como exemplo.

## Etapa 1 · Site em código (quando o Regente avisar que a base da F02 está na `main`)

Branch `design/f07-site` a partir da `main` com a base:

- Home e `/transparencia` em Astro, cada bloco um componente em `src/components/blocks/`, tokens da DIRECAO em `src/styles/tokens.css`.
- Texto dos módulos, passos, gargalos e contribuições em arquivos de dados, nunca espalhado no componente. Estado e data dos módulos num lugar só.
- O livro público lê o formato que a F08 (EngenheiroFino) define. Use os tipos e o verificador da F08; não crie formato paralelo. Se a F08 ainda não estiver na `main`, use a fixture dela.
- HTML pronto no build, JS só nas ilhas (Ouvir, filtros, diálogo, Conferir). Fontes hospedadas no próprio site com subset.
- Orçamento da DIRECAO §11 medido no build.

## Limites

Sem deploy, sem serviço externo, sem formulário que colete dado.

## Pronto quando

- Etapa 0: PR com protótipo e docs atualizados, prints 360px e 1440px da home e da `/transparencia`, report ao Regente.
- Etapa 1: `npm run build` gera home e `/transparencia` iguais ao protótipo aprovado; lint, typecheck e teste verdes no CI; prints na PR; report ao Regente.
