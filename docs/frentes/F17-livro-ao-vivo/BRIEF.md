# F17 · Livro ao vivo pras ações do projeto

Dono: `fino` (EngenheiroFino) · Worktree: `.worktrees/fino` · Branch: `fino/f17-ao-vivo` a partir da `main` atualizada

## Por que agora

O Lucas pediu que o livro mostre **ao vivo** todas as ações ([spec 02](../../fontes/2026-09-22-spec-02.md)). Hoje o livro tem 28 fatos, mas cada PR integrada e cada decisão nova só entra quando o Regente roda `ledger:append` na mão. Isso atrasa e depende de lembrar. As ações do projeto são fatos públicos do GitHub: dá pra registrar sozinho, na hora, sem ninguém digitar nada.

## Entregáveis

1. **Workflow do GitHub Actions** que, a cada push na `main`:
   - acha as PRs integradas naquele push e acrescenta `pull_request_merged` com número, commit de merge e dia em `America/Sao_Paulo`;
   - acha IDs `D###` novos no `docs/DECISOES.md` e acrescenta `decision_recorded` com o commit do push;
   - roda `ledger:verify`, faz commit do `ledger.json` com uma mensagem padrão e empurra pra `main`.
2. **Idempotente:** rodar duas vezes no mesmo push não duplica nada; fato já registrado é sucesso, não erro. PRs e decisões antigas que faltarem são acrescentadas na ordem certa.
3. **Seguro:** permissão de escrita só nesse job; nunca `pull_request_target`; nada de fork com token de escrita; concorrência serializada pra dois pushes não brigarem pelo livro; o commit do bot não dispara o próprio workflow de novo. Explique no DIARIO por que não tem laço.
4. **Testes** da lógica que decide o que acrescentar (sem rede): PR nova, PR repetida, decisão nova, decisão já registrada, push sem nada.
5. `docs/transparencia/OPERACAO.md` atualizado: ações de projeto entram sozinhas; dinheiro, vida real e candidato continuam só pelo Regente.

## Limites

- Só família `project`. Dinheiro, vida real e candidato não entram por automação.
- Sem deploy, sem segredo novo além do `GITHUB_TOKEN` do próprio repositório.
- Se o repositório tiver proteção de branch no futuro, descreva o que muda, sem configurar nada.

## Pronto quando

- Numa PR de teste integrada depois desta, o livro ganha o fato sozinho, e `ledger:verify` passa na `main`.
- Testes da lógica passam e o DIARIO explica o porquê de não ter laço nem duplicação.
- Report ao Regente.
