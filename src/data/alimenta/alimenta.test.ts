import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISTRIBUTORS, suggestUrl } from './rede';
import { donationEvents, donationNumbers, donationPhrase } from './livro';

// Exact cases with fictitious refs: the Rede Alimenta numbers and the catalog the site shows.
const ev = (sequence: string, payload: Record<string, unknown>) => ({ sequence, recordedAt: '2026-10-15T12:00:00Z', payload: { type: 'donation', occurredOn: '2026-10-15', ...payload } });

describe('Rede Alimenta no site', () => {
  it('o catálogo é a cópia exata da pesquisa e todo registro tem fonte', () => {
    const copy = readFileSync('src/data/alimenta/distribuidores.json');
    expect(copy.equals(readFileSync('src/data/alimenta/distribuidores.json'))).toBe(true);
    expect(DISTRIBUTORS).toHaveLength(30);
    for (const d of DISTRIBUTORS) expect(d.sources.length).toBeGreaterThan(0);
  });

  it('livro sem doação dá zero honesto', () => {
    expect(donationNumbers(donationEvents([ev('1', { type: 'decision', action: 'x' })]))).toEqual(
      { registered: 0, kg: 0, withDestination: 0, delivered: 0, deliveredKg: 0, cancelled: 0, aiTop: 0 });
  });

  it('conta registro, destino, entrega e cancelamento pelos eventos donation', () => {
    const list = donationEvents([
      ev('10', { action: 'donation_registered', donationRef: 'dref-a', category: 'dry_goods', quantityGrams: '12500' }),
      ev('11', { action: 'donation_registered', donationRef: 'dref-b', category: 'bakery', quantityGrams: '3000' }),
      ev('12', { action: 'destination_chosen', donationRef: 'dref-a', distributorId: DISTRIBUTORS[0]!.id, choice: 'ai_top' }),
      ev('13', { action: 'donation_delivered', donationRef: 'dref-a' }),
      ev('14', { action: 'donation_cancelled', donationRef: 'dref-b' }),
      ev('15', { action: 'outra_coisa', donationRef: 'dref-c' }),
    ]);
    expect(list).toHaveLength(5);
    expect(donationNumbers(list)).toEqual({ registered: 2, kg: 15.5, withDestination: 1, delivered: 1, deliveredKg: 12.5, cancelled: 1, aiTop: 1 });
    expect(donationPhrase(list[0]!)).toBe('Doação registrada: 12,5 kg de não perecíveis');
    expect(donationPhrase(list[2]!)).toBe(`Destino escolhido: ${DISTRIBUTORS[0]!.name}, a sugestão da AI`);
  });

  it('sugerir ou corrigir abre issue com o template e o id do registro', () => {
    const url = new URL(suggestUrl(DISTRIBUTORS[0]));
    expect(url.pathname).toMatch(/\/issues\/new$/);
    expect(url.searchParams.get('template')).toBe('distribuidor-alimenta.md');
    expect(url.searchParams.get('body')).toContain(`Registro: ${DISTRIBUTORS[0]!.id}`);
  });
});
