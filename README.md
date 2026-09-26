# PontaPé

Plataforma sem fins lucrativos e de código aberto. Usa AI pra levar cada doação a quem pode mudar de vida e acompanha a pessoa até o trabalho. O livro público permite conferir as ações do projeto.

Site: [pontape.org](https://pontape.org). Produto e estado das frentes: [PRD](docs/PRD.md) e [Quadro](docs/QUADRO.md).

Hoje o repositório contém site Astro, livro verificável, chat Yume, métricas e painel admin. Checkout e webhook Asaas estão implementados atrás de configuração; a operação com candidatos, voz e vagas ainda está em planejamento. Não confunda o estado do código com a abertura das doações.

## Começar pelo CLI

Use Node 24.21, fixado em `.node-version`, e npm:

```sh
npm ci
npm run cli -- --help
npm run cli -- doctor
npm --silent run cli -- capabilities --json
npm --silent run cli -- status --json
```

O CLI permite consultar e operar as funções atuais sem navegador. Tem ajuda por comando, saída JSON versionada, códigos de saída, timeout, sessão admin própria e ambiente fictício para testes. Não acrescenta dependências nem exige build próprio.

**[Guia completo do CLI](docs/cli/README.md)** · [Plano e levantamento](docs/cli/PLANO.md) · [Registro da entrega](docs/cli/DIARIO.md)

```sh
# Instalação opcional do atalho neste ambiente
npm link
pontape help ledger
pontape ledger verify
pontape site data --collection modules --id M4
pontape dev mock
```

`dev mock` executa o Worker real com SQLite em memória e provedores fictícios. Informa credenciais locais de teste, não precisa de conta externa e não publica nada. Para trabalhar na interface:

```sh
npm run dev
```

Abra o endereço informado pelo Astro, normalmente `http://localhost:4321`. `Ctrl+C` encerra. `.env.example` documenta a configuração para testar o Worker com provedores reais.

## Verificações

```sh
npm run check
npm run test:cli
npm run cli -- test --suite python
```

`check` executa lint, tipos, Vitest (incluindo integração do CLI), Python, verificação do livro, build e orçamento de assets. Build estático em `dist/`; `npm run preview` permite conferir os assets, sem as APIs do Worker. O CI roda em PRs e pushes para `main`.

## Onde trabalhar

| Caminho | Responsabilidade |
|---|---|
| `bin/pontape.mjs`, `scripts/cli/` | Executável, descoberta, comandos e testes de integração |
| `src/pages/`, `src/components/`, `src/styles/` | Rotas, interface e estilos |
| `src/data/site/` | Nome do projeto, módulos, jornada, tarefas e textos do site |
| `src/data/transparency.json` | Snapshot financeiro público validado no build |
| `src/data/ledger/`, `src/lib/ledger/` | Livro público, schemas e verificação criptográfica |
| `scripts/ledger/` | Operação do livro; comandos npm antigos preservados |
| `scripts/deploy/` | Worker, chat, métricas, admin, SQL e publicação |
| `tools/conferir.py` | Conferidor independente em Python |
| `docs/` | Produto, decisões, operação, pesquisas e diários |

## Livro público

```sh
npm run cli -- ledger summary
npm run cli -- ledger list --limit 5
npm run cli -- ledger verify
```

`ledger append --event arquivo.json` simula; `--apply` grava localmente. Assinatura exige chave Ed25519 fora do repositório. A corrente, a assinatura e o carimbo externo são verificações distintas. Os comandos de operação e suas dependências estão no [guia](docs/cli/README.md#livro-de-ações).

[Como conferir](docs/transparencia/COMO-CONFERIR.md) · [Contrato do livro](docs/transparencia/CONTRATO.md) · [Operação](docs/transparencia/OPERACAO.md)

## Contribuir

Leia [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), [decisões](docs/DECISOES.md) e [arquitetura](docs/arquitetura/ARQUITETURA.md). Toda PR passa por revisão de admin. Licença [Apache-2.0](LICENSE).

O pacote aprova apenas o install script de `esbuild@0.28.2`, conforme `allowScripts` no `package.json`. Uma atualização dessa dependência exige revisar sua nova versão.
