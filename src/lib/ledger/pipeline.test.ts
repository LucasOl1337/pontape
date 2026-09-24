import { describe, expect, it } from 'vitest';
import { createCheckpoint } from './verify';
import { drainOne } from './pipeline';
import { ed25519Seed, publicKeyMatches } from './keys';
import { parseRekor, publicKeyHexFromSeed, rekorHashedRekord, signForRekor, timeFromTimestampReply, timestampQuery } from './stamp';
import type { StampWitness } from './stamp';

const now = '2000-01-02T00:00:00.000Z';
const donation = {
  occurredOn: '2000-01-01', correctionOf: null, type: 'finance', action: 'movement_recorded',
  currency: 'BRL', amountCents: '2000', category: 'donation', evidence: 'pending',
};
const envelope = { source: 'test', eventId: 'charge_ficticia_1', payload: donation };
const witness: StampWitness = {
  registry: 'Sigstore Rekor', id: 'ab'.repeat(32), seenAt: '2026-09-24T18:19:00.000Z',
  url: 'https://rekor.sigstore.dev/api/v1/log/entries/ab',
  rfc3161: { url: 'https://freetsa.org', time: '2026-09-24T18:19:01.000Z' },
};

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16));
}

async function keyPair() {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const publicKeyHex = [...raw].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const seed = ed25519Seed(new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey)));
  return { privateKey: pair.privateKey, publicKeyHex, seed };
}

describe('escrevente do livro (F42 E2)', () => {
  it('grava um evento fictício num livro temporário, assina e publica o carimbo', async () => {
    const key = await keyPair();
    expect(await publicKeyMatches(key.privateKey, key.publicKeyHex)).toBe(true);
    const document = { events: [], checkpoint: createCheckpoint([], now) };
    const result = await drainOne({
      document, intake: { keys: [] }, envelope, ...key, previousPublicKey: 'ab'.repeat(32), now,
      stamp: async () => witness,
    });
    expect(result).toMatchObject({ duplicate: false });
    if (!('document' in result)) return;
    expect(result.document.events).toHaveLength(1);
    expect(result.intake.keys).toEqual(['test:charge_ficticia_1']);
    expect(result.trust).toMatchObject({
      signature: 'configured', publicKey: key.publicKeyHex, timestamp: 'anchored',
      witness: { registry: 'Sigstore Rekor', id: witness.id, url: witness.url },
    });
    const again = await drainOne({ ...{ document: result.document, intake: result.intake, envelope, ...key, previousPublicKey: 'ab'.repeat(32), now, stamp: async () => witness } });
    expect(again).toEqual({ duplicate: true });
  });

  it('não grava envelope com dado de pessoa', async () => {
    const key = await keyPair();
    const result = await drainOne({
      document: { events: [], checkpoint: createCheckpoint([], now) }, intake: { keys: [] },
      envelope: { ...envelope, payload: { ...donation, name: 'Pessoa fictícia' } },
      ...key, previousPublicKey: 'ab'.repeat(32), now, stamp: async () => witness,
    });
    expect(result).toEqual({ rejected: true });
  });

  it('assina no Ed25519ph que o Rekor confere', () => {
    const seed = fromHex('80a9d22d36896b68698bc4ebb74bec60933996182ca93d9ca64813fb7e9dbe04');
    const message = new TextEncoder().encode('pontape-ledger-ed25519ph');
    expect(publicKeyHexFromSeed(seed)).toBe('ed7760f92c1bf774749c278584d3ba76fc024db7e838b7b6cf9198e5e629ddcc');
    const signature = signForRekor(seed, message);
    expect([...signature].map((byte) => byte.toString(16).padStart(2, '0')).join(''))
      .toBe('5b3b14ee1b7b820ca9f3f97ebcd1b9dbcb13d34a257ad48490ac79e7a0b140ff832430e7b70b88eb05d4613f4e876c20f9bc1954bf10386b711193a68855c105');
    const prefix = fromHex('302e020100300506032b657004220420');
    const der = new Uint8Array(prefix.length + seed.length);
    der.set(prefix);
    der.set(seed, prefix.length);
    expect(ed25519Seed(der)).toEqual(seed);
    expect(rekorHashedRekord('ab'.repeat(64), signature, publicKeyHexFromSeed(seed)).spec.data.hash.algorithm).toBe('sha512');
  });

  it('lê a data de um carimbo RFC 3161 e o id do Rekor', () => {
    const query = timestampQuery(new Uint8Array(32));
    expect(query[0]).toBe(0x30);
    const text = new TextEncoder().encode('20260924181900Z');
    const reply = new Uint8Array([0x18, 15, ...text]);
    expect(timeFromTimestampReply(reply)).toBe('2026-09-24T18:19:00.000Z');
    const seen = Date.parse('2026-09-24T18:19:00.000Z') / 1000;
    expect(parseRekor({ abcd: { integratedTime: seen } })?.seenAt).toBe('2026-09-24T18:19:00.000Z');
  });
});
