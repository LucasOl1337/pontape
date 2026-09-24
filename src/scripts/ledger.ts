// /transparencia islands: real or example ledger, type filters, pages of the list, the
// "edit a line in secret" demo, Conferir, and the tabs under the first screen.
import type { LedgerView } from '../lib/ledger-view/source';
import { correctionsOf } from '../lib/ledger-view/money';
import { TECHNICAL_VISIBLE } from '../lib/ledger-view/window';
import { chainEntry } from './chain-card';
import { toast } from './site';
import { mountVerify, readLedger } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
type Mode = 'real' | 'example';

const ledgers: Record<Mode, LedgerView> = { real: readLedger('ledger-real'), example: readLedger('ledger-example') };
const panel = $('#conferir [data-verify-panel]')!;
let olderLoaded = !document.querySelector('[data-load-older]');
let loadingOlder: Promise<void> | null = null;

function titles(): Record<string, string> {
  try { return JSON.parse(document.getElementById('decision-titles')?.textContent || '{}') as Record<string, string>; }
  catch { return {}; }
}

// The first screen is the newest actions. The rest of the real book comes from the public file.
function loadOlder(): Promise<void> {
  if (olderLoaded) return Promise.resolve();
  if (loadingOlder) return loadingOlder;
  const button = $<HTMLButtonElement>('[data-load-older]');
  loadingOlder = (async () => {
    if (button) button.disabled = true;
    try {
      const response = await fetch('/livro/ledger.json');
      if (!response.ok) throw new Error('status');
      const book = await response.json() as LedgerView;
      if (!Array.isArray(book.events) || !book.checkpoint) throw new Error('shape');
      const list = $('#ledger-chain-real')!;
      const have = new Set($$('.chain-entry', list).map(li => li.dataset.seq));
      const corrected = correctionsOf(book.events);
      const names = titles();
      const missing = book.events.filter(event => !have.has(event.sequence))
        .sort((a, b) => Number(b.sequence) - Number(a.sequence));
      for (const event of missing) list.append(chainEntry(event, corrected[event.sequence], names));
      const ordered = $$('.chain-entry', list).sort((a, b) => Number(b.dataset.seq) - Number(a.dataset.seq));
      for (const item of ordered) list.append(item);
      ledgers.real = book;
      olderLoaded = true;
      $('[data-older-note]')?.setAttribute('hidden', '');
      if (button) button.hidden = true;
    } catch (error) {
      if (button) button.disabled = false;
      throw error;
    }
  })().finally(() => { loadingOlder = null; });
  return loadingOlder;
}

const params = new URLSearchParams(location.search);
let mode: Mode = params.has('exemplo') ? 'example' : 'real';

async function ensureOlder() {
  if (mode !== 'real' || olderLoaded) return;
  try { await loadOlder(); }
  catch { toast('Não deu pra buscar as anteriores. A conta segue com o livro desta página.'); }
}

const verify = mountVerify(panel, () => ledgers[mode], ensureOlder);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
let filter = 'all';
let page = 0;
let tampered: { seq: string; amount: string } | null = null;

/* ---------- The list, a page at a time ---------- */

// Four actions a page on a wide screen, three on a phone: the first screen shows the latest ones.
const PAGE_SIZE = matchMedia('(min-width: 960px)').matches ? 4 : 3;
const pager = $('[data-pager]')!;
const listOf = () => $(`[data-ledger-list="${mode}"]`)!;
const matching = () => $$('.chain-entry', listOf()).filter(li => filter === 'all' || li.dataset.type === filter);

