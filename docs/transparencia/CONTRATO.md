# Contrato do livro público v1

**Esta é a especificação normativa da F08. Prevalece sobre a fórmula proposta na ARQUITETURA §4.2.** Permite implementar produtor ou verificador sem consultar o código TypeScript. Nomes de campos, literais e regras abaixo fazem parte do formato; tradução só na interface.

## 1. Arquivos e contêineres

Todos os objetos têm **lista fechada de chaves**. Todas as chaves descritas são obrigatórias; não há campos opcionais, defaults, coerção nem chave extra. `null` só é permitido onde indicado. Rejeitar nomes de propriedade repetidos, inclusive se uma grafia usar escape Unicode. Rejeitar Unicode malformado (surrogate isolado), NaN, infinito e valores fora de JSON.

| Arquivo/entrada | Contêiner exato | Uso |
|---|---|---|
| `src/data/ledger/ledger.json` e download `/livro/ledger.json` | Objeto com **somente** `events` (array de eventos) e `checkpoint` (objeto do §5) | Fonte única do livro real e documento completo para conferência |
| `/livro/events.json` | Array de eventos, sem objeto em volta | Conferência da cadeia, com checkpoint fornecido à parte |
| `/livro/checkpoint.json` | Objeto do §5 | Cópia da cabeça atual ou referência guardada pelo leitor |
| `/livro/trust.json` | Objeto com somente `signature: "not_configured"`, `timestamp: "not_anchored"`, `mirror: "not_configured"` nesta entrega | Estado honesto das provas externas; não entra no hash de eventos |
| `design/prototipo/ledger/real.json` | Array de eventos | Vetor do protótipo, **não** fonte do site, conforme D014 |
| `design/prototipo/ledger/sample.json` | Objeto com somente `notice` (aviso de dados fictícios) e `events` (array) | Exemplo do protótipo; extrair `events` para o verificador da cadeia |

O documento de produção não aceita `notice`, nem o objeto inteiro do sample como se fosse evento. Arrays têm de zero a 100.000 eventos. Os quatro downloads de produção e o arquivo fonte são **bytes UTF-8 JCS exatos, sem BOM nem quebra de linha final**. O JSON indentado do protótipo é aceito como vetor lógico depois de parse sem duplicatas; seus bytes de arquivo não são a entrada direta do hash.

A fixture `src/data/ledger/conformance.fixture.json` tem `{notice, events, checkpoint}` para o teste do §7; não é contêiner de produção. A fixture `example.fixture.json` tem `{notice, payloads}` de quatro famílias, ainda sem envelope. Ambas são **fictícias**, separadas do livro real.

## 2. Formatos primitivos e datas

| Nome usado nesta especificação | Formato exato |
|---|---|
| `PositiveDecimal` | String ASCII que corresponde a `^[1-9][0-9]{0,19}$`; de 1 a 20 dígitos, sem sinal ou zero inicial |
| `NonNegativeDecimal` | `"0"` ou `PositiveDecimal` |
| `SignedCents` | String ASCII que corresponde a `^-?[1-9][0-9]{0,19}$`; valor não zero, até 20 dígitos de magnitude; sem `+`, decimal, expoente, zero inicial ou `-0` |
| `Hash` | String de exatamente 64 caracteres hexadecimais minúsculos, `^[a-f0-9]{64}$` |
| `Commit` | String de exatamente 40 caracteres hexadecimais minúsculos, `^[a-f0-9]{40}$` |
| `Date` | Data gregoriana válida `YYYY-MM-DD`, com ano de quatro dígitos, mês/dia de dois; rejeitar, por exemplo, 30 de fevereiro |
| `Instant` | Data/hora válida `YYYY-MM-DDTHH:mm:ss.sssZ`, UTC, exatamente três dígitos de milissegundos; sem offset alternativo, hora 24 ou segundo 60 |

Sequências, quantidades, contagens e dinheiro são strings para preservar precisão. Usar inteiros arbitrários (BigInt, `int` Python ou equivalente), nunca ponto flutuante. A versão de schema é o **número JSON** `1`, não a string `"1"`.

**`occurredOn` é o dia civil do fato em `America/Sao_Paulo`.** Converter `created_at`/`merged_at` e outras fontes com hora usando o fuso IANA, incluindo horário de verão histórico, e só então extrair ano/mês/dia. Exemplo: `2026-09-23T00:50:55Z` vira `2026-09-22`, às 21h50 no Brasil. Não fazer `timestamp.slice(0, 10)` nem usar offset fixo para toda a história. Decisões sem hora conhecida conservam o dia brasileiro escrito na fonte; não inventar horário.

