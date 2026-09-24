import type { LedgerEvent, LedgerPayload } from '../ledger/schema';
import { formatCents } from './money';
import { phrase } from './phrases';

// The first layer of /transparencia (F32, D029) speaks to someone who never heard of GitHub.
// None of these words may show up there; the technical page keeps them.
export const TECHNICAL_WORDS = /\b(github|pr|pull request|commits?|merge|hash|json|sha-?256|jcs|ed25519|checkpoint|reposit[oó]rio|marcas?)\b|#\d/i;

export interface PlainLine { day: string; lead?: string; text: string; through: string }

const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

function lineOf(p: LedgerPayload, decisionPlain: (id: string) => string): Omit<PlainLine, 'day' | 'through'> {
  switch (p.type) {
    case 'project':
      if (p.action === 'decision_recorded') return { lead: 'Decisão.', text: sentence(decisionPlain(p.decisionId)) };
      return { text: 'O projeto nasce e começa a anotar tudo aqui.' };
    case 'finance': {
      const cents = BigInt(p.amountCents);
      return { text: sentence(`${phrase(p)}: ${formatCents(cents < 0n ? -cents : cents)}`) };
    }
    default:
      return { text: sentence(phrase(p)) };
  }
}

// The latest actions in plain words, newest first. The ledger keeps only the number of a merged
// change, so the changes of one day in a row become one line; the number stays on the technical page.
export function recentLines(events: LedgerEvent[], decisionPlain: (id: string) => string, limit = 5): PlainLine[] {
  const lines: PlainLine[] = [];
  for (let i = events.length - 1; i >= 0 && lines.length < limit; i--) {
    const event = events[i]!;
    const p = event.payload;
    if (p.type === 'project' && p.action === 'pull_request_merged') {
      let count = 1;
      for (let q = events[i - 1]?.payload; q?.type === 'project' && q.action === 'pull_request_merged' && q.occurredOn === p.occurredOn; q = events[i - 1]?.payload) {
        count++;
        i--;
      }
      lines.push({ day: p.occurredOn, through: event.sequence, text: count === 1 ? 'Uma mudança aprovada no projeto.' : `${count} mudanças aprovadas no projeto.` });
      continue;
    }
    lines.push({ day: p.occurredOn, ...lineOf(p, decisionPlain), through: event.sequence });
  }
  return lines;
}
