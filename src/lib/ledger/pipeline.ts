import { canonicalize } from './canonical.ts';
import { acceptIngest } from './ingest.ts';
import { signCheckpoint } from './keys.ts';
import { ack, head, push, type Intake, type QueueState } from './queue.ts';
import type { LedgerCheckpoint, LedgerDocument } from './schema.ts';
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

export type DrainBatch = {
  rejected: false;
  appended: number;
  document: LedgerDocument;
  intake: Intake;
  trust?: LiveTrust;
  signed?: SignedCheckpoint;
  stampFailed: boolean;
};

/** Appends every valid envelope, then stamps once. A failed stamp still keeps the new actions. */
export async function drainAll(input: {
  document: LedgerDocument;
  intake: Intake;
  envelopes: unknown[];
  privateKey: CryptoKey;
  seed: Uint8Array;
  publicKeyHex: string;
  previousPublicKey: string;
  now: string;
  stamp?: typeof stampCheckpoint;
}): Promise<{ rejected: true } | DrainBatch> {
  const receipts = [];
  for (const envelope of input.envelopes) {
    const accepted = acceptIngest(envelope);
    if (!accepted.ok) return { rejected: true };
    receipts.push(accepted.receipt);
  }
  let state: QueueState = { pending: [], done: input.intake.keys };
  let events = input.document.events;
  let appended = 0;
  for (const receipt of receipts) {
    const queued = push(state, { ...receipt, receivedAt: input.now });
    if (queued.duplicate) continue;
    const item = head(queued.state);
    if (!item) return { rejected: true };
    events = await appendEvent(events, item.payload, input.now);
    state = ack(queued.state, item.key);
    appended += 1;
  }
  const intake = { keys: state.done };
  if (appended === 0) return { rejected: false, appended, document: input.document, intake: input.intake, stampFailed: false };
  const checkpoint = createCheckpoint(events, input.now);
  const next = { events, checkpoint };
  try {
    const signed = await signCheckpoint(checkpoint, input.privateKey, input.publicKeyHex);
    const witness = await (input.stamp ?? stampCheckpoint)(canonicalize(checkpoint), input.seed, input.publicKeyHex);
    return {
      rejected: false, appended, document: next, intake,
      trust: liveTrust(input.publicKeyHex, input.previousPublicKey, checkpoint.sequence, witness),
      signed, stampFailed: false,
    };
  } catch {
    return { rejected: false, appended, document: next, intake, stampFailed: true };
  }
}

/** Signs and stamps the checkpoint already in the book. Does not append an event. */
export async function stampHead(input: {
  checkpoint: LedgerCheckpoint;
  privateKey: CryptoKey;
  seed: Uint8Array;
  publicKeyHex: string;
  previousPublicKey: string;
  stamp?: typeof stampCheckpoint;
}): Promise<{ trust: LiveTrust; signed: SignedCheckpoint }> {
  const signed = await signCheckpoint(input.checkpoint, input.privateKey, input.publicKeyHex);
  const witness = await (input.stamp ?? stampCheckpoint)(canonicalize(input.checkpoint), input.seed, input.publicKeyHex);
  return {
    trust: liveTrust(input.publicKeyHex, input.previousPublicKey, input.checkpoint.sequence, witness),
    signed,
  };
}
