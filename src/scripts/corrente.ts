// The book in five steps (/transparencia): this only moves data-scene; the drawing is CSS.
// It plays by itself, slowly, when motion is welcome, and holds while the pointer or focus is on it
// or the tab is hidden. Any button the reader presses (a step, Voltar, Próximo, Pausar) stops the
// autoplay for good: from then on the reader sets the pace.
const figure = document.querySelector<HTMLElement>('[data-corrente]');

if (figure) {
  const steps = [...figure.querySelectorAll<HTMLButtonElement>('[data-scene-go]')];
  const play = figure.querySelector<HTMLButtonElement>('[data-play]')!;
  const prev = figure.querySelector<HTMLButtonElement>('[data-prev]')!;
  const next = figure.querySelector<HTMLButtonElement>('[data-next]')!;
  const num = figure.querySelector<HTMLElement>('[data-scene-num]')!;
  const title = figure.querySelector<HTMLElement>('[data-scene-title]')!;
  const text = figure.querySelector<HTMLElement>('[data-scene-text]')!;
  const scenes = [...figure.querySelectorAll<HTMLElement>('.corrente-all li')].map(li => ({
    title: li.querySelector('b')?.textContent ?? '',
    text: li.querySelector('b + span')?.textContent ?? '',
  }));
  const total = steps.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Time to read the step, plus the animation. The break (4) has the most to watch.
  const STEP_MS = [6000, 7000, 8000, 9500, 8500];

  let scene = 1;
  let timer = 0;
  let playing = !reduced.matches;
  let hovered = false;
  let focused = false;

  const show = (n: number) => {
    scene = Math.min(Math.max(n, 1), total);
    figure.dataset.scene = String(scene);
    num.textContent = String(scene);
    title.textContent = scenes[scene - 1]?.title ?? '';
    text.textContent = scenes[scene - 1]?.text ?? '';
    steps.forEach((step, i) => {
      if (i + 1 === scene) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
      step.toggleAttribute('data-done', i + 1 < scene);
    });
    prev.disabled = scene === 1;
    next.querySelector('span')!.textContent = scene === total ? 'Ver de novo' : 'Próximo';
  };

  const paint = () => {
    figure.querySelector<HTMLElement>('[data-live]')!.setAttribute('aria-live', playing ? 'off' : 'polite');
    play.setAttribute('aria-pressed', playing ? 'true' : 'false');
    play.querySelector('span')!.textContent = playing ? 'Pausar' : 'Tocar';
    play.querySelector('use')?.setAttribute('href', playing ? '#i-pause' : '#i-play');
  };

  const tick = () => {
    clearTimeout(timer);
    if (!playing || hovered || focused || document.hidden) return;
    timer = window.setTimeout(() => { show(scene === total ? 1 : scene + 1); tick(); }, STEP_MS[scene - 1] ?? 8000);
  };
  const takeOver = () => { playing = false; paint(); clearTimeout(timer); };

  figure.querySelector<HTMLElement>('[data-controls]')!.hidden = false;
  figure.querySelector<HTMLElement>('[data-nav]')!.hidden = false;
  figure.classList.add('is-live');
  show(1);
  paint();
  tick();

  steps.forEach(step => step.addEventListener('click', () => { takeOver(); show(Number(step.dataset.sceneGo)); }));
  prev.addEventListener('click', () => { takeOver(); show(scene - 1); });
  next.addEventListener('click', () => { takeOver(); show(scene === total ? 1 : scene + 1); });
  play.addEventListener('click', () => {
    playing = !playing; paint();
    tick();
  });
  figure.addEventListener('pointerenter', () => { hovered = true; tick(); });
  figure.addEventListener('pointerleave', () => { hovered = false; tick(); });
  figure.addEventListener('focusin', () => { focused = true; tick(); });
  figure.addEventListener('focusout', event => {
    focused = event.relatedTarget instanceof Node && figure.contains(event.relatedTarget);
    tick();
  });
  document.addEventListener('visibilitychange', tick);
  reduced.addEventListener('change', () => { if (reduced.matches) takeOver(); });
}
