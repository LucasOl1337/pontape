import { publishedLedger } from '../../lib/ledger/published';
import { distributorName } from './rede';

// The Rede Alimenta numbers come from the public book, read at build (D014): no network call for a
// visitor without an account. The `donation` family is the round 6 amendment to the contract (Celeiro,
// branch alimenta/dominio); until it is in the book, every number here is an honest zero.
export type DonationAction = 'donation_registered' | 'destination_chosen' | 'donation_delivered' | 'donation_cancelled';
export interface DonationEvent {
  sequence: string; recordedAt: string; occurredOn: string; action: DonationAction; donationRef: string;
  category?: string; quantityGrams?: string; distributorId?: string; choice?: 'ai_top' | 'other';
}

const ACTIONS: DonationAction[] = ['donation_registered', 'destination_chosen', 'donation_delivered', 'donation_cancelled'];
const text = (value: unknown) => (typeof value === 'string' ? value : undefined);

export function donationEvents(events: { sequence: string; recordedAt: string; payload: unknown }[]): DonationEvent[] {
  return events.flatMap(e => {
    const p = e.payload as Record<string, unknown>;
    const action = p?.action as DonationAction;
    if (p?.type !== 'donation' || !ACTIONS.includes(action) || !text(p.donationRef)) return [];
    return [{ sequence: e.sequence, recordedAt: e.recordedAt, occurredOn: String(p.occurredOn), action,
      donationRef: String(p.donationRef), category: text(p.category), quantityGrams: text(p.quantityGrams),
      distributorId: text(p.distributorId), choice: p.choice === 'ai_top' || p.choice === 'other' ? p.choice : undefined }];
  });
}

export interface DonationNumbers { registered: number; kg: number; withDestination: number; delivered: number; deliveredKg: number; cancelled: number; aiTop: number }

export function donationNumbers(list: DonationEvent[]): DonationNumbers {
  const grams = new Map<string, number>();
  const n: DonationNumbers = { registered: 0, kg: 0, withDestination: 0, delivered: 0, deliveredKg: 0, cancelled: 0, aiTop: 0 };
  for (const e of list) {
    if (e.action === 'donation_registered') { n.registered += 1; grams.set(e.donationRef, Number(e.quantityGrams ?? 0)); }
    if (e.action === 'destination_chosen') { n.withDestination += 1; if (e.choice === 'ai_top') n.aiTop += 1; }
    if (e.action === 'donation_delivered') { n.delivered += 1; n.deliveredKg += (grams.get(e.donationRef) ?? 0) / 1000; }
    if (e.action === 'donation_cancelled') n.cancelled += 1;
  }
  n.kg = [...grams.values()].reduce((sum, g) => sum + g, 0) / 1000;
  return n;
}

const CATEGORY_WORD: Record<string, string> = {
  dry_goods: 'não perecíveis', produce: 'frutas, legumes e verduras', bakery: 'pães', dairy: 'leite e derivados', prepared_meal: 'refeição pronta',
};
export const kgText = (kg: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(kg)} kg`;

export function donationPhrase(e: DonationEvent): string {
  if (e.action === 'donation_registered') {
    const kg = e.quantityGrams ? kgText(Number(e.quantityGrams) / 1000) : '';
    return `Doação registrada: ${[kg, CATEGORY_WORD[e.category ?? ''] ?? 'comida'].filter(Boolean).join(' de ')}`;
  }
  if (e.action === 'destination_chosen') {
    const to = distributorName(e.distributorId) ?? 'distribuidor do catálogo';
    return `Destino escolhido: ${to}${e.choice === 'ai_top' ? ', a sugestão da AI' : ', escolhido pela pessoa'}`;
  }
  if (e.action === 'donation_delivered') return 'Entrega declarada por quem doou';
  return 'Doação cancelada';
}

export async function alimentaLedger() {
  const { events } = await publishedLedger();
  const list = donationEvents(events);
  return { list, numbers: donationNumbers(list), latest: [...list].reverse().slice(0, 8) };
}
