# Operação · F26 · Vigília noturna

Janela autorizada: 23/09/2026 até 08:00, horário de Brasília (11:00 UTC). Gestor: ExecutorBruto. Alvo: [pontape.org](https://pontape.org), variante Crônica. Trabalho no worktree `.worktrees/bruto`; executores nos worktrees `noite-1` a `noite-4`. Navegação apenas em bancadas `agent-bench` dos workspaces 6 a 11. O gestor não envia mensagens ao Regente, Design/UI ou EngenheiroFino nesta janela.

## Estado e critério de integração

- Base da rodada: `origin/main` em `2e41c7d` às 03:38 UTC, depois do deploy de D021/D022. A `main` e o livro podem avançar automaticamente; conferir a versão efetiva antes de cada revisão e merge.
- Bancada do gestor: `pontape-f24-pos-lancamento`, workspace 6, controle `agente`, Chromium e perfil exclusivos confirmados por `agent-bench status` e `browser-status`. DNS local não resolveu o domínio; a regra de resolução está apenas no processo Chromium desta bancada. `curl` usa `--resolve pontape.org:443:172.67.180.35` quando necessário.
- Para cada PR: uma causa, diff inteiro revisado, apenas arquivos permitidos, evidência antes/depois, `npm run check`, CI verde, visual 360/1440 na bancada e teste do caso vizinho. Só então `gh pr merge --merge`. Esperar o timer publicar, conferir site real e reverter se a versão quebrar.
- O skill `$loop` foi lido, mas este harness não expõe ferramenta de automação ou renomeação de thread. A vigília continua enquanto esta sessão estiver ativa. Não presumir cobertura após seu fim. A última leitura bem-sucedida, PRs em curso e próximo passo ficam aqui.

## Backlog inicial da F24

| Item | Caso real e critério de pronto | Estado / dono |
|---|---|---|
| [#56](https://github.com/LucasOl1337/pontape/issues/56) | Livro em 320 px mede 337 px sem A+ e 395 px com A+; em 360 px com A+ mede 395 px. Deve caber em 320/360 e zoom 200%, mantendo leitura e Conferir. | Em execução, Vagalume (`noite-1`). |
| [#40](https://github.com/LucasOl1337/pontape/issues/40) | Na 404, quatro links do menu criam hash sem destino na própria 404. Devem voltar à home e abrir a seção ou caderno certo. | Em execução, Candeia (`noite-2`). |
| [#41](https://github.com/LucasOl1337/pontape/issues/41) | Exemplo fictício do livro oferece fonte em commit de 40 zeros. Não deve prometer fonte inexistente. | Em execução, Lampião (`noite-3`). |
| [#54](https://github.com/LucasOl1337/pontape/issues/54) | 404 em 320 px com A+ mede 353 px. Deve caber, sem degradar 360/1440. | Em execução, Coruja (`noite-4`). |
| [#55](https://github.com/LucasOl1337/pontape/issues/55) | A Cloudflare injeta beacon externo bloqueado por `script-src` na home, livro e 404. Resolver sem relaxar a CSP genericamente. | Na fila, exige análise de causa e possivelmente configuração Cloudflare, fora da F26. Não delegar alteração da conta. |
| [#57](https://github.com/LucasOl1337/pontape/issues/57) | O roteiro de rollback ainda descreve Pages; produção usa Workers e timer. | Fora da F26, documentação operacional posterior. |

As issues #42 e #43 do visual anterior foram fechadas na F24 após reprodução negativa na Crônica. HTTP sem redirecionamento apareceu na primeira leitura da F24, mas o deploy da D021 entrou durante o ensaio e a nova resposta HTTP passou a ser 301 para HTTPS. Não é falha atual.

## Eventos

### 03:38 a 03:41 UTC · Início e despacho

- Li `vigilia/SKILL.md`, observação prolongada, `loop/SKILL.md`, brief F26 e AGENTS. Mesclei `origin/main` na branch F24 sem conflito. O site foi atualizado durante a F24: redirecionamento HTTP e www para HTTPS canônico, HSTS e links do repositório novo entraram; livro baixado às 03:36 UTC passou no conferidor independente com 44 ações.
- Repeti F24 na versão nova. Home cabe em 320/360 px; livro continua transbordando em 320 sem/com A+ e em 360 com A+; 404 transborda em 320 com A+. O beacon continua bloqueado pela CSP em home, livro e 404. 3G lento da versão atual: home `load` 3.654 ms / 137.054 B; livro 4.237 ms / 165.238 B, com cache do navegador desligado. Recursos próprios 200.
- Abri #54, #55, #56 e #57 com passos reproduzíveis. Despachei um item para cada executor via Maestri. Os quatro confirmaram recebimento ou estão trabalhando; acompanhar por `maestri check Nome` e PRs abertas. Não houve merge ainda.
- `npm run check` no worktree do gestor passou após a atualização da main: 127 testes, livro local com 45 ações, build, CSP com 3 hashes e orçamento. Isso valida a base local; o livro publicado pode ter outra contagem por causa do timer.
- Próximo passo: terminar relatório F24, guardar evidências, abrir a PR de documentação e revisar as quatro PRs de polimento quando chegarem. Reconciliar `origin/main` antes de cada integração.
