# F13 · Contribuições abertas

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f13-contribuicoes` a partir da `main` atualizada

## Por que agora

O Lucas quer a página apresentando a ideia, os gargalos e **as contribuições abertas** ([spec 02](../../fontes/2026-09-22-spec-02.md)). O projeto é open source e aceita qualquer ajuda. Pra isso virar ação, cada coisa em que alguém de fora pode ajudar precisa existir como item concreto, com contexto e critério de pronto.

## Entregáveis

1. **Labels no GitHub** do repositório `LucasOl1337/VidaNova`: tipo (`codigo`, `design`, `pesquisa`, `campo`, `juridico`, `conteudo`), `bom-primeiro-passo`, `precisa-de-ajuda`, e uma por módulo (`M1` a `M9`).
2. **Modelos de issue** em `.github/ISSUE_TEMPLATE/` em PT-BR: ideia pra um gargalo, contribuição de pesquisa, problema no site. Sem pedir dado pessoal.
3. **Issues** no repositório, uma por contribuição aberta. Fontes: os gargalos (PRD §5 e `docs/design/MAPA-DO-SITE.md`, bloco 06), as incertezas das pesquisas (`docs/pesquisa/`, seções de pendências e "o piloto precisa medir"), e pedidos concretos que já apareceram (ex.: testar o botão Ouvir num Android barato; revisar o texto do site lendo em voz alta pra quem lê pouco; advogado voluntário pro estatuto da associação; contador voluntário; medir reconhecimento de fala com ruído de rua). Cada issue tem: contexto em 3 linhas, como ajudar, pronto quando, links pros docs, labels.
4. **`docs/contribuicoes/contribuicoes.json`** com a lista pro site (F07) ler no build: `id`, `title`, `summary`, `type`, `module`, `goodFirst`, `bottleneck`, `issueNumber`. Mais `docs/contribuicoes/README.md` explicando o formato e como atualizar.

Diário em `docs/frentes/F13-contribuicoes-abertas/DIARIO.md`.

## Limites

- O repositório ainda é privado: as issues só ficam visíveis quando o Lucas abrir. Escreva como se fossem públicas desde já, sem dado pessoal e sem nome de ninguém de fora.
- Não mexa em `.github/workflows/`, `CONTRIBUTING.md` nem `CODEOWNERS`: são da F02 (EngenheiroFino).
- Nada de contatar pessoa ou empresa.

## Pronto quando

- Todo gargalo do PRD e do MAPA tem pelo menos uma issue.
- Pelo menos 5 issues marcadas `bom-primeiro-passo`.
- O JSON bate com as issues abertas (mesmos números e títulos).
- PR aberta pra `main` com os modelos, o JSON e o diário; report ao Regente com a lista de issues.
