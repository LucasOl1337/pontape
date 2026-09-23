// Crônica: the line art follows the reader. Each [data-scene] gets --p, from 0 to 1, as it crosses
// the screen, and strokes with .draw read it in CSS. A pinned scene (data-scene="pin") also marks
// the [data-step] being read. Without JS, or with reduced motion, --p is never set: every line
// shows fully drawn and every step shows at once.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * t * (3 - 2 * t);

interface Scene { el: HTMLElement; pin: boolean; steps: HTMLElement[]; active: number; journey?: Journey }
interface Journey { route: SVGPathElement; walker: SVGGElement; total: number; stops: number[]; vigs: Element[]; treads: Element[] }

const scenes: Scene[] = [...document.querySelectorAll<HTMLElement>('[data-scene]')].map(el => {
  const scene: Scene = { el, pin: el.dataset.scene === 'pin', steps: [...el.querySelectorAll<HTMLElement>('[data-step]')], active: -2 };
  const route = el.querySelector<SVGPathElement>('[data-route]');
  const walker = el.querySelector<SVGGElement>('[data-walker]');
  if (route && walker) {
    scene.journey = {
      route, walker, total: route.getTotalLength(), stops: JSON.parse(el.dataset.stops ?? '[]'),
      vigs: [...el.querySelectorAll('[data-vig]')], treads: [...el.querySelectorAll('[data-tread]')],
    };
    route.style.strokeDasharray = `${scene.journey.total} ${scene.journey.total * 2}`;
  }
  el.classList.add('is-live');
  return scene;
});

// Where the eye reads: under the pinned drawing on a phone, the middle of the screen on a wide one.
const readingLine = (vh: number) => vh * (innerWidth < 960 ? 0.74 : 0.55);

function setActive(scene: Scene, active: number) {
  if (active === scene.active) return;
  scene.active = active;
  scene.el.dataset.active = String(active);
  scene.steps.forEach((s, k) => { s.classList.toggle('is-active', k === active); s.classList.toggle('is-past', k < active); });
  scene.journey?.treads.forEach((t, k) => t.classList.toggle('is-reached', k <= active));
}

function update() {
  const vh = innerHeight;
  const line = readingLine(vh);
  for (const scene of scenes) {
    const r = scene.el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    const p = scene.pin ? clamp(-r.top / Math.max(1, r.height - vh)) : clamp((vh * 0.95 - r.top) / (vh * 0.6));
    if (!reduced.matches) scene.el.style.setProperty('--p', p.toFixed(4));
    if (!scene.steps.length) continue;

    // The step being read, and how far the reader is between it and the next one.
    const centers = scene.steps.map(s => { const b = s.getBoundingClientRect(); return b.top + b.height / 2; });
    const i = centers.findLastIndex(c => c <= line);
    const next = centers[i + 1];
    const f = i < 0 ? clamp(1 - (centers[0]! - line) / (vh * 0.6)) : next === undefined ? 0 : clamp((line - centers[i]!) / (next - centers[i]!));
    setActive(scene, f > 0.5 && next !== undefined ? i + 1 : i);

    const j = scene.journey;
    if (!j) continue;
    const from = i < 0 ? 0 : j.stops[i]!;
    const to = i < 0 ? j.stops[0]! : j.stops[i + 1] ?? from;
    // With reduced motion the staircase stays fully drawn and only the dot moves, step by step.
    const at = reduced.matches ? j.stops[Math.max(0, scene.active)]! : from + (to - from) * ease(clamp((f - 0.25) / 0.5));
    const length = at * j.total;
    j.route.style.strokeDashoffset = reduced.matches ? '0' : String(j.total - length);
    const pt = j.route.getPointAtLength(length);
    j.walker.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
  }
}

let ticking = false;
const schedule = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; update(); });
};
if (scenes.length) {
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', () => { scenes.forEach(s => s.el.style.removeProperty('--p')); schedule(); });
  update();
}
