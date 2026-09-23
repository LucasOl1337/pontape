import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import { appendEvent, verifyLedger } from './verify';
import type { LedgerEvent } from './schema';

describe('modo exemplo fictício completo', () => {
  it('confere 20 ações, gastos de todas as categorias, estorno e entregas', async () => {
    expect(fixture.notice).toContain('DADOS FICTÍCIOS');
    let events: LedgerEvent[] = [];
    for (const payload of fixture.payloads) events = await appendEvent(events, payload, '2000-01-01T12:00:00.000Z');
    expect(await verifyLedger(events)).toMatchObject({
      valid: true, eventCount: 20, balanceCents: '141000',
      totalsByCategory: { donation: '210000', food: '-16500', clothing: '-25000', hygiene: '-9000', operations: '-12000', fee: '-1500', refund: '-5000' },
    });
    expect(events.filter(event => event.payload.type === 'field').map(event => event.payload.action))
      .toEqual(['food_delivered', 'clothing_delivered', 'hygiene_delivered', 'food_delivered']);
    expect(events[13]!.payload).toMatchObject({ action: 'reversal', correctionOf: '6', amountCents: '18000' });
  });
});
