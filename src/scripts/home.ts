// Home: the stair of blocks. One step is open at a time and its content fills the stage.
// Also: the small stairs inside steps (journey, bottlenecks), module filters and dialog,
// contributions with filter and pages, and the ledger teaser.
import { stopSpeech } from './site';
import { mountVerify, readLedger } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Same breakpoint as home.css: the whole home fits in one screen.
const oneScreen = matchMedia('(min-width: 1024px) and (min-height: 800px)');

// Re-layouts glide into place with a same-page view transition where the browser has it.
// Cells carry their own name in --vt; names are set only during the change (motion.css).
type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
function glide(grid: HTMLElement | null, change: () => void) {
  const doc = document as ViewTransitionDoc;
  if (!grid || !doc.startViewTransition || reducedMotion.matches) { change(); return; }
  const root = document.documentElement;
  grid.classList.add('is-gliding');
  root.classList.add('vt-glide');
  doc.startViewTransition(change).finished.finally(() => { grid.classList.remove('is-gliding'); root.classList.remove('vt-glide'); });
}

// A row of tabs that follows the arrows (automatic activation). `next` also answers to ArrowUp:
// on the stair, going up is going forward.
function tabs(list: HTMLElement, onSelect: (tab: HTMLElement, index: number) => void, { upIsNext = false } = {}) {
  const all = $$<HTMLElement>('[role="tab"]', list);
  const select = (i: number, focus = false) => {
    const index = Math.max(0, Math.min(all.length - 1, i));
    all.forEach((t, k) => { t.setAttribute('aria-selected', String(k === index)); t.tabIndex = k === index ? 0 : -1; });
    if (focus) all[index]!.focus();
    onSelect(all[index]!, index);
  };
  const current = () => all.findIndex(t => t.getAttribute('aria-selected') === 'true');
  list.addEventListener('click', e => {
    const tab = (e.target as Element).closest<HTMLElement>('[role="tab"]');
    if (tab) select(all.indexOf(tab));
  });
  list.addEventListener('keydown', e => {
    const i = current();
    const keys: Record<string, number> = {
      ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: all.length - 1,
      ArrowDown: upIsNext ? i - 1 : i + 1, ArrowUp: upIsNext ? i + 1 : i - 1,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key]!, true);
  });
  return { select, all };
}

/* ---------- The stair ---------- */

const stairway = $('[data-stairway]');
const stair = stairway && $('[role="tablist"]', stairway);
const stage = $('[data-stage]');
const panels = $$('.stage-panel', stage ?? document);
let activeIndex = 0;

function showStep(index: number, { focusPanel = false, updateHash = true } = {}) {
  if (!stairway || !stage) return;
  const panel = panels[index];
  if (!panel) return;
  stopSpeech();
  stage.dataset.dir = index >= activeIndex ? 'up' : 'down';
  activeIndex = index;
  panels.forEach((p, k) => { p.hidden = k !== index; });
  stairway.dataset.active = panel.id;
  const now = $('[data-stair-now]', stairway);
  const tab = document.getElementById(panel.getAttribute('aria-labelledby') ?? '');
  if (now && tab) now.innerHTML = `Degrau ${index + 1} de ${panels.length} · <strong>${$('.step-name', tab)?.textContent ?? ''}</strong>`;
  if (updateHash) history.replaceState(null, '', index === 0 ? location.pathname + location.search : `#${panel.id}`);
  // On phones the content sits under the stair: bring its top into view.
  if (!oneScreen.matches && stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  if (focusPanel) panel.focus({ preventScroll: true });
}

const stairTabs = stair ? tabs(stair, (_tab, i) => showStep(i), { upIsNext: true }) : null;

// Go to a step, or to the step that holds an element (#gargalo-..., #codigo-aberto, #pra-voce).
function goTo(id: string, { focus = true } = {}) {
  const target = document.getElementById(id);
  const panel = target?.closest<HTMLElement>('.stage-panel');
  if (!target || !panel || !stairTabs) return false;
  const index = panels.indexOf(panel);
  stairTabs.select(index);
  if (target.matches('.bn-detail')) selectBottleneck(target.id);
  if (focus) (target === panel ? panel : target).focus({ preventScroll: true });
  return true;
}

document.addEventListener('click', e => {
  const go = (e.target as Element).closest<HTMLElement>('[data-go]');
  if (go) { e.preventDefault(); goTo(go.dataset.go!); return; }
  // Links inside the page (header menu, notes) open their step instead of jumping.
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
  if (link && (link.pathname === location.pathname)) {
    const id = link.hash.slice(1);
    if (id && goTo(id)) e.preventDefault();
  }
});

/* ---------- Journey: the small stair inside step 2 ---------- */

const substair = $('[data-substair]');
if (substair) {
  tabs(substair, tab => {
    const id = tab.getAttribute('aria-controls');
    $$('.passo').forEach(p => { p.hidden = p.id !== id; });
  });
}

/* ---------- Bottlenecks: list and detail ---------- */

const bnTabs = $('[data-bottleneck-tabs]');
const bottlenecks = bnTabs ? tabs(bnTabs, tab => {
  const id = tab.getAttribute('aria-controls');
  $$('.bn-detail').forEach(d => { d.hidden = d.id !== id; });
}) : null;
function selectBottleneck(detailId: string) {
  const index = bottlenecks?.all.findIndex(t => t.getAttribute('aria-controls') === detailId) ?? -1;
  if (index >= 0) bottlenecks!.select(index);
}

/* ---------- Modules: filters and dialog ---------- */

const filters = $('[data-module-filters]');
filters?.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-filter]');
  if (!btn) return;
  const filter = btn.dataset.filter!;
  $$('[data-filter]', filters).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  glide($('[data-module-grid]'), () => {
    $$('[data-status-item]').forEach(li => { li.hidden = filter !== 'all' && li.dataset.statusItem !== filter; });
    $$('[data-filter-note]').forEach(p => { p.hidden = p.dataset.filterNote !== filter; });
    $$('[data-empty-for]', $('#modulos')!).forEach(d => { d.hidden = d.dataset.emptyFor !== filter; });
  });
});

