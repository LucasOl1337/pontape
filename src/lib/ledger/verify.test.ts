import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import realLedger from '../../data/ledger/ledger.json';
import { GENESIS_HASH, ledgerDocumentSchema, type LedgerEvent } from './schema';
import { appendEvent, createCheckpoint, eventHash, verifyDocument, verifyLedger } from './verify';

const at = '2000-01-02T00:00:00.000Z';
async function example(): Promise<LedgerEvent[]> {
  let events: LedgerEvent[] = [];
  for (const payload of fixture.payloads) events = await appendEvent(events, payload, at);
  return events;
}
async function rehash(events: LedgerEvent[]): Promise<LedgerEvent[]> {
  let previousHash = GENESIS_HASH;
  for (const [index, event] of events.entries()) {
    event.sequence = String(index + 1); event.previousHash = previousHash;
    const { schemaVersion, sequence, recordedAt, payload } = event;
    event.hash = await eventHash({ schemaVersion, sequence, previousHash, recordedAt, payload });
    previousHash = event.hash;
  }
  return events;
}

describe('livro encadeado', () => {
  it('confere os 26 fatos reais com as fontes exigidas', async () => {
    expect(await verifyDocument(realLedger)).toMatchObject({ valid: true });
    const all = ledgerDocumentSchema.parse(realLedger).events;
    // Pin the historical prefix, while allowing later legitimate appends.
    const events = all.slice(0, 26);
    expect(await verifyLedger(all, {
      schemaVersion: 1, ledger: 'vidanova-public-actions', sequence: '26',
      headHash: 'ce05cfba4bc24efec75c612c509bd2867b8f4bf03d86401df00de21c80cb4a77',
      generatedAt: '2026-09-23T00:56:32.239Z',
    })).toMatchObject({ valid: true });
    expect(events).toHaveLength(26);
    expect(events.every(event => event.payload.type === 'project')).toBe(true);
    expect(events.every(event => event.payload.occurredOn === '2026-09-22')).toBe(true);
    expect(events.flatMap(({ payload }) => payload.type === 'project' && payload.action === 'decision_recorded' ? [payload.decisionId] : []))
      .toEqual(Array.from({ length: 14 }, (_, i) => `D${String(i + 1).padStart(3, '0')}`));
    expect(events.flatMap(({ payload }) => payload.type === 'project' && payload.action === 'pull_request_merged' ? [payload.pullRequest] : []).sort())
      .toEqual(['2', '23', '24', '25', '26', '27', '28', '29', '3', '4', '5']);
  });
  it('aceita livro vazio somente com cabeça zero e contagem zero', async () => {
    expect(await verifyDocument({ events: [], checkpoint: createCheckpoint([], at) })).toMatchObject({ valid: true, eventCount: 0 });
    expect(await verifyDocument({ events: [], checkpoint: realLedger.checkpoint })).toMatchObject({ valid: false });
  });
  it('detecta adulteração de campo', async () => {
    const events = await example(); events[0]!.payload.occurredOn = '1999-12-31';
    expect(await verifyLedger(events)).toMatchObject({ valid: false, code: 'hash' });
  });
  it.each([0, 1, fixture.payloads.length - 1])('detecta remoção na posição %i contra checkpoint conhecido', async (index) => {
    const events = await example(); const checkpoint = createCheckpoint(events, at);
    events.splice(index, 1);
    expect(await verifyLedger(events, checkpoint)).toMatchObject({ valid: false });
  });
  it('detecta ordem trocada e cadeia quebrada', async () => {
    const events = await example();
    [events[0], events[1]] = [events[1]!, events[0]!];
    expect(await verifyLedger(events)).toMatchObject({ valid: false, code: 'sequence' });
    const broken = await example(); broken[1]!.previousHash = GENESIS_HASH;
    expect(await verifyLedger(broken)).toMatchObject({ valid: false, code: 'previous_hash' });
  });
  it('detecta reescrita completa somente comparando com checkpoint conhecido', async () => {
    const events = await example(); const checkpoint = createCheckpoint(events, at);
    events[0]!.payload.occurredOn = '1999-12-31';
    await rehash(events);
    expect(await verifyLedger(events)).toMatchObject({ valid: true, checkpointMatched: false });
    expect(await verifyLedger(events, checkpoint)).toMatchObject({ valid: false, code: 'checkpoint' });
  });
  it('aceita extensão honesta de um prefixo já guardado', async () => {
    const events = await example(); const checkpoint = createCheckpoint(events.slice(0, 2), at);
    expect(await verifyLedger(events, checkpoint)).toMatchObject({ valid: true, checkpointMatched: true });
    expect(await verifyDocument({ events, checkpoint })).toMatchObject({ valid: false, code: 'checkpoint' });
  });
  it('checkpoint não pode anteceder um evento do prefixo, mesmo com relógios fora de ordem', async () => {
    const events = await example();
    events[0]!.recordedAt = '2000-01-03T12:00:00.000Z';
    await rehash(events);
    expect(await verifyLedger(events)).toMatchObject({ valid: true, lastUpdatedAt: '2000-01-03T12:00:00.000Z' });
    expect(await verifyLedger(events, createCheckpoint(events, at))).toMatchObject({ valid: false, code: 'checkpoint' });
  });
  it('recusa campos extras no envelope e payload', async () => {
    const events = await example();
    expect(await verifyLedger([{ ...events[0], name: 'FICTÍCIO' }])).toMatchObject({ valid: false, code: 'invalid_schema' });
    await expect(appendEvent(events, { ...fixture.payloads[3], cpf: 'FICTÍCIO' }, at)).rejects.toThrow();
  });
  it('valida referências de correção, identidade da fonte e duplicatas', async () => {
    const events = await example();
    await expect(appendEvent(events, fixture.payloads[0], at)).rejects.toThrow('duplicate_source');
    await expect(appendEvent(events, { ...fixture.payloads[0], correctionOf: '9' }, at)).rejects.toThrow('correction');
    await expect(appendEvent(events, { ...fixture.payloads[0], correctionOf: '1', decisionId: 'D998' }, at)).rejects.toThrow('correction');
    const corrected = await appendEvent(events, { ...fixture.payloads[0], correctionOf: '1', occurredOn: '1999-12-31' }, at);
    expect(corrected).toHaveLength(fixture.payloads.length + 1);
    await expect(appendEvent(corrected, { ...fixture.payloads[0], correctionOf: '1' }, at)).rejects.toThrow('correction');
  });
  it('soma centavos sem arredondar e exige estorno inverso único', async () => {
    const initial = await appendEvent([], { ...fixture.payloads[1], amountCents: '9007199254740993' }, at);
    expect(await verifyLedger(initial)).toMatchObject({ valid: true, balanceCents: '9007199254740993' });
    const reversal = { ...fixture.payloads[1], action: 'reversal', correctionOf: '1', amountCents: '-9007199254740993' };
    await expect(appendEvent(initial, { ...reversal, amountCents: '-1' }, at)).rejects.toThrow('correction');
    await expect(appendEvent(initial, { ...reversal, category: 'fee' }, at)).rejects.toThrow('correction');
    const events = await appendEvent(initial, reversal, at);
    expect(await verifyLedger(events)).toMatchObject({ valid: true, balanceCents: '0', totalsByCategory: { donation: '0' } });
    await expect(appendEvent(events, reversal, at)).rejects.toThrow('correction');
  });
  it('não aceita datas futuras ao registro ou relógio regressivo', async () => {
    const events = await example();
    await expect(appendEvent(events, fixture.payloads[2], '1999-12-31T00:00:00.000Z')).rejects.toThrow('time');
    await expect(appendEvent(events, { ...fixture.payloads[2], occurredOn: '2001-01-01' }, at)).rejects.toThrow('time');
  });
});
