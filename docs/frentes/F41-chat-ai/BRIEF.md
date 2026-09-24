# F41 · Chat com AI no site

**Dono:** fino (EngenheiroFino) · **Branch:** `fino/f41-chat` · **Estado:** na fila, abre quando o Regente despachar

## O que o Lucas pediu (24/09, [fonte](../../fontes/2026-09-24-feedback-divulgar-hoje.md))

Um chat ao vivo no canto de cima do site, com a página como está. Um bot de AI com o conhecimento do projeto, que responde dúvida de um jeito simples e fácil. O público principal é a população geral.

## Regras que não mudam

- **Nada é guardado** (D012): sem log de mensagem, sem histórico no servidor, sem cookie. A conversa vive só na aba. O bot diz isso na primeira linha.
- O bot **nunca promete** atendimento, doação ou prazo. O que ainda não existe ele diz que não existe e aponta pro Lucas (`/perguntas#contato`).
- **AI**, nunca "IA" (D034). Frase curta, palavra de gente, sem jargão.
- Chave de AI só em segredo do Worker; `.env.example` documenta.

## Como fazer

- Um Worker pequeno ao lado do site (a hospedagem já é Workers, D019), rota `/api/chat`, streaming, sem estado.
- Conhecimento: `docs/PRD.md`, `docs/DECISOES.md` (coluna "em palavras simples"), os textos de `src/data/site/*.ts` e `perguntas.ts`. Montar no build, não em runtime.
- Modelo: o Regente confirma a conta com o Lucas antes de publicar (Anthropic direto ou 9Router).
- Limite por IP e por minuto, sem identificar ninguém além do necessário pra barrar abuso.
- Botão "Tirar dúvida" no cabeçalho, ao lado do menu; abre um painel por cima, fecha com Esc. Celular primeiro.

## Pronto quando

- Responde as nove perguntas de `/perguntas` sem inventar nada além delas e do PRD.
- Testes: não promete, não guarda, não usa "IA", cabe na CSP do site.
- PR pra `main` com o custo estimado por mil conversas no DIARIO.
