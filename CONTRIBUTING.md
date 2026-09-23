# Como contribuir

Rascunho da fundação; governança completa vem da F10.

Leia o [PRD](docs/PRD.md), as [decisões](docs/DECISOES.md) e o [AGENTS.md](AGENTS.md). Para configurar o projeto e validar uma mudança, siga o [README](README.md).

Veja também [governança](GOVERNANCA.md), [código de conduta](CODE_OF_CONDUCT.md), [segurança](SECURITY.md) e [modelo de PR](.github/pull_request_template.md).

1. Trabalhe numa branch própria, com uma mudança de propósito claro por PR. Nesta máquina, agentes usam seus worktrees; o checkout compartilhado pertence ao Regente.
2. Escreva interface e documentação em PT-BR; código e identificadores em inglês. Use tokens de `src/styles/tokens.css` e blocos de `src/components/blocks/`.
3. Use somente dados fictícios, identificados como fictícios, em testes e exemplos. Dados pessoais reais, credenciais e comprovantes privados nunca entram no Git.
4. Execute `npm run check` e explique na PR o problema resolvido e a validação feita. Alterações de contrato público precisam de testes que rejeitem campos não permitidos.
5. Abra PR para `main`. **Toda PR passa por aprovação de um admin**, Lucas ou pessoa designada; o Regente integra as frentes. CI verde não substitui aprovação.

`.github/CODEOWNERS` identifica `@LucasOl1337` como responsável. Esse arquivo e o CI não configuram proteção de branch: regras obrigatórias de revisão são administradas no GitHub pelo responsável do repositório.

Não habilite coleta de dados, pagamentos, serviços externos ou publicação como parte de uma mudança não autorizada. D012 mantém a coleta de dados pessoais parada até a definição do responsável legal. A licença do projeto ainda será decidida; não adicione `LICENSE` nesta fase.
