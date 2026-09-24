import type { LedgerPayload } from './schema.ts';

// Asaas sandbox checkout and webhooks. Documented payloads only.
// Access 24/09/2026: https://docs.asaas.com/docs/checkout-asaas
// and https://docs.asaas.com/docs/link-do-checkout-e-redirecionamento-do-cliente
export const ASAAS_SANDBOX_API = 'https://api-sandbox.asaas.com/v3';

const AMOUNTS = new Set([1_000, 2_000, 5_000, 10_000]);
const ID = /^[A-Za-z0-9:_-]{1,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export type IngestEnvelope = { source: 'asaas'; eventId: string; payload: LedgerPayload };

export function reaisToCents(value: number): bigint | null {
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > 1e-6) return null;
  return BigInt(cents);
}

export function checkoutRequest(amountCents: number, origin: string) {
  if (!AMOUNTS.has(amountCents)) return null;
  const back = `${origin}/doar/`;
  return {
    billingTypes: ['PIX', 'CREDIT_CARD'] as const,
    chargeTypes: ['DETACHED'] as const,
    minutesToExpire: 30,
    callback: { successUrl: back, cancelUrl: back, expiredUrl: back },
    items: [{ name: 'Doação', quantity: 1, value: amountCents / 100 }],
  };
}

export function checkoutUrl(apiUrl: string, id: string): string {
  const host = apiUrl.includes('sandbox') ? 'https://sandbox.asaas.com' : 'https://asaas.com';
  return `${host}/checkoutSession/show?id=${encodeURIComponent(id)}`;
}

function dayOf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const day = value.slice(0, 10);
  return DAY.test(day) ? day : null;
}

function money(eventId: string, occurredOn: string, amountCents: bigint, category: 'donation' | 'fee' | 'refund', externalId: string): IngestEnvelope | null {
  if (amountCents === 0n || !ID.test(eventId) || !ID.test(externalId)) return null;
  return {
    source: 'asaas',
    eventId,
    payload: {
      occurredOn, correctionOf: null, type: 'finance', action: 'movement_recorded', currency: 'BRL',
      amountCents: String(amountCents), category, evidence: 'pending', externalId,
    },
  };
}

/** Turns a webhook into ledger envelopes. Name, CPF and email are never copied. */
export function envelopesFromWebhook(body: unknown): { ok: true; envelopes: IngestEnvelope[] } | { ok: false } {
  if (!body || typeof body !== 'object') return { ok: false };
  const record = body as Record<string, unknown>;
  const event = record.event;
  if (event === 'CHECKOUT_CREATED' || event === 'CHECKOUT_PAID' || event === 'CHECKOUT_CANCELED' || event === 'CHECKOUT_EXPIRED') {
    return { ok: true, envelopes: [] };
  }
  const payment = record.payment;
  if (typeof event !== 'string' || !payment || typeof payment !== 'object') return { ok: false };
  const pay = payment as Record<string, unknown>;
  const id = pay.id;
  const occurredOn = dayOf(pay.paymentDate) ?? dayOf(pay.clientPaymentDate) ?? dayOf(record.dateCreated);
  const gross = typeof pay.value === 'number' ? reaisToCents(pay.value) : null;
  const net = typeof pay.netValue === 'number' ? reaisToCents(pay.netValue) : null;
  if (typeof id !== 'string' || !ID.test(id) || !occurredOn || gross === null || net === null || gross <= 0n || net < 0n || net > gross) {
    return { ok: false };
  }
  const fee = gross - net;
  if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
    const donation = money(id, occurredOn, gross, 'donation', id);
    const feeEvent = money(`${id}:fee`, occurredOn, -fee, 'fee', `${id}:fee`);
    if (!donation) return { ok: false };
    return { ok: true, envelopes: feeEvent ? [donation, feeEvent] : [donation] };
  }
  if (event === 'PAYMENT_REFUNDED') {
    const refund = money(`${id}:refund`, occurredOn, -gross, 'refund', `${id}:refund`);
    const feeBack = money(`${id}:fee-refund`, occurredOn, fee, 'fee', `${id}:fee-refund`);
    if (!refund) return { ok: false };
    return { ok: true, envelopes: feeBack ? [refund, feeBack] : [refund] };
  }
  return { ok: true, envelopes: [] };
}

type StatementItem = { type?: unknown; value?: unknown; paymentId?: unknown; date?: unknown };

/** Fictitious-safe reading of /v3/financialTransactions. One payment can be two lines. */
export function envelopesFromStatement(items: unknown[]): IngestEnvelope[] {
  const groups = new Map<string, { day: string; gross: bigint | null; fee: bigint; refund: bigint }>();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as StatementItem;
    if (typeof row.paymentId !== 'string' || !ID.test(row.paymentId) || typeof row.value !== 'number') continue;
    const day = dayOf(row.date);
    const cents = reaisToCents(row.value);
    if (!day || cents === null) continue;
    const group = groups.get(row.paymentId) ?? { day, gross: null, fee: 0n, refund: 0n };
    if (row.type === 'PAYMENT_RECEIVED') group.gross = cents;
    else if (row.type === 'PAYMENT_FEE') group.fee += cents;
    else if (row.type === 'PAYMENT_REVERSAL') group.refund += cents;
    group.day = day;
    groups.set(row.paymentId, group);
  }
  const envelopes: IngestEnvelope[] = [];
  for (const [id, group] of groups) {
    if (group.gross !== null && group.gross > 0n) {
      const donation = money(id, group.day, group.gross, 'donation', id);
      if (donation) envelopes.push(donation);
    }
    if (group.fee < 0n) {
      const feeEvent = money(`${id}:fee`, group.day, group.fee, 'fee', `${id}:fee`);
      if (feeEvent) envelopes.push(feeEvent);
    }
    if (group.refund < 0n) {
      const refund = money(`${id}:refund`, group.day, group.refund, 'refund', `${id}:refund`);
      if (refund) envelopes.push(refund);
    }
  }
  return envelopes;
}

export function statementGap(envelopes: IngestEnvelope[], done: readonly string[]): { missingInBook: IngestEnvelope[]; missingInStatement: string[] } {
  const seen = new Set(done);
  const fromStatement = new Set(envelopes.map(envelope => `asaas:${envelope.eventId}`));
  return {
    missingInBook: envelopes.filter(envelope => !seen.has(`asaas:${envelope.eventId}`)),
    missingInStatement: done.filter(key => key.startsWith('asaas:') && !fromStatement.has(key)),
  };
}
