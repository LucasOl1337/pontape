import { z } from 'zod';
import { canonicalize } from './canonical.ts';
import { ledgerCheckpointSchema } from './schema.ts';

export const signedCheckpointSchema = z.strictObject({
  schemaVersion: z.literal(1),
  algorithm: z.literal('Ed25519'),
  publicKey: z.string().regex(/^[a-f0-9]{64}$/),
  checkpoint: ledgerCheckpointSchema,
  signature: z.string().regex(/^[a-f0-9]{128}$/),
});
export type SignedCheckpoint = z.infer<typeof signedCheckpointSchema>;

export function fromHex(value: string): Uint8Array<ArrayBuffer> {
  if (!/^(?:[a-f0-9]{2})+$/.test(value)) throw new Error('Hexadecimal inválido.');
  return Uint8Array.from(value.match(/../g)!, (byte) => parseInt(byte, 16));
}

/** trustedPublicKey must come from a separately trusted channel, not the signed file itself. */
export async function verifyCheckpointSignature(input: unknown, trustedPublicKey: string): Promise<boolean> {
  const parsed = signedCheckpointSchema.safeParse(input);
  if (!parsed.success || parsed.data.publicKey !== trustedPublicKey || !globalThis.crypto?.subtle) return false;
  try {
    const key = await crypto.subtle.importKey('raw', fromHex(trustedPublicKey), 'Ed25519', false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, fromHex(parsed.data.signature),
      new TextEncoder().encode(canonicalize(parsed.data.checkpoint)));
  } catch { return false; }
}
