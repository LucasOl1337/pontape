# F41 · Chat com AI no site

**Dono:** `tecla` (Codex GPT-6-Sol, sub-agente do Regente no Maestri) · **Worktree:** `~/Projects/VidaNova/.worktrees/tecla` · **Branch:** `tecla/f41-chat` · **Estado:** em andamento desde 24/09/2026, tarde

## O que o Lucas pediu (24/09, [fonte](../../fontes/2026-09-24-feedback-divulgar-hoje.md))

Segunda vez, à tarde: "ainda não tem um chat inteligente com AI integrada no 9Router, que a gente já tem em outros projetos, e precisamos ter aqui também: um bot treinado, pode usar a Yumi, que já tá na nuvem no Hostinger, pra ter uma persona especialista em tudo sobre o PontaPé".

Um chat ao vivo no canto de cima do site, com a página como está. Um bot de AI com o conhecimento do projeto, que responde dúvida de um jeito simples e fácil. O público principal é a população geral.

## Regras que não mudam

- **Nada é guardado** (D012): sem log de mensagem, sem histórico no servidor, sem cookie. A conversa vive só na aba. O bot diz isso na primeira linha.
- O bot **nunca promete** atendimento, doação ou prazo. O que ainda não existe ele diz que não existe e aponta pro Lucas (`/perguntas#contato`).
- **AI**, nunca "IA" (D034). Frase curta, palavra de gente, sem jargão.
- Chave de AI só em segredo do Worker; `.env.example` documenta.

## O que já está decidido (24/09, tarde)

- **A persona se chama Yumi.** O Lucas fala da Yumi como o bot dele em outros projetos; não existe código da Yumi nesta máquina nem no servidor Hostinger que a gente acessa. Então a Yumi nasce aqui como persona no prompt do sistema: simpática, direta, PT-BR de gente, frase curta, sem jargão. Se o Lucas apontar um repositório ou endereço da Yumi depois, o Regente avisa.
- **Gateway: 9Router no Railway**, OpenAI-compatible: `https://9router-production-056a.up.railway.app/v1/chat/completions`, header `Authorization: Bearer <chave>`. A chave está em `~/.config/environment.d/60-9router-railway.conf` (variável `NINEROUTER_TOKEN`); **nunca** vai pro repo nem pro DIARIO. No Worker ela entra como Secret `NINEROUTER_TOKEN`; o Regente roda o `wrangler secret put`. Local: `.env` com a mesma variável; `.env.example` documenta.
- **Modelo:** `cc/claude-haiku-4-5-20251001` por padrão (rápido e barato), com `cx/gpt-5.4-mini` como reserva se o primeiro falhar. Lista em `GET /v1/models`.
- **Onde roda:** no mesmo Worker do site. Hoje `scripts/deploy/worker.js` só serve os assets estáticos e redireciona http/www (D021). Ganha a rota `POST /api/chat` (e `GET /api/chat/health`). O template do wrangler é `scripts/deploy/wrangler.template.jsonc`; `publicar.sh` copia os dois pro deploy. Sem banco, sem KV de conversa.
- **Limite de abuso:** binding de Rate Limiting do Workers (`ratelimits` no wrangler), por IP, tipo 20 mensagens a cada 10 minutos; acima disso a Yumi responde educada que precisa de um tempo. Mensagem com mais de 600 caracteres é recusada. Conversa com no máximo 12 turnos guardados só na aba (memória do navegador, não `localStorage`).
- **Conhecimento:** um arquivo gerado no build, `src/data/site/yumi-knowledge.ts` (ou JSON), montado por script a partir de `docs/PRD.md` (seções 1 a 6), da coluna "Em palavras simples" de `docs/DECISOES.md`, de `src/data/site/*.ts` (journey, modules, bottlenecks, perguntas, livro) e de `docs/frentes/F42-transparencia-que-recebe/BRIEF.md` (só o "por quê"). Cabe em uns 12 mil tokens. O Worker manda esse texto como sistema em toda chamada; `cache_control` se o 9Router repassar.
- **Regras da Yumi no prompt:** responde só sobre o PontaPé; não promete atendimento, doação nem prazo; o que não existe ainda ela diz que não existe e aponta pra `/perguntas#contato`; nunca pede nome, telefone, CPF nem e-mail, e se a pessoa mandar, diz que não guarda e não usa; termo **AI**, nunca "IA"; sem Bitcoin nem criptomoeda (D038): o carimbo é em "registro público"; sem travessão; no máximo 4 frases por resposta, a não ser que peçam mais.
- **UI:** botão **"Tirar dúvida"** no cabeçalho (`SiteHeader.astro`), ao lado do menu, em todas as páginas. Abre um painel por cima (dialog), no canto de baixo à direita no computador e tela inteira no celular. Primeira linha da Yumi: quem ela é e que nada é guardado. Campo de texto, Enter manda, Esc fecha, foco preso no painel, `aria-live` na resposta. Streaming por SSE, texto aparece enquanto chega. Estilo do site (creme, tinta, azul-anil), fonte sans, sem emoji. O JS do painel carrega só no primeiro clique (import dinâmico), pra não pesar as páginas (orçamento de 60 KB por página, `scripts/check-budget.mjs`).
- **CSP:** `connect-src 'self'` já cobre `/api/chat`. Não abrir exceção nenhuma.
- **Teste local:** `npx wrangler dev` com o worker e `dist/`, ou um script Node que chama o handler. Testes unitários: o prompt não contém "IA" nem "Bitcoin"; mensagem longa recusada; sem chave o endpoint responde 503 sem vazar nada; o conhecimento gerado não contém nome de pessoa nem e-mail.

## Como fazer

- **Gateway: 9Router** (skill `9router`), como nos outros projetos do Lucas; o Worker fala com o 9Router, nunca com o provedor direto. Chave do 9Router em Secret do Worker.
- **Persona: a Yumi**, projeto do Lucas que já roda na nuvem (Hostinger). A ideia dele é treinar a Yumi como especialista no PontaPé. O Regente pede ao Lucas o repositório ou o endereço da Yumi antes de começar; até lá, o conhecimento vai como contexto montado no build.
- Limite por IP e por minuto, sem identificar ninguém além do necessário pra barrar abuso.
- Celular primeiro. Deixe o Regente publicar: ele roda o `wrangler secret put` e o `publicar.sh`. Sua entrega é a PR com tudo pronto e o DIARIO dizendo como testar.

## Memória e report

- A cada marco, `docs/frentes/F41-chat-ai/DIARIO.md`. Depois de compactar, releia BRIEF e DIARIO.
- Report ao Regente por `maestri ask "Claude Code #2" "<resumo + link da PR>"`. Só o Regente fala com o Lucas.
- Nunca commitar, trocar branch, fazer stash ou reset em `~/Projects/VidaNova`. Só no seu worktree.

## Pronto quando

- Responde as nove perguntas de `/perguntas` sem inventar nada além delas e do PRD.
- Testes: não promete, não guarda, não usa "IA", cabe na CSP do site.
- PR pra `main` com o custo estimado por mil conversas no DIARIO.
