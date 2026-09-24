import type { LedgerPayload } from '../ledger/schema';
import type { IconName } from '../../components/site/icon-names';

// The only source of a ledger line's sentence: action (plus closed fields) to PT-BR.
// The contract has no description field, so nothing here comes from free text.
export type LedgerType = LedgerPayload['type'];
type FinancePayload = Extract<LedgerPayload, { type: 'finance' }>;
export type OutCategory = Exclude<FinancePayload['category'], 'donation'>;

// Entregas and Atendimento are the two halves of "As atividades" on the first layer of /transparencia (F32b).
export const TYPES: Record<LedgerType, { label: string; icon: IconName }> = {
  finance: { label: 'Dinheiro', icon: 'coin' },
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
    case 'candidate':
      if (p.action === 'contact_completed') return plural(p.count, 'contato feito', 'contatos feitos');
      if (p.action === 'interview_completed') return plural(p.count, 'entrevista concluída', 'entrevistas concluídas');
      if (p.action === 'referral_completed') return plural(p.count, 'encaminhamento pra vaga', 'encaminhamentos pra vaga');
      return plural(p.count, 'apoio dos primeiros dias concluído', 'apoios dos primeiros dias concluídos');
  }
}
