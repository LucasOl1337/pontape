# PontaPé pelo terminal

O CLI cobre as funções implementadas do PontaPé: site e dados públicos, livro de ações, chat Yume, métricas, login/admin, histórico de conversas, checkout e webhook de doação, desenvolvimento, testes e scripts de operação.

## Começar

Use Node **24.21**, fixado em `.node-version`. A suíte independente e `check --scope all` também precisam de Python 3.9+ com a base de fusos do sistema. Na raiz do checkout:

```sh
npm ci
node bin/pontape.mjs --help
node bin/pontape.mjs doctor --json
node bin/pontape.mjs capabilities --json
```

Também funciona com `npm run cli -- <comando>`. Para consumir JSON por pipe, use `npm --silent run cli -- <comando> --json`, evitando o banner do npm. Para instalar o atalho opcional no seu ambiente:

```sh
npm link
pontape --help
```

O CLI não tem build próprio nem dependências novas. Ajuda e descoberta funcionam mesmo antes de `npm ci`. O executável encontra o checkout pelo próprio arquivo; caminhos passados em argumentos são relativos ao diretório de quem chama. Não instala bibliotecas nem atualiza o Node por conta própria.

Nos exemplos seguintes, `pontape` também pode ser substituído por `node bin/pontape.mjs`.

## Descobrir antes de operar

```sh
pontape help
pontape help ledger
pontape ledger append --help
pontape capabilities --json
pontape status --json
pontape site routes --json
pontape site data --collection modules --id M4 --json
pontape docs list
pontape docs show --name cli
```

`capabilities` lista cada comando, seus argumentos, obrigatoriedade, valores aceitos, exemplo e efeito. `--help` nunca executa o comando. `-h`, `-j` e `-v` são atalhos para ajuda, JSON e versão. Flags desconhecidas ou repetidas são erro; não há prompts interativos.

`status` lê o checkout local e verifica o livro. A data do estado dos módulos vem da fonte do site. Para consultar o servidor, use `chat health`, `metrics public` ou `ledger verify --remote`.

## Servidor escolhido

Comandos HTTP usam, nesta ordem, `--base-url`, `PONTAPE_BASE_URL` ou **http://127.0.0.1:8794**. Arquivos e scripts sempre pertencem ao checkout do executável. `--base-url` não muda o destino de scripts como deploy, carimbo, reconciliação Asaas ou sincronização GitHub; os destinos deles seguem as variáveis e scripts existentes.

```sh
pontape chat health --base-url https://pontape.org --json
pontape metrics public --base-url https://pontape.org --json
pontape ledger verify --remote --base-url https://pontape.org --json
```

Use a origem exata, sem caminho, query, usuário ou senha. HTTP só é aceito em loopback; outras origens usam HTTPS. Redirects não são seguidos. Chamadas HTTP têm prazo de 30 segundos, configurável com `--timeout-ms`. Não existe repetição automática, inclusive para POST: timeout pode significar que o servidor executou e a resposta se perdeu.

## Testar tudo localmente

Em um terminal:

```sh
pontape dev mock --port 8794
```

Em outro:

```sh
export PONTAPE_BASE_URL=http://127.0.0.1:8794
pontape chat health
pontape chat ask --message 'Como funciona o PontaPé?'
export PONTAPE_ADMIN_USER=admin-ficticio
export PONTAPE_ADMIN_PASSWORD=senha-ficticia
pontape auth login
pontape auth session
pontape admin stats
pontape metrics hit --input docs/cli/examples/hit-ficticio.json --apply
pontape donation checkout --amount-cents 1000 --apply
export PONTAPE_WEBHOOK_TOKEN=webhook-ficticio
pontape donation webhook --input docs/cli/examples/webhook-ficticio.json --apply
pontape auth logout
```

Esse comando executa o **Worker real e suas migrações SQL**. SQLite fica em memória; Yume responde texto fictício; Asaas devolve checkout fictício; dispatch de webhook fica só na memória. Rede externa dos provedores é bloqueada. Nenhum segredo real é lido. Reiniciar zera tudo. O limitador de requisições é permissivo no mock; autenticação, validação, proteção de dados pessoais, SQL e roteamento continuam sendo os do Worker.

