import * as z from 'zod/mini';
import { hashSchema, sequenceSchema } from './schema.ts';
import { signedCheckpointSchema, verifyCheckpointSignature } from './signature.ts';
import { verifyLedger } from './verify.ts';

const publicFileSchema = z.strictObject({
  file: z.string().check(z.regex(/^checkpoint-[1-9][0-9]{0,19}-assinado\.json(?:\.[a-f0-9]{64})?(?:\.ots)?$/)),
  sha256: hashSchema,
});
export const bitcoinConfirmationSchema = z.strictObject({
  height: sequenceSchema, blockHash: hashSchema,
  attestedAt: z.iso.datetime({ precision: 3 }), verifiedAt: z.iso.datetime({ precision: 3 }),
});
export const anchorSchema = z.strictObject({
  sequence: sequenceSchema,
  signedCheckpoint: publicFileSchema,
  proofs: z.array(publicFileSchema).check(z.minLength(1)),
  status: z.enum(['pending', 'confirmed']),
  bitcoin: z.nullable(bitcoinConfirmationSchema),
}).check(z.refine(anchor => {
  const name = `checkpoint-${anchor.sequence}-assinado.json`;
  return anchor.signedCheckpoint.file === name
    && anchor.proofs.every(proof => proof.file === `${name}.ots`
      || proof.file === `${name}.${proof.sha256}.ots`)
    && new Set(anchor.proofs.map(proof => proof.file)).size === anchor.proofs.length
    && (anchor.status === 'confirmed') === (anchor.bitcoin !== null);
}));
export const anchorIndexSchema = z.strictObject({
  schemaVersion: z.literal(1), anchors: z.array(anchorSchema),
}).check(z.refine(index => index.anchors.every((anchor, i) => i === 0
  || BigInt(anchor.sequence) > BigInt(index.anchors[i - 1]!.sequence))));
const configuration = {
  schemaVersion: z.literal(1),
  signature: z.strictObject({
    status: z.literal('configured'), algorithm: z.literal('Ed25519'),
    custodian: z.literal('Regente'), publicKey: hashSchema,
  }),
  mirror: z.literal('not_configured'),
};
export const trustConfigurationSchema = z.strictObject(configuration);
export const ledgerTrustSchema = z.strictObject({
  ...configuration,
  timestamp: z.strictObject({
    status: z.enum(['not_anchored', 'pending', 'confirmed']),
    latestSequence: z.nullable(sequenceSchema),
    index: z.literal('/livro/ancoras/index.json'),
  }),
}).check(z.refine(trust => (trust.timestamp.status === 'not_anchored') === (trust.timestamp.latestSequence === null)));
export type AnchorIndex = z.infer<typeof anchorIndexSchema>;
export type Anchor = z.infer<typeof anchorSchema>;
export type LedgerTrust = z.infer<typeof ledgerTrustSchema>;
export type TrustConfiguration = z.infer<typeof trustConfigurationSchema>;
export type PublishedAuthentication = { trust: LedgerTrust; signedCheckpoint: z.infer<typeof signedCheckpointSchema> | null };

export function createTrust(configuration: unknown, input: unknown): LedgerTrust {
  const config = trustConfigurationSchema.parse(configuration);
  const index = anchorIndexSchema.parse(input);
  const latest = index.anchors.at(-1);
  return ledgerTrustSchema.parse({ ...config, timestamp: {
    status: latest?.status ?? 'not_anchored', latestSequence: latest?.sequence ?? null, index: '/livro/ancoras/index.json',
  } });
}

/** Checks a signed prefix against this whole ledger, with the separately published key. No I/O. */
export async function verifyPublishedSignature(events: unknown, trustInput: unknown, signedInput: unknown): Promise<
  { valid: true; sequence: string } | { valid: false; code: 'trust' | 'signature' | 'signed_checkpoint' | 'crypto_unavailable' }
> {
  const trust = ledgerTrustSchema.safeParse(trustInput);
  if (!trust.success) return { valid: false, code: 'trust' };
  const signed = signedCheckpointSchema.safeParse(signedInput);
  if (!signed.success || signed.data.checkpoint.sequence !== trust.data.timestamp.latestSequence) return { valid: false, code: 'signed_checkpoint' };
  if (!globalThis.crypto?.subtle) return { valid: false, code: 'crypto_unavailable' };
  if (!await verifyCheckpointSignature(signed.data, trust.data.signature.publicKey)) return { valid: false, code: 'signature' };
  if (!(await verifyLedger(events, signed.data.checkpoint)).valid) return { valid: false, code: 'signed_checkpoint' };
  return { valid: true, sequence: signed.data.checkpoint.sequence };
}
