// Home: the staircase (a tab list you climb with the arrows), the "cadernos" that open in place
// over it, the module dialog and the classified-ad filters. Everything answers to the URL hash,
// so the header links, /transparencia and shared links land on the right step or sheet.
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

/* ---------- The staircase ---------- */

const escada = $('[data-escada]')!;
const stair = $('[data-stair]', escada)!;
const tabs = $$<HTMLButtonElement>('[role="tab"]', stair);
const panels = $$('[data-panel]', escada);
let at = 0;

function climb(k: number, { focusTab = false } = {}) {
  const next = Math.max(0, Math.min(tabs.length - 1, k));
  at = next;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === at));
    tab.tabIndex = i === at ? 0 : -1;
    tab.classList.toggle('is-ahead', i > at);
  });
  panels.forEach((panel, i) => panel.classList.toggle('is-active', i === at));
  stair.style.setProperty('--at', String(at));
  escada.dataset.at = String(at);
  if (focusTab) tabs[at]!.focus();
}

stair.addEventListener('click', e => {
  const tab = (e.target as Element).closest<HTMLButtonElement>('[role="tab"]');
  if (tab) climb(tabs.indexOf(tab));
});
// Up and right climb, down and left go back: the staircase rises to the right.
const KEYS: Record<string, (k: number) => number> = {
  ArrowRight: k => k + 1, ArrowUp: k => k + 1, ArrowLeft: k => k - 1, ArrowDown: k => k - 1,
  Home: () => 0, End: () => tabs.length - 1,
};
stair.addEventListener('keydown', e => {
  const move = KEYS[e.key];
  if (!move) return;
  e.preventDefault();
  climb(move(at), { focusTab: true });
});
// Left and right also work while reading a step, as long as focus is not in a control.
document.addEventListener('keydown', e => {
  if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey || e.defaultPrevented) return;
  const active = document.activeElement;
  if ($('dialog[open]') || (active && active !== document.body && !active.matches('[data-panel]'))) return;
  e.preventDefault();
  const onPanel = active?.matches('[data-panel]');
  climb(KEYS[e.key]!(at));
  if (onPanel) panels[at]!.focus({ preventScroll: true });
});
escada.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-go]');
  if (!btn) return;
  const direction = Number(btn.dataset.go) > at ? 'next' : 'back';
  climb(Number(btn.dataset.go));
  // Keep the focus on the same kind of button in the new step, or on its tread.
  const same = $$<HTMLButtonElement>('[data-go]', panels[at]!).find(b => (Number(b.dataset.go) > at ? 'next' : 'back') === direction);
  (same ?? tabs[at]!).focus({ preventScroll: true });
});

/* ---------- Sheets (cadernos) and the module dialog ---------- */

const SHEETS = ['construir', 'modulos', 'gargalos', 'contribuicoes', 'codigo-aberto'];
const STEP_HASH: Record<string, number> = { inicio: 0, 'como-funciona': 1, transparencia: tabs.length - 2, ajudar: tabs.length - 1 };
let focusBefore: HTMLElement | null = null;

function closeSheets() {
  $$<HTMLDialogElement>('dialog.sheet[open]').forEach(d => d.close());
}
function openSheet(id: string) {
  const sheet = document.getElementById(id);
  if (!(sheet instanceof HTMLDialogElement)) return null;
  if (!sheet.open) {
    const opener = document.activeElement as HTMLElement | null;
    closeSheets();
    focusBefore = opener && !opener.closest('dialog') ? opener : focusBefore;
    sheet.showModal();
    sheet.scrollTop = 0;
  }
  return sheet;
}
$$<HTMLDialogElement>('dialog.sheet').forEach(sheet => sheet.addEventListener('close', () => {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  if (!$('dialog.sheet[open]') && focusBefore?.isConnected) focusBefore.focus({ preventScroll: true });
}));

