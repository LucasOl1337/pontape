// /transparencia: real or example ledger, the chain inspector, search, type filters, the
// "edit a line in secret" demo and Conferir.
import type { LedgerEvent } from '../lib/ledger/schema';
import type { LedgerView } from '../lib/ledger-view/source';
import { canonicalize } from '../lib/ledger/canonical';
import { EVIDENCE, TYPES } from '../lib/ledger-view/phrases';
import { toast } from './site';
import { mountVerify, readLedger } from './verify';
import { findAction, mountChainLinks, mountFlowHover, mountRoving } from './explorer';
import { hashPrintSvg, recordedText, shortHash } from './hashprint';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
type Mode = 'real' | 'example';

const ledgers: Record<Mode, LedgerView> = { real: readLedger('ledger-real'), example: readLedger('ledger-example') };
const panel = $('#conferir [data-verify-panel]')!;
const verify = mountVerify(panel, () => ledgers[mode]);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
let mode: Mode = params.has('exemplo') ? 'example' : 'real';
let selected: string | null = null;
let tampered: { seq: string; amount: string } | null = null;

mountRoving();
mountChainLinks();
mountFlowHover();

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const icon = (name: string) => `<svg class="icon" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
const amountText = (cents: string) => { const v = BigInt(cents); return `${v > 0n ? '+' : '−'} ${brl.format(Math.abs(Number(v)) / 100)}`; };
// Everything but the mark itself: exactly what the SHA-256 receives.
const unsignedOf = (e: LedgerEvent) => ({ schemaVersion: e.schemaVersion, sequence: e.sequence, previousHash: e.previousHash, recordedAt: e.recordedAt, payload: e.payload });

/* ---------- Inspector ---------- */

const inspector = $('[data-inspector]')!;
const body = $('[data-inspector-body]', inspector)!;
const title = $('[data-inspector-title]', inspector)!;
const stepBtns = $$<HTMLButtonElement>('[data-inspector-step]', inspector);
const repositoryOpen = inspector.dataset.repoOpen === 'true';

// The sentences of an action (built at build time) live in its row of the actions table.
function labelOf(e: LedgerEvent) {
  const row = $(`#table-${mode} tr[data-seq="${e.sequence}"]`);
  const text = (sel: string) => (row && $(sel, row)?.textContent?.trim()) || undefined;
  return {
    what: text('.what') ?? '',
    context: text('.context'),
    kind: text('.col-type') ?? TYPES[e.payload.type].label,
    source: (row && $<HTMLAnchorElement>('.col-detail a', row)?.href) || undefined,
  };
}

function render(e: LedgerEvent) {
  const l = labelOf(e);
  const p = e.payload;
  const first = e.sequence === '1';
  const prevSeq = String(Number(e.sequence) - 1);
  const rows = [
    ['O que foi', `<strong>${esc(l.what)}</strong>${l.context ? `<span class="context">${esc(l.context)}</span><span class="muted">Título lido do DECISOES.md. Fica fora da marca.</span>` : ''}`],
    ['Tipo', `<span class="type-tag" data-type="${p.type}">${icon(TYPES[p.type].icon)}</span>${esc(l.kind)}`],
    ...(p.type === 'finance' ? [['Valor', `<span class="amount${BigInt(p.amountCents) > 0n ? ' is-in' : ''}">${amountText(p.amountCents)}</span>`], ['Comprovante', EVIDENCE[p.evidence]]] : []),
    ['Dia do fato', p.occurredOn.split('-').reverse().join('/')],
    ['Registrada', recordedText(e.recordedAt)],
    ['Marca desta ação', `${hashPrintSvg(e.hash, 'hashprint hashprint--big')}<code class="hash-full">${e.hash}</code>`],
    ['Marca da anterior', first
      ? `<span>Nenhuma. Esta é a nº 1: o pontapé inicial da corrente.</span><code class="hash-full">${e.previousHash}</code>`
      : `${hashPrintSvg(e.previousHash, 'hashprint hashprint--big')}<code class="hash-full">${e.previousHash}</code><button class="link-btn" type="button" data-select="${prevSeq}">Ir pra nº ${prevSeq}${icon('arrow-right')}</button>`],
    ...(l.source ? [['Fonte', `<a href="${esc(l.source)}" rel="noopener">Ver no GitHub${icon('arrow-right')}</a>${repositoryOpen ? '' : '<span class="muted">Repositório ainda fechado</span>'}`]] : []),
  ];
  title.textContent = `Ação nº ${e.sequence}`;
  body.innerHTML = `<dl class="inspector-fields">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <div class="inspector-canon">
      <p class="canon-label">Texto exato que vira a marca</p>
      <pre class="canon"><code>${esc(canonicalize(unsignedOf(e)))}</code></pre>
      <div class="recheck"><button class="btn btn--small" type="button" data-recheck>${icon('shield')}Refazer a conta desta ação</button><div class="recheck-result" role="status" aria-live="polite"></div></div>
    </div>`;
  const events = ledgers[mode].events;
  stepBtns.forEach(b => { const to = Number(e.sequence) + Number(b.dataset.inspectorStep); b.disabled = to < 1 || to > events.length; });
}

