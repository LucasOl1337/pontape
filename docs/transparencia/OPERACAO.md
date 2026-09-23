# Operação do livro estático

Só o Regente publica o livro de produção. Estes comandos gravam arquivos locais; não fazem deploy, não abrem conta e não fazem contato com serviço de tempo. A primeira ancoragem real permanece com o Regente.

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
