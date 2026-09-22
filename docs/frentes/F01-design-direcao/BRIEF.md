# F01 · Direção visual e mapa do site

Dono: `design` (Design/UI) · Worktree: `.worktrees/design` · Branch: `design/f01-direcao` · Base: `main`

## Por que agora

O site é a primeira coisa que o mundo vai ver, e o Lucas quer ele no ar. Antes de escrever código de verdade, a gente precisa da cara do projeto e do mapa dos blocos, pra F07 (site em código) só executar.

## O pedido do Lucas

Interativo, bonito, por blocos. Design modular, cada parte do projeto bem separada. Hero que explica o que é e a intenção; depois quebra em módulos: o que é cada coisa, como funciona, como opera, pontos fortes, gargalos a resolver. Transparência total em primeiro lugar. Simples e fácil de entender. Fontes: [PRD §5 a §7](../../PRD.md) e [spec 01, itens 23 a 25](../../fontes/2026-09-22-spec-01.md).

## Entregáveis

1. `docs/design/DIRECAO.md`: conceito, tom visual, paleta como tokens, tipografia, grid, movimento e interação, acessibilidade (WCAG AA, alvo de toque, contraste), regras de imagem (dignidade: nada de foto de candidato; como ilustrar sem expor ninguém).
2. `docs/design/MAPA-DO-SITE.md`: os blocos da home em ordem, cada um com objetivo, conteúdo, interação e chamada. Inclui o estado vazio do painel de transparência (zero honesto antes da primeira doação) e o selo de estado de cada módulo (funcionando, em construção, gargalo aberto).
3. `design/prototipo/index.html`: protótipo estático da home num arquivo só, sem build, mobile-first, com texto real em PT-BR. É pro Lucas bater o olho e aprovar a direção.
4. `docs/frentes/F01-design-direcao/DIARIO.md` atualizado a cada marco.

## Limites

- Stack e código de produção são da F02 e F07. O protótipo é descartável.
- Nome definitivo ainda não existe: use "VidaNova" num ponto só do protótipo, fácil de trocar.
- Números do painel no protótipo: fictícios e marcados como exemplo, ou o estado vazio.
- Pra ver o protótipo no navegador, use sua bancada agent-bench.

## Pronto quando

- Alguém que nunca ouviu falar do projeto entende o que é e pra que serve só pelo hero.
- Todo módulo M1 a M9 do PRD aparece como bloco, com estado.
- O protótipo funciona bem em 360px de largura e em desktop.
- PR aberta pra `main` com print mobile e desktop, e report ao Regente.
