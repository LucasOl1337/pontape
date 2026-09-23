import * as z from 'zod/mini';

export const GENESIS_HASH = '0'.repeat(64);
export const REPOSITORY_URL = 'https://github.com/LucasOl1337/VidaNova';

export const hashSchema = z.string().check(z.regex(/^[a-f0-9]{64}$/));
export const sequenceSchema = z.string().check(z.regex(/^[1-9][0-9]{0,19}$/));
const countSchema = z.string().check(z.regex(/^(0|[1-9][0-9]{0,19})$/));
const commitSchema = z.string().check(z.regex(/^[a-f0-9]{40}$/));
const common = {
  occurredOn: z.iso.date(),
  correctionOf: z.nullable(sequenceSchema),
};

const projectPayloadSchema = z.discriminatedUnion('action', [
  z.strictObject({
    ...common,
    type: z.literal('project'),
    action: z.literal('repository_created'),
    repository: z.literal('LucasOl1337/VidaNova'),
  }),
  z.strictObject({
    ...common,
    type: z.literal('project'),
    action: z.literal('decision_recorded'),
    decisionId: z.string().check(z.regex(/^D[0-9]{3}$/)),
    sourceCommit: commitSchema,
  }),
  z.strictObject({
    ...common,
    type: z.literal('project'),
    action: z.literal('pull_request_merged'),
    pullRequest: sequenceSchema,
    mergeCommit: commitSchema,
  }),
]);

const financePayloadSchema = z.strictObject({
  ...common,
  type: z.literal('finance'),
  action: z.enum(['movement_recorded', 'reversal']),
  currency: z.literal('BRL'),
  // Signed delta, in cents. BigInt arithmetic; never floating point.
  amountCents: z.string().check(z.regex(/^-?[1-9][0-9]{0,19}$/)),
  category: z.enum(['donation', 'food', 'clothing', 'hygiene', 'operations', 'fee', 'refund']),
  evidence: z.enum(['pending', 'not_published']),
}).check(z.refine((event) => event.action === 'reversal'
  ? event.correctionOf !== null : event.correctionOf === null, {
  message: 'Estorno exige referência; movimento novo não corrige outro evento.',
}));

const fieldPayloadSchema = z.strictObject({
  ...common,
  type: z.literal('field'),
  action: z.enum(['food_delivered', 'clothing_delivered', 'hygiene_delivered']),
  quantity: sequenceSchema,
});

const candidatePayloadSchema = z.strictObject({
  ...common,
  type: z.literal('candidate'),
  action: z.enum(['contact_completed', 'interview_completed', 'referral_completed', 'support_completed']),
  // Aggregate count only. No stable pseudonym, location or free text.
  count: sequenceSchema,
});

export const ledgerPayloadSchema = z.union([
  projectPayloadSchema, financePayloadSchema, fieldPayloadSchema, candidatePayloadSchema,
]);

export const ledgerEventSchema = z.strictObject({
  schemaVersion: z.literal(1),
  sequence: sequenceSchema,
  previousHash: hashSchema,
  recordedAt: z.iso.datetime({ precision: 3 }),
  payload: ledgerPayloadSchema,
  hash: hashSchema,
});

export const ledgerSchema = z.array(ledgerEventSchema).check(z.maxLength(100_000));

export const ledgerCheckpointSchema = z.strictObject({
  schemaVersion: z.literal(1),
  ledger: z.literal('vidanova-public-actions'),
  sequence: countSchema,
  headHash: hashSchema,
  generatedAt: z.iso.datetime({ precision: 3 }),
});

export type LedgerPayload = z.infer<typeof ledgerPayloadSchema>;
export type LedgerEvent = z.infer<typeof ledgerEventSchema>;
export type LedgerCheckpoint = z.infer<typeof ledgerCheckpointSchema>;
export type LedgerEventType = LedgerPayload['type'];

/** Links are derived from restricted references, never accepted as arbitrary input. */
export function projectSourceUrl(payload: LedgerPayload): string | null {
  if (payload.type !== 'project') return null;
  switch (payload.action) {
    case 'repository_created': return REPOSITORY_URL;
    case 'decision_recorded': return `${REPOSITORY_URL}/blob/${payload.sourceCommit}/docs/DECISOES.md`;
    case 'pull_request_merged': return `${REPOSITORY_URL}/pull/${payload.pullRequest}`;
  }
}

/** One file is replaced atomically, keeping the current checkpoint and events together. */
export const ledgerDocumentSchema = z.strictObject({
  events: ledgerSchema,
  checkpoint: ledgerCheckpointSchema,
});
export type LedgerDocument = z.infer<typeof ledgerDocumentSchema>;
