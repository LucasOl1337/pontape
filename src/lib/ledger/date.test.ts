import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import { dateInSaoPaulo } from './date';
import { appendEvent } from './verify';

describe('data pública brasileira', () => {
  it('mostra a noite de 22/09 mesmo quando o horário UTC já é 23/09', () => {
    expect(dateInSaoPaulo('2026-09-23T00:50:55.000Z')).toBe('2026-09-22');
    expect(dateInSaoPaulo('2026-09-23T02:59:59.999Z')).toBe('2026-09-22');
    expect(dateInSaoPaulo('2026-09-23T03:00:00.000Z')).toBe('2026-09-23');
  });
  it('usa o fuso IANA, incluindo horário de verão histórico', () => {
    expect(dateInSaoPaulo('2018-12-01T02:30:00.000Z')).toBe('2018-12-01');
    expect(dateInSaoPaulo('2026-12-01T02:30:00.000Z')).toBe('2026-11-30');
  });
  it('recusa fato ainda futuro no Brasil, mesmo se o dia UTC já chegou', async () => {
    await expect(appendEvent([], { ...fixture.payloads[2], occurredOn: '2026-09-23' }, '2026-09-23T00:50:55.000Z')).rejects.toThrow('time');
    await expect(appendEvent([], { ...fixture.payloads[2], occurredOn: '2026-09-22' }, '2026-09-23T00:50:55.000Z')).resolves.toHaveLength(1);
  });
});