const moduleDialog = $<HTMLDialogElement>('#module-dialog');
let moduleOrigin: HTMLElement | null = null;
function openModule(id: string, origin?: HTMLElement | null) {
  const tpl = document.getElementById(`module-${id}`) as HTMLTemplateElement | null;
  if (!moduleDialog || !tpl) return;
  $('#module-dialog-id')!.textContent = id;
  $('#module-dialog-title')!.textContent = tpl.dataset.name ?? '';
  $('#module-dialog-body')!.replaceChildren(tpl.content.cloneNode(true));
  if (!moduleDialog.open) { moduleOrigin = origin ?? (document.activeElement as HTMLElement | null); moduleDialog.showModal(); }
  moduleDialog.scrollTop = 0;
  $('.close-btn', moduleDialog)?.focus();
}
moduleDialog?.addEventListener('close', () => {
  if (/^#m[1-9]$/i.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  if (moduleOrigin?.isConnected) moduleOrigin.focus({ preventScroll: true });
});
document.addEventListener('click', e => {
  const mod = (e.target as Element).closest<HTMLElement>('[data-module]');
  if (mod) openModule(mod.dataset.module!, moduleDialog?.open ? null : mod);
});

// One router for every in-page link: steps, sheets, a single bottleneck, a module.
function route(hash: string) {
  const id = decodeURIComponent(hash.slice(1));
  const moduleMatch = id.match(/^m([1-9])$/i);
  if (moduleMatch) { openModule(`M${moduleMatch[1]}`); return true; }
  if (id.startsWith('gargalo-')) {
    const item = document.getElementById(id);
    if (!(item instanceof HTMLDetailsElement)) return false;
    openSheet('gargalos');
    item.open = true;
    item.scrollIntoView({ block: 'start' });
    item.querySelector('summary')?.focus({ preventScroll: true });
    return true;
  }
  if (SHEETS.includes(id)) { openSheet(id)?.querySelector<HTMLElement>('.close-btn')?.focus(); return true; }
  const step = id in STEP_HASH ? STEP_HASH[id]! : Number(id.match(/^degrau-(\d+)$/)?.[1] ?? NaN);
  if (Number.isInteger(step)) {
    closeSheets();
    climb(step);
    escada.scrollIntoView({ block: 'start' });
    tabs[at]!.focus({ preventScroll: true });
    return true;
  }
  return false;
}
document.addEventListener('click', e => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!link || link.pathname !== location.pathname || !link.hash) return;
  if (route(link.hash)) e.preventDefault();
});
addEventListener('hashchange', () => route(location.hash));
if (location.hash) route(location.hash);

/* ---------- Modules sheet: filters ---------- */

const filters = $('[data-module-filters]');
filters?.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-filter]');
  if (!btn) return;
  const filter = btn.dataset.filter!;
  $$('[data-filter]', filters).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  $$('[data-status-item]').forEach(li => { li.hidden = filter !== 'all' && li.dataset.statusItem !== filter; });
  $$('[data-filter-note]').forEach(p => { p.hidden = p.dataset.filterNote !== filter; });
  $$('[data-empty-for]', $('#modulos')!).forEach(d => { d.hidden = d.dataset.emptyFor !== filter; });
});

/* ---------- Classified ads (open contributions) ---------- */

const contribFilters = $('[data-contrib-filters]');
const moreBtn = $<HTMLButtonElement>('[data-contrib-more]');
let contribFilter = 'all';
let expanded = false;
const renderContributions = () => {
  $$('[data-contrib-grid] .contrib-card').forEach(card => {
    const match = contribFilter === 'all' || (contribFilter === 'first' ? card.dataset.first === 'true' : card.dataset.type === contribFilter);
    card.hidden = !match || (contribFilter === 'all' && !expanded && card.dataset.extra === 'true');
  });
  if (moreBtn) moreBtn.hidden = contribFilter !== 'all' || expanded;
};
contribFilters?.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-contrib]');
  if (!btn) return;
  contribFilter = btn.dataset.contrib!;
  $$('[data-contrib]', contribFilters).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  renderContributions();
});
moreBtn?.addEventListener('click', () => {
  const firstHidden = $<HTMLElement>('[data-contrib-grid] .contrib-card[data-extra="true"]');
  expanded = true;
  renderContributions();
  firstHidden?.querySelector('a')?.focus();
});
