import { z } from 'zod';
import type { StampWitness } from './stamp.ts';

const hexKey = z.string().regex(/^[a-f0-9]{64}$/);
const https = z.string().regex(/^https:\/\/\S+$/);

export const idleTrustSchema = z.strictObject({
  signature: z.literal('not_configured'),
  publicKey: hexKey,
  previousPublicKey: hexKey,
  timestamp: z.literal('not_anchored'),
  mirror: z.literal('not_configured'),
});

export const liveTrustSchema = z.strictObject({
  signature: z.literal('configured'),
  publicKey: hexKey,
  previousPublicKey: hexKey,
  signedThrough: z.string().regex(/^[1-9][0-9]*$/),
  timestamp: z.literal('anchored'),
  witness: z.strictObject({
    registry: z.literal('Sigstore Rekor'),
    id: z.string().regex(/^[0-9a-f]+$/i),
    seenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    url: https,
  }),
  rfc3161: z.strictObject({
    url: https,
    time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  }),
  mirror: z.literal('not_configured'),
});

export const trustDocumentSchema = z.union([liveTrustSchema, idleTrustSchema]);
export type TrustDocument = z.infer<typeof trustDocumentSchema>;
export type LiveTrust = z.infer<typeof liveTrustSchema>;

export function liveTrust(publicKey: string, previousPublicKey: string, signedThrough: string, witness: StampWitness): LiveTrust {
  return liveTrustSchema.parse({
    signature: 'configured',
    publicKey,
    previousPublicKey,
    signedThrough,
    timestamp: 'anchored',
    witness: { registry: witness.registry, id: witness.id, seenAt: witness.seenAt, url: witness.url },
    rfc3161: witness.rfc3161,
    mirror: 'not_configured',
  });
}
