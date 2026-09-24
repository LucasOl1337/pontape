// The ficha of a piece (FichaPeca.astro), on the home and on /construir/pecas: any [data-module]
// button opens it, and so does a #m1…#m9 link.
const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);

const dialog = $<HTMLDialogElement>('#module-dialog');
let origin: HTMLElement | null = null;

export function openModule(id: string, from?: HTMLElement | null) {
  const tpl = document.getElementById(`module-${id}`);
  if (!dialog || !(tpl instanceof HTMLTemplateElement)) return;
  $('#module-dialog-id')!.textContent = id;
  // Opened from a step of the staircase, the ficha says which step it stands behind.
  $('#module-dialog-kicker')!.textContent = from?.dataset.step ? `Peça do passo ${from.dataset.step}` : 'Peça do projeto';
  $('#module-dialog-title')!.textContent = tpl.dataset.name ?? '';
  $('#module-dialog-body')!.replaceChildren(tpl.content.cloneNode(true));
  if (!dialog.open) { origin = from ?? (document.activeElement as HTMLElement | null); dialog.showModal(); }
  dialog.scrollTop = 0;
  $('.close-btn', dialog)?.focus();
}

export function routeModule(hash: string) {
  const match = hash.match(/^#m([1-9])$/i);
  if (match) openModule(`M${match[1]}`);
  return Boolean(match);
}

dialog?.addEventListener('close', () => {
  if (/^#m[1-9]$/i.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  if (origin?.isConnected) origin.focus({ preventScroll: true });
});
document.addEventListener('click', e => {
  const button = (e.target as Element).closest<HTMLElement>('[data-module]');
  if (button) openModule(button.dataset.module!, dialog?.open ? null : button);
});
