import decisionsMarkdown from '../../../docs/DECISOES.md?raw';

// D013: the site may show each decision's title, read from DECISOES.md at build.
// It is site content, outside the hashed ledger event: "Conferir" proves the event, not this text.
// F32: the sixth column says the same in plain words, for the first layer of /transparencia.
const stripMarkdown = (cell: string) => cell
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|`/g, '')
  .trim();

export interface DecisionText { title: string; plain?: string }

export function parseDecisions(markdown: string): Record<string, DecisionText> {
  const decisions: Record<string, DecisionText> = {};
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').map(c => c.trim());
    const [, id, , decision, , , plain] = cells;
    if (!id || !/^D\d{3}$/.test(id) || !decision) continue;
    decisions[id] = { title: stripMarkdown(decision), ...(plain ? { plain: stripMarkdown(plain) } : {}) };
  }
  return decisions;
}

export const parseDecisionTitles = (markdown: string) =>
  Object.fromEntries(Object.entries(parseDecisions(markdown)).map(([id, d]) => [id, d.title]));

export const DECISIONS = parseDecisions(decisionsMarkdown);
export const DECISION_TITLES: Record<string, string> = parseDecisionTitles(decisionsMarkdown);

// A decision recorded before its plain sentence still shows up: the live ledger never waits for copy.
export const PLAIN_FALLBACK = 'Decisão nova sobre o projeto';
export const decisionPlain = (id: string) => DECISIONS[id]?.plain ?? PLAIN_FALLBACK;
