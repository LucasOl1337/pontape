# Diário · F13 · Contribuições abertas

## 22/09/2026 · Início

- Criei a branch `bruto/f13-contribuicoes` a partir de `origin/main` atualizado, no worktree `bruto`. A árvore estava limpa.
- Li `AGENTS.md`, PRD v0.2, QUADRO, briefing F13, spec 02, MAPA-DO-SITE e as pendências das pesquisas. O repositório começou com zero issues abertas e dez labels padrão.
- Escopo: criar labels, três modelos de issue, uma lista de contribuições concretas no GitHub e o JSON consumível pelo site. Texto público, sem dado pessoal. `.github/workflows/`, `CONTRIBUTING.md` e `CODEOWNERS` ficam com F02.
- Ordem D009: plataforma e transparência primeiro. A F06 está em espera; não iniciarei a pesquisa de oportunidades nesta frente.

## Decisões propostas

- Abrir tarefas de M1/M2 e dos cinco gargalos do bloco 06 como prioridade de contribuição. Pedidos ligados a M3/M4 são de desenho ou medição futura, sem entrevistar candidatos nem iniciar piloto.
- Usar `id` estável no JSON e `issueNumber` como ligação ao GitHub. Fechar ou alterar uma issue exige atualizar o JSON na mesma PR de manutenção.

## 22/09/2026 · Taxonomia pronta

- Criei no repositório privado as 17 labels pedidas: seis tipos, `bom-primeiro-passo`, `precisa-de-ajuda` e `M1` a `M9`. Não alterei as dez labels padrão já existentes.
- Próximo marco: modelos de issue e publicação da lista de contribuições.

## 22/09/2026 · Modelos prontos

- Criei os três modelos em `.github/ISSUE_TEMPLATE/`: ideia para gargalo, contribuição de pesquisa e problema no site. Todos pedem descrição verificável sem dados pessoais.
- A lista de tarefas será aberta no GitHub antes de gerar o JSON, para que os números no catálogo sejam os reais.

## 22/09/2026 · Issues e catálogo publicados

- Abri 17 issues, de [#6](https://github.com/LucasOl1337/VidaNova/issues/6) a [#22](https://github.com/LucasOl1337/VidaNova/issues/22), cada uma com três linhas de contexto, como ajudar, critério de pronto, documentos e labels. Seis têm `bom-primeiro-passo`.
- Cobertura dos cinco gargalos do mapa: achar a pessoa certa [#13](https://github.com/LucasOl1337/VidaNova/issues/13); conversar com quem não lê [#6](https://github.com/LucasOl1337/VidaNova/issues/6), [#7](https://github.com/LucasOl1337/VidaNova/issues/7), [#16](https://github.com/LucasOl1337/VidaNova/issues/16)–[#18](https://github.com/LucasOl1337/VidaNova/issues/18); receber doação do jeito certo [#9](https://github.com/LucasOl1337/VidaNova/issues/9)–[#11](https://github.com/LucasOl1337/VidaNova/issues/11), [#19](https://github.com/LucasOl1337/VidaNova/issues/19) e [#20](https://github.com/LucasOl1337/VidaNova/issues/20); escolha justa [#14](https://github.com/LucasOl1337/VidaNova/issues/14); segurança no encontro [#15](https://github.com/LucasOl1337/VidaNova/issues/15).
- As demais tarefas cobrem acessibilidade [#8](https://github.com/LucasOl1337/VidaNova/issues/8), conferência pública [#12](https://github.com/LucasOl1337/VidaNova/issues/12) e [#21](https://github.com/LucasOl1337/VidaNova/issues/21), e escuta do nome [#22](https://github.com/LucasOl1337/VidaNova/issues/22).
- Gerei `docs/contribuicoes/contribuicoes.json` com números reais e um README para manutenção. A conferência automática encontrou as 17 issues abertas, títulos e labels correspondentes, seis primeiros passos e os cinco gargalos cobertos.

## 22/09/2026 · PR aberta

- Revisei o diff e passei `git diff --cached --check`. Commitei e enviei a branch `bruto/f13-contribuicoes`.
- Abri a [PR #24](https://github.com/LucasOl1337/VidaNova/pull/24) para `main` com os modelos, catálogo e diário. A conferência com o GitHub foi feita antes do commit; os 17 títulos, números e labels continuavam correspondentes.
- Próximo passo: avisar o Regente com a PR, a lista de issues e as dúvidas pendentes. A F06 permanece em espera.
