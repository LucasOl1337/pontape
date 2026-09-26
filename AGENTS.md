# PontaPé · guia dos agentes

O projeto se chama **PontaPé** (D016). O repositório agora é `LucasOl1337/pontape` (renomeado em 23/09/2026; o endereço antigo redireciona). A pasta local e alguns documentos antigos ainda dizem VidaNova: é o mesmo projeto. No site, o nome vem só de `src/data/site/project.ts`.

Organização sem fins lucrativos e open source que acha pessoas em vulnerabilidade que querem mudar de vida, dá o básico, conecta com trabalho e IA, e mostra ao vivo cada real doado. O produto está em [`docs/PRD.md`](docs/PRD.md): leia antes de começar qualquer frente.

## Equipe (canvas Maestri)

| Crachá | Quem | Papel |
|---|---|---|
| `regente` | Regente · Claude Opus 5.5 | Coordena, escreve briefs, revisa, integra na main, fala com o Lucas |
| `design` | Design/UI · Claude Opus 5.5 | UI, UX, design system, protótipos, texto de interface |
| `fino` | EngenheiroFino · Codex (GPT-6-Sol desde 23/09) | Arquitetura e partes delicadas: dinheiro, dados, IA de voz |
| `bruto` | ExecutorBruto · Codex GPT-6-Sol | Volume: pesquisa extensa, implementação de módulo |
| `anil` | Anil · Claude Fable 5.1 (xhigh) | Paletas de cor (F30), desde 23/09 |
| `prumo` | Prumo · Claude Opus 5.5 (xhigh) | Layout e UX do site (F31), desde 23/09 |
| `devin` | SubAgente (ligado ao EngenheiroFino) | Trabalho braçal, briefado e revisado pelo EngenheiroFino |
| `var-1` a `var-5` | Prisma, Crônica, Ábaco (Claude Opus 5.5), Maracatu (Codex GPT-6-Astra), Pluma (Codex GPT-6-Sol) | Uma variante visual cada (F19), até o Lucas escolher a direção |

Executor reporta ao Regente com `maestri ask "Regente" "<resumo + link da PR>"`. Só o Regente fala com o Lucas.

**Vigília noturna (F26, noite de 22 pra 23/09/2026):** encerrada. O que ela fez está no Quadro, seção Feito.

## Memória em arquivo

O contexto de qualquer agente compacta; o arquivo sobrevive. Cada frente segue esta sequência:

1. Leia `docs/QUADRO.md` e o `BRIEF.md` da sua frente em `docs/frentes/<ID>/`.
2. Trabalhe no seu worktree (seção Git).
3. A cada marco, anote no `DIARIO.md` da frente: o que fez, o que achou, decisões propostas, onde parou e o próximo passo. Depois de compactar, retome relendo `BRIEF.md` e `DIARIO.md`.
4. Pronto quando o critério do BRIEF está batido, o DIARIO mostra o estado final, a PR pra `main` está aberta e o Regente recebeu o report.

| Arquivo | Quem edita |
|---|---|
| `docs/PRD.md`, `docs/QUADRO.md`, `docs/DECISOES.md`, `docs/frentes/*/BRIEF.md` | Só o Regente. Proposta de mudança vai no DIARIO, seção "Decisões propostas" |
| `docs/frentes/<ID>/DIARIO.md` | Dono da frente |
| `docs/fontes/` | Regente: o que o Lucas disse, organizado |
| `docs/design/`, `docs/arquitetura/`, `docs/pesquisa/`, código | Dono da frente que o BRIEF indicar |

## Git

- O checkout `~/Projects/VidaNova` é do Regente. Nele ninguém commita, troca branch, faz stash ou reset.
- Cada agente trabalha no próprio worktree, `~/Projects/VidaNova/.worktrees/<crachá>`, na branch que o BRIEF indicar.
- Entrega é PR pra `main`. O Regente revisa e faz o merge.
- Commit pequeno, mensagem em PT-BR dizendo o quê e por quê.

## Regras

- **Reservado ao Regente, com OK do Lucas:** publicar, deploy, comprar domínio, criar conta em serviço, configurar pagamento, contatar pessoa ou empresa, abrir o repositório ao público.
- **Dado real de candidato nunca entra no repositório.** Exemplo e seed usam dado fictício marcado como fictício.
- **Segredo** só em `.env` local (ignorado pelo git); `.env.example` documenta as chaves.
- **Idioma:** docs e texto de interface em PT-BR; código e identificadores em inglês. O termo é sempre **AI**, nunca "IA" nem "inteligência artificial".
- **Texto público** (site, panfleto, roteiro de entrevista): frase curta e direta, que quem lê pouco entende ouvindo em voz alta. Sem travessão, sem jargão, sem rebaixar ninguém.
- **Pesquisa:** toda afirmação factual leva link e data de acesso.

## CLI para agentes

A entrada operacional é `node bin/pontape.mjs` (ou `npm run cli --`). Comece por `capabilities --json`, `doctor --json` e `docs/cli/README.md`. Use `npm --silent run cli -- ... --json` quando for ler stdout como JSON. O catálogo informa opções, efeitos e exemplos; não faça scraping da ajuda humana.

- `status`, `site data` e `ledger` consultam as fontes do checkout. Comandos HTTP usam loopback por padrão; origem remota deve ser explícita.
- `dev mock` sobe o Worker real com dados/provedores fictícios e banco em memória. `test --suite cli` testa processos do CLI contra esse servidor. Não precisa de credenciais reais.
- Preserve os limites de `--apply`, a autorização do Worker e as regras de publicação deste arquivo. Timeout de envio não autoriza repetir uma operação incerta.
- Uma nova função operacional precisa de comando no catálogo, exemplo documentado e teste pela interface do CLI. Reutilize o domínio existente.
- Planejamento e registro desta frente: `docs/cli/PLANO.md` e `docs/cli/DIARIO.md`.
