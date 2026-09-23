// /transparencia: the four tabs of the ledger, real or example ledger, type filters and pages,
// the "edit a line in secret" demo, and Conferir.
import type { LedgerView } from '../lib/ledger-view/source';
import { stopSpeech, toast } from './site';
import { mountVerify, readLedger } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
type Mode = 'real' | 'example';

const ledgers: Record<Mode, LedgerView> = { real: readLedger('ledger-real'), example: readLedger('ledger-example') };
const panel = $('#conferir [data-verify-panel]')!;
const verify = mountVerify(panel, () => ledgers[mode]);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const params = new URLSearchParams(location.search);
let mode: Mode = params.has('exemplo') ? 'example' : 'real';
let filter = 'all';
let page = 0;
let tampered: { seq: string; amount: string } | null = null;

/* ---------- Tabs: the small stair of the ledger ---------- */

const tablist = $('[data-ledger-tabs]')!;
const tabs = $$<HTMLElement>('[role="tab"]', tablist);
function selectTab(id: string, { focus = false, scroll = false } = {}) {
  const index = Math.max(0, tabs.findIndex(t => t.getAttribute('aria-controls') === id));
  stopSpeech();
  tabs.forEach((t, k) => {
    t.setAttribute('aria-selected', String(k === index));
    t.tabIndex = k === index ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')!)!.hidden = k !== index;
  });
  if (focus) tabs[index]!.focus();
  if (scroll) tablist.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
tablist.addEventListener('click', e => {
  const tab = (e.target as Element).closest<HTMLElement>('[role="tab"]');
  if (tab) selectTab(tab.getAttribute('aria-controls')!);
});
tablist.addEventListener('keydown', e => {
  const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const keys: Record<string, number> = { ArrowRight: i + 1, ArrowUp: i + 1, ArrowLeft: i - 1, ArrowDown: i - 1, Home: 0, End: tabs.length - 1 };
  if (!(e.key in keys)) return;
  e.preventDefault();
  const next = tabs[Math.max(0, Math.min(tabs.length - 1, keys[e.key]!))]!;
  selectTab(next.getAttribute('aria-controls')!, { focus: true });
});

/* ---------- The list: mode, filter and pages ---------- */

const pager = $('[data-ledger-pager]');
// Ten lines per page; five on a phone, where each line is taller.
const pageSize = matchMedia('(max-width: 719px)').matches ? 5 : Number(pager?.dataset.pageSize ?? 10);
const list = () => $(`[data-ledger-list="${mode}"]`)!;
const matching = () => $$('.chain-entry', list()).filter(li => filter === 'all' || li.dataset.type === filter);

function render() {
  const all = $$('.chain-entry', list());
  const shown = matching();
  const pages = Math.max(1, Math.ceil(shown.length / pageSize));
  page = Math.max(0, Math.min(pages - 1, page));
  all.forEach(li => { li.hidden = true; });
  shown.slice(page * pageSize, (page + 1) * pageSize).forEach(li => { li.hidden = false; });
  $$('.chain-empty[data-empty-for]:not([data-empty-for="all"])', list()).forEach(d => { d.hidden = d.dataset.emptyFor !== filter; });
  if (pager) {
    pager.hidden = pages < 2;
    $('[data-page-label]', pager)!.textContent = `${page + 1} de ${pages}`;
    $$<HTMLButtonElement>('[data-page]', pager).forEach(b => { b.disabled = b.dataset.page === '-1' ? page === 0 : page >= pages - 1; });
  }
}

function applyFilter(next: string) {
  filter = next;
  page = 0;
  $$('[data-type-filter]', $(`[data-type-filters="${mode}"]`)!).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.typeFilter === filter)));
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
  const modeBtn = target.closest<HTMLElement>('[data-mode]');
  if (modeBtn) { setMode(modeBtn.dataset.mode as Mode); selectTab('acoes'); return; }
  const filterBtn = target.closest<HTMLElement>('[data-type-filter]');
  if (filterBtn) { applyFilter(filterBtn.dataset.typeFilter!); return; }
  const pageBtn = target.closest<HTMLButtonElement>('[data-page]');
  if (pageBtn && pager?.contains(pageBtn) && !pageBtn.disabled) {
    page += Number(pageBtn.dataset.page);
    render();
    list().scrollIntoView({ block: 'nearest' });
    return;
  }
  const tabLink = target.closest<HTMLElement>('[data-ledger-tab]');
  if (tabLink) selectTab(tabLink.dataset.ledgerTab!, { scroll: true });
});

// Conferir walks every line, on every page. If one is broken, show the page that holds it.
panel.addEventListener('verify:broken', e => {
  const seq = (e as CustomEvent<string>).detail;
  if (filter !== 'all') applyFilter('all');
  const index = matching().findIndex(li => li.dataset.seq === seq);
  if (index < 0) return;
  selectTab('acoes');
  page = Math.floor(index / pageSize);
  render();
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

/* ---------- Start ---------- */

setMode(mode);
const initialType = params.get('tipo');
if (initialType && ['finance', 'field', 'candidate', 'project'].includes(initialType)) applyFilter(initialType);
const fromHash = () => {
  const id = location.hash.slice(1);
  if (tabs.some(t => t.getAttribute('aria-controls') === id)) selectTab(id, { scroll: true });
};
fromHash();
addEventListener('hashchange', fromHash);
