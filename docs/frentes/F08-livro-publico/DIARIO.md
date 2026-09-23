# F08 · Diário do EngenheiroFino

## 22/09/2026 · Início e contrato para F07

- F02 etapa 2 integrada pelo Regente em #23; branch `fino/f08-livro` criada de `origin/main` (1736937), incluindo exclusão de `.worktrees` do typecheck. Checkout compartilhado não alterado.
- Lidos AGENTS, PRD, QUADRO, DECISOES, BRIEF F08 e ARQUITETURA §4. Escopo: arquivos estáticos, sem banco, conta ou deploy; primeira ancoragem real é do Regente.
- Prioridade solicitada: liberar schema/tipos/fixture numa PR pequena, depois publicação, verificação e livro real.
- Contrato v1: quatro famílias, campos fechados, sem texto livre/URL arbitrária/identificador de candidato. Fontes de projeto derivadas de referências estruturadas. Datas do fato em dia; hora do registro separada. Centavos e sequência em strings decimais.
- Correção acrescenta evento; estorno financeiro exige inversão e referência, a validar na cadeia. Checkpoint externo será necessário para detectar supressão do fim e reescrita integral; não prometer proteção contra administrador só com hash local.
- Fixture explicitamente fictícia e separada do livro real. Próximo: validar e abrir PR de contrato; seguir com núcleo enquanto o Regente integra.

## Decisões propostas

- Custódia da chave, canal independente para chave pública e espelho precisam de responsável definido pelo Lucas/Regente. Implementação não gerará chave de produção nem fará ancoragem real.
- V1 não publica anexos: evidência financeira fica `pending` ou `not_published`. Adicionar anexos expurgados requer contrato e revisão específicos antes da F2.

## 22/09/2026 · Contrato validado

- `npm run check` passou: lint, tipos (zero erros/avisos), 34 testes e build estático.
- PR inicial contém somente contrato/tipos, helper de fontes, fixture, testes e documentação. O livro real e o verificador vêm na continuação.
