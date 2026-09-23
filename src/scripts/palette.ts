const root = document.documentElement;
const switcher = document.querySelector<HTMLElement>('[data-palette-switcher]');
const trigger = switcher?.querySelector<HTMLButtonElement>('[data-palette-trigger]');
const panel = switcher?.querySelector<HTMLElement>('[data-palette-panel]');
const radios = switcher?.querySelectorAll<HTMLInputElement>('input[name="palette"]');
if (switcher && trigger && panel && radios) {
  const current = root.dataset.palette ?? 'jornal';
  radios.forEach(radio => { radio.checked = radio.value === current; });

  const close = (focus = false) => {
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  };
  trigger.addEventListener('click', () => {
    const opening = panel.hidden;
    panel.hidden = !opening;
    trigger.setAttribute('aria-expanded', String(opening));
    if (opening) (Array.from(radios).find(radio => radio.checked) ?? radios[0])?.focus();
  });
  switcher.addEventListener('change', event => {
    const radio = event.target;
    if (!(radio instanceof HTMLInputElement) || !radio.checked) return;
    root.dataset.palette = radio.value;
    try { localStorage.setItem('pontape-paleta', radio.value); } catch { /* preferência só nesta página */ }
    const url = new URL(location.href);
    url.searchParams.set('cor', radio.value);
    history.replaceState(history.state, '', url);
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim());
    close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); }
  });
  document.addEventListener('click', event => {
    if (!panel.hidden && event.target instanceof Node && !switcher.contains(event.target)) close();
  });
}
