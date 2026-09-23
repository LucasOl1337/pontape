import fixture from '../../data/ledger/example.fixture.json';
import { publishedLedger, publishedAuthentication } from '../ledger/published';
import { appendEvent, createCheckpoint } from '../ledger/verify';
import type { PublishedAuthentication } from '../ledger/trust';
import type { LedgerCheckpoint, LedgerEvent } from '../ledger/schema';

// The one seam between the site and the ledger data. Both sources come from F08 (D014).
export interface LedgerView {
  authentication?: PublishedAuthentication;
  events: LedgerEvent[];
  checkpoint: LedgerCheckpoint;
}

// Real ledger, checked by F08 at build: the build stops if it does not verify.
export const getPublicLedger = async (): Promise<LedgerView> => ({
  ...await publishedLedger(), authentication: await publishedAuthentication(),
});

// Fictional F08 fixture, chained with F08's own appendEvent. Only for "Ver um exemplo".
const EXAMPLE_RECORDED_AT = '2000-01-01T12:00:00.000Z';
export async function getExampleLedger(): Promise<LedgerView> {
  let events: LedgerEvent[] = [];
  for (const payload of fixture.payloads) events = await appendEvent(events, payload, EXAMPLE_RECORDED_AT);
  return { events, checkpoint: createCheckpoint(events, EXAMPLE_RECORDED_AT) };
}