O mock escuta apenas em `127.0.0.1`; `--port 0` escolhe porta livre e informa o endereço. `Ctrl+C` encerra. `--json` emite **JSON Lines** de ciclo de vida (`ready`, depois `stopped`), exceção ao resultado único dos comandos finitos. O banco temporário não é uma cópia da produção. O endpoint `/__mock/state`, exclusivo deste servidor, permite aos testes conferir checkouts e dispatches simulados.

Se `dist/` existir, o mock serve esse build. Sem build, `/` mostra uma página fictícia mínima; os downloads do livro vêm do checkout. Para testar o site completo:

```sh
pontape build
pontape dev mock
```

Para desenvolvimento visual com recarga, `pontape dev site --port 4321`. Para o runtime Cloudflare local com provedores reais, configure `.env` conforme `.env.example` e use `pontape dev worker --port 8794`. Esse último reutiliza o script Wrangler existente, instala Wrangler se necessário e usa `.wrangler/f43` para persistência. Chamadas aos provedores podem consumir saldo. `pontape preview` serve somente o build estático, sem APIs do Worker.

## Livro de ações

Consultas validam a corrente antes de devolver dados. Valores financeiros permanecem strings de centavos exatos.

```sh
pontape ledger summary --json
pontape ledger list --type finance --after 0 --limit 50 --json
pontape ledger show --sequence 1 --json
pontape ledger export --out /tmp/pontape-copia.json
pontape ledger verify --file /tmp/pontape-copia.json
pontape ledger trust --json
```

`list` devolve `events`, `total`, `matching` e `nextAfter`. Enquanto `nextAfter` não for `null`, passe seu valor em `--after` para a próxima página. `--file` e `--remote` são exclusivos. `export` e `init` criam arquivo novo e recusam sobrescrita. Sem `--out`, `export` devolve o documento em `data` no modo JSON.

Para incluir um evento fictício sem tocar no livro do projeto:

```sh
pontape ledger init --out /tmp/livro-ficticio.json
pontape ledger append --file /tmp/livro-ficticio.json --event docs/cli/examples/evento-ficticio.json
pontape ledger append --file /tmp/livro-ficticio.json --event docs/cli/examples/evento-ficticio.json --apply
pontape ledger verify --file /tmp/livro-ficticio.json
```

`append` reutiliza os schemas, lock cooperativo e troca atômica do script existente. O payload pode ser de projeto, dinheiro, ação de campo ou contagem agregada de candidatos, conforme `src/lib/ledger/schema.ts`. Dado real de candidato nunca entra no repositório.

Verificação criptográfica opcional:

```sh
pontape ledger verify --checkpoint /tmp/checkpoint-guardado.json
pontape ledger verify --signed /tmp/checkpoint-assinado.json --public-key HEX_DE_64_CARACTERES
pontape ledger sign --file /tmp/livro-ficticio.json
pontape ledger sign --file /tmp/livro-ficticio.json --key /caminho/externo/chave.pem --out /tmp/assinatura-nova.json --apply
```

A chave pública deve vir de canal confiado, não do mesmo arquivo que você quer verificar. O resultado distingue integridade da corrente, checkpoint guardado, assinatura e cobertura da cabeça. `trust` apenas lê as declarações publicadas sobre assinatura/carimbo. Nenhum desses comandos afirma que consultou e validou criptograficamente Rekor/freetsa.

Operação já existente:

| Comando | Comportamento e requisitos |
|---|---|
| `ledger append --event arquivo.json [--file livro.json] [--apply]` | Simula ou grava evento local. Não publica. |
| `ledger sign [--file livro.json] [--key externo.pem --out novo.json --apply]` | Simula sem ler chave; ao aplicar, exige Ed25519 externa. |
| `ledger drain --input envelope.json [--apply]` | Valida inclusive na simulação; aceita envelope, lote Asaas ou webhook. Com apply, usa `LEDGER_SIGNING_PKCS8`, modifica livro/intake/assinatura e pode carimbar externamente. |
| `ledger stamp [--apply]` | Com apply, assina/carimba a cabeça via serviços externos. Requer `LEDGER_SIGNING_PKCS8`. |
| `ledger sync-project [--apply]` | Consulta Git e GitHub via `gh` autenticado e histórico completo; simula ou grava PRs e decisões pendentes. Não faz push. |
| `ledger reconcile` | Requer `ASAAS_SANDBOX_KEY`; lê extrato e devolve envelopes pendentes. Não grava nem envia automaticamente para drain. |

