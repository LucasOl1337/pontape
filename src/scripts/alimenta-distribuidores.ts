// /alimenta/distribuidores: filter by city and by what each one accepts. Without JS every one shows.
const city = document.querySelector<HTMLSelectElement>('#al-city');
const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-cat]')];
const items = [...document.querySelectorAll<HTMLLIElement>('.al-item')];
const count = document.querySelector<HTMLElement>('#al-count');
const empty = document.querySelector<HTMLElement>('#al-empty');
let category = '';

function apply() {
  let shown = 0;
  for (const item of items) {
    const ok = (!city?.value || item.dataset.city === city.value) && (!category || (item.dataset.cats ?? '').split(' ').includes(category));
    item.hidden = !ok;
    if (ok) shown += 1;
  }
  for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.cat === category));
  if (count) count.textContent = `${shown} ${shown === 1 ? 'distribuidor' : 'distribuidores'}`;
  if (empty) empty.hidden = shown > 0;
  const params = new URLSearchParams();
  if (city?.value) params.set('cidade', city.value);
  if (category) params.set('aceita', category);
  history.replaceState(null, '', `${location.pathname}${params.size ? `?${params}` : ''}${location.hash}`);
}

const start = new URLSearchParams(location.search);
if (city && [...city.options].some(o => o.value === start.get('cidade'))) city.value = start.get('cidade')!;
if (buttons.some(b => b.dataset.cat === start.get('aceita'))) category = start.get('aceita')!;
city?.addEventListener('change', apply);
for (const b of buttons) b.addEventListener('click', () => { category = b.dataset.cat ?? ''; apply(); });
document.querySelector('#al-filters')?.addEventListener('submit', e => e.preventDefault());
if (city?.value || category) apply();
