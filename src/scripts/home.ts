// Home: the staircase (a tab list you climb with the arrows) and the ficha of each piece.
// Both answer to the URL hash, so the header links and shared links land on the right step.
import { routeModule } from './modules';

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

/* ---------- Links: steps and the ficha of a piece ---------- */

const STEP_HASH: Record<string, number> = { inicio: 0, 'como-funciona': 1, transparencia: tabs.length - 2, ajudar: tabs.length - 1 };

// One router for every in-page link: a step or a piece. The old caderno links (#modulos,
// #contribuicoes...) are sent to their pages by a script in the head of index.astro.
function route(hash: string) {
  if (routeModule(hash)) return true;
  let id: string;
  try { id = decodeURIComponent(hash.slice(1)); } catch { return false; }
  const step = id in STEP_HASH ? STEP_HASH[id]! : Number(id.match(/^degrau-(\d+)$/)?.[1] ?? NaN);
  if (Number.isInteger(step)) {
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