Os comandos antigos `npm run ledger:*` continuam disponíveis. Os comandos que reutilizam scripts devolvem `data.exitCode`, `data.stdout`, `data.stderr` e `data.signal`, preservando a saída deles. A versão atual da reconciliação consulta a primeira página de 100 transações do Asaas, comportamento anterior ao CLI; não é uma auditoria completa de contas maiores. Um carimbo externo que falha em `drain` pode deixar a ação já registrada, conforme a regra existente. Não repita sem conferir o livro e a chave de idempotência.

## Yume e histórico

```sh
pontape chat ask --message 'Como conferir uma doação?' --json
pontape chat ask --input docs/cli/examples/chat-ficticio.json --json
pontape chat ask --message 'Como funciona?' --chat-id 11111111-1111-4111-8111-111111111111
pontape admin chats --page 1 --json
pontape admin chat --id 11111111-1111-4111-8111-111111111111 --json
```

Sem `chatId`, a conversa não é arquivada pelo Worker. Para continuar, mande o histórico em `--input` com `{ "messages": [{ "role": "user", "content": "..." }], "chatId": "UUID v4 opcional" }`. Até 12 falas alternadas, 600 caracteres por fala, terminando em `user`. `--input -` lê JSON de stdin. `--message` e `--input` são exclusivos. `--chat-id` é exclusivo com `chatId` no JSON.

O CLI lê SSE, reúne fragmentos de texto e só retorna sucesso quando recebe fim válido (`[DONE]` ou `finish_reason: stop`). Stream truncado retorna erro. A resposta é reunida antes de imprimir; o terminal não exibe token por token. No modo texto, imprime a resposta; em JSON, devolve `answer`, `chatId` e `private`. O filtro de dados pessoais permanece no Worker.

## Login admin

A sessão do CLI é independente do navegador e vinculada à origem. Senha entra por variável ou stdin, nunca por flag:

```sh
export PONTAPE_ADMIN_USER=meu-usuario
# Defina PONTAPE_ADMIN_PASSWORD pelo mecanismo de segredos do seu ambiente.
pontape auth login --base-url https://pontape.org
# Alternativa: o comando à esquerda deve escrever somente a senha.
comando-que-le-a-senha | pontape auth login --user meu-usuario --password-stdin --base-url https://pontape.org
pontape auth session --base-url https://pontape.org
pontape admin stats --base-url https://pontape.org --json
pontape auth logout --base-url https://pontape.org
```

Sessões ficam em `${XDG_STATE_HOME:-~/.local/state}/pontape`, um arquivo por origem, com modo 0600 e diretório criado com 0700. `PONTAPE_STATE_DIR` muda esse diretório e deve apontar para fora do repositório. Login não imprime senha/cookie. Validade vem do servidor, hoje 12 horas. Logout apaga o arquivo local mesmo se já estiver expirado; como no admin web, não existe revogação central antecipada de uma cópia desse cookie. Os dados do admin e históricos consultados são a saída solicitada; redirecione para local privado quando necessário.

## Métricas e doação

```sh
pontape metrics public --json
pontape metrics hit --input docs/cli/examples/hit-ficticio.json
pontape donation checkout --amount-cents 2000
pontape donation webhook --input docs/cli/examples/webhook-ficticio.json
```

Os três comandos de envio acima só fazem POST com `--apply`. A simulação valida a entrada localmente e informa origem e rota; não afirma que o servidor está disponível ou configurado. Valores de checkout: 1000, 2000, 5000 ou 10000 centavos. O CLI devolve o link de pagamento e não abre navegador nem conclui pagamento. A flag de abertura de doações, autorização do webhook e ambiente Asaas continuam controlados pelo Worker. O CLI não ativa dinheiro real.

