import type { LedgerEvent } from '../ledger/schema';
import type { OutCategory } from './phrases';

export interface MoneyTotals {
  inCents: bigint;
  outCents: bigint;
  balanceCents: bigint;
  outByCategory: Partial<Record<OutCategory, bigint>>;
}

// Sums every delta with BigInt, as the contract asks. Donations (and their reversals) are what came in;
// every other category is money going out.
export function sumMoney(events: LedgerEvent[]): MoneyTotals {
  const totals: MoneyTotals = { inCents: 0n, outCents: 0n, balanceCents: 0n, outByCategory: {} };
  for (const { payload: p } of events) {
    if (p.type !== 'finance') continue;
    const delta = BigInt(p.amountCents);
    totals.balanceCents += delta;
    if (p.category === 'donation') {
      totals.inCents += delta;
    } else {
      totals.outCents -= delta;
      totals.outByCategory[p.category] = (totals.outByCategory[p.category] ?? 0n) - delta;
    }
  }
  return totals;
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// Display only: BRL values of this project fit comfortably in a Number.
export const formatCents = (cents: bigint) => brl.format(Number(cents) / 100);

export const sumField = (events: LedgerEvent[], type: 'field' | 'candidate') => events.reduce((total, { payload: p }) => {
  if (type === 'field' && p.type === 'field') return total + BigInt(p.quantity);
  if (type === 'candidate' && p.type === 'candidate') return total + BigInt(p.count);
  return total;
}, 0n);

// sequence -> sequence of the later event that corrects or reverses it.
export function correctionsOf(events: LedgerEvent[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const e of events) if (e.payload.correctionOf) map[e.payload.correctionOf] = e.sequence;
  return map;
}
