import { describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import { appendEvent, verifyLedger } from '../ledger/verify';
import type { LedgerEvent, LedgerPayload } from '../ledger/schema';
import { proofFromTrust, proofReport, stampDay, type BookProof, type ProofInput } from './proof';

const at = '2000-01-02T00:00:00.000Z';
const okProof: BookProof = {
  signature: 'ok', signedThrough: 20, stamp: 'ok',
  bitcoin: { height: '840000', seenAt: '2026-09-23T15:00:00.000Z', url: 'https://mempool.space/block/abc' },
};
const missing: BookProof = { signature: 'missing', stamp: 'missing' };
const valid = (n: number, checkpoint = false): ProofInput['result'] => ({
  valid: true, eventCount: n, headHash: 'ab', lastUpdatedAt: null, balanceCents: '0', totalsByCategory: {}, checkpointMatched: checkpoint,
});

function report(over: Partial<ProofInput> & Pick<ProofInput, 'result' | 'proof'>) {
  return proofReport({ source: 'download', total: 20, through: 20, ...over });
}

describe('passo a passo do selo (F42 E1)', () => {
  it('não inventa bloco quando a confiança publicada ainda não tem carimbo', () => {
    const proof = proofFromTrust({ signature: 'not_configured', timestamp: 'not_anchored' });
    const out = report({ result: valid(20, true), proof });
    const stamp = out.steps.find(step => step.id === 'stamp')!;
    const signature = out.steps.find(step => step.id === 'signature')!;
    expect(proof).toMatchObject({ signature: 'missing', stamp: 'missing' });
    expect(stamp.mark).toBe('later');
    expect(stamp.href).toBeUndefined();
    expect(stamp.text).not.toMatch(/bloco [0-9]/i);
    expect(signature.mark).toBe('later');
    expect(out.summary).toMatchObject({ state: 'partial', title: 'A corrente está certa.' });
    expect(out.steps.map(step => step.title)).toEqual([
      'Baixou o livro.', 'Recalculou 20 marcas.', 'Assinatura com a chave pública.', 'Carimbo no Bitcoin.',
    ]);
  });

  it('mostra bloco, data e link quando o carimbo existe de verdade', () => {
    const out = report({ result: valid(20, true), proof: okProof });
    const stamp = out.steps.find(step => step.id === 'stamp')!;
    expect(stamp.mark).toBe('ok');
    expect(stamp.text).toContain('Bloco 840000');
    expect(stamp.text).toContain(stampDay('2026-09-23T15:00:00.000Z'));
    expect(stamp.href).toBe('https://mempool.space/block/abc');
    expect(out.summary.state).toBe('ok');
  });

  it('recusa link que não é https', () => {
    const proof = proofFromTrust({
      signature: 'ok', timestamp: 'anchored', signedThrough: '4',
      bitcoin: { height: '1', seenAt: '2026-09-23T15:00:00.000Z', url: 'javascript:alert(1)' },
    });
    expect(proof.bitcoin).toBeUndefined();
    const out = report({ total: 4, through: 4, result: valid(4), proof: { ...proof, stamp: 'ok', signedThrough: 4, bitcoin: { height: '1', seenAt: '2026-09-23T15:00:00.000Z', url: 'javascript:alert(1)' } } });
    expect(out.steps.find(step => step.id === 'stamp')!.href).toBeUndefined();
  });

  it('a assinatura que não cobre a ação conferida não fica verde', () => {
    const out = report({ total: 20, through: 8, result: valid(8), proof: { ...okProof, signedThrough: 5 } });
    expect(out.steps.find(step => step.id === 'marks')!.title).toContain('até a ação nº 8');
    expect(out.steps.find(step => step.id === 'signature')!.mark).toBe('later');
    expect(out.steps.find(step => step.id === 'stamp')!.mark).toBe('later');
    expect(out.steps.find(step => step.id === 'stamp')!.text).toContain('Bloco 840000');
  });

  it('acusa adulteração da F08 e não segue pra assinatura verde', async () => {
    let events: LedgerEvent[] = [];
    for (const payload of fixture.payloads as LedgerPayload[]) events = await appendEvent(events, payload, at);
    events[1]!.payload = { ...events[1]!.payload, occurredOn: '1999-12-31' };
    const result = await verifyLedger(events);
    expect(result.valid).toBe(false);
    const out = report({ total: events.length, through: events.length, result, proof: okProof });
    const marks = out.steps.find(step => step.id === 'marks')!;
    expect(marks.mark).toBe('bad');
    expect(marks.title).toMatch(/ação nº/);
    expect(out.steps.find(step => step.id === 'signature')!.mark).not.toBe('ok');
    expect(out.steps.find(step => step.id === 'stamp')!.mark).not.toBe('ok');
    expect(JSON.stringify(out)).not.toMatch(/blockchain|sha-?256|github|—/i);
  });

  it('arquivo que não é livro não finge conferência', () => {
    const out = report({ source: 'file', total: 0, through: 0, result: null, proof: missing });
    expect(out.summary.state).toBe('bad');
    expect(out.steps).toHaveLength(1);
  });
});
