# Operação do livro estático

PRs integradas e decisões novas entram no livro pela automação descrita abaixo. Dinheiro, ações de campo, candidato, correções e primeira ancoragem real continuam sob operação do Regente. Os comandos locais gravam arquivos; não fazem deploy, não abrem conta e não fazem contato com serviço de tempo.

## Ações de projeto automáticas

O workflow `.github/workflows/ledger-project.yml` concilia o projeto a cada push na `main`. Ele também pode ser executado manualmente pelo Actions, somente na `main` deste repositório. Usa apenas o `GITHUB_TOKEN` fornecido pelo GitHub, com `contents: write` e `pull-requests: read` restritos ao job. Não requer segredo novo.

- PR integrada: lê número, `merge_commit_sha` e `merged_at` pela API paginada do GitHub. Aceita apenas PR com base `main` neste repositório e merge alcançável no checkout. Converte o instante de integração para o dia em `America/Sao_Paulo`. Título, corpo e autor não entram no livro.
- Decisão: lê as linhas `| D### | DD/MM/AAAA |` do histórico de `docs/DECISOES.md`, usando a data declarada na tabela. `sourceCommit` aponta à primeira revisão da linha principal em que o ID existe. Quando a decisão vem por PR, é o commit que a trouxe à main. Ler revisões históricas permite recuperar decisões mesmo se a linha for removida depois.
- Deduplicação: número da PR ou ID da decisão já registrado é sucesso sem alteração. Mudanças posteriores no mesmo ID não reescrevem o livro; eventual correção continua manual. Criação do repositório e as demais famílias não são geradas pela automação.
- Recuperação: confere todo o histórico alcançável, não só o último push. Fatos ausentes são acrescentados em ordem topológica de commits; no mesmo commit, por chave de origem (decisões antes de PRs). Lacunas antigas entram no fim do livro, preservando todos os eventos publicados. `occurredOn` conserva o dia do fato e `recordedAt` é o instante atual de registro.

Uma execução sem fatos novos não toca o arquivo nem o checkpoint. Com novos fatos, o comando valida o livro, monta e verifica o lote e usa o mesmo lock e troca atômica do append manual. O workflow roda `npm run check`, faz commit somente de `src/data/ledger/ledger.json` com a mensagem `Registra ações do projeto no livro [ledger-bot]` e dá push normal para main.

