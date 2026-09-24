import { canonicalize } from './canonical.ts';
import { acceptIngest } from './ingest.ts';
import { signCheckpoint } from './keys.ts';
import { ack, head, push, type Intake, type QueueState } from './queue.ts';
import type { LedgerDocument } from './schema.ts';
import { appendEvent, createCheckpoint } from './verify.ts';
import { stampCheckpoint } from './stamp.ts';
import { liveTrust, type LiveTrust } from './trust-doc.ts';
import type { SignedCheckpoint } from './signature.ts';

export type DrainOk = {
  duplicate: false;
  document: LedgerDocument;
  intake: Intake;
  trust: LiveTrust;
  signed: SignedCheckpoint;
};
export type DrainStop = { duplicate: true } | { rejected: true };

export async function drainOne(input: {
  document: LedgerDocument;
  intake: Intake;
  envelope: unknown;
  privateKey: CryptoKey;
  seed: Uint8Array;
  publicKeyHex: string;
  previousPublicKey: string;
  now: string;
  stamp?: typeof stampCheckpoint;
}): Promise<DrainOk | DrainStop> {
  const accepted = acceptIngest(input.envelope);
  if (!accepted.ok) return { rejected: true };
  const state: QueueState = { pending: [], done: input.intake.keys };
  const queued = push(state, { ...accepted.receipt, receivedAt: input.now });
  if (queued.duplicate) return { duplicate: true };
  const item = head(queued.state);
  if (!item) return { rejected: true };
  const events = await appendEvent(input.document.events, item.payload, input.now);
  const checkpoint = createCheckpoint(events, input.now);
  const signed = await signCheckpoint(checkpoint, input.privateKey, input.publicKeyHex);
  const witness = await (input.stamp ?? stampCheckpoint)(canonicalize(checkpoint), input.seed, input.publicKeyHex);
  const done = ack(queued.state, item.key);
  return {
    duplicate: false,
    document: { events, checkpoint },
    intake: { keys: done.done },
    trust: liveTrust(input.publicKeyHex, input.previousPublicKey, checkpoint.sequence, witness),
    signed,
  };
}
