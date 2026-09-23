// Home page islands: the drawings that follow the scroll, module filters and dialog,
// the classified ads, and the Conferir of the ledger chapter.
import './story';
import { stopSpeech } from './site';
import { mountVerify, readLedger } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];

/* ---------- Modules: filters and dialog ---------- */

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
  history.replaceState(null, '', `#${id.toLowerCase()}`);
}
dialog?.addEventListener('close', () => {
  stopSpeech();
  history.replaceState(null, '', location.pathname + location.search);
  if (focusBefore?.isConnected) focusBefore.focus({ preventScroll: true });
});
document.addEventListener('click', e => {
  const mod = (e.target as Element).closest<HTMLElement>('[data-module]');
  if (mod) openModule(mod.dataset.module!, dialog?.open ? null : mod);
});
const openFromHash = () => {
  const moduleMatch = location.hash.match(/^#m([1-9])$/i);
  if (moduleMatch) { openModule(`M${moduleMatch[1]}`); return; }
  const bottleneck = location.hash.startsWith('#gargalo-') && document.getElementById(location.hash.slice(1));
  if (bottleneck instanceof HTMLDetailsElement) bottleneck.open = true;
};
addEventListener('hashchange', openFromHash);
openFromHash();

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

/* ---------- Ledger chapter: Conferir ---------- */

const teaserPanel = $('#transparencia [data-verify-panel]');
if (teaserPanel) {
  const ledger = readLedger(teaserPanel.dataset.source!);
  mountVerify(teaserPanel, () => ledger);
}
