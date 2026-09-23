// Home page islands: module filters and dialog, compare, contributions, ledger teaser.
// The journey needs no script: it lights up with the scroll, in css.
import { stopSpeech } from './site';
import { mountVerify, readLedger } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Re-layouts of a bento grid glide into place with a same-page view transition where the browser has it.
// Each cell carries its own name in --vt; names are set only during the change.
type ViewTransitionDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
function glide(grid: HTMLElement | null, change: () => void) {
  const doc = document as ViewTransitionDoc;
  if (!grid || !doc.startViewTransition || reducedMotion.matches) { change(); return; }
  const root = document.documentElement;
  grid.classList.add('is-gliding');
  root.classList.add('vt-glide');
  doc.startViewTransition(change).finished.finally(() => { grid.classList.remove('is-gliding'); root.classList.remove('vt-glide'); });
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
  if (moduleMatch) openModule(`M${moduleMatch[1]}`);
};
addEventListener('hashchange', openFromHash);
openFromHash();

/* ---------- Compare: loose help vs full path ---------- */

const CAPTIONS: Record<string, string> = {
  loose: 'Só o prato de comida. Ajuda hoje, mas amanhã tudo volta.',
  full: 'Comida, roupa, higiene, trabalho e IA. Um degrau depois do outro.',
};
$$<HTMLButtonElement>('[data-compare]').forEach(btn => btn.addEventListener('click', () => {
  $$('[data-compare]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  $('#compare-path')!.dataset.mode = btn.dataset.compare!;
  $('#compare-caption')!.textContent = CAPTIONS[btn.dataset.compare!] ?? '';
}));

/* ---------- Open contributions ---------- */

const contribFilters = $('[data-contrib-filters]');
const contribGrid = $('[data-contrib-grid]');
const moreBtn = $<HTMLButtonElement>('[data-contrib-more]');
let contribFilter = 'all';
let expanded = false;
const renderContributions = () => {
  $$('.contrib-card', contribGrid ?? document).forEach(card => {
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
  glide(contribGrid, renderContributions);
});
moreBtn?.addEventListener('click', () => {
  const firstHidden = $<HTMLElement>('.contrib-card[data-extra="true"]', contribGrid ?? document);
  expanded = true;
  glide(contribGrid, () => {
    renderContributions();
    firstHidden?.querySelector('a')?.focus({ preventScroll: true });
  });
});

/* ---------- Ledger teaser (block 05) ---------- */

const teaserPanel = $('#transparencia [data-verify-panel]');
if (teaserPanel) {
  const ledger = readLedger(teaserPanel.dataset.source!);
  mountVerify(teaserPanel, () => ledger);
}
