import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/donation.fixture.json';
import { canonicalize } from './canonical';
import { acceptIngest } from './ingest';
import { ledgerPayloadSchema, type LedgerEvent } from './schema';
import { appendEvent, eventHash, nextDonationState, verifyDocument, verifyLedger } from './verify';
import { phrase } from '../ledger-view/phrases';

const at = '2000-01-02T12:00:00.000Z';
const firstHash = '1dc9919a4739f0d1774f81ce1e57751faea06ab5f0c260759dd057a495209219';
const headHash = '86db676df96a70381b6d867e7967b0cc28713b531a3b44740fb13707e357d9c2';
const firstBytes = '{"payload":{"action":"donation_registered","category":"bakery","correctionOf":null,"donationRef":"AL0000TEST","occurredOn":"2000-01-01","quantityGrams":"12500","type":"donation"},"previousHash":"0000000000000000000000000000000000000000000000000000000000000000","recordedAt":"2000-01-02T12:00:00.000Z","schemaVersion":1,"sequence":"1"}';
const base = { type: 'donation', occurredOn: '2000-01-01', correctionOf: null } as const;
const registered = (ref: string) => ({ ...base, action: 'donation_registered', donationRef: ref, category: 'bakery', quantityGrams: '1000' });
const chosen = (ref: string) => ({ ...base, action: 'destination_chosen', donationRef: ref, distributorId: 'sp-municipal-food-bank', choice: 'other' });
const delivered = (ref: string) => ({ ...base, action: 'donation_delivered', donationRef: ref });
const cancelled = (ref: string) => ({ ...base, action: 'donation_cancelled', donationRef: ref });

async function chain(payloads: unknown[]): Promise<LedgerEvent[]> {
  let events: LedgerEvent[] = [];
  for (const payload of payloads) events = await appendEvent(events, payload, at);
  return events;
}

describe('família donation (emenda de 14/10/2026)', () => {
  it('fixa bytes e hashes da fixture fictícia, igual ao conferidor Python', async () => {
    expect(fixture.notice).toContain('FICTÍCIO');
    const { hash, ...unsigned } = fixture.events[0]!;
    expect(canonicalize(unsigned)).toBe(firstBytes);
    expect(await eventHash(unsigned as Omit<LedgerEvent, 'hash'>)).toBe(firstHash);
    expect(hash).toBe(firstHash);
    expect(await verifyDocument({ events: fixture.events, checkpoint: fixture.checkpoint }))
      .toMatchObject({ valid: true, eventCount: 5, headHash, balanceCents: '0', totalsByCategory: {} });
    const contract = readFileSync(new URL('../../../docs/transparencia/CONTRATO.md', import.meta.url), 'utf8');
    expect(contract).toContain('### Família donation');
    expect(contract).toContain('`donation_order`');
  });

  it('recusa dado pessoal, cidade, texto livre e correção', () => {
    for (const field of ['email', 'name', 'cnpj', 'city', 'address', 'notes']) {
      expect(ledgerPayloadSchema.safeParse({ ...registered('AL0000TEST'), [field]: 'DADO FICTÍCIO' }).success).toBe(false);
    }
    expect(ledgerPayloadSchema.safeParse({ ...registered('AL0000TEST'), correctionOf: '1' }).success).toBe(false);
  });

  it('recusa referência, categoria, gramas, distribuidor e escolha fora do formato', () => {
    for (const donationRef of ['al0000test', 'AL000TEST', 'XX0000TEST', 'AL0000TEST1']) {
      expect(ledgerPayloadSchema.safeParse({ ...registered('AL0000TEST'), donationRef }).success).toBe(false);
    }
    for (const quantityGrams of ['0', '01', '1.5', 1000]) {
      expect(ledgerPayloadSchema.safeParse({ ...registered('AL0000TEST'), quantityGrams }).success).toBe(false);
    }
    expect(ledgerPayloadSchema.safeParse({ ...registered('AL0000TEST'), category: 'clothing' }).success).toBe(false);
    for (const distributorId of ['SP-Banco', 'sp_banco', '-sp', 'https://x.org', '']) {
      expect(ledgerPayloadSchema.safeParse({ ...chosen('AL0000TEST'), distributorId }).success).toBe(false);
    }
    expect(ledgerPayloadSchema.safeParse({ ...chosen('AL0000TEST'), choice: 'ai' }).success).toBe(false);
  });

  it('segue a ordem por donationRef', async () => {
    const ok = await chain([registered('AL00000001'), chosen('AL00000001'), chosen('AL00000001'), delivered('AL00000001')]);
    expect(await verifyLedger(ok)).toMatchObject({ valid: true, eventCount: 4 });
    await expect(chain([chosen('AL00000002')])).rejects.toThrow('donation_order');
    await expect(chain([registered('AL00000003'), registered('AL00000003')])).rejects.toThrow('donation_order');
    await expect(chain([registered('AL00000004'), delivered('AL00000004')])).rejects.toThrow('donation_order');
    await expect(chain([registered('AL00000005'), cancelled('AL00000005'), chosen('AL00000005')])).rejects.toThrow('donation_order');
    await expect(chain([...[registered('AL00000006'), chosen('AL00000006'), delivered('AL00000006')], cancelled('AL00000006')]))
      .rejects.toThrow('donation_order');
    expect(nextDonationState('registered', 'donation_cancelled')).toBe('closed');
  });

  it('entra pela porta da Rede Alimenta com source alimenta', () => {
    expect(acceptIngest({ source: 'alimenta', eventId: 'AL0000TEST:1:donation_registered', payload: registered('AL0000TEST') }))
      .toMatchObject({ ok: true, receipt: { key: 'alimenta:AL0000TEST:1:donation_registered' } });
  });

  it('diz cada ação numa frase curta, sem travessão', () => {
    const lines = fixture.events.map(e => phrase(ledgerPayloadSchema.parse(e.payload)));
    expect(lines).toEqual([
      'Doação de 12,5 kg de pães e bolos registrada (AL0000TEST)',
      'AL0000TEST vai para sp-municipal-food-bank, a escolha da AI',
      'AL0000TEST entregue, segundo quem doou',
      'Doação de 3 kg de não perecíveis registrada (AL0001TEST)',
      'AL0001TEST cancelada',
    ]);
    expect(lines.join(' ')).not.toMatch(/[—–]|\bIA\b/);
  });
});
