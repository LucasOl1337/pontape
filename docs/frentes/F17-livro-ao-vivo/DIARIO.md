# F17 · Diário do EngenheiroFino

## 22/09/2026 · Início e desenho

- Branch `fino/f17-ao-vivo` criada de origin/main 560a050. Lidos AGENTS, PRD, QUADRO, DECISOES, BRIEF F17 e operação do livro. Base contém os 28 fatos confirmados pelo Regente. Checkout compartilhado não alterado.
- Escopo: automatizar somente `project/decision_recorded` e `project/pull_request_merged` em push para main; outros tipos e correções continuam manuais pelo Regente.
- Desenho: reconciliar histórico da main e todas as PRs integradas alcançáveis, filtrando por IDs já presentes no livro. Isso recupera lacunas de execuções antigas e tolera a substituição de jobs pendentes pelo grupo de concorrência do Actions.
- Concorrência: um grupo fixo sem cancelamento da execução ativa; push normal, sem force. Se main avançar, descartar apenas o commit local do runner descartável e recalcular a cadeia a partir da main nova, em tentativas limitadas. Nunca fazer rebase cego do JSON do livro.
- Laço: usar somente GITHUB_TOKEN do repo para o commit de dados. Push feito com esse token não dispara outro workflow push; reconciliação vazia também não cria commit. Não usar PAT, pull_request_target, token de fork ou segredo novo. Rodar verificações no job antes do push, pois o commit do bot também não dispara o CI normal.
- Fonte técnica: documentação oficial GitHub Actions sobre GITHUB_TOKEN e concorrência, consultada em 22/09/2026. Critério final requer PR de teste integrada depois da implementação; o merge permanece com o Regente e será combinado após entregar uma PR concreta.

## 22/09/2026 · Implementação e validação local

- Criados planejador puro, leitura de histórico Git/API paginada e CLI `ledger:sync-project`, com dry-run por padrão. Clone raso é recusado; decisões vêm de revisões da linha principal, PRs somente de merges alcançáveis. Metadados livres de PR nunca viram payload ou comando shell.
- Idempotência por ID da decisão/número da PR, inclusive dentro do lote. Ordenação topológica e desempate por chave de origem; recuperação de lacuna preserva o prefixo publicado. A aplicação valida antes/depois e usa o lock e rename atômico da F08.
- Workflow restrito a main do repo, token de escrita só no job, quatro tentativas com atualização da main e recálculo. Commit limitado ao livro. O check completo dentro do job cobre também o commit de dados, que não dispara CI externo.
- Explicação do laço: push com GITHUB_TOKEN não inicia workflows de push; não há PAT nem evento pull_request_target. Uma execução manual repetida também não escreve nem atualiza checkpoint quando não há fatos pendentes. [Fonte GitHub, acesso em 22/09/2026](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
- O grupo de concorrência pode substituir jobs pendentes; a leitura completa recupera seus fatos na execução seguinte. [Fonte GitHub, acesso em 22/09/2026](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency). A API de PRs fornece as referências estruturadas de merge; [referência REST, acesso em 22/09/2026](https://docs.github.com/en/rest/pulls/pulls).
- `npm run check` com Node 24.21.0 passou: lint, tipos, 125 testes, livro real com 28 fatos e checkpoint íntegro, build/CSP e orçamento de assets. Os 12 testes novos cobrem planejamento offline e histórico Git temporário, incluindo decisão introduzida por merge e remoção posterior.
- Dry-run real em HEAD 560a050: nenhum fato pendente. SHA-256 do arquivo antes/depois idêntico: `65330f16b670075aea9de991e7ccb7fde578b0c3d88b9bcec54294e637fa4762`. O livro publicado não foi alterado nesta implementação.
- Operação documentada: projeto automático, demais famílias e correções manuais; autenticação, recuperação e futura proteção de branch sem configurar bypass. Atualizar Git não publica o site nem ancora checkpoint.
- Próximo marco: entregar PR de implementação ao Regente, acompanhar integração e validar uma PR posterior entrando sozinha no livro. Esse critério ao vivo permanece pendente até os merges.

## 22/09/2026 · Integração e prova ao vivo

- A implementação foi integrada pelo Regente na [PR #35](https://github.com/LucasOl1337/VidaNova/pull/35), merge `71f68e2`, após CI verde com 125 testes.
- O merge iniciou a [primeira execução automática do livro](https://github.com/LucasOl1337/VidaNova/actions/runs/35806131656). Esta atualização de diário constitui a PR de teste posterior solicitada pelo BRIEF: seu merge deve gerar um único `project/pull_request_merged` sem append manual.
- Roteiro de aceitação: após integrar esta atualização, conferir o job, buscar a main, validar o documento com `ledger:verify` e contar exatamente um evento com o número desta PR. Executar novamente a conciliação em dry-run e confirmar zero fatos pendentes e bytes preservados. Dinheiro, campo e candidato devem continuar ausentes do lote automático.
- Resultado final será registrado após a execução, com links e hashes; não declarar o teste ao vivo concluído antes disso.
