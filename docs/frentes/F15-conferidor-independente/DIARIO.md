# Diário · F15 · Conferidor independente

## 22/09/2026 · Início em sala limpa

- Criei `bruto/f15-conferidor` a partir de `origin/main` atualizado, no worktree `bruto`; árvore limpa.
- Li `AGENTS.md`, o briefing F15, `docs/transparencia/CONTRATO.md` e somente a seção 4 de `docs/arquitetura/ARQUITETURA.md`. Li `design/prototipo/ledger/real.json` e `sample.json` **como dados**. Não abri `src/lib/ledger/*.ts` nem `design/prototipo/*.js`, e não vou lê-los nesta frente.
- Os vetores de dados têm 21 eventos reais em uma lista JSON e 18 eventos fictícios em um objeto com `notice` e `events`. Os hashes serão derivados do contrato v1, não do código JavaScript.

## Lacunas do contrato a comunicar

- O contrato define campos do evento e do checkpoint, mas **não fixa o contêiner JSON** do livro. Os dois arquivos permitidos usam formatos externos diferentes: lista e `{notice, events}`. O conferidor precisará aceitar ambos como formatos observados, deixando isso explícito.
- A tabela descreve os campos específicos por significado, mas não enumera todos os **nomes de chave, categorias financeiras e valores de evidência**. Isso impede afirmar validação integral do payload sem consultar código proibido. Farei validação estrutural básica dos campos comuns, ações e quantias, e registrarei esse limite na saída/guia.
- A ARQUITETURA §4.2 contém um formato **proposto e anterior** de hash com `schema_version` e sem `recordedAt`; o CONTRATO v1 diz que o hash cobre todos os campos do envelope exceto `hash`. Usarei o CONTRATO v1, por ser o contrato efetivo dos vetores.
- O checkpoint tem campos descritos, mas o contrato não fornece nome literal do identificador fixo do livro nem vetor com checkpoint. A F15 verificará o encadeamento no arquivo; não poderá comprovar completude do sufixo sem checkpoint independente.

## Próximo passo

Avisar o Regente dessas lacunas; implementar JCS/SHA-256 em Python padrão a partir do contrato e testar contra os livros JSON e cópias adulteradas.

## 22/09/2026 · Primeiro conferidor e vetores

- Avisei o Regente via Maestri sobre as lacunas. Ele confirmou que o EngenheiroFino completará o contrato na PR #30 e autorizou tratar `src/data/ledger/ledger.json` como dado quando ele entrar. Seguimos com o envelope v1 e os dois contêineres já observados.
- Implementei `tools/conferir.py` com biblioteca padrão: leitura JSON sem chaves duplicadas, serialização JCS no domínio de inteiros seguros da v1, SHA-256, esquema comum, sequência, encadeamento, correções, saldo financeiro e conferência básica do checkpoint quando presente. O uso de números JSON fracionários é recusado porque o contrato não os prevê e a representação ECMAScript teria de ser especificada; valores monetários são strings decimais.
- Conferi o primeiro hash de cada vetor diretamente a partir do envelope v1: o SHA-256 calculado bateu com os valores armazenados, sem consultar o código JavaScript.
- Adicionei testes com os dois livros e quatro adulterações (campo, exclusão, troca de ordem e hash), além de chave JSON duplicada. Criei o guia de três comandos em `CONFERIR-COM-PYTHON.md`, pois `COMO-CONFERIR.md` ainda não existe.
- A mensagem “nada apagado nem mudado” vale para as ações presentes e o prefixo protegido pelo encadeamento. Sufixo removido ou cadeia inteira reescrita com checkpoint substituído exige uma cópia independente do checkpoint, como alerta o contrato e o guia.
- Mantida a sala limpa: nenhum `src/lib/ledger/*.ts` ou `design/prototipo/*.js` foi aberto. Próximo marco: testar tudo e reler somente o contrato atualizado após a integração da #30.

## 22/09/2026 · Validação antes da revisão do contrato

- `python3 -m unittest tools/test_conferir.py -v`: 3 testes passaram. As quatro adulterações param na primeira linha lógica afetada (1 para campo/hash; 2 para exclusão/troca).
- `python3 tools/conferir.py design/prototipo/ledger/real.json`: 21 ações válidas, saldo R$ 0,00. `sample.json`: 18 ações válidas, saldo R$ 4.101,40.
- `npm run check`: passou, incluindo lint, tipos, testes e build. `git diff --check`: passou.
- Sugestão ao EngenheiroFino: incluir o comando do conferidor e seus testes no CI após estabilizar o contrato e o livro real; não editei workflows nesta frente.
- A PR #30 ainda está aberta. A conferência do novo `CONTRATO.md` e do livro em `src/data/ledger/ledger.json` segue pendente para o próximo marco.
