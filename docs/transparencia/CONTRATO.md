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
