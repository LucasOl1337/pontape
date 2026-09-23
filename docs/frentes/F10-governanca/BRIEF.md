# F10 · Governança open source (sem licença)

Dono: `bruto` (ExecutorBruto) · Worktree: `.worktrees/bruto` · Branch: `bruto/f10-governanca` a partir da `main` atualizada

## Por que agora

O Lucas quer o projeto aberto a qualquer ajuda, com tudo aprovado por ele ou por um admin ([spec 01](../../fontes/2026-09-22-spec-01.md), itens 26 a 28). As contribuições abertas já existem (F13, issues #6 a #22). Falta dizer, em linguagem simples, como alguém de fora participa, quem decide, como se comporta e como avisa um problema de segurança ou de privacidade sem expor ninguém.

## Entregáveis

1. **`GOVERNANCA.md`** na raiz: quem é quem (Lucas, admins, Regente, agentes de IA, contribuidores), como uma PR é aprovada, como uma decisão vira registro em `docs/DECISOES.md`, como tudo isso entra no livro público de ações (D010), e como alguém vira admin. Diga com clareza que parte do trabalho é feita por agentes de IA e que toda mudança passa por revisão humana.
2. **`CODE_OF_CONDUCT.md`** em PT-BR, baseado no Contributor Covenant 2.1 (com atribuição e link), adaptado ao projeto: dignidade das pessoas atendidas e proibição de expor qualquer dado delas. Canal de denúncia: deixe como "a definir pelo Lucas", sem inventar e-mail.
3. **`SECURITY.md`**: como avisar uma falha de segurança ou uma exposição de dado pessoal sem abrir issue pública (ARQUITETURA §6.4). Canal privado: "a definir pelo Lucas" até existir; enquanto isso, orientação pra usar o aviso privado de vulnerabilidade do GitHub quando o repositório abrir.
4. **`.github/pull_request_template.md`** em PT-BR: o que muda, por quê, como foi validado, confirmação de que não tem dado pessoal real nem segredo.
5. Ajuste o `CONTRIBUTING.md` só pra linkar esses arquivos, sem reescrever o que o EngenheiroFino escreveu.

Diário em `docs/frentes/F10-governanca/DIARIO.md`.

## Limites

- **Sem `LICENSE`**: é decisão do Lucas (PRD §10, pergunta 7).
- Sem e-mail, telefone ou canal inventado. Onde faltar canal, escreva "a definir".
- Não mexa em `.github/workflows/` nem em `CODEOWNERS`.

## Pronto quando

- Os 4 arquivos existem, curtos e em PT-BR simples. Teste: cada um se lê em voz alta em menos de 3 minutos.
- Nenhum canal de contato inventado.
- PR aberta pra `main` e report ao Regente.
