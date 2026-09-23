import { ledgerPayloadSchema, ledgerSchema, type LedgerEvent } from '../ledger/schema';
import fixture from '../../data/ledger/example.fixture.json';
import { chainPayloads } from './verifier';

// The one seam between the site and the ledger data (D014).
export interface PublicLedger {
  // 'pending' until F08 publishes the seeded ledger; the page then shows the honest empty state.
  status: 'published' | 'pending';
  events: LedgerEvent[];
}

// TODO(F08): import the seeded ledger from src/lib/ledger/ when its core PR lands. Nothing else changes.
export function getPublicLedger(): PublicLedger {
  return { status: 'pending', events: ledgerSchema.parse([]) };
}

// Fictional F08 fixture, only for the "Ver um exemplo" mode. Registration times are fixed so the
// hashes are the same on every build.
export async function getExampleLedger(): Promise<LedgerEvent[]> {
  const items = fixture.payloads.map((payload, i) => ({
    recordedAt: new Date(Date.UTC(2000, 0, 1, 12, i)).toISOString(),
    payload: ledgerPayloadSchema.parse(payload),
  }));
  return ledgerSchema.parse(await chainPayloads(items));
}
