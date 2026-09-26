# Diário do CLI

25/09/2026. Pedido direto do Lucas, executado no worktree `.worktrees/cli`, branch `codex/cli-agentes`, a partir de `1baba03`. Checkout principal preservado.

## Entrega

CLI `pontape`, sem dependência nova e sem build próprio. Catálogo único, ajuda, descoberta JSON, parsing estrito, códigos de saída e timeout. Consultas do site e livro, operação do livro existente, Yume/SSE, métricas, sessão admin própria por origem, histórico, checkout/webhook, desenvolvimento, testes e scripts de publicação/migração.

`dev mock` roda o Worker e suas migrações reais em SQLite temporário, com provedores fictícios. Scripts antigos permanecem. `ledger drain` ganhou entrada por arquivo para não colocar o envelope na lista de argumentos do processo. README, AGENTS, guia completo e quatro exemplos fictícios foram adicionados/atualizados.

No teste independente, o conferidor Python falhou na ação 111 do livro publicado: o contrato tinha ganhado `signing_key_rotated` e `externalId` financeiro, mas o Python não. Corrigido com validação estrita desses campos e teste de regressão. Python agora entra em `test:all`, `check` e CI.

## Validação concluída

- `node bin/pontape.mjs check --scope all --json`: sucesso, com stdout JSON válido e exit 0.
- Lint e tipos: zero erros e zero warnings. Continua o hint já existente no protótipo de design sobre um `await` sem efeito.
- Vitest: **207 testes**, 27 arquivos. Desses, 14 testes de integração do CLI, incluindo descoberta de todos os comandos, cópia sem node_modules, argumentos inválidos, caminhos de outro cwd, livro temporário, assinatura com chave confiada, corrupção, login/logout, expiração, isolamento por origem, chat, métricas, checkout/webhook, timeout sem retry, redirect e stream SSE truncado.
- Python: **11 testes**, incluindo livro publicado e contrato atualizado.
- Build, CSP e orçamento de assets: passaram. Nenhuma mudança nos arquivos de interface ou no Worker de produção.
- Consultas reais somente de leitura pelo CLI em `https://pontape.org`: saúde do chat configurada, métricas públicas e livro válido com **127 eventos**, saldo zero. Não houve chat real, login real, doação, envio de webhook, publicação ou migração remota.
- Mediana de 7 execuções locais com Node 24.21: ajuda **46,8 ms**, descoberta JSON **49,0 ms**, resumo/verificação do livro **113,1 ms**. São medições desta máquina, não promessa de latência em outros ambientes.
- Servidor usado no teste manual encerrado e sessão fictícia removida. Servidores da suíte encerram no teardown.

## Limites preservados

Os módulos futuros não viraram serviços inventados. O mock não valida credenciais nem disponibilidade dos provedores reais. Carimbo externo, Asaas real e Wrangler continuam com os scripts e requisitos existentes. `ledger reconcile` ainda lê a primeira página de 100 transações, limitação anterior registrada no guia. `ledger trust` devolve metadados, sem afirmar validação externa do carimbo.

## Próximo passo

Revisão da PR da branch `codex/cli-agentes` para `main`, conforme a organização do repositório. A integração pode acionar o fluxo normal de publicação do projeto; esta frente entregou código e validação local.
