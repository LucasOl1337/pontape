import { describe, expect, it } from 'vitest';
import { acceptIngest, takeOnce } from './ingest';

// Fictional donation. No person, no real charge.
const donation = {
  occurredOn: '2000-01-01',
  correctionOf: null,
  type: 'finance',
  action: 'movement_recorded',
  currency: 'BRL',
  amountCents: '2000',
  category: 'donation',
  evidence: 'pending',
};

const envelope = { source: 'test', eventId: 'charge_ficticia_1', payload: donation };

describe('recibo do livro (F42 E2)', () => {
  it('aceita um envelope fictício e guarda a chave da fonte', () => {
    const result = acceptIngest(envelope);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.key).toBe('test:charge_ficticia_1');
    expect(result.receipt.payload).toEqual(donation);
  });

  it('rejeita nome, CPF e campo fora da lista', () => {
    for (const extra of [{ name: 'Pessoa fictícia' }, { cpf: '00000000000' }, { email: 'a@example.com' }, { note: 'texto' }]) {
      expect(acceptIngest({ ...envelope, ...extra }).ok).toBe(false);
      expect(acceptIngest({ ...envelope, payload: { ...donation, ...extra } }).ok).toBe(false);
    }
  });

  it('o mesmo evento duas vezes não entra de novo', () => {
    const first = acceptIngest(envelope);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const once = takeOnce(new Set(), first.receipt.key);
    expect(once.duplicate).toBe(false);
    const twice = takeOnce(once.seen, first.receipt.key);
    expect(twice.duplicate).toBe(true);
    expect(twice.seen.size).toBe(1);
  });
});
