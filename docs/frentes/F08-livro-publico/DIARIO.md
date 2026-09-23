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

## 22/09/2026 · Contrato integrado; núcleo e livro real

- PR #26 de contrato integrada pelo Regente e repassada ao Design/UI. Continuação em `fino/f08-verificador`, atualizada por fast-forward com `origin/main` 3d767c8. #25 (governança) também incluída na base.
- Livro semeado com 21 fatos reais: criação do repositório, D001–D012, PRs #2–#5 e #23–#26. Datas/commits conferidos pela API GitHub e Git; referência e consulta em `docs/transparencia/FONTES.md`. Importação histórica explicitamente distinta do momento dos fatos.
- Implementados JCS, SHA-256 encadeado, checkpoints de prefixo conhecido, estornos e correções; entrypoint do navegador sem dependência Node. CLI verifica a mesma lógica. Publicação dry-run por padrão, lock exclusivo e substituição atômica do documento eventos+checkpoint.
- 67 testes passaram na primeira rodada: adulteração, retirada inclusive do fim, reordenação, privacidade, números grandes, referência, estorno, concorrência e dry-run. Lint depois apontou três construções intencionais nos vetores de teste; ajustadas sem suprimir regras.
- Rotas estáticas de download em `/livro/`; build valida a cadeia. Não há UI nova de transparência, responsabilidade da F07.
- Assinatura Ed25519 offline implementada, com chave privada obrigatoriamente externa ao repositório e verificação por chave confiável explícita no navegador. Testes só usam chaves efêmeras. Nenhuma chave de produção criada, assinatura real publicada ou ancoragem executada.
- Próximo: rodar check completo, conferir bundle web, registrar limites operacionais e abrir PR do núcleo.

## Proposta operacional de criptografia aberta

- Custódia pendente: Lucas/Regente nomeiam responsável pela chave Ed25519, backup e revogação. Chave pública e rotações precisam de canal independente; assinatura com chave trazida no próprio arquivo não basta para provar autoria. A CLI entrega arquivo com chave pública e checkpoint assinado quando o operador aplicar explicitamente.
- Ancoragem proposta: Regente guarda checkpoint canônico imutável e executa OpenTimestamps sem conta/pagamento (`ots stamp`, depois `upgrade` e `verify`). Primeira execução real não é do agente. Prova pendente não vira selo confirmado; manter `.ots` final e cópia independente. A verificação pelo cliente oficial requer Bitcoin Core; não ocultar essa dependência.
- Espelho independente continua ausente. Assinatura, carimbo e espelho têm estados explícitos desativados. Hash não prova fatos fora do livro nem omissões anteriores à publicação; checkpoint guardado é a referência contra reescrita e truncamento do fim.
- Procedimento concreto em `docs/transparencia/OPERACAO.md`; consultas ao RFC 8785, Node Web Crypto e OpenTimestamps em 22/09/2026. Nenhuma decisão de custódia bloqueia o núcleo estático.

## 22/09/2026 · Validação do núcleo

- `npm run check` passou com 68 testes: lint, tipos sem erro/aviso, testes, CLI real e build. CI passa a executar `ledger:verify` explicitamente.
- Bundle `platform: browser` compilado e executado em contexto JS sem globais Node: os 21 eventos conferiram usando Web Crypto. Isso verifica portabilidade da lógica; não é teste visual de navegador nem aceite da UI F07.
- Conferência independente com Python/hashlib bateu com os hashes dos 21 eventos e com os bytes dos downloads gerados. O teste histórico fixa o checkpoint inicial e permite novas inclusões legítimas, sem exigir livro eternamente com 21 eventos.
- CLI de assinatura testada com chave Ed25519 temporária e fictícia fora do repositório: assinatura válida, recusa de sobrescrita e de chave interna; tudo removido no cleanup. Nenhuma chave de produção.
- Adicionado download completo `/livro/ledger.json` para conferir eventos e checkpoint de um mesmo build sem combinar respostas de versões diferentes. Downloads separados continuam disponíveis.
- Estado pronto para PR: nenhuma mudança em UI da F07, nenhum banco, conta, deploy ou chamada real a calendários OpenTimestamps. Pendências de custódia/espelho não bloqueiam o núcleo. Regente precisa revisar o primeiro lote real e executar a primeira ancoragem quando aprovar o procedimento.

## 22/09/2026 · D014 e teste cruzado independente

- Main atualizada por fast-forward até 68cf25b, trazendo protótipo integrado, D013/D014 e F14. Nenhum arquivo de outro agente foi editado.
- Conforme instrução do Regente, usei `design/prototipo/ledger/real.json` e `sample.json` como vetores produzidos pelo gerador independente do Design. **Não são fonte do livro de produção.**
- Todos os hashes bateram desde a primeira conferência. `real.json` passou com 21 eventos. O sample inicialmente falhou em `time` nas sequências 10 e 12, que têm horários anteriores ao registro precedente.
- Causa da divergência: restrição extra do meu verificador, não falha JCS/SHA-256 do Design. O contrato v1 garante ordem pela sequência, não por relógio monotônico. Corrigi a verificação para aceitar relógios não ordenados; `lastUpdatedAt` é o maior horário declarado. O escritor local ainda recusa regressão do seu relógio ao acrescentar evento novo. A data do fato continua limitada à data do registro.
- Testes cruzados permanentes: real do protótipo válido; sample fictício válido com 18 eventos e saldo 410140 centavos; hash de cada evento comparado individualmente. Suite agora tem 71 testes passando. Divergência e resolução reportadas ao Regente via Maestri.
- Verificador puro exportado em `src/lib/ledger/index.ts`; `published.ts` é o carregador de build separado. F07 pode importar sem copiar lógica.

## 22/09/2026 · Check final após integração da main

- `npm run check` passou na base atualizada: 71 testes, livro real válido e build com quatro downloads `/livro/`. Typecheck: zero erros/avisos; um hint já existente no protótipo integrado (`await onStep`, `design/prototipo/ledger.js:140`), sem alteração nessa frente.
- PR do núcleo em preparação com `fino/f08-verificador` contra main. Entrega mantém o recorte inicial autorizado de 21 fatos; novos eventos entram via append, sem regenerar o lote.