const dialog = $<HTMLDialogElement>('#module-dialog');
let focusBefore: HTMLElement | null = null;
function openModule(id: string, origin?: HTMLElement | null) {
  const tpl = document.getElementById(`module-${id}`) as HTMLTemplateElement | null;
  if (!dialog || !tpl) return;
  stopSpeech();
  $('#module-dialog-id')!.textContent = id;
  $('#module-dialog-title')!.textContent = tpl.dataset.name ?? '';
  $('#module-dialog-body')!.replaceChildren(tpl.content.cloneNode(true));
  if (!dialog.open) { focusBefore = origin ?? (document.activeElement as HTMLElement | null); dialog.showModal(); }
  dialog.scrollTop = 0;
  $('.close-btn', dialog)?.focus();
}
dialog?.addEventListener('close', () => {
  stopSpeech();
  if (focusBefore?.isConnected) focusBefore.focus({ preventScroll: true });
});
document.addEventListener('click', e => {
  const mod = (e.target as Element).closest<HTMLElement>('[data-module]');
  if (mod) openModule(mod.dataset.module!, dialog?.open ? null : mod);
});

/* ---------- Open contributions: filter and pages ---------- */

const contribFilters = $('[data-contrib-filters]');
const contribGrid = $('[data-contrib-grid]');
const pager = $('[data-contrib-pager]');
const pageSize = Number(contribGrid?.dataset.pageSize ?? 6);
let contribFilter = 'all';
let page = 0;
const renderContributions = () => {
  const cards = $$('.contrib-card', contribGrid ?? document);
  const matching = cards.filter(card => contribFilter === 'all' || (contribFilter === 'first' ? card.dataset.first === 'true' : card.dataset.type === contribFilter));
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  page = Math.max(0, Math.min(pages - 1, page));
  cards.forEach(card => { card.hidden = true; });
  matching.slice(page * pageSize, (page + 1) * pageSize).forEach(card => { card.hidden = false; });
  if (pager) {
    $('[data-page-label]', pager)!.textContent = `${page + 1} de ${pages}`;
    $$<HTMLButtonElement>('[data-page]', pager).forEach(b => { b.disabled = b.dataset.page === '-1' ? page === 0 : page >= pages - 1; });
  }
};
contribFilters?.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-contrib]');
  if (!btn) return;
  contribFilter = btn.dataset.contrib!;
  page = 0;
  $$('[data-contrib]', contribFilters).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  glide(contribGrid, renderContributions);
});
pager?.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-page]');
  if (!btn || btn.disabled) return;
  page += Number(btn.dataset.page);
  glide(contribGrid, renderContributions);
});
renderContributions();

/* ---------- Ledger teaser (step 4) ---------- */

const teaserPanel = $('#transparencia [data-verify-panel]');
if (teaserPanel) {
  const ledger = readLedger(teaserPanel.dataset.source!);
  mountVerify(teaserPanel, () => ledger);
}

/* ---------- Start: the step in the address, if any ---------- */

const openFromHash = () => {
  const id = decodeURIComponent(location.hash.slice(1));
  const moduleMatch = id.match(/^m([1-9])$/i);
  if (moduleMatch) { goTo('modulos', { focus: false }); openModule(`M${moduleMatch[1]}`); return true; }
  return !!id && goTo(id, { focus: false });
};
if (!openFromHash()) showStep(0, { updateHash: false });
addEventListener('hashchange', openFromHash);
if (oneScreen.matches && location.hash) scrollTo(0, 0);
stairway?.setAttribute('data-ready', '');
