import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { proofFromTrust, proofReport } from '../ledger-view/proof';
import { appendEvent, createCheckpoint, verifyLedger } from './verify';
import { drainAll, drainOne, stampHead } from './pipeline';
import { ed25519Seed, publicKeyMatches } from './keys';
import { REKOR_URL, parseRekor, publicKeyHexFromSeed, readRekorResponse, rekorHashedRekord, signForRekor, timeFromTimestampReply, timestampQuery } from './stamp';
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

  it('carimba o checkpoint atual e o selo fica verde, sem ação nova', async () => {
    const key = await keyPair();
    const events = await appendEvent([], donation, now);
    const checkpoint = createCheckpoint(events, now);
    const result = await stampHead({
      checkpoint, ...key, previousPublicKey: 'ab'.repeat(32), stamp: async () => witness,
    });
    expect(events).toHaveLength(1);
    expect(result.signed.checkpoint).toEqual(checkpoint);
    expect(result.trust).toMatchObject({ signature: 'configured', timestamp: 'anchored', signedThrough: '1' });
    const proof = proofFromTrust(result.trust);
    const out = proofReport({
      source: 'download', total: 1, through: 1, proof, result: await verifyLedger(events, checkpoint),
    });
    expect(out.steps.find((step) => step.id === 'signature')?.mark).toBe('ok');
    expect(out.steps.find((step) => step.id === 'stamp')?.mark).toBe('ok');
    expect(out.summary.state).toBe('ok');
  });

  it('reaproveita a entrada quando o registro já tem o mesmo checkpoint', async () => {
    const seen = Date.parse('2026-09-24T18:19:00.000Z') / 1000;
    const id = 'ab'.repeat(40);
    const fetchImpl = async (url: string | URL | Request) => {
      if (String(url) === REKOR_URL) {
        return new Response('conflito', { status: 409, headers: { location: `${REKOR_URL}/${id}` } });
      }
      return new Response(JSON.stringify({ [id]: { integratedTime: seen } }), { status: 200 });
    };
    const again = await readRekorResponse(await fetchImpl(REKOR_URL), fetchImpl);
    expect(again).toMatchObject({ id, seenAt: '2026-09-24T18:19:00.000Z' });
    const elsewhere = new Response('conflito', { status: 409, headers: { location: 'https://evil.example/x' } });
    expect(await readRekorResponse(elsewhere, fetchImpl)).toBeNull();
  });

  it('grava a ação mesmo quando o carimbo falha', async () => {
    const key = await keyPair();
    const result = await drainAll({
      document: { events: [], checkpoint: createCheckpoint([], now) }, intake: { keys: [] },
      envelopes: [envelope], ...key, previousPublicKey: 'ab'.repeat(32), now,
      stamp: async () => { throw new Error('registro fora'); },
    });
    expect(result.rejected).toBe(false);
    if (result.rejected) return;
    expect(result.appended).toBe(1);
    expect(result.stampFailed).toBe(true);
    expect(result.trust).toBeUndefined();
    expect(result.document.events).toHaveLength(1);
  });

  it('não lê o secret no dry-run do carimbo', () => {
    const env = { ...process.env };
    delete env.LEDGER_SIGNING_PKCS8;
    const dry = spawnSync(process.execPath, ['scripts/ledger/stamp-head.ts'], { encoding: 'utf8', env });
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain('DRY-RUN');
    const apply = spawnSync(process.execPath, ['scripts/ledger/stamp-head.ts', '--apply'], { encoding: 'utf8', env });
    expect(apply.status).not.toBe(0);
    expect(apply.stderr).toContain('LEDGER_SIGNING_PKCS8');
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
