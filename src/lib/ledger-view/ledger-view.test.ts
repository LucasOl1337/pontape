import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import { GENESIS_HASH as CONTRACT_GENESIS, ledgerPayloadSchema, type LedgerEvent, type LedgerPayload } from '../ledger/schema';
import { phrase } from './phrases';
import { correctionsOf, formatCents, sumField, sumMoney } from './money';
import { GENESIS_HASH, canonical, chainPayloads, verifyLedger } from './verifier';
import { getExampleLedger, getPublicLedger } from './source';

const common = { occurredOn: '2000-01-01', correctionOf: null };
const finance = (amountCents: string, category: string, extra: object = {}) =>
  ledgerPayloadSchema.parse({ ...common, type: 'finance', action: 'movement_recorded', currency: 'BRL', amountCents, category, evidence: 'pending', ...extra });
const chain = (payloads: LedgerPayload[]) =>
  chainPayloads(payloads.map((payload, i) => ({ recordedAt: new Date(Date.UTC(2000, 0, 1, 12, i)).toISOString(), payload })));

describe('frase de cada ação', () => {
  // Every action of the v1 contract, so a new action without a sentence fails here.
  const payloads: LedgerPayload[] = [
    { ...common, type: 'project', action: 'repository_created', repository: 'LucasOl1337/VidaNova' },
    { ...common, type: 'project', action: 'decision_recorded', decisionId: 'D006', sourceCommit: 'a'.repeat(40) },
    { ...common, type: 'project', action: 'pull_request_merged', pullRequest: '26', mergeCommit: 'b'.repeat(40) },
    ...['donation', 'food', 'clothing', 'hygiene', 'operations', 'fee', 'refund'].map(c => finance(c === 'donation' ? '100' : '-100', c)),
    ledgerPayloadSchema.parse({ ...common, type: 'finance', action: 'reversal', correctionOf: '2', currency: 'BRL', amountCents: '-100', category: 'donation', evidence: 'pending' }),
    ...(['food_delivered', 'clothing_delivered', 'hygiene_delivered'] as const).map(action => ({ ...common, type: 'field' as const, action, quantity: '2' })),
    ...(['contact_completed', 'interview_completed', 'referral_completed', 'support_completed'] as const).map(action => ({ ...common, type: 'candidate' as const, action, count: '1' })),
  ];

  it.each(payloads.map(p => [`${p.type}/${p.action}`, p] as const))('%s tem frase', (_, p) => {
    expect(phrase(p).length).toBeGreaterThan(3);
  });

  it('usa só campos fechados: decisão, PR, estorno, singular e plural', () => {
    expect(phrase(payloads[1]!)).toBe('Decisão D006 registrada');
    expect(phrase(payloads[2]!)).toBe('PR #26 integrada');
    expect(phrase(payloads[10]!)).toBe('Estorno da ação nº 2');
    expect(phrase({ ...common, type: 'candidate', action: 'interview_completed', count: '1' })).toBe('1 entrevista concluída');
    expect(phrase({ ...common, type: 'candidate', action: 'interview_completed', count: '3' })).toBe('3 entrevistas concluídas');
  });
});

describe('dinheiro', () => {
  it('soma com BigInt: doação entra, o resto sai, estorno de doação reduz a entrada', async () => {
    const events = await chain([
      finance('10000', 'donation'),
      finance('-2500', 'food'),
      finance('-150', 'fee'),
      ledgerPayloadSchema.parse({ ...common, type: 'finance', action: 'reversal', correctionOf: '1', currency: 'BRL', amountCents: '-10000', category: 'donation', evidence: 'pending' }),
      finance('9007199254740993', 'donation'),
    ]);
    const totals = sumMoney(events);
    expect(totals.inCents).toBe(9007199254740993n);
    expect(totals.outCents).toBe(2650n);
    expect(totals.balanceCents).toBe(9007199254740993n - 2650n);
    expect(totals.outByCategory).toEqual({ food: 2500n, fee: 150n });
    expect(correctionsOf(events)).toEqual({ 1: '4' });
    expect(formatCents(2650n)).toBe('R$ 26,50');
  });

  it('conta pessoas e entregas pelos números dentro do evento, não pelas linhas', async () => {
    const events = await chain([
      { ...common, type: 'candidate', action: 'interview_completed', count: '2' },
      { ...common, type: 'candidate', action: 'referral_completed', count: '1' },
      { ...common, type: 'field', action: 'food_delivered', quantity: '5' },
    ]);
    expect(sumField(events, 'candidate')).toBe(3n);
    expect(sumField(events, 'field')).toBe(5n);
  });
});

describe('verificador provisório (D014: troca pelo da F08)', () => {
  it('usa o mesmo começo de corrente do contrato', () => {
    expect(GENESIS_HASH).toBe(CONTRACT_GENESIS);
  });

  it('JCS ordena chaves e não deixa espaço', () => {
    expect(canonical({ b: '1', a: { d: null, c: 1 } })).toBe('{"a":{"c":1,"d":null},"b":"1"}');
  });

  it('passa no exemplo e acusa linha mudada, linha apagada e corrente trocada', async () => {
    const events = await getExampleLedger();
    expect(await verifyLedger(events)).toEqual({ ok: true, checked: events.length });

    const changed: LedgerEvent[] = structuredClone(events);
    const money = changed.find(e => e.payload.type === 'finance')!;
    if (money.payload.type === 'finance') money.payload.amountCents = '999999';
    expect(await verifyLedger(changed)).toMatchObject({ ok: false, at: money.sequence, reason: 'changed' });

    expect(await verifyLedger([events[0]!, ...events.slice(2)])).toMatchObject({ ok: false, reason: 'missing', expected: '2' });

    const relinked: LedgerEvent[] = structuredClone(events);
    relinked[2]!.previousHash = GENESIS_HASH;
    expect(await verifyLedger(relinked)).toMatchObject({ ok: false, at: '3', reason: 'link' });
  });
});

describe('fontes do livro', () => {
  it('o livro real só vem da F08: até lá fica pendente e vazio', () => {
    expect(getPublicLedger()).toEqual({ status: 'pending', events: [] });
  });

  it('o exemplo é a fixture fictícia da F08, nada a mais', async () => {
    const events = await getExampleLedger();
    expect(events.map(e => e.payload)).toEqual(fixture.payloads);
    expect(await getExampleLedger()).toEqual(events);
  });
});
