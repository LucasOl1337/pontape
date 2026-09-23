# F07 · Diário

Dono: `design` · Branches: `design/f07-prep` (etapa 0), `design/f07-site` (etapa 1)

Se o contexto compactar: releia o `BRIEF.md`, depois este diário de cima pra baixo.

## Marco 1 · 22/09/2026 · etapa 0 pronta

Feito, só em `design/` e `docs/design/`:

- **D011:** selo público "Precisa de ajuda"; seção continua "Gargalos".
- **D012:** saíram os "Quero ser avisado" e o "Dar uma ideia" clicável. No lugar, selo "Ainda não abriu" com o motivo. Nota no bloco Como ajudar: a gente não guarda contato de ninguém por enquanto.
- **Livro público (D010) no contrato da F08:** página nova `transparencia.html` e bloco 05 da home redesenhado. Quatro tipos, frase de cada linha tirada de um mapa fixo de ação pra PT-BR (nenhum texto nem link livre), link só via a mesma regra do `projectSourceUrl`, candidato só em contagem, comprovante "pendente" ou "não publicado", somas com BigInt, correção e estorno ligados nas duas pontas.
- **Conferir de verdade:** o navegador refaz SHA-256 sobre o JCS do envelope `{schemaVersion, sequence, previousHash, recordedAt, payload}` e compara. Conferido na bancada: 21 ações reais, "Tudo certo"; no exemplo, "Mudar uma linha escondido" e o Conferir aponta "A corrente quebrou na ação nº 14".
- **Livro do protótipo:** 21 fatos reais (D001 a D012, repositório criado, PRs #2, #3, #4, #5, #23, #24, #25, #26 com commit de merge). Gerado por `design/prototipo/ledger/build-ledger.mjs`, que valida cada evento com `ledgerSchema` de `src/lib/ledger/schema.ts`.
- **"Ao vivo" honesto:** nada pisca. Mostra a hora da última ação registrada e diz que a página é refeita quando entra uma nova.
- **Contribuições abertas:** bloco 07 na home com as 17 issues reais (#6 a #22) de `docs/contribuicoes/contribuicoes.json`, filtros por tipo e bom primeiro passo; faixa no bloco Código aberto.
- **"pessoa #014"** saiu de tudo.
- Protótipo quebrado em peças compartilhadas (`styles.css`, `common.js`, `ledger.js`) porque agora são duas páginas.
- `DIRECAO.md` 0.2 (tipo de ação com contraste medido, corrente, Conferir, faixa da regra, "ao vivo" honesto) e `MAPA-DO-SITE.md` 0.2 (home com 9 blocos e a página do livro).

Decisões propostas:

| # | Proposta | Por quê |
|---|---|---|
| P9 | Contadores de Vida real e Candidato somam `quantity` e `count`, não linhas | "3 entrevistas" diz mais que "1 linha" e segue o contrato (contagem agregada) |
| P10 | Hero do livro mostra "Marca mais recente" | Quem guardar essa marca consegue conferir depois que nada foi reescrito (checkpoint do contrato) |
| P11 | Modo exemplo com "Mudar uma linha escondido" | Mostra em 5 segundos por que a corrente importa, sem jargão |

Dúvidas:

1. Frase de decisão hoje é só "Decisão D006 registrada", porque o contrato não tem descrição. Posso mostrar o título da decisão tirado do `DECISOES.md` no build (conteúdo do site, não do livro), ou fica só o ID com o link?
2. O BRIEF fala em "seção na página de código aberto". Hoje só existe o bloco 09 na home, e pus lá uma faixa com o número de contribuições. Precisa de página própria de código aberto?

Etapa 0 entregue na PR #28, integrada. Respostas do Regente: D013 (título da decisão pode aparecer, fora da marca) e D014 (livro real e verificador do site vêm só da F08).

## Marco 2 · 22/09/2026 · etapa 1: site em código

Branch `design/f07-site`, a partir da `main` com a base da F02, o contrato da F08 e a etapa 0.

Feito:

- **Home e `/transparencia` em Astro**, um componente por bloco em `src/components/blocks/` (10 da home, 6 do livro), peças comuns em `src/components/site/` e `src/components/ledger/`. Visual igual ao protótipo aprovado; estilos portados pra `src/styles/` (tokens em `tokens.css`).
- **Dados fora do componente:** `src/data/site/` tem nome e data do estado (`project.ts`, um lugar só), estados, módulos, jornada, gargalos, contribuições (lidas e validadas de `docs/contribuicoes/contribuicoes.json` no build) e títulos das decisões (lidos do `DECISOES.md` no build, D013).
- **Livro (D014):** `src/lib/ledger-view/` usa os tipos de `src/lib/ledger/schema.ts`. O livro real sai de `getPublicLedger()` em `source.ts`, que hoje devolve "pendente" e vazio: a página mostra "O livro oficial ainda não foi publicado" e chama pro exemplo. O exemplo é a fixture da F08, e nada além dela. O verificador provisório fica sozinho em `verifier.ts`, atrás do tipo `LedgerVerifier`. Na troca, só esses dois arquivos mudam.
- **D013:** decisão mostra o título do `DECISOES.md` embaixo da frase, com estilo de citação, e uma nota fixa: "O Conferir prova a linha, não o título."
- **"Ver a fonte"** agora diz "Repositório ainda fechado" em texto, sem cadeado.
- **HTML pronto no build.** JS só pra alternar e conferir, com scripts do Astro e sem React: home 1,6 KB, livro 1,1 KB, comum 1,2 KB, Conferir 1,8 KB (comprimidos). O zod não vai pro navegador.
- **Fontes no próprio site:** três woff2 variáveis com subset latino (87 KB) e as licenças OFL em `public/fonts/`.
- **CSP mais fechada** em `public/_headers`: sem Google, sem hash de script inline. Testei servindo `dist/` com essa CSP: JS, fontes e Conferir funcionam.
- **Orçamento medido:** `npm run budget` (`scripts/check-budget.mjs`) segue os imports de cada página e reprova acima de 60 KB. Hoje a home tem 29,1 KB, o livro 21,5 KB e as fontes 87,1 KB de 120 KB. Entrou no `npm run check`.
- **Testes:** frase pra toda ação do contrato, somas BigInt, contagens, verificador (linha mudada, apagada e corrente trocada), livro real pendente, exemplo igual à fixture, dados do site e títulos das decisões. Total do repositório: 67.

Decisões propostas:

| # | Proposta | Por quê |
|---|---|---|
| P12 | Nada de React nestas duas páginas; ilhas com `<script>` do Astro | Só o runtime do React passaria da metade do orçamento de 60 KB |
| P13 | Tirar o Google da CSP e o hash de script inline | Fontes agora são locais e não sobrou script inline |
| P14 | Rodar `npm run budget` no CI | Hoje só roda no `check`; o workflow é da F02 |

Dúvidas:

1. O exemplo agora é só a fixture da F08 (4 ações). "Simular uma ação chegando" saiu, e "Mudar uma linha escondido" continua. A F08 pode aumentar a fixture fictícia (gastos por categoria, estorno, entregas) pra o exemplo mostrar o dinheiro de verdade?
2. Posso pôr `npm run budget` no CI, ou fica pra F02?

PR: https://github.com/LucasOl1337/VidaNova/pull/32, com CI verde. A main trouxe a CSP gerada no build (F14b) no meio do caminho. Fiz merge: o gerador acrescenta os hashes dos blocos JSON do livro (não executam) e a CSP modelo continua sem Google. Aviso pro Regente: o `docs/operacao/LANCAMENTO.md` ainda diz que o Google Fonts segue permitido, e não segue mais.

Onde parei: PR da etapa 1 aberta. Próximo: quando o núcleo da F08 entrar, trocar `getPublicLedger()` e o verificador pelos dela, e tirar os prints com o livro real (onde aparecem os títulos D013).

## F16 · Polimento pro lançamento · 22/09/2026

Branch `design/f16-polimento`, a partir da `main` com a #32.

Feito:

- **Ícone:** `favicon.svg`, `favicon.ico` (16, 32, 48) e `apple-touch-icon.png` (180), gerados no build (`src/pages/*.ts`) a partir de `src/lib/share/logo.ts`. A marca do topo (`LogoMark.astro`) passou a ler o mesmo arquivo.
- **Prévia de compartilhamento:** `og.png` (home) e `og-transparencia.png` (livro), 1200×630, desenhadas em SVG e rasterizadas com `@resvg/resvg-js` (dependência de desenvolvimento, sem serviço externo). O gerador usa cópias TTF das fontes do site em `src/assets/og/`, que não vão pro site. O texto é medido pelo próprio renderizador, o nome encolhe se for longo e o título cabe em até quatro linhas. O texto do card mora em `src/data/site/share.ts`.
- **Meta tags** em toda página: `og:*`, `twitter:card`, `description`, `theme-color`, ícones e `canonical` quando houver domínio. O `astro.config.mjs` lê `SITE_URL` no build; sem ela, as URLs ficam relativas.
- **404** com o layout, a faixa "Em construção", o texto do ExecutorBruto, três caminhos de volta e a escada com o degrau que falta. Ganhou `noindex`.
- **Simulação do WhatsApp** em `design/compartilhamento/` (`gerar.mjs` lê o `dist/` e monta a conversa). Prints em `design/site-v1/prints/`.
- Testes: tamanho da imagem, nome longo encolhendo, título dentro da coluna, ICO bem formado. `npm run check` verde; orçamento com home em 29,5 KB e livro em 21,9 KB.

Dúvida: no dia do lançamento, alguém precisa definir `SITE_URL` no build do Pages, senão WhatsApp e X não acham a imagem (eles exigem URL absoluta). Vale entrar no `docs/operacao/LANCAMENTO.md`.

Onde parei: abrindo a PR da F16. Depois, quando a #30 entrar, PR pequena trocando `source.ts` e `verifier.ts` pelo núcleo da F08.