function select(seq: string, { reveal = false, fromHash = false } = {}) {
  const e = ledgers[mode].events.find(x => x.sequence === seq);
  if (!e) return;
  selected = seq;
  render(e);
  $$('[data-select]').forEach(el => {
    const on = el.dataset.select === seq && !el.closest('.inspector');
    if (el.hasAttribute('aria-pressed')) el.setAttribute('aria-pressed', String(on));
  });
  $$('.is-selected').forEach(el => el.classList.remove('is-selected'));
  $$(`[data-mode-panel="${mode}"] [data-seq="${seq}"]`).forEach(el => el.classList.add('is-selected'));
  const block = $(`#chain-${mode} .chain-block[data-seq="${seq}"]`);
  const strip = block?.closest<HTMLElement>('.chain-strip');
  if (block && strip) strip.scrollTo({ left: block.offsetLeft - strip.clientWidth / 2 + block.offsetWidth / 2, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  if (!fromHash) history.replaceState(null, '', `${location.pathname}${location.search}#acao-${seq}`);
  if (reveal) {
    inspector.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    inspector.focus({ preventScroll: true });
  }
}

stepBtns.forEach(b => b.addEventListener('click', () => {
  if (selected) select(String(Number(selected) + Number(b.dataset.inspectorStep)));
}));

body.addEventListener('click', async e => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('[data-recheck]');
  if (!btn || !selected) return;
  const ev = ledgers[mode].events.find(x => x.sequence === selected);
  const out = $('.recheck-result', body);
  if (!ev || !out) return;
  btn.disabled = true;
  const { eventHash } = await import('../lib/ledger/index');
  const redone = await eventHash(unsignedOf(ev));
  const ok = redone === ev.hash;
  out.dataset.state = ok ? 'ok' : 'broken';
  out.innerHTML = `${hashPrintSvg(redone)}<code>${shortHash(redone)}</code><span>${ok ? 'Bate com a marca guardada.' : 'Não bate com a marca guardada. Esta linha foi mudada.'}</span>`;
  btn.disabled = false;
});

/* ---------- Mode, filters, clicks ---------- */

function applyFilter(filter: string) {
  const list = $(`[data-ledger-list="${mode}"]`)!;
  $$('[data-type-filter]', $(`[data-type-filters="${mode}"]`)!).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.typeFilter === filter)));
  $$('tbody tr', list).forEach(tr => { tr.hidden = filter !== 'all' && tr.dataset.type !== filter; });
  $$('.empty-note[data-empty-for]:not([data-empty-for="all"])', list).forEach(d => { d.hidden = d.dataset.emptyFor !== filter; });
}

