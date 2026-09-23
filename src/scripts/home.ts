// Home page islands: the ledger in the hero (Conferir, chain), money switch, module status page,
// bottleneck links and open contributions.
import type { LedgerView } from '../lib/ledger-view/source';
import { mountVerify } from './verify';
import { mountChainLinks, mountFlowHover, mountRoving } from './explorer';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

mountRoving();
mountChainLinks();
mountFlowHover();

/* ---------- Ledger in the hero ---------- */

// The home checks the same published file anyone can download, fetched only on the first click.
const heroPanel = $('#livro-agora [data-verify-panel]');
let published: Promise<LedgerView> | undefined;
async function fetchLedger(): Promise<LedgerView> {
  const res = await fetch('/livro/ledger.json');
  if (!res.ok) throw new Error(`livro ${res.status}`);
  return res.json();
}
// A failed download is not cached, so the next click tries again.
if (heroPanel) mountVerify(heroPanel, () => published ??= fetchLedger().catch(err => { published = undefined; throw err; }));

/* ---------- Money: real ledger or fictional example ---------- */

$$('[data-money-block]').forEach(block => block.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-mode-switch]');
  if (!btn) return;
  const mode = btn.dataset.modeSwitch;
  $$('[data-mode-switch]', block).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  $$('[data-mode-panel]', block).forEach(p => { p.hidden = p.dataset.modePanel !== mode; });
}));

/* ---------- Modules: filters and deep links ---------- */

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

// #m4 opens module M4; #gargalo-... opens that bottleneck.
const openFromHash = () => {
  const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target instanceof HTMLDetailsElement) target.open = true;
};
addEventListener('hashchange', openFromHash);
openFromHash();

/* ---------- Open contributions ---------- */

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