function render() {
  const entries = $$('.chain-entry', listOf());
  const shown = matching();
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  page = Math.max(0, Math.min(pages - 1, page));
  entries.forEach(li => { li.hidden = true; });
  shown.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).forEach(li => { li.hidden = false; });
  pager.hidden = pages < 2 && !(mode === 'real' && !olderLoaded);
  $('[data-pager-where]', pager)!.textContent = `Página ${page + 1} de ${pages}`;
  $<HTMLButtonElement>('[data-page="-1"]', pager)!.disabled = page === 0;
  $<HTMLButtonElement>('[data-page="1"]', pager)!.disabled = page >= pages - 1 && olderLoaded;
}
pager.addEventListener('click', async e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-page]');
  if (!btn || btn.disabled) return;
  const dir = Number(btn.dataset.page);
  if (dir > 0 && page >= Math.ceil(matching().length / PAGE_SIZE) - 1 && !olderLoaded) {
    try { await loadOlder(); }
    catch { toast('Não deu pra buscar as anteriores.'); return; }
  }
  page += dir;
  render();
  if (btn.disabled) $<HTMLButtonElement>(`[data-page="${-Number(btn.dataset.page)}"]`, pager)?.focus();
});

async function applyFilter(next: string) {
  filter = next;
  page = 0;
  $$('[data-type-filter]', $(`[data-type-filters="${mode}"]`)!).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.typeFilter === filter)));
  $$('.chain-empty[data-empty-for]:not([data-empty-for="all"])', listOf()).forEach(d => { d.hidden = d.dataset.emptyFor !== filter; });
  if (mode === 'real' && next !== 'all' && !olderLoaded) {
    try { await loadOlder(); }
    catch { toast('Não deu pra buscar as anteriores.'); }
  }
  render();
  verify.reset();
}

function setMode(next: Mode) {
  mode = next;
  $$('[data-mode]', $('.ledger-toolbar')!).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $$('[data-ledger-list], [data-type-filters], [data-money]').forEach(el => {
    el.hidden = (el.dataset.ledgerList ?? el.dataset.typeFilters ?? el.dataset.money) !== mode;
  });
  $$('[data-example-only]').forEach(el => { el.hidden = mode !== 'example'; });
  panel.dataset.list = `ledger-chain-${mode}`;
  applyFilter('all');
}

document.addEventListener('click', e => {
  const target = e.target as Element;
  const go = target.closest<HTMLButtonElement>('[data-goto]');
  if (go?.dataset.goto && /^[1-9][0-9]*$/.test(go.dataset.goto)) {
    location.assign(`/transparencia?ate=${go.dataset.goto}#conferir`);
    return;
  }
  if (target.closest('[data-load-older]')) {
    void loadOlder().then(() => {
      page = Math.floor(TECHNICAL_VISIBLE / PAGE_SIZE);
      render();
    }).catch(() => toast('Não deu pra buscar as anteriores.'));
    return;
  }
  const modeBtn = target.closest<HTMLElement>('[data-mode]');
  if (modeBtn) { setMode(modeBtn.dataset.mode as Mode); return; }
  const filterBtn = target.closest<HTMLElement>('[data-type-filter]');
  if (filterBtn) applyFilter(filterBtn.dataset.typeFilter!);
});

// When Conferir finds a broken link, turn to the page where it is and show it.
panel.addEventListener('verified', e => {
  const seq = (e as CustomEvent<{ sequence: string | null }>).detail.sequence;
  if (!seq) return;
  const index = matching().findIndex(li => li.dataset.seq === seq);
  if (index < 0) return;
  page = Math.floor(index / PAGE_SIZE);
  render();
  $(`.chain-entry[data-seq="${seq}"]`, listOf())?.scrollIntoView({ block: 'center' });
});

/* ---------- Example only: edit a money line without redoing its mark ---------- */