Há um grupo fixo de concorrência, sem cancelar a execução ativa. Como o Actions pode substituir execuções pendentes, cada execução recupera também lacunas anteriores. Se outro push avançar a main, o push do bot é recusado: o runner descartável volta à main atualizada e recalcula o lote, em até quatro tentativas. Não usa force nem rebase do JSON encadeado. Se falhar, confira o log e execute novamente o workflow; a idempotência evita repetir fatos já gravados. [Concorrência no Actions, acesso em 22/09/2026](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

O push com `GITHUB_TOKEN` não dispara novos workflows de push, portanto não há laço. Também não dispara o CI normal: por isso a verificação completa ocorre antes do push, dentro do próprio job. Não trocar esse token por PAT. Não há `pull_request_target` nem execução de código de fork com escrita. A atualização do arquivo no Git não faz deploy; publicar a versão nova do site continua separado. [Gatilhos e GITHUB_TOKEN, acesso em 22/09/2026](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

Para diagnosticar localmente, use um checkout com histórico completo e `gh` autenticado com leitura do repositório:

```sh
npm run ledger:sync-project
# Apenas se o Regente precisar aplicar manualmente a conciliação:
npm run ledger:sync-project -- --apply
npm run ledger:verify
```

O padrão é dry-run; `--apply` altera apenas o arquivo local. O comando nunca cria commit, faz push, troca branch ou descarta alterações locais. A fonte é o HEAD do checkout: para reproduzir a automação, use uma branch atualizada a partir da main. Clone raso é recusado. Falha de API, tabela inválida ou livro inválido interrompe a operação sem aplicar parte do lote. Não execute a aplicação em paralelo com edições que não respeitem o lock.

Se uma proteção futura impedir push direto pelo bot ou exigir verificações externas no commit, este fluxo precisará passar por uma PR de atualização do livro, revisada e integrada pelo Regente. Não habilitar bypass, PAT ou mudança de proteção automaticamente. A proteção não foi configurada nesta entrega.

## Acrescentar um fato

Crie um JSON contendo somente um `LedgerPayload` do [contrato](CONTRATO.md). Rode primeiro a simulação:

```sh
npm run ledger:append -- --event /caminho/evento.json
npm run ledger:append -- --event /caminho/evento.json --apply
npm run ledger:verify
npm run check
```

Sem `--apply`, nenhum arquivo é alterado, nem lock é criado. A simulação imprime o evento previsto; ao aplicar, a hora de registro é recalculada. `--file /caminho/livro.json` permite testar numa cópia. O arquivo de destino precisa existir e estar válido; para testes, o documento vazio tem `events: []` e checkpoint de sequência `"0"` e hash de 64 zeros.

O comando recusa campos extras, JSON com chave repetida, datas inválidas, fontes duplicadas de projeto, referência de correção inválida e livro anterior adulterado. Centavos são inteiros em strings; cálculos usam BigInt. Entrada ou livro acima de 32 MiB é recusado. Não coloque identidade nem texto livre dentro de campos numéricos, hashes ou códigos: schema reduz erros, não substitui revisão humana contra uso indevido.

O arquivo `src/data/ledger/ledger.json` contém eventos e checkpoint atual juntos, em bytes JCS, sem quebra de linha final. Um lock exclusivo serializa os escritores deste comando. O novo documento é escrito em arquivo temporário no mesmo diretório, sincronizado e publicado por rename. Erro antes do rename preserva o anterior. Se um processo cair deixando `.lock`, confirme que ele terminou e compare o livro antes de remover o lock manualmente. Não disputar escrita com editor ou script que ignore esse protocolo. Git/PR mantém a revisão; este controle local não substitui permissões de produção.

Se o comando for interrompido, confira o último evento antes de repetir: ações de campo/candidato e movimentos financeiros não têm deduplicação automática de origem nesta fase estática.

Não regenerar o primeiro lote, ajustar `recordedAt` antigo, reordenar ou substituir um fato publicado. Correção é novo evento. Para finanças, estorne exatamente o delta do movimento anterior e depois acrescente o valor correto. Não estornar duas vezes o mesmo movimento. O verificador soma deltas; ele não concilia conta bancária. Anexos públicos ainda não são aceitos pela v1; evidência fica `pending` ou `not_published` até o fluxo de expurgo ser implementado.

Depois de revisar o diff e integrar a PR, a publicação do site deve gerar os downloads de novo. O build falha se o livro ou checkpoint não conferir. Não há relógio de atualização contínua nem automação de deploy nesta entrega.

## Assinatura de checkpoints

O código suporta Ed25519 via API criptográfica nativa. A CLI assina offline; o navegador verifica com uma chave pública previamente conhecida. Consulte [Web Crypto do Node, acesso em 22/09/2026](https://nodejs.org/api/webcrypto.html). Não há chave de produção criada ou assinatura real nesta entrega.

Primeiro definir custodiante, backup da chave privada e canal independente de publicação da chave pública. Depois de obter uma chave Ed25519 em PEM fora de todo o repositório e seus worktrees:

```sh
npm run ledger:sign
npm run ledger:sign -- --key /pasta-privada/chave.pem --out /pasta-publica/checkpoint-assinado.json --apply
```

O primeiro comando é dry-run e não lê chave. O segundo valida o livro, assina o checkpoint atual e cria um arquivo novo; recusa sobrescrita e chave privada dentro do repositório. Nunca copiar a chave privada para Git, navegador, CI ou `.env.example`. O arquivo assinado contém só checkpoint, assinatura e chave pública hexadecimal. Publicar a chave pública e seu histórico num canal independente; guardar checkpoints assinados antigos. A função `verifyCheckpointSignature(arquivo, chaveConfiavel)` exige a chave conhecida pelo leitor. Usar a chave que veio no próprio arquivo só prova autoconsistência, não autoria confiável.

Rotação ou comprometimento exigem anúncio pelo custodiante, preservação das chaves públicas anteriores e data do corte. Uma chave comprometida permite novas assinaturas falsas; a assinatura não impede que seu dono reescreva o passado. Cópias independentes e carimbo de tempo ajudam a detectar isso. Até a custódia ser aprovada, `trust.json` continua `not_configured`.

## Proposta de ancoragem OpenTimestamps

Proposta para o Regente executar depois da revisão, sem conta nem pagamento. O [cliente oficial OpenTimestamps, consultado em 22/09/2026](https://github.com/opentimestamps/opentimestamps-client) cria uma prova `.ots`; ela começa pendente e pode ser completada depois. O serviço recebe um digest, não o conteúdo do livro. A verificação independente pelo cliente requer Bitcoin Core local; conferir por um site implica confiar também nesse verificador.

Com o cliente `ots` instalado pelo operador num ambiente separado, copie os bytes exatos de `/livro/checkpoint.json` para uma pasta durável, fora do build, e rode:

```sh
ots stamp checkpoint.json
ots info checkpoint.json.ots
# Depois da confirmação:
ots upgrade checkpoint.json.ots
ots verify checkpoint.json.ots
```

Esses comandos **não foram executados nesta entrega**. Não marcar `anchored` quando só existe recibo pendente. Publicar o checkpoint imutável, `.ots` completo e instruções de verificação juntos; manter outra cópia sob custódia independente. Antes de marcar confirmado, o Regente deve conferir o hash, a prova final e sua ligação ao livro. O carimbo atesta existência até um momento; não prova a data histórica ou veracidade de cada fato. Carimbar o checkpoint compromete também `headHash` e `sequence`; uma cadeia reescrita não confere com essa cabeça guardada.
