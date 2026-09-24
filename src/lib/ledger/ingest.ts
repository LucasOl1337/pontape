import { ledgerPayloadSchema, type LedgerPayload } from './schema.ts';
import * as z from 'zod/mini';

// What an authorized source may hand the worker. Closed list: no name, CPF or free text.
const sourceSchema = z.enum(['test', 'asaas', 'stripe']);
const eventIdSchema = z.string().check(z.regex(/^[A-Za-z0-9:_-]{1,80}$/));

export const ingestEnvelopeSchema = z.strictObject({
  source: sourceSchema,
  eventId: eventIdSchema,
  payload: ledgerPayloadSchema,
});

export type IngestReceipt = { key: string; payload: LedgerPayload };

export function idempotencyKey(source: string, eventId: string): string {
  return `${source}:${eventId}`;
}

/** Accepts one envelope or rejects it. A duplicate key is the caller's job, so a retry stays the same event. */
export function acceptIngest(input: unknown): { ok: true; receipt: IngestReceipt } | { ok: false } {
  const parsed = ingestEnvelopeSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  return {
    ok: true,
    receipt: { key: idempotencyKey(parsed.data.source, parsed.data.eventId), payload: parsed.data.payload },
  };
}

/** Returns whether this key was already accepted. The set grows only for a new key. */
export function takeOnce(seen: ReadonlySet<string>, key: string): { duplicate: boolean; seen: Set<string> } {
  if (seen.has(key)) return { duplicate: true, seen: new Set(seen) };
  const next = new Set(seen);
  next.add(key);
  return { duplicate: false, seen: next };
}
