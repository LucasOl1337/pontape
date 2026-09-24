// Shared by every page: header menu, toast, dialog close, "Mandar pra alguém".
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
$('#yumi-open')?.addEventListener('click', async () => {
  closeMenu();
  const { openYumiChat } = await import('./yumi-chat');
  openYumiChat();
});
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

/* ---------- Mandar pra alguém: the share sheet, or the link copied ---------- */

document.addEventListener('click', async e => {
  const button = (e.target as Element).closest<HTMLElement>('[data-share]');
  if (!button) return;
  const url = new URL('/', location.href).href;
  const data = { title: button.dataset.shareTitle ?? document.title, text: button.dataset.shareText ?? '', url };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (error) {
      // Closing the share sheet is a choice, not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copiado. É só colar numa conversa.');
  } catch {
    toast(`Mande este endereço: ${location.host}`);
  }
});
