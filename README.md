# PontaPé

O pontapé inicial pra quem quer mudar de vida. Nome escolhido pelo Lucas em 22/09/2026 (D016); o repositório é `LucasOl1337/pontape` (antes VidaNova) e a pasta local ainda se chama VidaNova.

Um projeto sem fins lucrativos e open source pra quem quer mudar de vida e não tem nem o primeiro passo.

A gente encontra a pessoa certa, conversa com ela por voz usando IA (ela não precisa saber ler), garante comida, roupa e higiene pros primeiros dias, e conecta com trabalho. Toda ação do projeto, cada real e cada passo, fica à vista num livro público que qualquer um pode conferir.

Estado: fundação. Esta base entrega uma página provisória e um painel estático com zero e data de referência. Atendimento e doações ainda não estão habilitados. A interface completa vem da F07; o livro público de ações vem da F08.

## Rodar localmente

Requisitos: **Node.js 24.21.0** (também registrado em `.node-version`) e npm. Ative essa versão no seu gerenciador de Node antes dos comandos. Não precisa de conta externa, variável de ambiente ou backend.

Na raiz do checkout:

```sh
npm install
npm run dev
```

Abra o endereço local mostrado pelo Astro, normalmente `http://localhost:4321`. Encerre com `Ctrl+C` no terminal. Se o Astro iniciar em segundo plano, use `npm run dev -- stop`. `.env.example` documenta que esta fase não exige configuração; não é necessário copiá-lo.

## Verificar a base

Para reproduzir a instalação do CI a partir do lockfile:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run check` executa as quatro verificações em sequência. `npm run test:watch` acompanha os testes durante edição. O build é inteiramente estático, gravado em `dist/`.

Para conferir o build localmente:

```sh
npm run preview
```

Esse comando não publica o site. O workflow de CI roda em toda PR e em pushes para `main`, com permissão apenas de leitura e sem segredos ou deploy.

## Onde trabalhar

| Caminho | Responsabilidade |
|---|---|
| `src/pages/` | Rotas Astro; `index.astro` é a página provisória |
| `src/layouts/` | HTML base, idioma, metadados e estilos globais |
| `src/components/blocks/` | Blocos que a F07 vai compor a partir da F01 |
| `src/styles/tokens.css` | Fonte única dos tokens visuais; valores iniciais da F01 |
| `src/data/transparency.json` | Snapshot financeiro público, versionado e com data |
| `src/lib/transparency.ts` | Schema estrito e tipo exportado do snapshot |
| `src/lib/*.test.ts` | Testes Vitest, sem navegador ou serviço externo |
| `docs/` | Produto, decisões, pesquisas e diários |

React está instalado e integrado ao Astro. A F07 pode criar componentes `.tsx` e hidratá-los explicitamente com `client:*` quando houver interação. O placeholder não carrega JavaScript de React nem fontes externas.

O snapshot aceita apenas os campos declarados no schema. Nesta fase, valores financeiros devem ser zero, moeda BRL e doações desabilitadas. `asOf` é a data do dado, não a data do build. Não atualize a data automaticamente nem acrescente texto livre ou dados pessoais. A validação também roda no build; mudar só o teste não torna um snapshot inválido publicável.

A F08 terá contrato próprio para eventos públicos de projeto, finanças e ações. Ela poderá exportar tipos e verificador em `src/lib/` e manter dados versionados em `src/data/`, sem depender dos componentes de tela. Esta etapa não implementa cadeia de hashes nem transforma o snapshot em livro de eventos. D009 e D010 definem plataforma e transparência primeiro, entrevista depois.

## Documentos e contribuição

- [PRD](docs/PRD.md)
- [Quadro](docs/QUADRO.md)
- [Decisões](docs/DECISOES.md)
- [Arquitetura](docs/arquitetura/ARQUITETURA.md), com execução regida pelo brief aprovado da F02 e decisões posteriores
- [Como contribuir, rascunho](CONTRIBUTING.md)

Toda PR passa por aprovação de admin. Licença e abertura do repositório aguardam decisão do Lucas.

## Livro público de ações

O primeiro lote real, com fontes e datas, fica em `src/data/ledger/ledger.json`. Confira com `npm run ledger:verify`. Para propor um evento, `npm run ledger:append -- --event arquivo.json` simula sem gravar; `--apply` é explícito. O Regente opera o livro de produção.

A mesma lógica pode ser importada no navegador por `src/lib/ledger/index.ts`. O build gera os downloads em `/livro/` e falha se a cadeia não conferir. [Como conferir](docs/transparencia/COMO-CONFERIR.md), [contrato para F07](docs/transparencia/CONTRATO.md) e [operação, assinatura e proposta OpenTimestamps](docs/transparencia/OPERACAO.md). Assinatura, ancoragem e espelho externos ainda não estão ativos.

O projeto registra em `package.json` a aprovação de install script apenas para `esbuild@0.28.2`, a versão fixada no lockfile. A política `allowScripts` do npm 11.19 acompanha o repositório; atualização do esbuild exige revisar e aprovar a nova versão. Não usar liberação global de scripts para contornar avisos. [Referência do npm](https://docs.npmjs.com/cli/v11/commands/npm-install-scripts/) (consulta em 22/09/2026).