function setMode(next: Mode) {
  mode = next;
  $$('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $$('[data-mode-panel]').forEach(el => { el.hidden = el.dataset.modePanel !== mode; });
  panel.dataset.marks = `#chain-${mode}, #table-${mode}, #abacus-${mode}`;
  verify.reset();
  applyFilter('all');
  const events = ledgers[mode].events;
  const keep = selected && events.some(e => e.sequence === selected) ? selected : events.at(-1)?.sequence;
  if (keep) select(keep, { fromHash: true });
}

document.addEventListener('click', e => {
  const target = e.target as Element;
  const modeBtn = target.closest<HTMLElement>('[data-mode]');
  if (modeBtn) { setMode(modeBtn.dataset.mode as Mode); return; }
  const filterBtn = target.closest<HTMLElement>('[data-type-filter]');
  if (filterBtn) { applyFilter(filterBtn.dataset.typeFilter!); return; }
  const pick = target.closest<HTMLElement>('[data-select]');
  // From the strip the inspector is right below; from the table or the abacus, bring it into view.
  if (pick) select(pick.dataset.select!, { reveal: !pick.closest('.chain-strip') });
});

$$<HTMLFormElement>('[data-search]').forEach(form => form.addEventListener('submit', e => {
  e.preventDefault();
  const q = new FormData(form).get('acao')?.toString() ?? '';
  const { event, note } = findAction(q, ledgers[mode].events);
  if (note) toast(note);
  if (event) select(event.sequence, { reveal: true });
}));

/* ---------- Example only: edit a money line without redoing its mark ---------- */

const tamperBtn = $<HTMLButtonElement>('[data-tamper]');
const untamperBtn = $<HTMLButtonElement>('[data-untamper]');
const showAmount = (seq: string, cents: string) => {
  const el = $(`#table-example tr[data-seq="${seq}"] [data-amount]`);
  if (el) el.textContent = amountText(cents);
  if (mode === 'example' && selected === seq) select(seq, { fromHash: true });
};
tamperBtn?.addEventListener('click', () => {
  const target = ledgers.example.events.find(e => e.payload.type === 'finance');
  if (!target || target.payload.type !== 'finance') return;
  tampered = { seq: target.sequence, amount: target.payload.amountCents };
  target.payload.amountCents = String(BigInt(target.payload.amountCents) * 10n);
  showAmount(target.sequence, target.payload.amountCents);
  tamperBtn.hidden = true;
  if (untamperBtn) untamperBtn.hidden = false;
  verify.reset();
  toast(`Mudamos o valor da ação nº ${target.sequence} sem refazer a marca dela. Agora aperte Conferir.`);
});
untamperBtn?.addEventListener('click', () => {
  const target = ledgers.example.events.find(e => e.sequence === tampered?.seq);
  if (!target || target.payload.type !== 'finance' || !tampered) return;
  target.payload.amountCents = tampered.amount;
  showAmount(target.sequence, tampered.amount);
  tampered = null;
  untamperBtn.hidden = true;
  if (tamperBtn) tamperBtn.hidden = false;
  verify.reset();
  toast('Mudança desfeita. O livro voltou ao que era.');
});

/* ---------- Start: mode, deep links (#acao-12, ?acao=, ?tipo=) ---------- */

setMode(mode);
const initialType = params.get('tipo');
if (initialType && ['finance', 'field', 'candidate', 'project'].includes(initialType)) applyFilter(initialType);
const fromHash = () => {
  const m = location.hash.match(/^#acao-(\d+)$/);
  if (m) select(m[1]!, { reveal: true, fromHash: true });
};
const query = params.get('acao');
if (query) {
  const { event, note } = findAction(query, ledgers[mode].events);
  if (note) toast(note);
  if (event) select(event.sequence, { reveal: true });
} else fromHash();
addEventListener('hashchange', fromHash);