`recordedAt` é o instante UTC em que o evento entrou no livro; uma importação histórica usa a hora da importação. `generatedAt` é o instante UTC do checkpoint. A data `occurredOn` não pode ser posterior ao dia de `recordedAt` **convertido para America/Sao_Paulo**.

A ordem é definida por `sequence`, não por relógio. O verificador aceita `recordedAt` fora de ordem. `lastUpdatedAt` é o maior instante declarado na cadeia (ou `null` se vazia). O comando local de inclusão recusa relógio regressivo ao criar um evento novo, como proteção operacional do escritor; isso não é uma exigência de monotonicidade para verificar livros de outros produtores.

## 3. Envelope e payloads completos

O envelope de cada evento tem exatamente estas seis chaves:

| Chave | Tipo/valor |
|---|---|
| `schemaVersion` | Número literal `1` |
| `sequence` | `PositiveDecimal`; primeiro evento `"1"`, depois `"2"` e assim por diante, sem lacuna |
| `previousHash` | `Hash`; primeiro evento tem 64 zeros; demais têm o `hash` do anterior |
| `recordedAt` | `Instant` |
| `payload` | Exatamente uma das variantes abaixo |
| `hash` | `Hash`, calculado conforme §4 |

### Campos comuns a todos os payloads

| Chave | Tipo/valor |
|---|---|
| `type` | Literal da família: `"project"`, `"finance"`, `"field"` ou `"candidate"` |
| `action` | Um dos literais da variante, listados abaixo |
| `occurredOn` | `Date` em America/Sao_Paulo |
| `correctionOf` | `null` num fato original ou `PositiveDecimal` da sequência anterior corrigida; regras do §6 |

Nas tabelas seguintes, **“comuns” significa exatamente essas quatro chaves**, às quais se somam somente as chaves específicas indicadas. Campos de outra variante também são extras e devem ser rejeitados.

### Família project

| `action` | Lista completa de chaves | Restrição dos campos específicos |
|---|---|---|
| `"repository_created"` | comuns + `repository` | `repository` é a string literal `"LucasOl1337/VidaNova"` |
| `"decision_recorded"` | comuns + `decisionId`, `sourceCommit` | `decisionId` corresponde a `^D[0-9]{3}$`; `sourceCommit` é `Commit` |
| `"pull_request_merged"` | comuns + `pullRequest`, `mergeCommit` | `pullRequest` é `PositiveDecimal`; `mergeCommit` é `Commit` |

`type` é sempre `"project"`. Links são **derivados**, não campos do payload: prefixo literal `https://github.com/LucasOl1337/VidaNova`; repositório usa o prefixo; decisão usa `{prefixo}/blob/{sourceCommit}/docs/DECISOES.md`; PR usa `{prefixo}/pull/{pullRequest}`. Não aceitar URL arbitrária. O commit de merge continua no evento para comparar com o GitHub/Git.

### Família finance

| Chave | Tipo/valor |
|---|---|
| `type` | `"finance"` |
| `action` | `"movement_recorded"` ou `"reversal"` |
| `occurredOn` | `Date` em America/Sao_Paulo |
| `correctionOf` | Obrigatoriamente `null` em `movement_recorded`; obrigatoriamente `PositiveDecimal` em `reversal` |
| `currency` | String literal `"BRL"` |
| `amountCents` | `SignedCents`: delta positivo de entrada ou negativo de saída; estorno tem sinal inverso ao movimento alvo |
| `category` | **Somente** `"donation"`, `"food"`, `"clothing"`, `"hygiene"`, `"operations"`, `"fee"`, `"refund"` |
| `evidence` | **Somente** `"pending"` ou `"not_published"` |

Essas oito chaves são a lista completa. `pending` indica evidência pendente; `not_published` indica que não está publicada. Nenhum dos dois significa comprovante conferido. A v1 não aceita anexo, hash de comprovante, URL ou evidência privada. Extensão para comprovantes expurgados requer contrato versionado e revisão antes da F2.

### Família field

| Chave | Tipo/valor |
|---|---|
| `type` | `"field"` |
| `action` | **Somente** `"food_delivered"`, `"clothing_delivered"`, `"hygiene_delivered"` |
| `occurredOn` | `Date` em America/Sao_Paulo |
| `correctionOf` | `null` ou `PositiveDecimal` |
| `quantity` | `PositiveDecimal` |

Essas cinco chaves são a lista completa. Sem pessoa, endereço, estabelecimento, observação ou localização.

### Família candidate

| Chave | Tipo/valor |
|---|---|
| `type` | `"candidate"` |
| `action` | **Somente** `"contact_completed"`, `"interview_completed"`, `"referral_completed"`, `"support_completed"` |
| `occurredOn` | `Date` em America/Sao_Paulo |
| `correctionOf` | `null` ou `PositiveDecimal` |
| `count` | `PositiveDecimal`; contagem agregada da ação |

