// Shared by every page: Listen (browser speech), header menu, theme, A+ text size, toast, dialog close,
// the light that follows the pointer on tiles, and which elements travel between pages.
const root = document.documentElement;
root.classList.replace('no-js', 'js');

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);

let toastTimer: number | undefined;
export function toast(message: string) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('shown');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('shown'), 4200);
}

/* ---------- Listen ---------- */

let speaking: HTMLElement | null = null;
function setSpeaking(btn: HTMLElement, on: boolean) {
  btn.classList.toggle('speaking', on);
  btn.setAttribute('aria-pressed', String(on));
  const label = $('.label', btn);
  if (label) label.textContent = on ? 'Parar' : 'Ouvir';
  const use = $('use', btn);
  if (use && !btn.classList.contains('voice-btn')) use.setAttribute('href', on ? '#i-stop' : '#i-speaker');
}
export function stopSpeech() {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (speaking) setSpeaking(speaking, false);
  speaking = null;
}
function speak(text: string, btn: HTMLElement) {
  if (!('speechSynthesis' in window)) { toast('Este navegador não consegue ler em voz alta.'); return; }
  const sameButton = speaking === btn;
  stopSpeech();
  if (sameButton) return;
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => /^pt[-_]BR/i.test(v.lang)) ?? voices.find(v => /^pt/i.test(v.lang));
  if (voices.length && !voice) { toast('Seu aparelho não tem voz em português instalada.'); return; }
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) ?? [text];
  speaking = btn;
  setSpeaking(btn, true);
  sentences.forEach((sentence, i) => {
    const u = new SpeechSynthesisUtterance(sentence.trim());
    u.lang = 'pt-BR';
    if (voice) u.voice = voice;
    u.rate = 0.95;
    if (i === sentences.length - 1) u.onend = () => { if (speaking === btn) stopSpeech(); };
    u.onerror = e => {
      if (speaking !== btn || e.error === 'interrupted' || e.error === 'canceled') return;
      stopSpeech();
      toast('Não deu pra ler em voz alta neste aparelho.');
    };
    speechSynthesis.speak(u);
  });
  if (!voices.length) {
    window.setTimeout(() => {
      if (speaking === btn && !speechSynthesis.speaking) {
        stopSpeech();
        toast('Seu aparelho não tem voz em português instalada.');
      }
    }, 1500);
  }
}
if ('speechSynthesis' in window) speechSynthesis.getVoices();

document.addEventListener('click', e => {
  const target = e.target as Element;
  const listen = target.closest<HTMLElement>('[data-listen], button[data-speech]');
  if (listen) {
    const text = listen.dataset.speech ?? document.getElementById(listen.dataset.listen ?? '')?.dataset.speech;
    if (text) speak(text, listen);
    return;
  }
  const close = target.closest('[data-close]');
  if (close) { close.closest('dialog')?.close(); return; }
  if (target instanceof HTMLDialogElement) target.close();
});

/* ---------- Header: menu, A+, border on scroll ---------- */

const header = $('.site-header');
const menuBtn = $('#menu-btn');
const closeMenu = () => { header?.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); };
menuBtn?.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', String(header?.classList.toggle('menu-open'))));
document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && header?.classList.contains('menu-open')) { closeMenu(); menuBtn?.focus(); }
});

const textSizeBtn = $('#text-size-btn');
const setLargeText = (on: boolean) => { root.classList.toggle('large-text', on); textSizeBtn?.setAttribute('aria-pressed', String(on)); };
try { setLargeText(localStorage.getItem('large-text') === '1'); } catch { /* no storage: keep default size */ }
textSizeBtn?.addEventListener('click', () => {
  const on = !root.classList.contains('large-text');
  setLargeText(on);
  try { localStorage.setItem('large-text', on ? '1' : '0'); } catch { /* same */ }
  toast(on ? 'Texto maior ligado.' : 'Texto no tamanho normal.');
});

/* ---------- Theme: dark or light, saved on this device ---------- */

const themeBtn = $('#theme-btn');
const themeColor = $<HTMLMetaElement>('meta[name="theme-color"]');
const setTheme = (theme: 'light' | 'dark') => {
  root.dataset.theme = theme;
  themeBtn?.setAttribute('aria-pressed', String(theme === 'light'));
  themeColor?.setAttribute('content', theme === 'light' ? '#F6F6F7' : '#07080B');
};
setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
themeBtn?.addEventListener('click', () => {
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  const apply = () => setTheme(next);
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // The new colours open as a circle from the button (motion.css).
    const r = themeBtn.getBoundingClientRect();
    root.style.setProperty('--vx', `${r.left + r.width / 2}px`);
    root.style.setProperty('--vy', `${r.top + r.height / 2}px`);
    root.classList.add('vt-theme');
    doc.startViewTransition(apply).finished.finally(() => root.classList.remove('vt-theme'));
  } else apply();
  try { localStorage.setItem('theme', next); } catch { /* no storage: the choice lasts this visit */ }
});
matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
  let saved: string | null = null;
  try { saved = localStorage.getItem('theme'); } catch { /* same */ }
  if (!saved) setTheme(e.matches ? 'light' : 'dark');
});

/* ---------- Light that follows the pointer on tiles ---------- */

if (matchMedia('(hover: hover)').matches) {
  let frame = 0;
  document.addEventListener('pointermove', e => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const tile = (e.target as Element).closest?.<HTMLElement>('.tile');
      if (!tile) return;
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', `${e.clientX - r.left}px`);
      tile.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }, { passive: true });
}

/* ---------- Between pages: only what is on screen travels ---------- */
// Elements with data-vt carry a view-transition-name (css). If one is off screen when the page
// changes, it would fly in from far away; drop its name so the page just fades.
const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight;
};
const pruneTravellers = () => document.querySelectorAll<HTMLElement>('[data-vt]').forEach(el => {
  el.style.viewTransitionName = onScreen(el) ? el.dataset.vt! : 'none';
});
addEventListener('pageswap', pruneTravellers);
addEventListener('pagereveal', pruneTravellers);
