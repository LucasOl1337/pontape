import type { LedgerCheckpoint, LedgerEvent } from '../lib/ledger/schema';
import type { LedgerView } from '../lib/ledger-view/source';
import type { BookProof, ProofReport, ProofSource, ProofStep } from '../lib/ledger-view/proof';
import { verifyEvents } from './verify';

// Lay page only (F42). The technical page does not import this, so its weight stays put.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const readLedger = (id: string): LedgerView => JSON.parse(document.getElementById(id)?.textContent ?? '{"events":[]}');

type Loaded = { events: LedgerEvent[]; checkpoint?: LedgerCheckpoint };

function asView(data: unknown): Loaded | null {
  if (Array.isArray(data)) return { events: data as LedgerEvent[] };
  if (!data || typeof data !== 'object' || !Array.isArray((data as { events?: unknown }).events)) return null;
  const record = data as { events: LedgerEvent[]; checkpoint?: LedgerCheckpoint };
  return { events: record.events, checkpoint: record.checkpoint };
}

function clampThrough(until: string | undefined, total: number): number {
  if (!until) return total;
  const n = Number(until);
  if (!Number.isInteger(n) || n < 1) return total;
  return Math.min(n, total);
}

export function mountSeal(panel: HTMLElement, getLedger: () => LedgerView) {
  const btn = panel.querySelector<HTMLButtonElement>('[data-verify]')!;
  const stepsEl = panel.querySelector<HTMLOListElement>('[data-proof-steps]')!;
  const summaryEl = panel.querySelector<HTMLElement>('[data-proof-summary]')!;
  const more = panel.querySelector<HTMLElement>('[data-proof-more]');
  const fileInput = panel.querySelector<HTMLInputElement>('[data-verify-file]');
  let fileOverride: Loaded | null = null;

  const render = (report: ProofReport) => {
    stepsEl.hidden = false;
    summaryEl.hidden = false;
    summaryEl.textContent = `${report.summary.title} ${report.summary.text}`;
    stepsEl.replaceChildren(...report.steps.map(step => {
      const li = document.createElement('li');
      li.className = 'proof-step';
      li.dataset.mark = step.mark;
      const mark = document.createElement('span');
      mark.className = 'proof-mark';
      mark.setAttribute('aria-hidden', 'true');
      const body = document.createElement('div');
      const title = document.createElement('p');
      title.className = 'proof-step-title';
      const heard = document.createElement('span');
      heard.className = 'sr-only';
      heard.textContent = step.mark === 'ok' ? 'Certo. ' : step.mark === 'bad' ? 'Falhou. ' : step.mark === 'later' ? 'Ainda não. ' : '';
      title.append(heard, document.createTextNode(step.title));
      const text = document.createElement('p');
      text.textContent = step.text;
      body.append(title, text);
      if (step.href) {
        const link = document.createElement('a');
        link.href = step.href;
        link.rel = 'noopener';
        link.target = '_blank';
        link.textContent = step.hrefLabel ?? 'Ver no registro';
        body.append(link);
      }
      li.append(mark, body);
      return li;
    }));
    if (more) more.hidden = false;
  };

  const interim = (step: ProofStep) => render({ steps: [step], summary: { state: 'partial', title: step.title, text: step.text } });

  async function loadReal(): Promise<{ view: Loaded; source: ProofSource }> {
    try {
      const response = await fetch('/livro/ledger.json');
      if (!response.ok) throw new Error('status');
      const view = asView(await response.json());
      if (!view) throw new Error('shape');
      return { view, source: 'download' };
    } catch {
      return { view: getLedger(), source: 'page' };
    }
  }

  async function run(until?: string) {
    if (btn.disabled) return;
    btn.disabled = true;
    const fromFile = Boolean(fileOverride);
    interim({ id: 'book', mark: 'run', title: fromFile ? 'Abrindo o arquivo.' : 'Baixando o livro.', text: '' });
    let source: ProofSource;
    let view: Loaded;
    if (fileOverride) {
      source = 'file';
      view = fileOverride;
      fileOverride = null;
    } else {
      const loaded = await loadReal();
      source = loaded.source;
      view = loaded.view;
    }
    const total = view.events.length;
    const through = clampThrough(until, total);
    const events = view.events.slice(0, through);
    const checkpoint = through >= total ? view.checkpoint : undefined;
    interim({ id: 'marks', mark: 'run', title: 'Recalculando as marcas.', text: '' });
    try {
      const [{ proofReport, proofFromTrust }, result] = await Promise.all([
        import('../lib/ledger-view/proof'),
        verifyEvents(events, checkpoint),
      ]);
        // The page embeds the proof already read from trust.json at build (VerifyPanel); a raw trust
      // document (with `timestamp`) is still accepted, so both shapes end in the same place.
      let proof: BookProof = { signature: 'missing', stamp: 'missing' };
      try {
        const embedded = JSON.parse(document.getElementById('ledger-proof')?.textContent || '{}') as Record<string, unknown>;
        proof = 'timestamp' in embedded ? proofFromTrust(embedded) : { ...proof, ...(embedded as Partial<BookProof>) };
      } catch { /* missing proof stays missing */ }
      render(proofReport({ source, total, through, proof, result }));
    } catch {
      // Never leave the seal spinning: say it could not check here, so the person can try again.
      render({ steps: [{ id: 'marks', mark: 'bad', title: 'Não deu pra conferir aqui.', text: 'Alguma parte não carregou. Recarregue a página e tente de novo.' }],
        summary: { state: 'partial', title: 'Conferência incompleta.', text: 'Não deu pra terminar a conta.' } });
    }
    btn.disabled = false;
  }

  btn.addEventListener('click', () => { void run(); });
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try { fileOverride = asView(JSON.parse(await file.text())); } catch { fileOverride = null; }
    if (!fileOverride) {
      const { proofReport } = await import('../lib/ledger-view/proof');
      render(proofReport({ source: 'file', total: 0, through: 0, result: null, proof: { signature: 'missing', stamp: 'missing' } }));
      return;
    }
    btn.disabled = false;
    void run();
  });
  document.addEventListener('click', event => {
    const one = (event.target as Element).closest<HTMLButtonElement>('button[data-verify-until]');
    if (!one) return;
    panel.scrollIntoView({ block: 'nearest', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    void run(one.dataset.verifyUntil);
  });
  return { run };
}

export { readLedger };
