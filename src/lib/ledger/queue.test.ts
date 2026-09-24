import { describe, expect, it } from 'vitest';
import { ack, head, push } from './queue';
import type { LedgerPayload } from './schema';

const payload = {
  occurredOn: '2000-01-01', correctionOf: null, type: 'finance', action: 'movement_recorded',
  currency: 'BRL', amountCents: '2000', category: 'donation', evidence: 'pending',
} as LedgerPayload;

describe('fila do livro', () => {
  const item = { key: 'test:1', payload, receivedAt: '2000-01-02T00:00:00.000Z' };

  it('guarda o item até o ack e não duplica', () => {
    const first = push({ pending: [], done: [] }, item);
    expect(first.duplicate).toBe(false);
    expect(head(first.state)?.key).toBe('test:1');
    const again = push(first.state, item);
    expect(again.duplicate).toBe(true);
    expect(again.state.pending).toHaveLength(1);
    const done = ack(first.state, item.key);
    expect(head(done)).toBeNull();
    expect(push(done, item).duplicate).toBe(true);
  });
});
