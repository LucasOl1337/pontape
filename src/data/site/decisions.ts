import decisionsMarkdown from '../../../docs/DECISOES.md?raw';

// D013: the site may show each decision's title, read from DECISOES.md at build.
// It is site content, outside the hashed ledger event: "Conferir" proves the event, not this text.
const stripMarkdown = (cell: string) => cell
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|`/g, '')
  .trim();

export function parseDecisionTitles(markdown: string): Record<string, string> {
  const titles: Record<string, string> = {};
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').map(c => c.trim());
    const [, id, , decision] = cells;
    if (id && /^D\d{3}$/.test(id) && decision) titles[id] = stripMarkdown(decision);
  }
  return titles;
}

export const DECISION_TITLES = parseDecisionTitles(decisionsMarkdown);
