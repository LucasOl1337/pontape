// Home (rodada 2): the staircase of numbers, Conferir in the ledger step, the money switch and
// the paged open tasks.
import type { LedgerView } from '../lib/ledger-view/source';
import { mountVerify } from './verify';
import { mountChainLinks, mountFlowHover, mountRoving } from './explorer';
import { choose, mountStairs } from './stairs';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

mountStairs();
mountRoving();
mountChainLinks();
mountFlowHover();

/* ---------- Conferir, in the ledger step ---------- */

// The home checks the same published file anyone can download, fetched only on the first click.
const verifyPanel = $('#p-livro [data-verify-panel]');
let published: Promise<LedgerView> | undefined;
async function fetchLedger(): Promise<LedgerView> {
  const res = await fetch('/livro/ledger.json');
  if (!res.ok) throw new Error(`livro ${res.status}`);
  return res.json();
}
// A failed download is not cached, so the next click tries again.
if (verifyPanel) mountVerify(verifyPanel, () => published ??= fetchLedger().catch(err => { published = undefined; throw err; }));

/* ---------- Money: real ledger or fictional example ---------- */

$$('.money-step').forEach(step => step.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-mode-switch]');
  if (!btn) return;
  const mode = btn.dataset.modeSwitch;
  $$('[data-mode-switch]', step).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  $$('[data-mode-panel]', step).forEach(p => { p.hidden = p.dataset.modePanel !== mode; });
}));

/* ---------- Open tasks: filters and pages ---------- */

const contribs = $('[data-contribs]');
if (contribs) {
  const PAGE = 3;
  const rows = $$('[data-contrib-grid] .contrib-row', contribs);
  const pager = $('[data-pager]', contribs)!;
  const pagerText = $('[data-pager-text]', contribs)!;
  const [prev, next] = $$<HTMLButtonElement>('[data-page]', pager);
  let filter = 'all';
  let page = 0;
  const matches = (row: HTMLElement) => filter === 'all'
    || (filter === 'first' ? row.dataset.first === 'true'
      : filter.startsWith('g:') ? row.dataset.bottleneck === filter.slice(2) : row.dataset.type === filter);
  const render = () => {
    const shown = rows.filter(matches);
    const pages = Math.max(1, Math.ceil(shown.length / PAGE));
    page = Math.min(page, pages - 1);
    rows.forEach(r => { r.hidden = true; });
    shown.slice(page * PAGE, page * PAGE + PAGE).forEach(r => { r.hidden = false; });
    pager.hidden = shown.length <= PAGE;
    const from = shown.length ? page * PAGE + 1 : 0;
    pagerText.textContent = `${from} a ${Math.min(shown.length, (page + 1) * PAGE)} de ${shown.length} ${shown.length === 1 ? 'tarefa' : 'tarefas'}`;
    if (prev) prev.disabled = page === 0;
    if (next) next.disabled = page >= pages - 1;
  };
  const setFilter = (f: string) => {
    filter = f;
    page = 0;
    $$('[data-contrib]', contribs).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.contrib === f)));
    render();
  };
  contribs.addEventListener('click', e => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-contrib], [data-page]');
    if (btn?.dataset.contrib) setFilter(btn.dataset.contrib);
    else if (btn?.dataset.page) { page += Number(btn.dataset.page); render(); }
  });
  // "N tarefas pra esse gargalo" opens the last step already filtered.
  document.addEventListener('click', e => {
    const link = (e.target as Element).closest<HTMLElement>('[data-contrib-link]');
    const tab = $('#t-ajudar');
    if (!link || !tab) return;
    e.preventDefault();
    setFilter(`g:${link.dataset.contribLink}`);
    choose(tab, { focus: true });
  });
  render();
}
