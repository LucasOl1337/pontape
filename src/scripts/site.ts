// Shared by every page: Listen (browser speech), header menu, A+ text size, toast, dialog close.
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
// A block without its own speech is read from its fields ("O que é: ..."), after an optional lead.
function spokenText(el: HTMLElement | null, lead = '') {
  if (!el) return undefined;
  if (el.dataset.speech) return el.dataset.speech;
  const fields = [...el.querySelectorAll('dt')].map(dt => `${dt.textContent}: ${dt.nextElementSibling?.textContent ?? ''}`);
  return [lead, ...fields].join(' ').trim() || undefined;
}

document.addEventListener('click', e => {
  const target = e.target as Element;
  const listen = target.closest<HTMLElement>('[data-listen], button[data-speech]');
  if (listen) {
    const text = listen.dataset.speech ?? spokenText(document.getElementById(listen.dataset.listen ?? ''), listen.dataset.lead);
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

let scrollTicking = false;
addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => { header?.classList.toggle('scrolled', scrollY > 8); scrollTicking = false; });
}, { passive: true });
