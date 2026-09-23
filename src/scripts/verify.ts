import type { LedgerEvent } from '../lib/ledger/schema';
import type { LedgerView } from '../lib/ledger-view/source';
import type { LedgerVerification, VerificationCode } from '../lib/ledger/verify';
import { hashPrintSvg, shortHash } from './hashprint';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

type Shown = { state: string; icon: string; title: string; text: string; detail?: string; extra?: string };
const IDLE: Shown = { state: 'idle', icon: 'shield', title: 'Ainda não conferido.', text: 'Aperte Conferir e o seu aparelho refaz as contas de cada ação.' };

// One sentence per F08 failure code, said to someone who never heard of a hash.
const BROKEN: Record<VerificationCode, (n: string) => Pick<Shown, 'title' | 'text'>> = {
  hash: n => ({ title: `A corrente quebrou na ação nº ${n}.`, text: 'Alguém mudou essa linha depois que ela foi registrada. A marca refeita não bate com a guardada.' }),
  previous_hash: n => ({ title: `A ação nº ${n} não se prende à anterior.`, text: 'Alguma linha foi apagada ou trocada de lugar.' }),
  sequence: n => ({ title: `A numeração pula na ação nº ${n}.`, text: 'Alguma linha foi apagada.' }),
  time: n => ({ title: `A data da ação nº ${n} não bate.`, text: 'O fato aparece com data depois do dia em que foi registrado.' }),
  correction: n => ({ title: `A correção na ação nº ${n} não confere.`, text: 'Ela aponta pra uma linha que não pode corrigir.' }),
  duplicate_source: n => ({ title: `A ação nº ${n} repete outra.`, text: 'A mesma decisão ou mudança foi registrada duas vezes.' }),
  invalid_schema: () => ({ title: 'O livro saiu do formato.', text: 'Tem campo que não deveria estar ali, ou falta campo.' }),
  checkpoint: () => ({ title: 'A marca de controle não bate.', text: 'O livro não confere com a marca de controle publicada junto com ele.' }),
  crypto_unavailable: () => ({ title: 'Não deu pra conferir aqui.', text: 'Este navegador não faz a conta SHA-256. Use o verificador aberto.' }),
};

function describe(r: LedgerVerification, count: number): Shown {
  if (r.valid) {
    if (!count) return { state: 'idle', icon: 'shield', title: 'Nada pra conferir ainda.', text: 'O livro ainda não tem nenhuma ação.' };
    return {
      state: 'ok', icon: 'check-circle', title: 'Tudo certo.', text: 'Nada foi apagado nem mudado desde o começo.',
      detail: `${plural(r.eventCount, 'ação conferida', 'ações conferidas')}, da nº 1 até a nº ${r.eventCount}, e combinam com a marca de controle publicada junto. Marca da ponta: ${shortHash(r.headHash)}.`,
    };
  }
  const at = r.sequence ?? '';
  const ok = Number(at) - 1;
  const before = ok > 0 ? `${ok === 1 ? 'A ação antes dela está certa' : `As ${ok} ações antes dela estão certas`}. Da nº ${at} em diante, nada pode ser confiado.` : undefined;
  return { state: 'broken', icon: 'x-circle', ...BROKEN[r.code](at), detail: before };
}

// The stored mark next to the one redone from the line as it is now: two different fingerprints.
const fingerprints = (stored: string, redone: string) => `<div class="print-diff">
  <p><span>Marca guardada</span>${hashPrintSvg(stored)}<code>${shortHash(stored)}</code></p>
  <p class="is-broken"><span>Marca refeita agora</span>${hashPrintSvg(redone)}<code>${shortHash(redone)}</code></p>
</div>`;

export const readLedger = (id: string): LedgerView => JSON.parse(document.getElementById(id)?.textContent ?? '{"events":[]}');

