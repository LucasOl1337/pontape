import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import configuration from '../../data/ledger/trust.json';
import ledger from '../../data/ledger/ledger.json';
import index from '../../../public/livro/ancoras/index.json';
import { anchorIndexSchema, createTrust, ledgerTrustSchema, verifyPublishedSignature } from './trust';
import { readAnchors } from './anchors';
import { appendEvent } from './verify';

const directory = fileURLToPath(new URL('../../../public/livro/ancoras/', import.meta.url));
const signed = JSON.parse(await readFile(new URL('../../../public/livro/ancoras/checkpoint-43-assinado.json', import.meta.url), 'utf8'));
const trust = createTrust(configuration, index);

describe('confiança publicada', () => {
  it('confere assinatura real 43 e arquivos públicos, sem ler chave privada', async () => {
    const loaded = await readAnchors(directory, ledger.events, configuration);
    expect(loaded.authentication.trust.timestamp).toMatchObject({ status: 'pending', latestSequence: '43' });
    expect(await verifyPublishedSignature(ledger.events, trust, signed)).toEqual({ valid: true, sequence: '43' });
  });
  it('assinatura cobre prefixo antigo e não exige reassinar o restante da cadeia', async () => {
    const next = await appendEvent(ledger.events, { type: 'field', action: 'food_delivered', quantity: '1', occurredOn: '2000-01-01', correctionOf: null }, '2099-01-01T12:00:00.000Z');
    expect(await verifyPublishedSignature(next, trust, signed)).toEqual({ valid: true, sequence: '43' });
    expect(await verifyPublishedSignature(ledger.events.slice(0, 42), trust, signed)).toMatchObject({ valid: false, code: 'signed_checkpoint' });
  });
  it('recusa troca de chave, assinatura, checkpoint e reescrita do livro', async () => {
    expect(await verifyPublishedSignature(ledger.events, { ...trust, signature: { ...trust.signature, publicKey: '0'.repeat(64) } }, signed)).toMatchObject({ valid: false, code: 'signature' });
    expect(await verifyPublishedSignature(ledger.events, trust, { ...signed, signature: '0'.repeat(128) })).toMatchObject({ valid: false });
    expect(await verifyPublishedSignature(ledger.events, trust, { ...signed, checkpoint: { ...signed.checkpoint, headHash: '0'.repeat(64) } })).toMatchObject({ valid: false });
    const changed = structuredClone(ledger.events); changed[0]!.hash = '0'.repeat(64);
    expect(await verifyPublishedSignature(changed, trust, signed)).toMatchObject({ valid: false, code: 'signed_checkpoint' });
  });
  it('não aceita confirmação sem bloco, caminho livre, estado incoerente ou campo extra', () => {
    const anchor = index.anchors[0]!;
    for (const changed of [
      { ...anchor, status: 'confirmed' },
      { ...anchor, signedCheckpoint: { ...anchor.signedCheckpoint, file: '../../private.pem' } },
      { ...anchor, proofs: [] },
      { ...anchor, privateKey: 'FICTÍCIO' },
    ]) expect(anchorIndexSchema.safeParse({ schemaVersion: 1, anchors: [changed] }).success).toBe(false);
    expect(anchorIndexSchema.safeParse({ schemaVersion: 1, anchors: [anchor, anchor] }).success).toBe(false);
    expect(ledgerTrustSchema.safeParse({ ...trust, timestamp: { ...trust.timestamp, status: 'not_anchored' } }).success).toBe(false);
    expect(ledgerTrustSchema.safeParse({ ...trust, schemaVersion: 2 }).success).toBe(false);
  });
});
