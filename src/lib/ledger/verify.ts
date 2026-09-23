import { dateInSaoPaulo } from './date.ts';
import { canonicalize } from './canonical.ts';
import {
  GENESIS_HASH, ledgerCheckpointSchema, ledgerDocumentSchema, ledgerPayloadSchema, ledgerSchema,
  type LedgerCheckpoint, type LedgerEvent,
} from './schema.ts';

export type VerificationCode = 'invalid_schema' | 'sequence' | 'previous_hash' | 'hash'
  | 'time' | 'correction' | 'duplicate_source' | 'checkpoint' | 'crypto_unavailable';
export type LedgerVerification = {
  valid: true;
  eventCount: number;
  headHash: string;
  lastUpdatedAt: string | null;
  balanceCents: string;
  totalsByCategory: Record<string, string>;
  checkpointMatched: boolean;
} | { valid: false; code: VerificationCode; sequence?: string };

export async function sha256(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function eventHash(event: Omit<LedgerEvent, 'hash'>): Promise<string> {
  return sha256(canonicalize(event));
}

/** Both CLI and browser use this function; no filesystem, network or Node imports. */
export async function verifyLedger(input: unknown, expectedCheckpoint?: unknown): Promise<LedgerVerification> {
  const parsed = ledgerSchema.safeParse(input);
  if (!parsed.success) return { valid: false, code: 'invalid_schema' };
  if (!globalThis.crypto?.subtle) return { valid: false, code: 'crypto_unavailable' };
  const events = parsed.data;
  let previousHash = GENESIS_HASH;
  let balance = 0n;
  const totals = new Map<string, bigint>();
  const corrected = new Set<string>();
  const sources = new Set<string>();
  for (const [index, event] of events.entries()) {
    const fail = (code: VerificationCode): LedgerVerification => ({ valid: false, code, sequence: event.sequence });
    if (event.sequence !== String(index + 1)) return fail('sequence');
    if (event.previousHash !== previousHash) return fail('previous_hash');
    const { hash, ...unsigned } = event;
    if (await eventHash(unsigned) !== hash) return fail('hash');
    if (event.payload.occurredOn > dateInSaoPaulo(event.recordedAt)) return fail('time');
    const payload = event.payload;
    if (payload.correctionOf !== null) {
      const reference = BigInt(payload.correctionOf);
      if (reference >= BigInt(event.sequence) || corrected.has(payload.correctionOf)) return fail('correction');
      const target = events[Number(reference - 1n)]?.payload;
      if (!target || target.type !== payload.type) return fail('correction');
      if (payload.type === 'finance') {
        if (target.type !== 'finance' || target.action !== 'movement_recorded'
          || payload.action !== 'reversal' || target.category !== payload.category
          || BigInt(payload.amountCents) !== -BigInt(target.amountCents)) return fail('correction');
      } else {
        if (target.action !== payload.action) return fail('correction');
        if (payload.type === 'project' && target.type === 'project') {
          if (payload.action === 'decision_recorded' && target.action === 'decision_recorded'
            && payload.decisionId !== target.decisionId) return fail('correction');
          if (payload.action === 'pull_request_merged' && target.action === 'pull_request_merged'
            && payload.pullRequest !== target.pullRequest) return fail('correction');
        }
      }
      corrected.add(payload.correctionOf);
    }
    if (payload.type === 'project' && payload.correctionOf === null) {
      const source = payload.action === 'decision_recorded' ? `decision:${payload.decisionId}`
        : payload.action === 'pull_request_merged' ? `pr:${payload.pullRequest}` : 'repository';
      if (sources.has(source)) return fail('duplicate_source');
      sources.add(source);
    }
    if (payload.type === 'finance') {
      const amount = BigInt(payload.amountCents);
      balance += amount;
      totals.set(payload.category, (totals.get(payload.category) ?? 0n) + amount);
    }
    previousHash = hash;
  }
  if (expectedCheckpoint !== undefined) {
    const checkpoint = ledgerCheckpointSchema.safeParse(expectedCheckpoint);
    if (!checkpoint.success) return { valid: false, code: 'checkpoint' };
    const length = BigInt(checkpoint.data.sequence);
    if (length > BigInt(events.length)) return { valid: false, code: 'checkpoint' };
    const knownEvent = length === 0n ? undefined : events[Number(length - 1n)];
    if (checkpoint.data.headHash !== (knownEvent?.hash ?? GENESIS_HASH)
      || events.slice(0, Number(length)).some(event => checkpoint.data.generatedAt < event.recordedAt)) return { valid: false, code: 'checkpoint' };
  }
  return {
    valid: true, eventCount: events.length, headHash: previousHash,
    lastUpdatedAt: events.reduce<string | null>((latest, event) => latest === null || event.recordedAt > latest ? event.recordedAt : latest, null),
    balanceCents: String(balance),
    totalsByCategory: Object.fromEntries([...totals].map(([key, value]) => [key, String(value)])),
    checkpointMatched: expectedCheckpoint !== undefined,
  };
}

export async function appendEvent(input: unknown, payloadInput: unknown, recordedAt: string): Promise<LedgerEvent[]> {
  const result = await verifyLedger(input);
  if (!result.valid) throw new Error(`Livro inválido: ${result.code}.`);
  if (result.lastUpdatedAt !== null && recordedAt < result.lastUpdatedAt) throw new Error('Evento inválido: time (relógio regressivo).');
  const events = ledgerSchema.parse(input);
  const unsigned = {
    schemaVersion: 1 as const,
    sequence: String(events.length + 1),
    previousHash: result.headHash,
    recordedAt,
    payload: ledgerPayloadSchema.parse(payloadInput),
  };
  const next = [...events, { ...unsigned, hash: await eventHash(unsigned) }];
  const checked = await verifyLedger(next);
  if (!checked.valid) throw new Error(`Evento inválido: ${checked.code}.`);
  return next;
}

export function createCheckpoint(events: LedgerEvent[], generatedAt: string): LedgerCheckpoint {
  return ledgerCheckpointSchema.parse({
    schemaVersion: 1, ledger: 'vidanova-public-actions', sequence: String(events.length),
    headHash: events.at(-1)?.hash ?? GENESIS_HASH, generatedAt,
  });
}

export async function verifyDocument(input: unknown): Promise<LedgerVerification> {
  const parsed = ledgerDocumentSchema.safeParse(input);
  if (!parsed.success) return { valid: false, code: 'invalid_schema' };
  if (parsed.data.checkpoint.sequence !== String(parsed.data.events.length)) return { valid: false, code: 'checkpoint' };
  return verifyLedger(parsed.data.events, parsed.data.checkpoint);
}
