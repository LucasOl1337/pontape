import type { DONATION_CATEGORIES, LedgerPayload } from '../ledger/schema';
import type { IconName } from '../../components/site/icon-names';

// The only source of a ledger line's sentence: action (plus closed fields) to PT-BR.
// The contract has no description field, so nothing here comes from free text.
export type LedgerFamily = LedgerPayload['type'];
// Families with their own filter and empty text on /transparencia. `donation` joins when the site adds its filter.
export type LedgerType = Exclude<LedgerFamily, 'donation'>;
type FinancePayload = Extract<LedgerPayload, { type: 'finance' }>;
export type OutCategory = Exclude<FinancePayload['category'], 'donation'>;

// Entregas and Atendimento are the two halves of "As atividades" on the first layer of /transparencia (F32b).
export const TYPES: Record<LedgerFamily, { label: string; icon: IconName }> = {
  finance: { label: 'Dinheiro', icon: 'coin' },
  donation: { label: 'Rede Alimenta', icon: 'plate' },
  field: { label: 'Entregas', icon: 'package' },
  candidate: { label: 'Atendimento', icon: 'person' },
  project: { label: 'Projeto', icon: 'flag' },
};
export const TYPE_ORDER: LedgerType[] = ['finance', 'field', 'candidate', 'project'];

// Money going out, by contract category. Donations are the money coming in.
export const OUT_CATEGORIES: { id: OutCategory; name: string; spent: string; icon: IconName; color: string }[] = [
  { id: 'food', name: 'Comida', spent: 'Gasto com comida', icon: 'plate', color: 'var(--color-sun)' },
  { id: 'clothing', name: 'Roupa', spent: 'Gasto com roupa', icon: 'shirt', color: 'var(--color-indigo)' },
  { id: 'hygiene', name: 'Higiene', spent: 'Gasto com higiene', icon: 'soap', color: '#5cc8b5' },
  { id: 'operations', name: 'Operação', spent: 'Custo de operação', icon: 'wrench', color: 'var(--color-ink-2)' },
  { id: 'fee', name: 'Tarifas', spent: 'Tarifa', icon: 'receipt', color: '#a78bfa' },
  { id: 'refund', name: 'Devoluções', spent: 'Devolução de doação', icon: 'undo', color: 'var(--color-paper-2)' },
];

export const EVIDENCE: Record<FinancePayload['evidence'], string> = {
  pending: 'Comprovante pendente',
  not_published: 'Comprovante não publicado',
};

export const PROJECT_KIND = {
  repository_created: 'repositório',
  decision_recorded: 'decisão',
  pull_request_merged: 'mudança',
  signing_key_rotated: 'assinatura',
} as const;

const plural = (n: string, one: string, many: string) => `${n} ${n === '1' ? one : many}`;

export const DONATION_CATEGORY: Record<(typeof DONATION_CATEGORIES)[number], string> = {
  produce: 'hortifrúti', bakery: 'pães e bolos', dairy: 'laticínios', meat: 'carnes',
  prepared_meal: 'refeição pronta', dry_goods: 'não perecíveis', beverages: 'bebidas',
};

// Grams are a whole number in the book; the sentence shows kg with up to 3 decimals, comma as separator.
export function formatKg(grams: string): string {
  const g = BigInt(grams);
  const kg = g / 1000n;
  const rest = (g % 1000n).toString().padStart(3, '0').replace(/0+$/, '');
  return `${kg.toLocaleString('pt-BR')}${rest ? `,${rest}` : ''} kg`;
}

export function phrase(p: LedgerPayload): string {
  switch (p.type) {
    case 'project':
      if (p.action === 'repository_created') return 'Repositório do projeto criado';
      if (p.action === 'decision_recorded') return `Decisão ${p.decisionId} registrada`;
      if (p.action === 'signing_key_rotated') return 'Chave pública de assinatura trocada';
      return `PR #${p.pullRequest} integrada`;
    case 'finance':
      if (p.action === 'reversal') return `Estorno da ação nº ${p.correctionOf}`;
      if (p.category === 'donation') return 'Doação recebida';
      return OUT_CATEGORIES.find(c => c.id === p.category)?.spent ?? '';
    case 'field':
      if (p.action === 'food_delivered') return plural(p.quantity, 'entrega de comida', 'entregas de comida');
      if (p.action === 'clothing_delivered') return plural(p.quantity, 'entrega de roupa', 'entregas de roupa');
      return plural(p.quantity, 'kit de higiene entregue', 'kits de higiene entregues');
    case 'donation':
      if (p.action === 'donation_registered') return `Doação de ${formatKg(p.quantityGrams)} de ${DONATION_CATEGORY[p.category]} registrada (${p.donationRef})`;
      if (p.action === 'destination_chosen') return `${p.donationRef} vai para ${p.distributorId}${p.choice === 'ai_top' ? ', a escolha da AI' : ''}`;
      if (p.action === 'donation_delivered') return `${p.donationRef} entregue, segundo quem doou`;
      return `${p.donationRef} cancelada`;
    case 'candidate':
      if (p.action === 'contact_completed') return plural(p.count, 'contato feito', 'contatos feitos');
      if (p.action === 'interview_completed') return plural(p.count, 'entrevista concluída', 'entrevistas concluídas');
      if (p.action === 'referral_completed') return plural(p.count, 'encaminhamento pra vaga', 'encaminhamentos pra vaga');
      return plural(p.count, 'apoio dos primeiros dias concluído', 'apoios dos primeiros dias concluídos');
  }
}