Essas cinco chaves são a lista completa. Não existe identificador ou pseudônimo de candidato, nem ligação de trajetória individual. O schema não autoriza coleta/atendimento e não substitui revisão humana do risco de identificação por combinação de dia e contagem.

## 4. Cálculo e validação da cadeia

Para cada evento, remover **apenas** a propriedade de topo `hash`. O objeto resultante deve conter exatamente `schemaVersion`, `sequence`, `previousHash`, `recordedAt`, `payload`.

```text
unsigned = {schemaVersion, sequence, previousHash, recordedAt, payload}
hash = lowercase_hex(SHA-256(UTF8(JCS(unsigned))))
```

JCS segue [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785) (consultado em 22/09/2026): ordenar recursivamente chaves por unidades UTF-16, preservar a ordem dos arrays, serializar primitivas como ECMAScript, não normalizar Unicode nem emitir espaços/quebras de linha. O `hash` não é hash do arquivo, do payload isolado nem da concatenação de campos. `recordedAt` está incluído. A ordem das cinco chaves na notação acima não altera o resultado porque JCS as ordena.

Verificar schema fechado antes dos hashes. Percorrer na ordem do array, exigindo `sequence == índice + 1`, `previousHash` igual ao hash anterior e hash recalculado igual ao publicado. Verificar data conforme §2, duplicatas e correções conforme §6. Campo extra, lacuna, remoção intermediária, inversão ou alteração de conteúdo invalidam o livro. Remoção do fim exige referência de tamanho/cabeça conhecida (§5).

## 5. Checkpoint, documento e assinatura

O checkpoint tem exatamente cinco chaves:

| Chave | Tipo/valor |
|---|---|
| `schemaVersion` | Número literal `1` |
| `ledger` | String literal **`"vidanova-public-actions"`** |
| `sequence` | `NonNegativeDecimal`: tamanho do prefixo representado; `"0"` no vazio |
| `headHash` | `Hash` do evento dessa sequência; 64 zeros se sequência `"0"` |
| `generatedAt` | `Instant`; não pode anteceder nenhum `recordedAt` do prefixo representado |

Para o **documento completo** `{events, checkpoint}`, o tamanho do array deve ser igual ao número de `checkpoint.sequence`. Para conferir um **checkpoint antigo separado**, permitir uma cadeia maior, mas exigir que a sequência conhecida ainda exista, tenha o mesmo hash, e que todo o restante também seja válido. Se o livro está menor que o checkpoint, falhar. Um checkpoint vazio exige cabeça zero.

Um checkpoint recém-baixado junto do livro só prova consistência interna. Para detectar reescrita completa ou retirada do fim, comparar com cópia anterior sob outro controle. Hash não prova fatos no mundo real ou ações omitidas antes do registro.

O arquivo opcional de checkpoint assinado tem exatamente: `schemaVersion: 1`, `algorithm: "Ed25519"`, `publicKey` (64 caracteres hexadecimais minúsculos, 32 bytes brutos), `checkpoint` (objeto acima) e `signature` (128 caracteres hexadecimais minúsculos, 64 bytes). A assinatura Ed25519 cobre **UTF8(JCS(checkpoint))**, sem prehash da aplicação. O verificador exige a chave pública conhecida por canal confiável e verifica que coincide com `publicKey`; confiar só na chave trazida pelo próprio arquivo não prova autoria. O envelope assinado inteiro não entra na cadeia de eventos.

Não há chave de produção, assinatura real, carimbo ou espelho ativo nesta entrega. Custódia e primeira ancoragem OpenTimestamps são do Regente. Procedimento em [OPERACAO.md](OPERACAO.md).

## 6. Referências, duplicatas e totais

1. `correctionOf` não nulo deve apontar para sequência existente, estritamente menor que a atual, da mesma família. Uma sequência só pode ser alvo direto de uma correção; uma correção não financeira pode depois ser corrigida por outra, formando uma cadeia.
2. Projeto/campo/candidato: a ação corrigida deve ser a mesma ação. Projeto também conserva `decisionId` ou `pullRequest`, quando aplicável. Correção é payload completo substituto; as linhas antigas permanecem visíveis, marcadas como corrigidas. Na contagem de ações, não somar original e substituto como dois fatos distintos.
3. Financeiro: o alvo deve ser `movement_recorded`, ainda não estornado, da mesma `category` e `currency` (BRL). O novo evento é `reversal`, e `amountCents` deve ser exatamente o inteiro oposto ao alvo. Não estornar um estorno. Se precisar corrigir o valor, fazer estorno e depois novo `movement_recorded`.
4. Para eventos `project` com `correctionOf: null`, rejeitar segundo `repository_created`, `decisionId` já registrado ou `pullRequest` já registrado. Correções legítimas não contam como essas duplicatas. Movimentos e contagens não têm deduplicação automática de origem na v1; operador confere antes de repetir um comando interrompido.
5. `balanceCents` é a soma inteira **de todos os deltas financeiros**, inclusive estornos. `totalsByCategory` soma esses mesmos deltas por categoria presente; categoria ausente é omitida. Livro sem finanças resulta em `"0"` e `{}`. Correção financeira não apaga o delta original. Nenhuma regra exige saldo não negativo; conferir integridade não equivale a conciliar conta bancária.

