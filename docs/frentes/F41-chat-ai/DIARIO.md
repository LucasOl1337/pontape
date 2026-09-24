# F41 · DIARIO da Yumi

## 24/09/2026 · implementação no worktree tecla

- Li AGENTS, QUADRO, BRIEF, os arquivos do deploy, o cabeçalho e o orçamento na ordem pedida. `npm install` e `npm run check` passaram antes da primeira edição: 161 testes.
- Enviei ao Regente pelo Maestri o plano em dez linhas antes de codar.
- O build gera `scripts/deploy/yumi-knowledge.js` a partir de PRD §§1–6, coluna simples das decisões, nove respostas de `/perguntas`, dados do site e motivo da F42. O gerador retira nome pessoal, e-mail e termos vetados. O prompt marca o projeto como em construção e a confirmação humana da seleção como proposta, não fato decidido.
- O Worker ganhou `POST /api/chat` com SSE pelo 9Router, Haiku 4.5 como primeira tentativa e GPT 5.4 mini como reserva; `GET /api/chat/health`; validação de até 12 falas e 600 caracteres; 503 sem Secret; respostas sem cache. Mensagem que parece conter e-mail, CPF, telefone ou apresentação de nome recebe aviso local e não vai ao gateway. Não há banco, KV, cookie, `localStorage` nem log de mensagem no código.
- O cabeçalho ganhou “Tirar dúvida” em todas as páginas. Dialog com saudação de privacidade, foco preso, Enter para enviar, Esc para fechar e foco de volta ao botão. No celular usa a tela toda. O código de conversa carrega no primeiro clique.
- Acrescentei binding `CHAT_RATE_LIMITER`, `.env.example` e `scripts/deploy/dev-chat.sh`. O deploy copia o prompt e o conhecimento junto do Worker. O Secret da produção continua a cargo do Regente.

## Como testar

1. Crie `.env` local com `NINEROUTER_TOKEN=...` e rode `scripts/deploy/dev-chat.sh` (porta padrão 8794; passe outra como primeiro argumento se precisar). O script monta a mesma pasta do deploy numa pasta temporária, deixa a chave só em `.dev.vars` temporário e a apaga ao encerrar.
2. Abra `http://localhost:8794/`, clique em “Tirar dúvida” e pergunte “Posso doar?”. `GET http://localhost:8794/api/chat/health` informa `configured: true`. `POST /api/chat` aceita `{ "messages": [{ "role": "user", "content": "Posso doar?" }] }` e devolve `text/event-stream`.
3. Rode `npm run check`. Em 24/09 passou com 166 testes, CSP gerada e verificada e orçamento. A página mais pesada ficou em 55,6 KB com o chat carregado, de 60 KB.

## Ensaios

- `wrangler dev` serviu assets e `/api/chat`; respostas reais vieram em SSE pelo 9Router. As nove perguntas de `/perguntas` responderam sem inventar atendimento, doação ou seleção pronta. No segundo passe, nenhuma trouxe emoji, Markdown ou termos vetados. A pergunta sobre escolha deixou explícito que a confirmação humana ainda é proposta.
- Na bancada isolada `pontape-yumi-ui`, conferi tela de 320 px e desktop: painel abre e recebe foco, não cria rolagem horizontal, Enter envia, texto chega durante o streaming, Esc fecha e devolve o foco. A bancada foi encerrada depois do ensaio.
- Testes automatizados cobrem segredo ausente, mensagem longa, limite de chamadas, dado pessoal sem envio ao gateway, fallback de modelo, SSE e conhecimento sem nome ou e-mail.

## Custo estimado

O contexto gerado tem cerca de 20 mil caracteres, aproximadamente 5 mil tokens. Para uma conversa de três perguntas com cerca de 150 tokens de resposta por pergunta, estimo **US$ 18 a US$ 20 por mil conversas**, sem cache de prompt e sem contar custo da infraestrutura. Usei US$ 1 por milhão de tokens de entrada e US$ 5 por milhão de saída do Haiku 4.5 como preço de referência, não uma cobrança confirmada do 9Router: [tabela da Anthropic](https://www.anthropic.com/news/claude-haiku-4-5), acesso em 24/09/2026. O custo real depende da duração da conversa, do gateway e de quantas chamadas caírem no modelo reserva.

## Decisões propostas e próximo passo

- O Rate Limiting binding do Cloudflare aceita períodos de 10 ou 60 segundos, não 10 minutos ([documentação oficial](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/), acesso em 24/09/2026). Configurei **20 mensagens por IP por minuto**; é o limite que o binding suporta mais perto do pedido sem restringir uma conversa a duas mensagens por minuto. Se 20 por dez minutos for obrigatório, precisa de outro mecanismo de contagem. O IP vira hash antes de entrar no contador.
- A revisão, o Secret `NINEROUTER_TOKEN` e a publicação foram concluídos pelo Regente. Não fiz deploy nem criei Secret na nuvem.

## Entrega

- [PR #105](https://github.com/LucasOl1337/pontape/pull/105) aberta para `main`, branch atualizada sobre a `main`. O CI “Lint, tipos, testes e build” passou. Link e pendências enviados ao Regente pelo Maestri.

## 24/09/2026 · no ar

- O Regente informou que revisou, integrou e publicou a [PR #105](https://github.com/LucasOl1337/pontape/pull/105). A Yumi está no ar em `pontape.org`, com `NINEROUTER_TOKEN` como Secret do Worker. Ele conferiu `GET /api/chat/health` com `configured: true` e uma resposta real. Essa verificação de produção foi feita por ele.
- A [PR #106](https://github.com/LucasOl1337/pontape/pull/106) tirou `scripts/deploy/yumi-knowledge.js` do Git e o pôs no `.gitignore`, porque o arquivo é gerado a cada check.
- O CI da atualização do DIARIO revelou que `npm run typecheck` isolado tentava importar o arquivo antes de gerá-lo. Acrescentei `pretypecheck` e `pretest` para gerar o contexto também nesses comandos isolados. O `npm run check` completo já fazia essa geração.
- Estado: em espera. Próximo passo: só um ajuste pedido pelo Regente.
