# Diário · F22 v2 · Crônica (rodada 2)

## 22/09/2026

**Ponto de partida**
- Feedback do Lucas (`docs/fontes/2026-09-22-feedback-f19-r1.md`): scroll longo demais; a escadinha da Crônica acertou o jeito de explicar; espaço da tela mal usado (nos prints dele, em 1920 de largura, texto pequeno num canto, escada pequena no outro).
- Rodada 1 fechada como estava na PR #47. Branch nova `variante/r2-v2-cronica` a partir da main, com a identidade da rodada 1 trazida por cima (fontes, tokens, cabeçalho, rodapé).

**Feito**
- Home reescrita como uma tela: `Escada.astro` (palco com 9 degraus = chão, 7 passos, topo), `Edicao.astro` (faixa "Nesta edição") e `Sheet.astro` (caderno que abre por cima). Peças, gargalos, classificados e expediente viraram cadernos.
- Tamanhos em unidade de contêiner (`cqh`): título e texto do degrau crescem com a altura do palco, não com a largura. É isso que resolve o "pequeno num canto" em telas grandes.
- O painel do degrau fica preso entre o título e o degrau 3, o único canto que os degraus baixos deixam livre. Medi a sobra de cada degrau em 1440×900, 1366×768 e 1280×720 e enxuguei até nenhum rolar por dentro em 1440×900.
- Livro: topo numa tela com lista paginada; abas pra como conferir, dinheiro e o que entra. O verificador agora avisa a página (`verified`) pra paginação pular até a ação quebrada. Aproveitei e corrigi "As 1 ações antes dela" no texto do verificador.
- Tirei o motor de scroll da rodada 1 (`story.ts`): com a home de uma tela ele não tinha mais função. O "traço que se desenha" ficou no degrau que muda de pontilhado pra linha cheia e no ponto que pula.

**Achados**
- Na bancada, captura por CDP de janela que está atrás de outra sai com quadro velho. O script de print agora traz a janela pra frente antes. Um bug de verdade apareceu assim mesmo: um trecho sem quebra de linha no convite por voz esticava o palco pra 488 px no celular. Corrigido, e o palco ganhou `min-width: 0`.
- A main voltou a trazer Archivo e Atkinson Mono em `public/fonts`; a Crônica não usa, então saíram de novo (senão as fontes passam de 120 KB).

**Decisões propostas**
- Nenhuma que mude a direção. Se a escada for escolhida, vale decidir se a home mantém o Conferir só no livro (como está) ou se o degrau 7 ganha um Conferir direto.

**Onde parou**
- Pronto: `npm run check` passando, servidor na 4342, prints e README no lugar, PR em rascunho `F22 v2 · Crônica`.
