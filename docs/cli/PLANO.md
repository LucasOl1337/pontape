# CLI do PontaPé

Pedido do Lucas em 25/09/2026: agentes devem conseguir descobrir, consultar, operar e testar todas as funções existentes por uma entrada de terminal rápida e documentada.

## Levantamento

Base: commit `1baba03`, consultado em 25/09/2026. O app tem site Astro estático, Worker com chat Yume, métricas, autenticação/admin e checkout/webhook Asaas. O livro já tem oito scripts Node para verificação, inclusão, assinatura, carimbo, ingestão e conciliação. Build, lint, tipos e testes ficam no npm; publicação e migração ficam em shell. Não existe executável unificado nem contrato JSON de saída. O README ainda descreve uma fase anterior do produto.

Fontes: `package.json`, `scripts/ledger/`, `scripts/deploy/worker*.js`, `src/data/site/`, `src/lib/ledger/`, `src/pages/`, `docs/PRD.md` e `docs/QUADRO.md`.

## Decisões de implementação

- Executável `bin/pontape.mjs`, alias npm `cli`, instalação opcional com `npm link`. Node da `.node-version`, sem biblioteca nova e sem build do CLI.
- Registro único de comandos e opções alimenta ajuda e descoberta JSON. Parsing estrito, códigos de saída documentados, timeout, erros legíveis e nenhum prompt interativo.
- Consulta local como padrão. Chamadas HTTP apontam para `http://127.0.0.1:8794`; produção exige `--base-url https://pontape.org` ou variável explícita. Cada comando informa seu efeito.
- Reutilizar verificadores e scripts existentes. Não duplicar a regra de dinheiro, assinatura, autorização ou retenção. Scripts antigos continuam compatíveis.
- JSON tem envelope versionado; stdout fica reservado ao resultado. Logs de subprocessos ficam em stderr, com resultado de execução no envelope.
- Autenticação usa a API real e sessão própria do CLI vinculada à origem, fora do checkout, com arquivo 0600. Senha por stdin ou variável, nunca por argumento.
- Operações que já simulam continuam simulando. Checkout, webhook, registro de métrica, deploy e migração exigem `--apply` para executar. Chat e login são comandos explícitos que efetuam a chamada.
- Servidor `dev mock` executa o Worker real, SQL real em SQLite temporário e provedores fictícios, sem credenciais ou rede externa. Testes de integração usam processos reais do CLI contra esse servidor.

## Cobertura planejada

| Superfície atual | Comandos |
|---|---|
| Descoberta e diagnóstico | help, capabilities, doctor, status, docs list/show |
| Dados públicos e rotas | site data/routes, ledger list/show/summary/export/trust |
| Integridade e operação do livro | ledger verify/append/sign/drain/stamp/sync-project/reconcile |
| Chat Yume | chat health/ask, mensagem simples ou histórico JSON, SSE |
| Métricas públicas e eventos | metrics public/hit |
| Admin e histórico | auth login/session/logout, admin stats/chats/chat |
| Asaas sandbox | donation checkout, donation webhook |
| Desenvolvimento e testes | dev site/worker/mock, preview, build, check, test |
| Operação existente | ops deploy/migrate |

Captação, entrevista por voz, seleção, entregas e vagas ainda não têm serviço próprio. O CLI consulta seus estados nos módulos e registra os eventos agregados que o livro já suporta. Não inventa CRUD de candidatos, pagamentos reais nem serviços ausentes.

## Critérios de entrega

1. Todo endpoint atual do Worker tem comando e exemplo, sem exigir navegador.
2. Ajuda e manifesto funcionam sem instalação de dependências; comandos de domínio só carregam o necessário.
3. Integração cobre chat, login/logout, sessão, estatísticas, histórico, checkout e webhook com dados fictícios; livro cobre consulta, alteração explícita e recusa de corrupção.
4. JSON continua válido em sucesso e falha; argumentos inválidos, timeout, sessão expirada e serviço indisponível têm saída não zero.
5. `npm run check` e conferidor Python passam. README, guia completo, instruções de agentes e diário registram resultado e limitações.
6. Commit, push e PR para main, preservando o checkout do Regente e sem publicar o site.
