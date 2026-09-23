import type { LedgerView } from '../lib/ledger-view/source';
import type { LedgerVerification, VerificationCode } from '../lib/ledger/verify';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const shortHash = (h: string) => `${h.slice(0, 4)} ${h.slice(4, 8)}`;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

type Shown = { state: string; icon: string; title: string; text: string; detail?: string };
const IDLE: Shown = { state: 'idle', icon: 'shield', title: 'Ainda não conferido.', text: 'Aperte Conferir e o seu aparelho refaz as contas de cada ação.' };

// One sentence per F08 failure code, said to someone who never heard of a hash.
const BROKEN: Record<VerificationCode, (n: string) => Pick<Shown, 'title' | 'text'>> = {
  hash: n => ({ title: `A corrente quebrou na ação nº ${n}.`, text: 'Alguém mudou essa linha depois que ela foi registrada.' }),
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
      state: 'ok', icon: 'check-circle', title: 'Tudo certo.', text: 'As ações combinam com suas marcas e com a marca de controle.',
      detail: `${plural(r.eventCount, 'ação conferida', 'ações conferidas')}, da nº 1 até a nº ${r.eventCount}, e combinam com a marca de controle publicada junto. Marca mais recente: ${shortHash(r.headHash)}.`,
    };
  }
  const at = r.sequence ?? '';
  const good = Number(at) - 1;
  const before = good > 1 ? `As ${good} ações antes dela estão certas.` : good === 1 ? 'A ação antes dela está certa.' : undefined;
  return { state: 'broken', icon: 'x-circle', ...BROKEN[r.code](at), detail: before };
}

export const readLedger = (id: string): LedgerView => JSON.parse(document.getElementById(id)?.textContent ?? '{"events":[]}');

// Wires one Conferir panel. `getLedger` lets a page swap which ledger is checked (real or example).
// The F08 verifier (with zod) loads only on the first click, so it never weighs on the page load.
export function mountVerify(panel: HTMLElement, getLedger: () => LedgerView) {
  const btn = panel.querySelector<HTMLButtonElement>('[data-verify]')!;
  const bar = panel.querySelector<HTMLElement>('.verify-progress')!;
  const out = panel.querySelector<HTMLElement>('.verify-result')!;
  // Read on every use: a page can point the panel at another list (real or example).
  const listEl = () => document.getElementById(panel.dataset.list ?? '');
  const entry = (seq: string) => listEl()?.querySelector<HTMLElement>(`.chain-entry[data-seq="${seq}"]`);
  const entries = () => [...(listEl()?.querySelectorAll<HTMLElement>('.chain-entry') ?? [])];
  const show = (s: Shown) => {
    out.dataset.state = s.state;
    out.innerHTML = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${s.icon}"/></svg><div><p class="verify-title">${s.title}</p><p>${s.text}</p>${s.detail ? `<p class="verify-detail">${s.detail}</p>` : ''}</div>`;
  };
  const clearMarks = () => entries().forEach(li => li.classList.remove('is-ok', 'is-broken', 'is-unchecked'));
  const reset = () => { clearMarks(); bar.hidden = true; show(IDLE); };

  btn.addEventListener('click', async () => {
    const { events, checkpoint, authentication } = getLedger();
    clearMarks();
    btn.disabled = true;
    bar.hidden = !events.length;
    bar.style.setProperty('--p', '0%');
    show({ state: 'running', icon: 'shield', title: 'Conferindo…', text: `Refazendo a conta de ${plural(events.length, 'ação', 'ações')}, uma por uma.` });
    let result: LedgerVerification;
    let signed: Awaited<ReturnType<typeof import('../lib/ledger/trust').verifyPublishedSignature>> | undefined;
    try {
      const { verifyLedger, verifyPublishedSignature } = await import('../lib/ledger/index');
      result = await verifyLedger(events, checkpoint);
      if (result.valid && authentication) signed = await verifyPublishedSignature(events, authentication.trust, authentication.signedCheckpoint);
    } catch {
      show({ state: 'broken', icon: 'x-circle', title: 'Não deu pra conferir agora.', text: 'O verificador não carregou ou este navegador não oferece a criptografia necessária. Tente novamente ou use o guia de conferência.' });
      btn.disabled = false;
      bar.hidden = true;
      return;
    }
    // Walk the marks down to the first break, so the check is visible line by line.
    const brokenAt = result.valid ? Infinity : Number(result.sequence ?? 0);
    const upTo = result.valid ? events.length : Math.max(0, brokenAt - 1);
    const pause = reducedMotion.matches ? 0 : Math.max(18, Math.min(70, 1200 / Math.max(events.length, 1)));
    for (let i = 0; i < upTo; i++) {
      entry(events[i]!.sequence)?.classList.add('is-ok');
      bar.style.setProperty('--p', `${((i + 1) / events.length) * 100}%`);
      if (pause) await new Promise(res => setTimeout(res, pause));
    }
    if (!result.valid && result.sequence) {
      const broken = entry(result.sequence);
      broken?.classList.add('is-broken');
      entries().filter(li => Number(li.dataset.seq) > brokenAt).forEach(li => li.classList.add('is-unchecked'));
      broken?.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    const shown = describe(result, events.length);
    if (result.valid && signed) {
      if (signed.valid) {
        shown.text = `As marcas conferem. A assinatura do Regente confere até a ação nº ${signed.sequence}.`;
        const remaining = events.length - Number(signed.sequence);
        shown.detail += remaining > 0 ? ` ${plural(remaining, 'ação posterior ainda não está assinada', 'ações posteriores ainda não estão assinadas')}.` : ' Todas estas ações estão cobertas pela assinatura.';
        shown.detail += authentication!.trust.timestamp.status === 'pending'
          ? ' Carimbo de tempo pendente no Bitcoin.' : ' O estado do carimbo é informado pelo projeto. Este botão não verifica o Bitcoin.';
      } else {
        shown.state = 'broken'; shown.icon = 'x-circle'; shown.title = 'A assinatura não conferiu.';
        shown.text = 'As marcas internas conferem, mas a assinatura não pôde ser confirmada com a chave publicada para este livro.';
        shown.detail = 'Não considere a autoria confirmada. Use o guia de conferência independente.';
      }
    } else if (result.valid) shown.detail += ' Sem conferência de assinatura nesta lista.';
    show(shown);
    btn.disabled = false;
    // Lets a page react to the result, e.g. turn to the page of the book where the chain broke.
    panel.dispatchEvent(new CustomEvent('verified', { bubbles: true, detail: { sequence: result.valid ? null : result.sequence ?? null } }));
  });
  return { reset };
}
