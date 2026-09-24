// The chain in five scenes (/transparencia): this only moves data-scene; the drawing is CSS.
// Auto-plays when motion is welcome, pauses on hover, focus or when the tab is hidden, and
// stops for good when the reader picks a scene or presses pause.
const figure = document.querySelector<HTMLElement>('[data-corrente]');

if (figure) {
  const controls = figure.querySelector<HTMLElement>('[data-controls]')!;
  const dots = [...figure.querySelectorAll<HTMLButtonElement>('[data-scene-go]')];
  const play = figure.querySelector<HTMLButtonElement>('[data-play]')!;
  const num = figure.querySelector<HTMLElement>('[data-scene-num]')!;
  const text = figure.querySelector<HTMLElement>('[data-scene-text]')!;
  const captions = [...figure.querySelectorAll<HTMLElement>('.corrente-all li')].map(li => li.lastChild?.textContent ?? '');
  const total = dots.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const STEP_MS = 4600;

  let scene = 1;
  let timer = 0;
  let playing = !reduced.matches;
  let held = false;

  const show = (n: number) => {
    scene = ((n - 1 + total) % total) + 1;
    figure.dataset.scene = String(scene);
    num.textContent = String(scene);
    text.textContent = captions[scene - 1] ?? '';
    dots.forEach((dot, i) => dot.setAttribute('aria-selected', i + 1 === scene ? 'true' : 'false'));
  };

  const paint = () => {
    play.setAttribute('aria-pressed', playing ? 'true' : 'false');
    play.querySelector('span')!.textContent = playing ? 'Pausar' : 'Continuar';
    play.querySelector('use')?.setAttribute('href', playing ? '#i-pause' : '#i-play');
  };

  const tick = () => {
    clearTimeout(timer);
    if (!playing || held || document.hidden) return;
    timer = window.setTimeout(() => { show(scene + 1); tick(); }, STEP_MS);
  };

  controls.hidden = false;
  figure.classList.add('is-live');
  show(1);
  paint();
  tick();

  dots.forEach(dot => dot.addEventListener('click', () => { playing = false; paint(); show(Number(dot.dataset.sceneGo)); tick(); }));
  play.addEventListener('click', () => { playing = !playing; paint(); if (playing) show(scene + 1); tick(); });
  figure.addEventListener('pointerenter', () => { held = true; clearTimeout(timer); });
  figure.addEventListener('pointerleave', () => { held = false; tick(); });
  figure.addEventListener('focusin', () => { held = true; clearTimeout(timer); });
  figure.addEventListener('focusout', () => { held = false; tick(); });
  document.addEventListener('visibilitychange', tick);
  reduced.addEventListener('change', () => { playing = !reduced.matches; paint(); tick(); });
}
