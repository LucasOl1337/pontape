# Contrato do livro público v1

Importe `LedgerPayload`, `LedgerEvent`, `LedgerCheckpoint`, os schemas e `projectSourceUrl` de `src/lib/ledger/schema.ts`. A F07 pode discriminar `event.payload.type` e `event.payload.action`. A fixture em `src/data/ledger/example.fixture.json` é **fictícia**, separada do futuro livro real. Não mostrá-la como atividade realizada.

Todo evento tem `schemaVersion: 1`, `sequence` decimal em string, `previousHash`, `recordedAt` UTC com milissegundos, `payload` e `hash`. Sequência começa em `"1"`; hash anterior inicial tem 64 zeros. O hash cobre todos os campos do envelope exceto o próprio `hash`, serializados com JCS e SHA-256. `recordedAt` é a hora de registro no livro; `occurredOn` é a data do fato, com precisão de dia. Não inventar horário para decisão que só tem data.

As quatro famílias têm campos fechados e `correctionOf` obrigatório, nulo num fato original:

| Tipo | Ações da v1 | Campos específicos |
|---|---|---|
| `project` | `repository_created`, `decision_recorded`, `pull_request_merged` | Repositório literal; ou ID da decisão e commit fonte; ou número da PR e commit de merge |
| `finance` | `movement_recorded`, `reversal` | BRL, delta em centavos como string com sinal, categoria permitida, evidência pendente ou não publicada |
| `field` | `food_delivered`, `clothing_delivered`, `hygiene_delivered` | Quantidade inteira positiva |
| `candidate` | `contact_completed`, `interview_completed`, `referral_completed`, `support_completed` | Contagem agregada inteira positiva, sem trajetória individual |

Links do projeto são derivados de referências limitadas por `projectSourceUrl`; não existe URL arbitrária, descrição, nome, pseudônimo, local ou JSON aberto. Novas ações e publicação de comprovantes expurgados exigem extensão versionada e revisão do contrato. O schema não autoriza atendimento, entrevista, doação ou coleta de dados. Mesmo contagens e datas exigem revisão humana do risco de identificação por contexto antes de publicar.

Correção de projeto/campo/candidato é um novo fato completo que aponta para a sequência anterior da mesma ação. Ambos permanecem disponíveis; o leitor marca o anterior como corrigido. Para dinheiro, `reversal` deve apontar para um movimento ainda não estornado da mesma categoria e conter o delta inverso; um movimento corrigido entra como outro `movement_recorded`. Somar todos os deltas com BigInt. Referências e inversões serão verificadas pela lógica de cadeia, além da validação estrutural do schema.

O checkpoint contém `schemaVersion`, identificador fixo do livro, `sequence` final, `headHash` e `generatedAt`. Guardar uma cópia fora do repositório permite conferir um prefixo conhecido depois. A cadeia, sozinha, não detecta uma reescrita completa ou a retirada dos últimos eventos quando o atacante também substitui o checkpoint. Assinatura e ancoragem terão estado explícito; nenhuma está ativa nesta entrega de contrato.

## Integração F07 e downloads

O entrypoint `src/lib/ledger/index.ts` exporta schema, tipos, `canonicalize`, `parseCanonicalJson`, `verifyLedger`, `verifyDocument` e `verifyCheckpointSignature`. Ele não importa Node, arquivos locais ou o livro real. Pode entrar no bundle de uma ilha React. `published.ts` é separado e exclusivo do build; fornece o documento validado e os estados `ledgerTrust`.

```ts
import { parseCanonicalJson, verifyDocument } from '../lib/ledger';

const response = await fetch('/livro/ledger.json');
if (!response.ok) throw new Error('Livro indisponível');
const result = await verifyDocument(parseCanonicalJson(await response.text()));
// result.valid false: não exibir selo de integridade.
// true: só consistência interna com o checkpoint fornecido.
// Para comparar uma cópia antiga do leitor: verifyLedger(document.events, copiaGuardada).
```

Web Crypto requer contexto seguro (HTTPS ou localhost); a ausência retorna `crypto_unavailable`. `verifyLedger` aceita objetos desconhecidos, valida o schema antes de calcular hashes e retorna uma união discriminada por `valid`. Falhas têm `code` e eventualmente `sequence`, sem dados enviados pelo usuário. Sucesso traz `eventCount`, `headHash`, `lastUpdatedAt`, `balanceCents`, `totalsByCategory` e `checkpointMatched`. Este último significa correspondência ao checkpoint fornecido, **não** assinatura ou confiança externa. `lastUpdatedAt` é o maior `recordedAt` declarado, e pode ser nulo num livro vazio. A sequência define a ordem; o verificador não exige relógios crescentes (o contrato v1 nunca garantiu isso). A CLI, ao criar novos eventos, recusa regressão do relógio local por cautela operacional. A data declarada de um fato não pode ser posterior ao seu registro.

O arquivo fonte atômico `src/data/ledger/ledger.json` tem `{events, checkpoint}` (`LedgerDocument`). `verifyDocument` exige checkpoint atual com contagem igual ao documento; `verifyLedger` também aceita checkpoint de um prefixo antigo, para comparar a cópia do leitor. Não usar `Number(balanceCents)` sem verificar limite seguro. Campos extras são recusados em todas as camadas, inclusive checkpoint e assinatura.

Datas de decisões preservam o dia indicado na fonte; datas de criação/PR vêm do dia UTC de `created_at`/`merged_at`. `recordedAt` usa UTC com milissegundos; a UI pode exibir sua hora em `America/Sao_Paulo`. Correção de projeto conserva o identificador da decisão/PR; mudar o significado de um ID exige outro fato, não redirecionar uma referência existente.

O download completo é `/livro/ledger.json`, com eventos e checkpoint do mesmo build. Os arquivos `/livro/events.json` e `/livro/checkpoint.json` saem em JCS exato; `/livro/trust.json` declara assinatura, carimbo e espelho ausentes. Ainda não existe chave pública de produção aprovada. A API Ed25519 verifica assinaturas com chave confiável explícita, mas não verifica `.ots`; essa prova usa o cliente independente descrito em OPERACAO.
