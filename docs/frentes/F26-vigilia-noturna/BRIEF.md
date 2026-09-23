# F26 · Vigília noturna de polimento

Gestor: `bruto` (ExecutorBruto · GPT-6-Sol), em `/vigilia` · Executores: **Vagalume, Candeia, Lampião** (Codex GPT-6-Luna) e **Coruja** (Devin) · Começo: noite de 23/09/2026

## A ordem do Lucas

> Passe a noite fazendo polimentos no site usando o Devin e modelos baratos como GPT-6-Luna. Sem modelos caros. O GPT-6-Sol é o gestor em loop com /vigilia. Não vamos mais gastar tokens Opus ou Astra: apenas o Sol com vários Luna 6 e Devins.

Isso quer dizer, sem exceção: **Regente (Opus), Design/UI (Opus) e EngenheiroFino (Astra) não recebem mensagem nenhuma esta noite.** Ninguém faz `maestri ask "Regente"`. Quem fala com os executores é o gestor; quem reporta é pro gestor.

## O alvo

O site no ar em **https://pontape.org** (variante Crônica, D018). Polir o que já existe, sem mudar a direção: o que o Lucas escolheu é a escada grande, a home curta e o caderno por cima.

**Polimento é:** bug visual, texto que um brasileiro não escreveria, erro de digitação, acessibilidade (teclado, 320px, zoom, contraste, leitor de tela, `prefers-reduced-motion`), responsividade, peso e velocidade (as fontes estão em 117 KB de 120), prévia de compartilhamento, 404, consistência entre home e livro, e as falhas que o ensaio da F24 e as issues abertas apontarem.

**Não é polimento, então fica fora:** funcionalidade nova, mudança de direção visual, contrato ou dados do livro (`src/lib/ledger/**`, `src/data/ledger/**`, `scripts/ledger/**`), assinatura e âncora (F25, pausada), `scripts/deploy/**`, `.github/**`, DNS, Cloudflare, configurações do repositório, `docs/DECISOES.md`, `docs/PRD.md`, qualquer contato com terceiros e qualquer dado pessoal.

## Como a noite roda

1. **Backlog:** o gestor monta a fila em `docs/frentes/F26-vigilia-noturna/OPERACAO.md` a partir do ensaio F24, das issues abertas e da própria observação do site no ar pela bancada. Um item por causa, com o caso concreto (página, tamanho de tela, passo) e o critério de pronto.
2. **Despacho:** um item por executor, cada um no próprio worktree (`.worktrees/noite-1` a `noite-4`, branches `noite/<nome>`; pra item novo, branch nova a partir da `main` atualizada). O executor reproduz, corrige, roda `npm run check`, confere na **sua bancada agent-bench** em 360px e 1440px, abre PR com antes/depois e reporta ao gestor.
3. **Revisão e merge pelo gestor:** lê o diff inteiro, confere no navegador da bancada e faz `gh pr merge --merge` só quando: uma causa por PR, CI verde, `npm run check` passando, nenhum arquivo fora do escopo, e o antes/depois prova a melhora. Na dúvida, a PR fica aberta com o motivo no OPERACAO.
4. **Publicação:** automática. O timer desta máquina publica a `main` em pontape.org em até 3 minutos, e só se o check passar (D021). Depois de cada merge, o gestor confere no site real que a mudança entrou e nada quebrou. Se quebrou, reverte a PR (`gh pr revert` ou PR de revert) e registra.
5. **Livro:** cada PR integrada entra sozinha no livro público (F17). Nada a fazer à mão.
6. **Checkpoint:** o gestor anota cada evento no OPERACAO (hora, item, dono, PR, resultado). É a memória da noite: se compactar, retome por ele.

## Parada

A noite termina às **08:00 (horário de Brasília) de 23/09/2026**, ou antes se o backlog de polimento real acabar. Não invente trabalho pra ocupar a noite. Ao parar: nenhuma PR pela metade sem registro, executores parados, e um **resumo pro Lucas** em `docs/frentes/F26-vigilia-noturna/RESUMO.md`: o que mudou no site (com link das PRs), o que ficou aberto e por quê, e o que precisa de decisão dele.

## Regras que não caem

- Só GPT-6-Sol (gestor), GPT-6-Luna e Devin. Nenhum outro modelo.
- Navegador só nas bancadas agent-bench (workspaces 6 a 11), nunca no do Lucas.
- Nada de dado pessoal, nada de travessão no texto, PT-BR simples.
- Mudança que vai pro ar é revisada antes. Merge sem revisão não existe, mesmo de madrugada.
