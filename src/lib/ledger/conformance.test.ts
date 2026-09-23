import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/conformance.fixture.json';
import { canonicalize } from './canonical';
import { eventHash, verifyDocument } from './verify';
import { ledgerEventSchema } from './schema';

const expectedHash = 'a8183311eaf2313a098f25b08352e4676b9555c4a3c752efc024c60063c3d454';
const expectedBytes = '{"payload":{"action":"food_delivered","correctionOf":null,"occurredOn":"2000-01-01","quantity":"1","type":"field"},"previousHash":"0000000000000000000000000000000000000000000000000000000000000000","recordedAt":"2000-01-02T12:00:00.000Z","schemaVersion":1,"sequence":"1"}';

describe('vetor público para implementação independente', () => {
  it('fixa bytes, hash e exemplo publicado no CONTRATO', async () => {
    expect(fixture.notice).toContain('FICTÍCIO');
    const { hash, ...unsigned } = ledgerEventSchema.parse(fixture.events[0]);
    expect(canonicalize(unsigned)).toBe(expectedBytes);
    expect(hash).toBe(expectedHash);
    expect(await eventHash(unsigned)).toBe(expectedHash);
    expect(await verifyDocument({ events: fixture.events, checkpoint: fixture.checkpoint }))
      .toMatchObject({ valid: true, eventCount: 1, balanceCents: '0' });
    const contract = readFileSync(new URL('../../../docs/transparencia/CONTRATO.md', import.meta.url), 'utf8');
    expect(contract).toContain(expectedBytes);
    expect(contract).toContain(expectedHash);
  });
});
