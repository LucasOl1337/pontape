import { describe, expect, it } from 'vitest';
import prototypeReal from '../../../design/prototipo/ledger/real.json';
import prototypeSample from '../../../design/prototipo/ledger/sample.json';
import { eventHash, verifyLedger } from './verify';
import { ledgerSchema } from './schema';

describe('teste cruzado com o gerador independente do Design (D014)', () => {
  it('confere real.json do protótipo sem adotá-lo como fonte de produção', async () => {
    expect(await verifyLedger(prototypeReal)).toMatchObject({ valid: true, eventCount: 21, balanceCents: '0' });
  });
  it('confere sample.json fictício, inclusive estorno e contagens', async () => {
    expect(prototypeSample.notice).toContain('FICTÍCIOS');
    expect(await verifyLedger(prototypeSample.events)).toMatchObject({ valid: true, eventCount: 18, balanceCents: '410140' });
  });
  it('bate cada hash independentemente e trata sequência como ordem, não relógio', async () => {
    for (const event of ledgerSchema.parse([...prototypeReal, ...prototypeSample.events])) {
      const { hash, ...unsigned } = event;
      expect(await eventHash(unsigned)).toBe(hash);
    }
    // The independent sample has 17:00 followed by 15:00; this was not prohibited
    // by the v1 contract. Its hashed sequence is authoritative, timestamps are claims.
    expect(prototypeSample.events[9]!.recordedAt < prototypeSample.events[8]!.recordedAt).toBe(true);
  });
});
