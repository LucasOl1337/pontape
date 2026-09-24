// The technical page ships this many chain cards. The rest come from /livro/ledger.json.
export const TECHNICAL_VISIBLE = 30;

export function tailEvents<T>(events: readonly T[], visible = TECHNICAL_VISIBLE): T[] {
  return events.length > visible ? events.slice(-visible) : events.slice();
}

export function olderEvents<T>(events: readonly T[], visible = TECHNICAL_VISIBLE): T[] {
  return events.length > visible ? events.slice(0, events.length - visible) : [];
}
