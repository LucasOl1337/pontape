import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalize } from './canonical';
import { createCheckpoint } from './verify';
import { verifyCheckpointSignature } from './signature';

describe('assinatura de checkpoint', () => {
  it('confere Ed25519 com chave externa conhecida e recusa alterações e substituição de chave', async () => {
    // Ephemeral test-only keys; never written to disk or used for the real ledger.
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const raw = Buffer.from(publicKey.export({ format: 'jwk' }).x!, 'base64url').toString('hex');
    const checkpoint = createCheckpoint([], '2000-01-01T00:00:00.000Z');
    const signed = { schemaVersion: 1, algorithm: 'Ed25519', publicKey: raw, checkpoint,
      signature: sign(null, Buffer.from(canonicalize(checkpoint)), privateKey).toString('hex') };
    expect(await verifyCheckpointSignature(signed, raw)).toBe(true);
    expect(await verifyCheckpointSignature({ ...signed, checkpoint: { ...checkpoint, generatedAt: '2001-01-01T00:00:00.000Z' } }, raw)).toBe(false);
    expect(await verifyCheckpointSignature({ ...signed, signature: '0'.repeat(128) }, raw)).toBe(false);
    expect(await verifyCheckpointSignature(signed, '0'.repeat(64))).toBe(false);
    expect(await verifyCheckpointSignature({ ...signed, privateKey: 'FICTÍCIO' }, raw)).toBe(false);
  });
});
