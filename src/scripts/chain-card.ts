import type { LedgerEvent } from '../lib/ledger/schema';
import { projectSourceUrl } from '../lib/ledger-view/source-url';
import { formatCents } from '../lib/ledger-view/money';
import { EVIDENCE, PROJECT_KIND, TYPES, phrase } from '../lib/ledger-view/phrases';
import { PLAIN } from '../data/site/livro';
import { formatDay } from '../data/site/project';

const icon = (name: string) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
};

const shortHash = (hash: string) => `${hash.slice(0, 4)} ${hash.slice(4, 8)}`;
const span = (text: string) => {
  const el = document.createElement('span');
  el.textContent = text;
  return el;
};

// Same card the server draws for the first screen. Used when the rest of the book arrives.
export function chainEntry(event: LedgerEvent, correctedBy?: string, titles: Record<string, string> = {}): HTMLLIElement {
  const p = event.payload;
  const type = TYPES[p.type];
  const li = document.createElement('li');
  li.className = 'chain-entry';
  li.dataset.seq = event.sequence;
  li.dataset.type = p.type;
  li.hidden = true;

  const node = document.createElement('span');
  node.className = 'chain-node';
  node.setAttribute('aria-hidden', 'true');
  node.textContent = event.sequence;

  const card = document.createElement('div');
  card.className = 'chain-card';

  const meta = document.createElement('div');
  meta.className = 'chain-meta';
  const chip = document.createElement('span');
  chip.className = 'type-chip';
  chip.append(icon(type.icon), document.createTextNode(type.label + (p.type === 'project' ? ` · ${PROJECT_KIND[p.action]}` : '')));
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = `Ação nº ${event.sequence}.`;
  const time = document.createElement('time');
  time.dateTime = p.occurredOn;
  time.textContent = formatDay(p.occurredOn);
  meta.append(chip, sr, time);

  const title = document.createElement('p');
  title.className = 'chain-title';
  title.textContent = phrase(p);

  const facts = document.createElement('p');
  facts.className = 'chain-facts';
  if (p.type === 'finance') {
    const delta = BigInt(p.amountCents);
    const amount = document.createElement('span');
    amount.className = delta > 0n ? 'chain-amount is-in' : 'chain-amount';
    amount.dataset.amount = '';
    amount.textContent = `${delta > 0n ? '+' : '−'} ${formatCents(delta < 0n ? -delta : delta)}`;
    const evidence = document.createElement('span');
    evidence.append(icon('clock'), document.createTextNode(` ${EVIDENCE[p.evidence]}`));
    facts.append(amount, evidence);
  }
  const source = projectSourceUrl(p);
  if (source) {
    const link = document.createElement('a');
    link.href = source;
    link.rel = 'noopener';
    link.append(document.createTextNode('Ver a fonte'), icon('arrow-right'));
    facts.append(link);
  }
  if (p.type === 'candidate') facts.append(span('Só a contagem. Sem nome, rosto, apelido ou lugar.'));
  if (p.type === 'field') facts.append(span('Sem dizer quem recebeu nem onde.'));
  if (p.correctionOf && p.type !== 'finance') facts.append(span(`Corrige a ação nº ${p.correctionOf}`));
  if (correctedBy) {
    const corrected = document.createElement('span');
    corrected.className = 'chain-corrected';
    corrected.append(icon('undo'), document.createTextNode(` ${p.type === 'finance' ? 'Estornada' : 'Corrigida'} pela nº ${correctedBy}`));
    facts.append(corrected);
  }

  const decisionTitle = p.type === 'project' && p.action === 'decision_recorded' ? titles[p.decisionId] : undefined;
  const context = document.createElement('p');
  context.className = 'chain-context';
  context.textContent = decisionTitle ?? '';

  const seal = document.createElement('div');
  seal.className = 'chain-seal';
  const mark = document.createElement('code');
  mark.title = 'Marca desta ação';
  mark.textContent = shortHash(event.hash);
  seal.append(icon('link'), mark, span(event.sequence === '1' ? 'começo da corrente' : `presa na nº ${Number(event.sequence) - 1}`));
  const details = document.createElement('details');
  details.className = 'chain-full';
  const summary = document.createElement('summary');
  summary.textContent = 'marca inteira';
  const recorded = new Date(event.recordedAt);
  const recordedText = `${recorded.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}, às ${recorded.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}`;
  const list = document.createElement('dl');
  for (const [term, value] of [['Marca desta ação', event.hash], ['Marca da anterior', event.previousHash], ['Registrada em', recordedText]] as const) {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    list.append(dt, dd);
  }
  details.append(summary, list);
  seal.append(details);

  const button = document.createElement('button');
  button.className = 'conferir-esta';
  button.type = 'button';
  button.dataset.goto = event.sequence;
  button.textContent = PLAIN.thisOne;

  card.append(meta, title);
  if (decisionTitle) card.append(context);
  card.append(facts, seal, button);
  li.append(node, card);
  return li;
}
