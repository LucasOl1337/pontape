// Explorer pieces shared by both pages: arrow keys along the chain and the abacus, the link between
// a block and the one before it, the money-flow highlight, and the search by number or mark.
import type { LedgerEvent } from '../lib/ledger/schema';

const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

// One tab stop per group; arrows move along it (abacus: in chain order, not rod by rod).
export function mountRoving(root: ParentNode = document) {
  $$('[data-roving]', root).forEach(group => {
    const items = () => {
      const all = $$<HTMLElement>('[data-roving-item]', group).filter(el => !el.closest('[hidden]'));
      return group.closest('.abacus') ? all.sort((a, b) => Number(a.dataset.seq) - Number(b.dataset.seq)) : all;
    };
    group.addEventListener('focusin', e => {
      const item = (e.target as Element).closest<HTMLElement>('[data-roving-item]');
      if (!item) return;
      items().forEach(el => { el.tabIndex = el === item ? 0 : -1; });
    });
    group.addEventListener('keydown', e => {
      const list = items();
      const at = list.indexOf(document.activeElement as HTMLElement);
      if (at < 0) return;
      const next: Record<string, number> = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 };
      if (!(e.key in next)) return;
      e.preventDefault();
      list[Math.max(0, Math.min(list.length - 1, next[e.key]!))]?.focus();
    });
  });
}

// Hovering or focusing a block lights its "anterior" and the mark of the block it points to.
export function mountChainLinks(root: ParentNode = document) {
  $$('.chain-strip', root).forEach(strip => {
    const clear = () => $$('.is-linked, .is-linked-prev', strip).forEach(el => el.classList.remove('is-linked', 'is-linked-prev'));
    const light = (target: EventTarget | null) => {
      clear();
      const block = (target as Element | null)?.closest?.('.chain-block');
      if (!block) return;
      block.classList.add('is-linked');
      let prev = block.nextElementSibling;
      while (prev && !prev.classList.contains('chain-block')) prev = prev.nextElementSibling;
      if (prev && Number((prev as HTMLElement).dataset.seq) === Number((block as HTMLElement).dataset.seq) - 1) prev.classList.add('is-linked-prev');
    };
    strip.addEventListener('pointerover', e => light(e.target));
    strip.addEventListener('focusin', e => light(e.target));
    strip.addEventListener('pointerleave', clear);
    strip.addEventListener('focusout', clear);
  });
}

// Money flow: pointing at a destination brings its band forward.
export function mountFlowHover(root: ParentNode = document) {
  $$('.flow', root).forEach(flow => {
    flow.addEventListener('pointerover', e => {
      const cat = (e.target as Element).closest<HTMLElement>('[data-cat]')?.dataset.cat;
      $$('[data-cat]', flow).forEach(el => el.classList.toggle('is-hot', el.dataset.cat === cat));
      flow.classList.toggle('has-hot', !!cat);
    });
    flow.addEventListener('pointerleave', () => flow.classList.remove('has-hot'));
  });
}

// "12", "nº 12" or the start of a mark ("6597", "6597 b96f"). Returns the action, or why not.
export function findAction(query: string, events: LedgerEvent[]): { event?: LedgerEvent; note?: string } {
  const q = query.trim().toLowerCase().replace(/^n[º°o.]?\s*/, '');
  if (!q) return { note: 'Digite o número de uma ação ou o começo da marca dela.' };
  if (/^\d+$/.test(q)) {
    const event = events.find(e => e.sequence === String(Number(q)));
    return event ? { event } : { note: `O livro tem ${events.length} ações. Não existe a nº ${Number(q)}.` };
  }
  const hex = q.replace(/\s+/g, '');
  if (!/^[0-9a-f]+$/.test(hex)) return { note: 'Use só o número da ação ou os caracteres da marca (0 a 9 e a até f).' };
  if (hex.length < 4) return { note: 'Digite pelo menos 4 caracteres da marca.' };
  const found = events.filter(e => e.hash.startsWith(hex));
  if (!found.length) return { note: `Nenhuma marca começa com ${hex}.` };
  return { event: found[0], note: found.length > 1 ? `${found.length} marcas começam assim. Mostrando a primeira, nº ${found[0]!.sequence}.` : undefined };
}
