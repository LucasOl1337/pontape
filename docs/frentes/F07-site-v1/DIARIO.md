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

Onde parei: abrindo a PR da etapa 0. Próximo: etapa 1 na `design/f07-site`.