const tamperBtn = $<HTMLButtonElement>('[data-tamper]');
const untamperBtn = $<HTMLButtonElement>('[data-untamper]');
const showAmount = (seq: string, cents: string) => {
  const el = $(`#ledger-chain-example .chain-entry[data-seq="${seq}"] [data-amount]`);
  const value = BigInt(cents);
  if (el) el.textContent = `${value > 0n ? '+' : '−'} ${brl.format(Math.abs(Number(value)) / 100)}`;
};
tamperBtn?.addEventListener('click', () => {
  const target = ledgers.example.events.find(e => e.payload.type === 'finance');
  if (!target || target.payload.type !== 'finance') return;
  tampered = { seq: target.sequence, amount: target.payload.amountCents };
  target.payload.amountCents = String(BigInt(target.payload.amountCents) * 10n);
  showAmount(target.sequence, target.payload.amountCents);
  tamperBtn.hidden = true;
  if (untamperBtn) untamperBtn.hidden = false;
  verify.reset();
  toast(`Mudamos o valor da ação nº ${target.sequence} sem refazer a marca dela. Agora aperte Conferir.`);
});
untamperBtn?.addEventListener('click', () => {
  const target = ledgers.example.events.find(e => e.sequence === tampered?.seq);
  if (!target || target.payload.type !== 'finance' || !tampered) return;
  target.payload.amountCents = tampered.amount;
  showAmount(target.sequence, tampered.amount);
  tampered = null;
  untamperBtn.hidden = true;
  if (tamperBtn) tamperBtn.hidden = false;
  verify.reset();
  toast('Mudança desfeita. O livro voltou ao que era.');
});

/* ---------- Tabs: como conferir, dinheiro, o que entra ---------- */

const tablist = $('[data-tabs]');
const tabs = tablist ? $$<HTMLButtonElement>('[role="tab"]', tablist) : [];
function selectTab(i: number, focus = false) {
  const next = (i + tabs.length) % tabs.length;
  tabs.forEach((tab, k) => {
    tab.setAttribute('aria-selected', String(k === next));
    tab.tabIndex = k === next ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')!)?.classList.toggle('is-active', k === next);
  });
  if (focus) tabs[next]!.focus();
  // On a phone with large text the row scrolls sideways: the chosen tab comes into view.
  if (tablist && tablist.scrollWidth > tablist.clientWidth) {
    const tab = tabs[next]!;
    tablist.scrollLeft = Math.max(0, Math.min(tab.offsetLeft - tablist.offsetLeft, tablist.scrollWidth - tablist.clientWidth));
  }
}
// When the tabs do not fit, each side that still hides a tab fades out, as a hint to swipe.
function markMore() {
  if (!tablist) return;
  tablist.toggleAttribute('data-more', tablist.scrollWidth - tablist.clientWidth - tablist.scrollLeft > 2);
  tablist.toggleAttribute('data-less', tablist.scrollLeft > 2);
}
tablist?.addEventListener('scroll', markMore, { passive: true });
// The tabs change size with the screen, the fonts arriving and the browser's text size.
if (tablist) { const sizes = new ResizeObserver(markMore); [tablist, ...tabs].forEach(el => sizes.observe(el)); }
tablist?.addEventListener('click', e => {
  const tab = (e.target as Element).closest<HTMLButtonElement>('[role="tab"]');
  if (tab) selectTab(tabs.indexOf(tab));
});
tablist?.addEventListener('keydown', e => {
  const current = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const moves: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
  if (!(e.key in moves)) return;
  e.preventDefault();
  selectTab(moves[e.key]!, true);
});
const openTabFromHash = (hash: string) => {
  const i = tabs.findIndex(t => `#${t.getAttribute('aria-controls')}` === hash);
  if (i < 0) return false;
  selectTab(i);
  document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  return true;
};
document.addEventListener('click', e => {
  const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (link && openTabFromHash(link.hash)) { e.preventDefault(); history.replaceState(null, '', link.hash); }
});
addEventListener('hashchange', () => openTabFromHash(location.hash));

setMode(mode);
const initialType = params.get('tipo');
if (initialType && ['finance', 'field', 'candidate', 'project'].includes(initialType)) applyFilter(initialType);
if (location.hash) openTabFromHash(location.hash);
