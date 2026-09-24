import { describe, expect, it } from 'vitest';
import { olderEvents, tailEvents, TECHNICAL_VISIBLE } from './window';

describe('lista técnica (F42 E1b)', () => {
  const events = Array.from({ length: 100 }, (_, i) => i + 1);

  it('o HTML fica com as últimas 30 e o resto é o que carrega depois', () => {
    expect(TECHNICAL_VISIBLE).toBe(30);
    expect(tailEvents(events)).toEqual(events.slice(-30));
    expect(olderEvents(events)).toEqual(events.slice(0, 70));
    expect([...olderEvents(events), ...tailEvents(events)]).toEqual(events);
  });

  it('um livro curto entra inteiro', () => {
    expect(tailEvents([1, 2])).toEqual([1, 2]);
    expect(olderEvents([1, 2])).toEqual([]);
  });
});
