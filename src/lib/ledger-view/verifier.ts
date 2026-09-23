import type { LedgerEvent, LedgerPayload } from '../ledger/schema';

// PROVISIONAL (D014): the site's verifier and chain builder come from F08 (src/lib/ledger/).
// Until its core lands, this file stands behind the same interface, and only it changes on the swap.

// Same value as GENESIS_HASH in src/lib/ledger/schema.ts (a test keeps them equal). Importing the
// constant from there would pull zod into the browser bundle.
export const GENESIS_HASH = '0'.repeat(64);

export type VerifyResult =
  | { ok: true; checked: number }
  | { ok: false; checked: number; at: string; reason: 'missing' | 'link' | 'changed'; expected?: string };

export type LedgerVerifier = (
  events: LedgerEvent[],
  onStep?: (event: LedgerEvent, index: number) => void | Promise<void>,
) => Promise<VerifyResult>;

// JCS (RFC 8785) for what the contract allows: strings, integers, null and objects.
export const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const hashEvent = (e: Omit<LedgerEvent, 'hash'>) => sha256Hex(canonical({
  schemaVersion: e.schemaVersion, sequence: e.sequence, previousHash: e.previousHash, recordedAt: e.recordedAt, payload: e.payload,
}));

export const canVerifyHere = () => Boolean(globalThis.crypto?.subtle);

// Walks the chain from the first action and stops at the first break, saying why.
export const verifyLedger: LedgerVerifier = async (events, onStep) => {
  for (const [i, e] of events.entries()) {
    const expected = String(i + 1);
    if (e.sequence !== expected) return { ok: false, checked: i, at: e.sequence, reason: 'missing', expected };
    const previous = i === 0 ? GENESIS_HASH : events[i - 1]?.hash;
    if (e.previousHash !== previous) return { ok: false, checked: i, at: e.sequence, reason: 'link' };
    if (await hashEvent(e) !== e.hash) return { ok: false, checked: i, at: e.sequence, reason: 'changed' };
    await onStep?.(e, i);
  }
  return { ok: true, checked: events.length };
};

// Chains payloads into events. Used only to turn the F08 fixture into the example ledger.
export async function chainPayloads(items: { recordedAt: string; payload: LedgerPayload }[]): Promise<LedgerEvent[]> {
  const events: LedgerEvent[] = [];
  for (const [i, { recordedAt, payload }] of items.entries()) {
    const draft = { schemaVersion: 1 as const, sequence: String(i + 1), previousHash: events[i - 1]?.hash ?? GENESIS_HASH, recordedAt, payload };
    events.push({ ...draft, hash: await hashEvent(draft) });
  }
  return events;
}
