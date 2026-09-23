import { z } from 'zod';
import { ledgerPayloadSchema, ledgerSchema, type LedgerPayload } from '../../src/lib/ledger/schema.ts';
import { dateInSaoPaulo } from '../../src/lib/ledger/date.ts';

export type ProjectPayload = Extract<LedgerPayload, { type: 'project' }>;
export interface ProjectFact {
  order: number;
  payload: ProjectPayload;
}

const commitSchema = z.string().regex(/^[a-f0-9]{40}$/);
const apiPullSchema = z.object({
  number: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  merged_at: z.iso.datetime().nullable(),
  merge_commit_sha: commitSchema.nullable(),
  base: z.object({ ref: z.string(), repo: z.object({ full_name: z.string() }) }),
});

export function decisionsFromMarkdown(markdown: string): { id: string; date: string }[] {
  const decisions: { id: string; date: string }[] = [];
  const seen = new Set<string>();
  for (const line of markdown.split(/\r?\n/)) {
    if (!/^\|\s*D\d{3}\s*\|/.test(line)) continue;
    const match = /^\|\s*(D\d{3})\s*\|\s*(\d{2})\/(\d{2})\/(\d{4})\s*\|/.exec(line);
    if (!match) throw new Error('Linha de decisão sem data DD/MM/AAAA válida.');
    const [, id, day, month, year] = match;
    const date = z.iso.date().parse(`${year}-${month}-${day}`);
    if (seen.has(id!)) throw new Error('ID de decisão repetido no documento.');
    seen.add(id!);
    decisions.push({ id: id!, date });
  }
  return decisions;
}

/** metadata may include open PRs; only merged PRs already in this main snapshot count. */
export function pullFacts(input: unknown, commitOrder: ReadonlyMap<string, number>): ProjectFact[] {
  const pulls = z.array(apiPullSchema).parse(input);
  return pulls.flatMap(pull => {
    if (pull.base.ref !== 'main' || pull.base.repo.full_name !== 'LucasOl1337/VidaNova' || !pull.merged_at) return [];
    if (!pull.merge_commit_sha) throw new Error('PR integrada sem commit de merge.');
    const order = commitOrder.get(pull.merge_commit_sha);
    if (order === undefined) return []; // A newer merge can appear while the API is paginated.
    return [{ order, payload: {
      type: 'project' as const, action: 'pull_request_merged' as const,
      occurredOn: dateInSaoPaulo(pull.merged_at), correctionOf: null,
      pullRequest: String(pull.number), mergeCommit: pull.merge_commit_sha,
    } }];
  });
}

function sourceKey(payload: ProjectPayload): string {
  if (payload.action === 'decision_recorded') return `decision:${payload.decisionId}`;
  if (payload.action === 'pull_request_merged') return `pr:${payload.pullRequest}`;
  return 'repository';
}

/** Pure planning: no network, I/O, clock or writes. Existing IDs are successful no-ops. */
export function planProjectEvents(ledger: unknown, facts: readonly ProjectFact[]): ProjectPayload[] {
  const events = ledgerSchema.parse(ledger);
  const known = new Set(events.flatMap(event => event.payload.type === 'project' ? [sourceKey(event.payload)] : []));
  const validated = facts.map(fact => {
    if (!Number.isSafeInteger(fact.order) || fact.order < 0) throw new Error('Ordem de commit inválida.');
    const payload = ledgerPayloadSchema.parse(fact.payload);
    if (payload.type !== 'project' || payload.action === 'repository_created' || payload.correctionOf !== null) {
      throw new Error('Automação aceita apenas novas PRs e decisões do projeto.');
    }
    return { order: fact.order, payload };
  }).sort((a, b) => a.order - b.order || sourceKey(a.payload).localeCompare(sourceKey(b.payload), 'en'));
  const planned: ProjectPayload[] = [];
  for (const { payload } of validated) {
    const key = sourceKey(payload);
    if (known.has(key)) continue;
    known.add(key);
    planned.push(payload);
  }
  return planned;
}
