// Every [data-stairs] tablist: click or arrows choose a step and its panel opens in place.
// Nested staircases (journey, modules, bottlenecks) work the same way inside a step.
// Tabs with data-hash keep the address in sync (#modulos, #m4, #gargalo-...), so links work.
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

type Choose = (tab: HTMLElement, opts?: { focus?: boolean; hash?: boolean }) => void;
const tabsOf = (list: Element) => $$<HTMLElement>('[role="tab"]', list).filter(t => t.closest('[data-stairs]') === list);
const panelOf = (tab: Element) => document.getElementById(tab.getAttribute('aria-controls') ?? '');

export const choose: Choose = (tab, { focus = false, hash = true } = {}) => {
  const list = tab.closest('[data-stairs]');
  if (!list) return;
  const tabs = tabsOf(list);
  const at = tabs.indexOf(tab);
  tabs.forEach((t, i) => {
    const on = i === at;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    t.classList.toggle('is-passed', i < at);
    panelOf(t)?.classList.toggle('is-active', on);
  });
  if (focus) tab.focus({ preventScroll: true });
  // On a phone the stairs scroll sideways: keep the chosen one in view without moving the page.
  if (list.scrollWidth > list.clientWidth) {
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
  if (hash && tab.dataset.hash) history.replaceState(null, '', `#${tab.dataset.hash}`);
  list.dispatchEvent(new CustomEvent('stairs:change', { bubbles: true, detail: { tab } }));
};

// Opens the step that holds `el`, from the outside in (a module opens its step first).
export function reveal(el: Element) {
  const chain: HTMLElement[] = [];
  let panel = el.closest<HTMLElement>('[role="tabpanel"]');
  while (panel) {
    const tab = document.querySelector<HTMLElement>(`[role="tab"][aria-controls="${panel.id}"]`);
    if (!tab) break;
    chain.unshift(tab);
    panel = tab.closest<HTMLElement>('[role="tabpanel"]');
  }
  chain.forEach(t => choose(t, { hash: false }));
}

export function mountStairs(root: ParentNode = document) {
  $$('[data-stairs]', root).forEach(list => {
    const cols = Number(list.dataset.grid ?? 0);
    const vertical = list.getAttribute('aria-orientation') === 'vertical';
    list.addEventListener('click', e => {
      const tab = (e.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab && tab.closest('[data-stairs]') === list) choose(tab);
    });
    list.addEventListener('keydown', e => {
      const tabs = tabsOf(list);
      const at = tabs.indexOf(e.target as HTMLElement);
      if (at < 0) return;
      const step = cols || 1;
      const moves: Record<string, number> = {
        ArrowRight: at + 1, ArrowLeft: at - 1, Home: 0, End: tabs.length - 1,
        ArrowDown: vertical ? at + 1 : cols ? at + step : at + 1,
        ArrowUp: vertical ? at - 1 : cols ? at - step : at - 1,
      };
      if (!(e.key in moves)) return;
      e.preventDefault();
      e.stopPropagation();
      const to = tabs[Math.max(0, Math.min(tabs.length - 1, moves[e.key]!))];
      if (to) choose(to, { focus: true });
    });
  });

  // "Anterior" and "Próximo" inside a step panel move along the stairs that own it.
  document.addEventListener('click', e => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-step-go]');
    const panel = btn?.closest<HTMLElement>('[role="tabpanel"]');
    const tab = panel && document.querySelector<HTMLElement>(`[role="tab"][aria-controls="${panel.id}"]`);
    const list = tab?.closest('[data-stairs]');
    if (!btn || !tab || !list) return;
    const tabs = tabsOf(list);
    const next = tabs[tabs.indexOf(tab) + Number(btn.dataset.stepGo)];
    if (next) choose(next, { focus: true });
  });

  // Arrow keys anywhere outside a control move along the main stairs.
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [role="tab"], [data-roving], [contenteditable]')) return;
    if (t !== document.body && !t.matches('[role="tabpanel"], main')) return;
    const list = document.querySelector('.stairs--main');
    if (!list) return;
    const tabs = tabsOf(list);
    const at = tabs.findIndex(x => x.getAttribute('aria-selected') === 'true');
    const next = tabs[at + (e.key === 'ArrowRight' ? 1 : -1)];
    if (!next) return;
    e.preventDefault();
    choose(next);
  });

  const fromHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const tab = document.querySelector<HTMLElement>(`[role="tab"][data-hash="${CSS.escape(id)}"]`);
    if (tab) { reveal(tab); choose(tab, { hash: false }); return; }
    const target = document.getElementById(id);
    if (target) reveal(target);
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}