## 7. Vetor mínimo de conformidade

**DADO FICTÍCIO PARA TESTE. Não é uma entrega realizada.** Uma implementação independente deve obter o hash abaixo sem consultar o TypeScript.

Entrada exata de SHA-256 em UTF-8, em uma linha, **sem quebra de linha final**:

```json
{"payload":{"action":"food_delivered","correctionOf":null,"occurredOn":"2000-01-01","quantity":"1","type":"field"},"previousHash":"0000000000000000000000000000000000000000000000000000000000000000","recordedAt":"2000-01-02T12:00:00.000Z","schemaVersion":1,"sequence":"1"}
```

Hash esperado:

```text
a8183311eaf2313a098f25b08352e4676b9555c4a3c752efc024c60063c3d454
```

Documento lógico completo (indentado só para leitura; na publicação aplicar JCS):

```json
{
  "events": [{
    "schemaVersion": 1,
    "sequence": "1",
    "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
    "recordedAt": "2000-01-02T12:00:00.000Z",
    "payload": {
      "type": "field",
      "action": "food_delivered",
      "occurredOn": "2000-01-01",
      "correctionOf": null,
      "quantity": "1"
    },
    "hash": "a8183311eaf2313a098f25b08352e4676b9555c4a3c752efc024c60063c3d454"
  }],
  "checkpoint": {
    "schemaVersion": 1,
    "ledger": "vidanova-public-actions",
    "sequence": "1",
    "headHash": "a8183311eaf2313a098f25b08352e4676b9555c4a3c752efc024c60063c3d454",
    "generatedAt": "2000-01-02T12:00:00.000Z"
  }
}
```

Resultado esperado: válido, um evento, `balanceCents: "0"`, `totalsByCategory: {}`, `lastUpdatedAt: "2000-01-02T12:00:00.000Z"`. Trocar somente `quantity` por `"2"` sem recalcular o hash deve falhar. Apagar o evento mantendo o checkpoint deve falhar. Acrescentar `name` ao payload deve falhar mesmo se o hash for recalculado.

O mesmo vetor, marcado fictício, está em `src/data/ledger/conformance.fixture.json`. Testes conferem a fixture, os bytes acima e o hash fixo. O lote real não importa essa fixture.

## 8. API para F07

`src/lib/ledger/index.ts` é o entrypoint puro, sem Node, filesystem ou import do livro real. Exporta tipos/schemas, `canonicalize`, `parseJson`, `parseCanonicalJson`, `verifyLedger`, `verifyDocument`, `verifyCheckpointSignature` e `dateInSaoPaulo`. `published.ts` é separado e exclusivo do build; fornece o documento real validado e `ledgerTrust`.

```ts
import { parseCanonicalJson, verifyDocument } from '../lib/ledger';

const response = await fetch('/livro/ledger.json');
if (!response.ok) throw new Error('Livro indisponível');
const result = await verifyDocument(parseCanonicalJson(await response.text()));
// valid: true prova consistência interna, não assinatura ou confiança externa.
// Para comparar cópia antiga: verifyLedger(document.events, checkpointGuardado).
```

`verifyLedger` recebe array desconhecido e checkpoint separado opcional; `verifyDocument` recebe `{events, checkpoint}`. Ambos retornam uma união discriminada por `valid`. Falha: `{valid: false, code, sequence?}`; códigos `invalid_schema`, `sequence`, `previous_hash`, `hash`, `time`, `correction`, `duplicate_source`, `checkpoint`, `crypto_unavailable`. Sucesso: `{valid: true, eventCount, headHash, lastUpdatedAt, balanceCents, totalsByCategory, checkpointMatched}`. `checkpointMatched` indica correspondência ao checkpoint fornecido, não autoria nem prova externa.

Web Crypto exige contexto seguro (HTTPS ou localhost); ausência retorna `crypto_unavailable`. Não transformar erro em selo de integridade. A data pública já é uma data brasileira: formatar `occurredOn` como dia/mês/ano sem convertê-la novamente como um instante UTC. `recordedAt`/`lastUpdatedAt` são instantes; podem ser apresentados em America/Sao_Paulo.
