// Shared by every page: header menu, toast, dialog close.
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

document.addEventListener('click', e => {
  const target = e.target as Element;
  const close = target.closest('[data-close]');
  if (close) { close.closest('dialog')?.close(); return; }
  if (target instanceof HTMLDialogElement) target.close();
});

/* ---------- Header: menu, border on scroll ---------- */

const header = $('.site-header');
const menuBtn = $('#menu-btn');
const closeMenu = () => { header?.classList.remove('menu-open'); menuBtn?.setAttribute('aria-expanded', 'false'); };
menuBtn?.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', String(header?.classList.toggle('menu-open'))));
document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && header?.classList.contains('menu-open')) { closeMenu(); menuBtn?.focus(); }
});

let scrollTicking = false;
addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    header?.classList.toggle('scrolled', scrollY > 8);
    // Reading progress under the header, like the thin bar of a long read.
    const max = root.scrollHeight - innerHeight;
    header?.style.setProperty('--read', max > 0 ? (scrollY / max).toFixed(4) : '0');
    scrollTicking = false;
  });
}, { passive: true });
