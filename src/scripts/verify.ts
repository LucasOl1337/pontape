import type { LedgerEvent } from '../lib/ledger/schema';
import { canVerifyHere, verifyLedger, type VerifyResult } from '../lib/ledger-view/verifier';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const shortHash = (h: string) => `${h.slice(0, 4)} ${h.slice(4, 8)}`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

type Shown = { state: string; icon: string; title: string; text: string; detail?: string };
const IDLE: Shown = { state: 'idle', icon: 'shield', title: 'Ainda não conferido.', text: 'Aperte Conferir e o seu aparelho refaz as contas de cada ação.' };

function describe(r: VerifyResult, events: LedgerEvent[]): Shown {
  if (r.ok) {
    if (!events.length) return { state: 'idle', icon: 'shield', title: 'Nada pra conferir ainda.', text: 'O livro oficial ainda não foi publicado.' };
    return {
      state: 'ok', icon: 'check-circle', title: 'Tudo certo.', text: 'Nada foi apagado nem mudado desde o começo.',
      detail: `${plural(r.checked, 'ação conferida', 'ações conferidas')}, da nº 1 até a nº ${r.checked}. Marca mais recente: ${shortHash(events.at(-1)!.hash)}.`,
    };
  }
  const before = `As ${r.checked} ações antes dela estão certas.`;
  if (r.reason === 'changed') return { state: 'broken', icon: 'x-circle', title: `A corrente quebrou na ação nº ${r.at}.`, text: 'Alguém mudou essa linha depois que ela foi registrada.', detail: `${before} Dali pra frente, nada vale até alguém explicar.` };
  if (r.reason === 'link') return { state: 'broken', icon: 'x-circle', title: `A ação nº ${r.at} não se prende à anterior.`, text: 'Alguma linha foi apagada ou trocada de lugar.', detail: before };
  return { state: 'broken', icon: 'x-circle', title: `Falta a ação nº ${r.expected}.`, text: 'Alguma linha foi apagada.', detail: before };
}

export const readEvents = (id: string): LedgerEvent[] => JSON.parse(document.getElementById(id)?.textContent ?? '[]');

// Wires one Conferir panel. `getEvents` lets a page swap which events are checked (real or example).
export function mountVerify(panel: HTMLElement, getEvents: () => LedgerEvent[]) {
  const btn = panel.querySelector<HTMLButtonElement>('[data-verify]')!;
  const bar = panel.querySelector<HTMLElement>('.verify-progress')!;
  const out = panel.querySelector<HTMLElement>('.verify-result')!;
  // Read on every use: a page can point the panel at another list (real or example).
  const listEl = () => document.getElementById(panel.dataset.list ?? '');
  const entries = () => [...(listEl()?.querySelectorAll<HTMLElement>('.chain-entry') ?? [])];
  const show = (s: Shown) => {
    out.dataset.state = s.state;
    out.innerHTML = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${s.icon}"/></svg><div><p class="verify-title">${s.title}</p><p>${s.text}</p>${s.detail ? `<p class="verify-detail">${s.detail}</p>` : ''}</div>`;
  };
  const clearMarks = () => entries().forEach(li => li.classList.remove('is-ok', 'is-broken', 'is-unchecked'));
  const reset = () => { clearMarks(); bar.hidden = true; show(IDLE); };

  btn.addEventListener('click', async () => {
    const events = getEvents();
    clearMarks();
    if (!canVerifyHere()) {
      show({ state: 'broken', icon: 'x-circle', title: 'Não deu pra conferir aqui.', text: 'Este navegador não faz a conta SHA-256. Use o verificador aberto.' });
      return;
    }
    btn.disabled = true;
    bar.hidden = !events.length;
    show({ state: 'running', icon: 'shield', title: 'Conferindo…', text: `Refazendo a conta de ${plural(events.length, 'ação', 'ações')}, uma por uma.` });
    const pause = reducedMotion.matches ? 0 : Math.max(18, Math.min(70, 1200 / Math.max(events.length, 1)));
    const result = await verifyLedger(events, async (e, i) => {
      listEl()?.querySelector(`.chain-entry[data-seq="${e.sequence}"]`)?.classList.add('is-ok');
      bar.style.setProperty('--p', `${((i + 1) / events.length) * 100}%`);
      if (pause) await new Promise(res => setTimeout(res, pause));
    });
    if (!result.ok) {
      const broken = listEl()?.querySelector<HTMLElement>(`.chain-entry[data-seq="${result.at}"]`);
      broken?.classList.add('is-broken');
      entries().filter(li => Number(li.dataset.seq) > Number(result.at)).forEach(li => li.classList.add('is-unchecked'));
      broken?.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    show(describe(result, events));
    btn.disabled = false;
  });
  return { reset };
}
