// /construir/tarefas: "Todas" or "Boas pra começar", and a subject; the two combine. Without JS
// the filters stay hidden and every task shows. With JS, "Todas" starts with the first few (the
// rest are hidden by CSS before the first paint, so nothing jumps) and one button shows them all.
const board = document.querySelector<HTMLElement>('[data-tasks]');

if (board) {
  const list = board.querySelector<HTMLElement>('[data-tasks-list]')!;
  const cards = [...list.querySelectorAll<HTMLElement>('.task')];
  const firstButtons = [...board.querySelectorAll<HTMLButtonElement>('[data-first-filter]')];
  const type = board.querySelector<HTMLSelectElement>('[data-type-filter]')!;
  const count = board.querySelector<HTMLElement>('[data-tasks-count]')!;
  const empty = board.querySelector<HTMLElement>('[data-tasks-empty]')!;
  const more = board.querySelector<HTMLButtonElement>('[data-tasks-more]');
  let onlyFirst = false;
  let expanded = false;

  const render = () => {
    const matches = cards.filter(c => (!onlyFirst || c.dataset.first === 'true') && (type.value === 'all' || c.dataset.type === type.value));
    const filtered = onlyFirst || type.value !== 'all';
    list.toggleAttribute('data-expanded', filtered || expanded);
    cards.forEach(c => { c.hidden = !matches.includes(c); });
    empty.hidden = matches.length > 0;
    if (more) more.hidden = filtered || expanded;
    count.textContent = matches.length === 1 ? '1 tarefa' : `${matches.length} tarefas`;
  };

  board.addEventListener('click', e => {
    const button = (e.target as Element).closest<HTMLButtonElement>('[data-first-filter]');
    if (!button) return;
    onlyFirst = button.dataset.firstFilter === 'first';
    firstButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    render();
  });
  type.addEventListener('change', render);
  more?.addEventListener('click', () => {
    const firstHidden = cards.find(c => c.dataset.extra === 'true');
    expanded = true;
    render();
    firstHidden?.querySelector('a')?.focus();
  });
}
