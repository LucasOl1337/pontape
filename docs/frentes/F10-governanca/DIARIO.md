# Diário · F10 · Governança open source

## 22/09/2026 · Início

- Criei `bruto/f10-governanca` a partir de `origin/main` atualizado, no worktree `bruto`; a árvore começou limpa.
- Li `AGENTS.md`, PRD, QUADRO, DECISOES, briefing F10, spec 01, `CONTRIBUTING.md` e ARQUITETURA §6.4.
- Consultei o [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) e a [documentação do GitHub sobre relato privado](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/report-privately), em 22/09/2026.
- Escopo: quatro arquivos curtos de governança, conduta, segurança e modelo de PR; no `CONTRIBUTING.md`, só links. Sem `LICENSE`, e-mail ou canal inventado. F06 continua em espera.

## Decisões propostas

- Documentar como regra futura que a integração exige aprovação humana de Lucas ou de admin designado; parecer de agente e CI não substituem a revisão.
- Registrar concessão/revogação de admin e decisões de projeto em `docs/DECISOES.md`, por meio do Regente, sem publicar dados pessoais no livro de ações.
- Declarar que o livro público de D010 ainda está em construção. Quando estiver ativo, publicar o registro mínimo de decisões e ações, sem nomes ou detalhes protegidos.
- Usar o aviso privado de vulnerabilidade do GitHub somente se o repositório for aberto e o recurso estiver habilitado. Até existir canal privado, deixar “a definir pelo Lucas” e não receber detalhes em issue pública.

## Próximo passo

Conferir links, tempo de leitura e limites; revisar diff, abrir PR e reportar ao Regente.

## 22/09/2026 · Documentos prontos

- Escrevi `GOVERNANCA.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` e `.github/pull_request_template.md`. No `CONTRIBUTING.md`, acrescentei só uma linha com links para eles.
- A governança separa Lucas, admins humanos, Regente, agentes e contribuidores; exige aprovação humana e explica decisão, concessão de admin e futuro livro público D010 sem afirmar que ele já está ativo.
- O código de conduta adapta o Contributor Covenant 2.1 e veda exposição de pessoas atendidas. Segurança mantém o canal “a definir pelo Lucas” e trata o aviso privado do GitHub como opção condicional após a abertura.
- Os quatro arquivos têm, respectivamente, 330, 215, 216 e 127 palavras aproximadamente, cada um com leitura em voz alta abaixo de três minutos em ritmo usual.

## 22/09/2026 · Validação

- Conferi todos os links locais nos cinco arquivos de entrada; os destinos existem. `LICENSE` continua ausente.
- `git diff --cached --check` passou. O diff de `CONTRIBUTING.md` contém só a linha de links.
- `npm run check` passou: lint, tipagem Astro, 22 testes e build estático.
- Próximo passo: commitar, enviar a branch, abrir PR e avisar o Regente. Não há decisão pendente que impeça esta PR; o canal privado e a licença ficam explicitamente a definir pelo Lucas.

## 22/09/2026 · PR aberta

- Commitei a documentação em `bruto/f10-governanca`, enviei a branch e abri a [PR #25](https://github.com/LucasOl1337/VidaNova/pull/25) para `main`.
- Próximo passo: reportar ao Regente. Dúvidas de produto para Lucas: qual canal privado será adotado para conduta e segurança, e qual licença será escolhida na frente futura F10b. Nenhuma exige resposta para revisar esta PR.