`metrics hit` aceita `kind`, `path` e `target` do contrato atual. `view` é aceito pela API mas não incrementa visita: o Worker conta quando serve HTML. `metrics public` pode devolver cache de até 60 segundos. Webhook aplicado usa `PONTAPE_WEBHOOK_TOKEN`; o servidor remove campos pessoais antes de encaminhar eventos públicos para o livro.

## Testes e operação

```sh
pontape test --suite cli
pontape test --suite worker
pontape test --suite ledger
pontape test --suite python
pontape check --scope all
pontape build
pontape ops deploy
pontape ops migrate
```

`test` aceita `all`, `cli`, `worker`, `ledger` e `python`; padrão `all` executa Vitest e o conferidor Python. `python` executa o conferidor independente. `check --scope all` roda o pipeline npm existente: lint, tipos, Vitest, Python, livro, build e orçamento de assets. Escopos individuais: `lint`, `types`, `tests`, `build`, `budget`. Os testes do CLI entram no CI padrão. Subprocessos finitos têm timeout de 10 minutos, alterável por `--timeout-ms`.

`ops deploy` reutiliza o script existente: exige checkout limpo no commit de `origin/main`, faz build/verificações e dry-run do Wrangler. Com `--apply`, publica. `ops migrate` só descreve o plano até receber `--apply`; então aplica no D1 remoto configurado. Operar essas funções continua sujeito às regras de publicação do projeto em `AGENTS.md`. O CLI não pede confirmação interativa nem contorna essas regras. A implementação/testes do CLI não executam deploy nem migração remota.

Servidores rodam em primeiro plano, sem daemon oculto. Interrupção encerra o grupo de processos iniciado pelo CLI. `--timeout-ms` não limita a duração de servidores.

## Contrato de saída

Comandos finitos com `--json` emitem um único JSON em stdout. Logs e diagnósticos auxiliares usam stderr. Não misture stderr no parser de JSON.

```json
{"schemaVersion":1,"ok":true,"command":"chat health","data":{"ok":true,"configured":true}}
```

```json
{"schemaVersion":1,"ok":false,"command":"auth session","error":{"code":"AUTH_REQUIRED","message":"Entre com auth login para esta origem."}}
```

`error.details`, quando presente, traz status HTTP, verificação inválida ou resultado do subprocesso. O corpo bruto de erros HTTP e valores de credenciais não são impressos. Não há garantia de ordenação das chaves JSON. A forma do `data` de consultas HTTP acompanha a API do Worker; o envelope tem versão própria.

| Exit code | Significado |
|---|---|
| 0 | Comando concluído; confira `data` para estado como `configured: false` |
| 1 | Falha de domínio, integridade, configuração, arquivo, HTTP ou ferramenta |
| 2 | Uso/argumentos/entrada inválidos |
| 3 | Sessão ausente/expirada ou HTTP 401/403 |
| 4 | Registro ausente ou HTTP 404 |
| 5 | Rede ou timeout |
| 130 | Subprocesso interrompido pelo usuário |

`dev mock --json` usa JSON Lines de ciclo de vida conforme explicado acima. Para testar suporte antes de montar comandos, consuma `capabilities --json`; não faça scraping da ajuda humana.

## Manutenção e limites

- Catálogo de comandos: `scripts/cli/catalog.ts`. Parsing/saída: `main.ts`. Operações locais, HTTP, livro e subprocessos ficam em arquivos separados. O mock só é importado quando solicitado.
- Ao adicionar uma função do Worker, inclua comando, exemplo e teste de processo contra `dev mock`. Reutilize a regra de domínio e os mesmos schemas.
- O CLI consulta o estado dos módulos futuros, mas não inventa cadastro de candidatos, entrevista por voz, seleção, entregas ou vagas. Eventos agregados desses tipos já podem ser incluídos pelo contrato do livro.
- Mock prova o cliente contra Worker/SQL locais. Não prova credenciais de produção, o provedor AI real, o runtime distribuído D1, limites Cloudflare, carimbos externos ou pagamento real. Use `dev worker` e o ambiente sandbox autorizado para essa etapa.
- Plano e inventário: [PLANO.md](PLANO.md). Registro da entrega: [DIARIO.md](DIARIO.md).
