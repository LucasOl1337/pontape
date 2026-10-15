# F44 · UX e design conciliado (diário)

Brief: `/home/lol/relatorios/pontape-plano-20261015/BRIEF-F44.md`. Plano: `plano-conciliado.md` (ondas 1 a 3; a 4 fica fora).
Branch `ux/plano-conciliado`, worktree `.worktrees/ux-plano`. Nada vai pra main. Prévia só no Worker `pontape-proposta` (workers.dev).

## Marcos

### 15/10 · início
- `npm ci` ok; `npm run check` verde na base fc2ac5f (sem mudança).
- Limite que pesa: `transparencia/tecnico` está em 59,2 KB de 60 KB no budget. Todo CSS global novo tem que ser mínimo; o resto vai em CSS por página.
- `/health` da API de produção: `signup_open:false`, `ai:true`.

### 15/10 · medida do ANTES (pontape.org e alimenta.pontape.org, só leitura)
- Script: `entrega/medicao/medir-f44.mjs` (derivado de medir.mjs e menu.mjs do design) e `links-f44.py` (derivado de links.py).
- Âncoras sem destino: 19 (`#ajudar` 15, `#como-funciona` 4). Troca de host em link interno: 21.
- Foco na faixa escura: 2,36:1 (azul #294EB2 sobre tinta). Rodapé já usa 9,35:1.
- Alvos < 44 px: menu desktop 36 px (6), "Ver o que já existe" 21 px, summary de fontes 43 px (até 30 por página), links de contato 24 px.
- Distribuidores em 390: primeiro cartão em y=876, documento de 17.836 px, botão de registrar em y=17.033.
- /alimenta/doar: a primeira coisa é o campo de e-mail, com `signup_open:false` na API. O aviso de fechado só vem depois do código.
- Menu do alimenta.pontape.org: todos os links apontam pro próprio subdomínio (o logo cai na Rede Alimenta).
- Prints em `entrega/prints/antes/`.

### 15/10 · marco 1: base da onda 1 e 2 escrita
- Tokens de função em palettes.css (2.1) com testes de contraste (texto 4,5:1, borda e foco 3:1, exemplo sem cor de erro).
- nav.ts: cabeçalho do projeto e do serviço, links absolutos para o projeto via SITE_URL (1.1, 2.3), rodapé em 4 grupos (2.6).
- StatusStrip por contexto (1.4), rodapé com data de build e data de estado separadas (1.6), menu com X e "Fechar" (1.7).
- Componente de estado (2.2): StateNote.astro + scripts/estado.ts + styles/estado.css.
- combina.ts: regra da API (recommend.py candidates) no cliente (3.2), agendamento (3.4), trava de escrita do exemplo (3.5).
- /alimenta: lista primeiro (1.3), número real primeiro e zeros explicados (1.5).

### 15/10 · marco 2: ondas 2 e 3 escritas, testes unitários verdes
- Home: PortasHoje (2.4) com frase concreta, estado numa linha e 4 portas antes da escada; id `comecar` novo, `como-funciona` mantido; a escada passou a h2.
- FAQ, escada e prompt da Yume (yumi.js) alinhados: comida se doa direto pela lista, o registro está em teste (1.6).
- /alimenta/distribuidores: topo curto, filtro de cidade fixo, tipo de comida recolhido, cartão resumido com "Como doar aqui" (3.1).
- /alimenta/doar: fluxo invertido em 4 passos (3.2, 3.3), tela Pronto com mapa, contato e "precisa agendar?" (3.4), /health lido antes do e-mail (1.2), modo ?exemplo=1 com trava de escrita em api() (3.5).
- Testes novos: combina.test.ts, nav.test.ts, estado.test.ts, contraste dos tokens em palettes.test.ts.
