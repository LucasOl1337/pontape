# F43 · Contador público, painel do admin e histórico da Yumi

**Dono:** `tecla` (Codex GPT-6-Sol) · **Worktree:** `~/Projects/VidaNova/.worktrees/tecla` · **Branch:** `tecla/f43-metricas` · **Revisão, secrets e publicação:** Regente

## O que o Lucas pediu (D042, [fonte](../../fontes/2026-09-24-feedback-metricas-admin-historico.md))

1. Um **contador público na home**: quantas pessoas já entraram, cliques únicos e o que mais fizer sentido em público.
2. Um **painel do admin** em `pontape.org/admin`, com e-mail e senha, só pra ele, com todas as estatísticas.
3. **Histórico das conversas da Yumi**, pra ele ler e melhorar o site. Sai o "a conversa não é guardada".

## O que já existe

- Worker do site com `/api/chat` (F41) e Rate Limiting binding; `scripts/deploy/worker.js`, `yumi.js`, `wrangler.template.jsonc`, `publicar.sh`.
- Cloudflare Web Analytics (beacon) já conta visitas na conta do Lucas, mas só no painel da Cloudflare. Pode continuar; o contador público não depende dele.
- **Banco D1 `pontape` criado pelo Regente** na conta do site: `database_id` `4a0e6b60-9273-4c40-a3f6-31a10f5f5da5`, binding `DB` (você acrescenta no `wrangler.template.jsonc`). Migrações em `scripts/deploy/migrations/*.sql`, aplicadas pelo Regente com `wrangler d1 migrations apply pontape --remote` antes do deploy.
- Secrets no Worker, postos pelo Regente: `ADMIN_USER` (nome de usuário, não e-mail; decisão do Lucas em 24/09), `ADMIN_PASSWORD` (compara em tempo constante), `SESSION_SECRET` (HMAC do cookie de sessão). O formulário pede **usuário** e senha. Local: `.env` e `.dev.vars` pelo `dev-chat.sh`.

## Regras

- **Nunca guardar IP, user agent bruto, nome, telefone, CPF ou e-mail.** Pessoa única por dia = SHA-256 de (IP + user agent + dia + `SESSION_SECRET`), truncado; o IP não vai pro banco.
- Mensagem que o filtro de dado pessoal barra **não é guardada** e não vai pro modelo (já é assim). O que passa pelo filtro é guardado: texto, papel, hora, id da conversa (aleatório, só na aba), modelo usado. Retenção: 180 dias, apagamento por job diário.
- A primeira linha da Yumi vira: "Sou a Yumi, AI do PontaPé. Esta conversa fica guardada pra melhorar o site, sem nome nem contato. Não mande dado pessoal." Ajustar `yumi.js` e o dialog.
- Termo **AI**, nunca "IA"; sem Bitcoin; texto público em PT-BR, frase curta, sem travessão.
- Nada de biblioteca pesada no cliente; orçamento de 60 KB por página (`scripts/check-budget.mjs`). O painel do admin é uma página à parte e pode passar do orçamento do site público, mas fica fora da lista do budget só se o Regente aprovar.
- CSP continua `default-src 'self'`; sem CDN.

## Entregáveis

### 1. Coleta (Worker + D1)

- `POST /api/hit` recebe `{ kind, path, target? }` com `sendBeacon`: `kind` em lista fechada (`view`, `step`, `seal`, `yumi_open`, `share`, `link`). Sem corpo livre. Rate limit por IP como o chat.
- Tabelas: `hits(day, kind, path, target, count)` agregada por dia; `uniques(day, hash)` pra pessoas por dia; `chats(id, started_at, model)` e `messages(chat_id, role, content, at)`.
- `view` é registrado pelo próprio Worker ao servir HTML (não pelo cliente), assim conta quem não tem JS. Bots conhecidos (user agent com bot, crawler, spider, curl, wget, headless) ficam de fora.
- `/api/chat` grava a conversa depois de responder (não no caminho crítico); erro de gravação não quebra a resposta.

### 2. Contador público

- `GET /api/stats/public` devolve, com cache de 60 s: visitas desde 24/09/2026, pessoas hoje, pessoas nos últimos 7 dias, conferências do selo, conversas com a Yumi, passos da escada abertos. Só números agregados.
- Na home, uma linha discreta e sem rolagem, no rodapé da escada (abaixo da linha da AI) ou no topo do rodapé do site: "Desde 24/09: 1.234 visitas · 87 pessoas hoje · 56 conversas com a Yumi". Proponha o lugar em 10 linhas antes de codar; o Regente escolhe. Sem JS o texto vem do build (última contagem conhecida) e o JS atualiza.
- A página de transparência ganha a mesma linha embaixo dos números do livro.

### 3. Painel do admin

- `pontape.org/admin`: página estática mínima (`src/pages/admin.astro`, `noindex`, fora do sitemap) com formulário de usuário e senha → `POST /api/admin/login` → cookie `HttpOnly; Secure; SameSite=Strict`, 12 h, assinado com `SESSION_SECRET`. 5 tentativas por 15 min por IP. Logout.
- Com sessão: `GET /api/admin/stats` (por dia, 30 dias: visitas, pessoas, cliques por tipo, páginas mais vistas) e `GET /api/admin/chats?page=` (lista com data, modelo, primeira pergunta) e `GET /api/admin/chats/:id` (transcrição). O painel desenha isso: tabela e gráfico simples em SVG inline, sem biblioteca. Estilo do site.
- Sem sessão, tudo em `/api/admin/*` responde 401 sem detalhe. `/admin` sem sessão mostra só o formulário.

### 4. Testes e documentação

- Testes: `hit` recusa kind fora da lista; `uniques` não guarda IP; mensagem barrada não vai pro banco; login errado não vaza se o e-mail existe; cookie inválido dá 401; `stats/public` só tem números.
- `docs/operacao/METRICAS.md`: o que é guardado, por quanto tempo, como apagar, como trocar a senha.
- DIARIO com como testar em `wrangler dev` (D1 local) e custo estimado.

## Memória e report

- A cada marco, `docs/frentes/F43-metricas-admin/DIARIO.md`. Report ao Regente por `maestri ask "Claude Code #2" "<resumo + link da PR>"`. Só o Regente fala com o Lucas.
- Nunca commitar, trocar branch, fazer stash ou reset em `~/Projects/VidaNova`.

## Pronto quando

Contador público na home e na transparência, `/admin` com login funcionando, conversas da Yumi visíveis no painel, testes verdes, `npm run check` verde, PR pra `main`.
