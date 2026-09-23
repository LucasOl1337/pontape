// /transparencia islands: real or example ledger, type filters, the "edit a line in secret" demo, Conferir.
import './story';
import type { LedgerView } from '../lib/ledger-view/source';
import { toast } from './site';
import { mountVerify, readLedger } from './verify';

const $ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, el: ParentNode = document) => [...el.querySelectorAll<T>(s)];
type Mode = 'real' | 'example';

const ledgers: Record<Mode, LedgerView> = { real: readLedger('ledger-real'), example: readLedger('ledger-example') };
const panel = $('#conferir [data-verify-panel]')!;
const verify = mountVerify(panel, () => ledgers[mode]);
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const params = new URLSearchParams(location.search);
let mode: Mode = params.has('exemplo') ? 'example' : 'real';
let tampered: { seq: string; amount: string } | null = null;

function applyFilter(filter: string) {
  const list = $(`[data-ledger-list="${mode}"]`)!;
  $$('[data-type-filter]', $(`[data-type-filters="${mode}"]`)!).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.typeFilter === filter)));
  $$('.chain-entry', list).forEach(li => { li.hidden = filter !== 'all' && li.dataset.type !== filter; });
  $$('.chain-empty[data-empty-for]:not([data-empty-for="all"])', list).forEach(d => { d.hidden = d.dataset.emptyFor !== filter; });
  verify.reset();
}

function setMode(next: Mode) {
  mode = next;
  $$('[data-mode]', $('.ledger-toolbar')!).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $$('[data-ledger-list], [data-type-filters], [data-money]').forEach(el => {
    el.hidden = (el.dataset.ledgerList ?? el.dataset.typeFilters ?? el.dataset.money) !== mode;
  });
  $$('[data-example-only]').forEach(el => { el.hidden = mode !== 'example'; });
  panel.dataset.list = `ledger-chain-${mode}`;
  applyFilter('all');
}

document.addEventListener('click', e => {
  const target = e.target as Element;
  const modeBtn = target.closest<HTMLElement>('[data-mode]');
  if (modeBtn) { setMode(modeBtn.dataset.mode as Mode); return; }
  const filterBtn = target.closest<HTMLElement>('[data-type-filter]');
  if (filterBtn) applyFilter(filterBtn.dataset.typeFilter!);
});

/* ---------- Example only: edit a money line without redoing its mark ---------- */

const tamperBtn = $<HTMLButtonElement>('[data-tamper]');
const untamperBtn = $<HTMLButtonElement>('[data-untamper]');
const showAmount = (seq: string, cents: string) => {
  const el = $(`#ledger-chain-example .chain-entry[data-seq="${seq}"] [data-amount]`);
  const value = BigInt(cents);
  if (el) el.textContent = `${value > 0n ? '+' : '−'} ${brl.format(Math.abs(Number(value)) / 100)}`;
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

setMode(mode);
const initialType = params.get('tipo');
if (initialType && ['finance', 'field', 'candidate', 'project'].includes(initialType)) applyFilter(initialType);
