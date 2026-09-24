import type { LedgerPayload } from './schema.ts';

export type QueueItem = { key: string; payload: LedgerPayload; receivedAt: string };
export type Intake = { keys: string[] };

// Pending items stay until ack, so a crash after a peek does not drop or double-write them.
export type QueueState = { pending: QueueItem[]; done: string[] };

export function push(state: QueueState, item: QueueItem): { state: QueueState; duplicate: boolean } {
  if (state.done.includes(item.key) || state.pending.some((queued) => queued.key === item.key)) {
    return { state, duplicate: true };
  }
  return { state: { ...state, pending: [...state.pending, item] }, duplicate: false };
}

export function head(state: QueueState): QueueItem | null {
  return state.pending[0] ?? null;
}

export function ack(state: QueueState, key: string): QueueState {
  return {
    pending: state.pending.filter((item) => item.key !== key),
    done: state.done.includes(key) ? state.done : [...state.done, key],
  };
}
