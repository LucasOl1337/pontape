// Home page islands: journey tabs, module filters and dialog, compare, contributions, ledger teaser.
import { stopSpeech } from './site';
import { mountVerify, readEvents } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- Journey tabs ---------- */

const track = $('[data-journey]');
if (track) {
  const tabs = $$<HTMLButtonElement>('[role="tab"]', track);
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls') ?? '')!);
  let current = 0;
  const select = (i: number, { focus = false } = {}) => {
    current = Math.max(0, Math.min(tabs.length - 1, i));
    tabs.forEach((tab, k) => {
      tab.setAttribute('aria-selected', String(k === current));
      tab.tabIndex = k === current ? 0 : -1;
      tab.classList.toggle('done', k < current);
      panels[k]!.hidden = k !== current;
    });
    const tab = tabs[current]!;
    if (focus) tab.focus({ preventScroll: true });
    if (track.scrollWidth > track.clientWidth) {
      track.scrollTo({ left: tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    const panel = panels[current]!;
    if (!reducedMotion.matches) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
  };
  track.addEventListener('click', e => {
    const tab = (e.target as Element).closest<HTMLButtonElement>('[role="tab"]');
    if (tab) select(tabs.indexOf(tab));
  });
  track.addEventListener('keydown', e => {
    const keys: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select(keys[e.key]!, { focus: true });
  });
  panels.forEach(panel => panel.addEventListener('click', e => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-step]');
    if (!btn || btn.disabled) return;
    const step = btn.dataset.step!;
    select(current + Number(step));
    const same = $<HTMLButtonElement>(`[data-step="${step}"]`, panels[current]!);
    (same && !same.disabled ? same : tabs[current]!).focus({ preventScroll: true });
  }));
}

/* ---------- Modules: filters and dialog ---------- */

const filters = $('[data-module-filters]');
filters?.addEventListener('click', e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-filter]');
  if (!btn) return;
  const filter = btn.dataset.filter!;
  $$('[data-filter]', filters).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  const items = $$('[data-status-item]');
  items.forEach(li => { li.hidden = filter !== 'all' && li.dataset.statusItem !== filter; });
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

/* ---------- Compare: loose help vs full path ---------- */

const CAPTIONS: Record<string, string> = {
  loose: 'Só o prato de comida. Ajuda hoje, mas amanhã tudo volta.',
  full: 'Comida, roupa, higiene, trabalho e IA. Um degrau depois do outro.',
};
$$<HTMLButtonElement>('[data-compare]').forEach(btn => btn.addEventListener('click', () => {
  $$('[data-compare]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  $('#compare-stairs')!.dataset.mode = btn.dataset.compare!;
  $('#compare-caption')!.textContent = CAPTIONS[btn.dataset.compare!] ?? '';
}));

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

/* ---------- Ledger teaser (block 05) ---------- */

const teaserPanel = $('#transparencia [data-verify-panel]');
if (teaserPanel) mountVerify(teaserPanel, () => readEvents(teaserPanel.dataset.source!));