// Wires one Conferir panel. `getLedger` lets a page swap which ledger is checked (real or example),
// or fetch the published file on the first click (home); `data-marks` on the panel lists the
// containers whose [data-seq] items light up, read on every use.
// The F08 verifier (with zod) loads only on the first click, so it never weighs on the page load.
export function mountVerify(panel: HTMLElement, getLedger: () => LedgerView | Promise<LedgerView>) {
  const btn = panel.querySelector<HTMLButtonElement>('[data-verify]')!;
  const bar = panel.querySelector<HTMLElement>('.verify-progress')!;
  const out = panel.querySelector<HTMLElement>('.verify-result')!;
  const log = panel.querySelector<HTMLOListElement>('.verify-log');
  const containers = () => (panel.dataset.marks ?? '').split(',').map(s => s.trim() && document.querySelector<HTMLElement>(s.trim())).filter((el): el is HTMLElement => !!el);
  const marksOf = (seq: string) => containers().flatMap(c => [...c.querySelectorAll<HTMLElement>(`[data-seq="${seq}"]`)]);
  const allMarks = () => containers().flatMap(c => [...c.querySelectorAll<HTMLElement>('[data-seq]')]);
  const show = (s: Shown) => {
    out.dataset.state = s.state;
    out.innerHTML = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${s.icon}"/></svg><div><p class="verify-title">${s.title}</p><p>${s.text}</p>${s.detail ? `<p class="verify-detail">${s.detail}</p>` : ''}${s.extra ?? ''}</div>`;
  };
  const logLine = (e: LedgerEvent, state: 'ok' | 'broken') => {
    if (!log) return;
    const li = document.createElement('li');
    li.dataset.state = state;
    li.innerHTML = `<span class="log-seq">nº ${e.sequence}</span><code>${shortHash(e.hash)}</code><span class="log-state">${state === 'ok' ? 'confere' : 'quebrou'}</span>`;
    log.append(li);
    while (log.children.length > 200) log.firstElementChild?.remove();
    log.scrollTop = log.scrollHeight;
  };
  const clearMarks = () => allMarks().forEach(el => el.classList.remove('is-ok', 'is-broken', 'is-unchecked'));
  const reset = () => {
    clearMarks();
    bar.hidden = true;
    if (log) { log.hidden = true; log.replaceChildren(); }
    show(IDLE);
  };

  btn.addEventListener('click', async () => {
    clearMarks();
    btn.disabled = true;
    let ledger: LedgerView;
    try {
      ledger = await getLedger();
    } catch {
      show({ state: 'idle', icon: 'shield', title: 'Não deu pra baixar o livro agora.', text: 'Confira a internet e aperte Conferir de novo.' });
      btn.disabled = false;
      return;
    }
    const { events, checkpoint } = ledger;
    bar.hidden = !events.length;
    bar.style.setProperty('--p', '0%');
    if (log) { log.replaceChildren(); log.hidden = !events.length; }
    show({ state: 'running', icon: 'shield', title: 'Conferindo…', text: `Refazendo a conta de ${plural(events.length, 'ação', 'ações')}, uma por uma.` });
    const { verifyLedger, eventHash } = await import('../lib/ledger/index');
    const result = await verifyLedger(events, checkpoint);
    // Walk the marks down to the first break, so the check is visible line by line.
    const brokenAt = result.valid ? Infinity : Number(result.sequence ?? 0);
    const upTo = result.valid ? events.length : Math.max(0, brokenAt - 1);
    const pause = reducedMotion.matches ? 0 : Math.max(16, Math.min(60, 1200 / Math.max(events.length, 1)));
    for (let i = 0; i < upTo; i++) {
      marksOf(events[i]!.sequence).forEach(el => el.classList.add('is-ok'));
      logLine(events[i]!, 'ok');
      bar.style.setProperty('--p', `${((i + 1) / events.length) * 100}%`);
      if (pause) await new Promise(res => setTimeout(res, pause));
    }
    const shown = describe(result, events.length);
    if (!result.valid && result.sequence) {
      const broken = events.find(e => e.sequence === result.sequence);
      marksOf(result.sequence).forEach(el => el.classList.add('is-broken'));
      allMarks().filter(el => Number(el.dataset.seq) > brokenAt).forEach(el => el.classList.add('is-unchecked'));
      if (broken) logLine(broken, 'broken');
      // Bring the broken block into view inside its own strip, without moving the page.
      const block = marksOf(result.sequence).find(el => el.closest('.chain-strip'));
      const strip = block?.closest<HTMLElement>('.chain-strip');
      if (block && strip) strip.scrollTo({ left: block.offsetLeft - strip.clientWidth / 2 + block.offsetWidth / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      if (broken && result.code === 'hash') {
        const { hash, ...unsigned } = broken;
        shown.extra = fingerprints(hash, await eventHash(unsigned));
      }
    }
    show(shown);
    btn.disabled = false;
  });
  return { reset };
}
