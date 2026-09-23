# F22 v3 · Ábaco · DIARIO (rodada 2)

Dono: Ábaco (Claude Opus 5.5) · Branch `variante/r2-v3-abaco` (da `main`) · Worktree `.worktrees/var-3` · Porta 4343

## 22/09/2026 · Marco 1: rodada 1 fechada, rodada 2 aberta

- Rodada 1 commitada e em PR rascunho (#45). Branch nova a partir da `main`, trazendo as peças visuais da rodada 1 (a `main` não tinha mexido em nenhum arquivo meu; só dados, lib e o verificador com Zod Mini).
- Li o feedback do Lucas e o BRIEF da F22. A minha escada: **escada com números**, cada degrau com o dado vivo da etapa.

**Decisão:** cada degrau é uma parte do projeto (não um passo da jornada), porque cada parte tem um número honesto pra mostrar e a pessoa precisa entender o projeto inteiro numa visita. A jornada virou uma escadinha dentro do degrau 2.

## 22/09/2026 · Marco 2: a escada funcionando

- `StairNav` + `StepPanel` + `stairs.ts`: tablist acessível, setas, Home/End, painel no mesmo lugar, endereço sincronizado (`#modulos`, `#m4`, `#gargalo-...`), escadas aninhadas (jornada, módulos, gargalos) com o mesmo código.
- Sem JavaScript todos os painéis aparecem um depois do outro (`html.no-js`), com a classe trocada no `<head>` pra não piscar.
- Livro público: primeira tela com o essencial, depois escada de 6 degraus; tabela paginada de 6 em 6 e o inspetor virou o degrau "Uma ação por dentro".

**Achados no caminho:**
- O perfil do Chromium da bancada abre com zoom de 110%: os prints da rodada 1 saíram com viewport real de 1309×818, não 1440×900. O script de print agora compensa o zoom e mede em CSS de verdade. Os números de telas desta rodada estão certos.
- Uma regra `.stairs` com altura fixa, da 404 da rodada 1, esticava a escada nova. Escopada pra 404.
- O cache do Vite fica velho quando rodo `npm run check` com o servidor de dev no ar (Conferir dá 504 no dev). Reinício do servidor resolve; em produção não acontece.
- A bancada entrou em modo humano no meio do trabalho; esperei voltar pro agente, sem `resume`.

## 22/09/2026 · Marco 3: pronta

- Home: 1 tela de palco em 1440×900 (1,3 com o rodapé); 2,6 a 3,4 telas em 360×780. Livro: 2,2 telas em 1440; 5,8 em 360.
- Ajustes por altura de tela (880 e 790 px) pra caber também dentro do seletor e em notebook.
- `npm run check` passa inteiro, orçamento incluso.

**Decisão proposta (pro Regente):** se o Lucas gostar da escada com números, dá pra deixar os números dos degraus ainda mais vivos buscando `/livro/checkpoint.json` na abertura (hoje eles são do build, que é refeito a cada ação nova).

**Estado:** PR em rascunho `F22 v3 · Ábaco`, servidor na 4343.
