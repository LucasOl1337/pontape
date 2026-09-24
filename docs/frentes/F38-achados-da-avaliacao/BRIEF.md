# F38 · Consertar os achados da avaliação de 24/09

Dono: subagente do Regente (Claude Opus 5.5, esforço alto) · Branch: `regente/f38-achados` a partir da `main` · Worktree: `.worktrees/f38` · Começo: 24/09/2026

## O que o Lucas pediu

O Regente avaliou o pontape.org inteiro (desktop 1440x900 e celular) e deu nota por tópico de UI/UX e de FDE (pronto pra ir a campo). O Lucas pediu: "pra todos os findings, a gente precisa melhorar eles", e os dois, celular (iPhone 15, 393x852) e computador, "têm que ficar bons". No fim ele mesmo avalia se ficou melhor.

## Onde ver

Servidor `astro dev` do teu worktree já no ar em http://127.0.0.1:4338 (não derrube; se precisar reiniciar, suba na mesma porta). Dois portais no canvas Maestri olham pra ele: "PontaPé" (1440x900) e "iPhone 15" (393x852, UA iOS). Pra conferir você mesmo, use `"$MAESTRI_CLI" portal screenshot "iPhone 15"` e leia o PNG; `resize` pra testar 320 px e volte pra 393x852 no fim. Não feche portal.

## Lotes

O Regente confere cada lote nos portais antes de liberar o próximo.

**Lote 1 · layout e celular**
1. #54: página 404 transborda em 320 px.
2. #56: livro público (`/transparencia/tecnico`) transborda em 320 px.
3. #87: layout quebra em Chrome < 111 (Android de entrada). Ache o recurso de CSS culpado (ex.: `:has`, nesting, `lh`, container query, `dvh`...) e dê fallback que não mude nada no Chrome novo.
4. Abas "Como conferir / Dinheiro / O que entra" da parte técnica quebram em 2 linhas no celular: devem caber numa linha (ou rolar na horizontal com dica clara).
5. Com o menu do celular aberto, o "M" do botão Menu ficou vermelho: parece o ponto vermelho da escada ou outro elemento vazando por cima. Achar e corrigir camada/z-index.
6. Degraus da escada no celular têm 40 px de largura: área de toque de pelo menos 44 px (pode crescer só a área clicável, sem mudar o desenho).

**Lote 2 · UX e texto**
1. Modal "Mais detalhes" usa jargão interno: "PEÇA M7", botões "M6" e "M8" num degrau chamado 5. Trocar por palavra de gente (nome da peça/degrau vizinho). O código M# pode ficar discreto, não como título.
2. Na escada, o degrau com "Precisa de ajuda" ganha bolinha vermelha e o degrau visitado fica com hachurado cinza que não se explica. Fazer o estado se explicar (legenda curta, ou tirar o que não informa nada).
3. "Quero ajudar" / "Sua vez": 3 dos 4 jeitos dizem "Ainda não abriu" e quem não é dev fica sem ação. Dar uma ação real hoje pra qualquer pessoa sem coletar dado e sem criar conta em serviço: ex. botão "Mandar pra alguém" (Web Share API com fallback de copiar link), e deixar claro o que dá pra fazer agora.
4. Botão "Conferir" em azul claro destoa do resto dos botões; alinhar ao sistema de botões (contraste AA).
5. Na home, ao rolar, o painel de texto some e a escada fica sem legenda; e a home acaba seco no rodapé. Ajuste mínimo, sem redesenhar a escada.

**Lote 3 · FDE**
1. Sitemap: `sitemap.xml` (ou `sitemap-index.xml`) e linha `Sitemap:` no `robots.txt`.
2. Imagem de compartilhar (`og.png`) usa outro logo, outra fonte e barras no lugar da escada; o alt fala em "cinco degraus". Deixar na identidade do site (Newsreader, logo da escada, Anil) e o alt certo. Ache onde ela é gerada (`src/data/site/share.ts` e script).
3. #55: o beacon do Cloudflare Web Analytics é injetado e bloqueado pela CSP. Liberar só o necessário (`static.cloudflareinsights.com` no script-src e `cloudflareinsights.com` no connect-src) pelo gerador `scripts/csp-headers.mjs`, e dizer no rodapé de privacidade, em frase curta, que o site conta visitas sem cookie e sem dado pessoal. Isso dá observabilidade mínima.
4. #57: documentar o rollback do Worker publicado e do timer (`scripts/deploy/`), em `docs/arquitetura/` ou onde a doc de deploy já mora.

## Fora do escopo

- Geometria e layout da escada (F36, aprovada pelo Lucas em D031). Não mexer em tamanho, posição de degrau, números ou ícones além do que o lote pede.
- Canal oficial de contato, conta em serviço, deploy, merge: reservado ao Regente com OK do Lucas.
- Voz, captação, qualquer peça M3 em diante.

## Regras

- Leia `AGENTS.md` e `docs/PRD.md` antes. Texto público: frase curta, lida em voz alta, sem travessão, sem jargão. Código em inglês, texto e docs em PT-BR.
- Commit pequeno por item, mensagem em PT-BR dizendo o quê e por quê, com `Fixes #N` quando fechar issue.
- No fim de cada lote: `npm run check` passando, e anotação no `DIARIO.md` desta pasta (o que fez, prints conferidos, onde parou).
- Não faça push nem abra PR: o Regente faz.
