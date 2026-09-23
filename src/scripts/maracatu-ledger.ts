import { mountVerify, readLedger } from './verify';
import { toast } from './site';
import type { LedgerView } from '../lib/ledger-view/source';

const ledgers: Record<string,LedgerView> = { real:readLedger('ledger-real'), example:readLedger('ledger-example') };
const modeInput = document.querySelector<HTMLSelectElement>('[data-book-mode]')!;
const filterInput = document.querySelector<HTMLSelectElement>('[data-book-filter]')!;
const panel = document.querySelector<HTMLElement>('[data-verify-panel]')!;
let mode = 'real';
let page = 0;
const pageSize = 3;
const verifier = mountVerify(panel,()=>ledgers[mode]!);
const all = <T extends Element = HTMLElement>(selector:string) => [...document.querySelectorAll<T>(selector)];

function render() {
  const rows = all<HTMLElement>(`[data-book-list="${mode}"] .compact-entry`);
  const matching = rows.filter(row=>filterInput.value==='all'||row.dataset.type===filterInput.value);
  const pages = Math.max(1,Math.ceil(matching.length/pageSize));
  page = Math.min(page,pages-1);
  rows.forEach(row=>{row.hidden=true;});
  matching.slice(page*pageSize,(page+1)*pageSize).forEach(row=>{row.hidden=false;});
  all('[data-book-list]').forEach(list=>{list.hidden=list.dataset.bookList!==mode;});
  all('[data-example-only]').forEach(el=>{el.hidden=mode!=='example';});
  document.querySelector<HTMLElement>('[data-book-empty]')!.hidden=matching.length>0;
  document.querySelector('[data-book-page-label]')!.textContent=`Página ${page+1} de ${pages} · ${matching.length} ações`;
  all<HTMLButtonElement>('[data-book-page]').forEach(button=>{button.disabled=button.dataset.bookPage==='-1'?page===0:page===pages-1;});
}
function setMode() {
  mode=modeInput.value;
  page=0;
  panel.dataset.list=`compact-chain-${mode}`;
  document.querySelector('#checking-mode')!.textContent=mode==='real'?'Você vai conferir o livro de verdade.':'Você vai conferir o exemplo fictício.';
  verifier.reset(); render();
}
modeInput.addEventListener('change',setMode);
filterInput.addEventListener('change',()=>{page=0;render();});
all<HTMLButtonElement>('[data-book-page]').forEach(button=>button.addEventListener('click',()=>{
  page+=Number(button.dataset.bookPage); render();
  if(button.disabled) {
    const label=document.querySelector<HTMLElement>('[data-book-page-label]')!;
    label.tabIndex=-1; label.focus({preventScroll:true});
  }
}));
const tamper=document.querySelector<HTMLButtonElement>('[data-tamper]')!;
const undo=document.querySelector<HTMLButtonElement>('[data-untamper]')!;
let original:string|null=null;
const finance=ledgers.example!.events.find(event=>event.payload.type==='finance');
const updateAmount = () => {
  if (!finance || finance.payload.type !== 'finance') return;
  const amount = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(finance.payload.amountCents)/100);
  const detail = document.querySelector(`#event-example-${finance.sequence} [data-amount]`);
  const row = document.querySelector(`#compact-chain-example [data-seq="${finance.sequence}"] [data-row-amount]`);
  if(detail) detail.textContent=amount;
  if(row) row.textContent=amount;
};
panel.addEventListener('verify-busy',event=>{
  const busy=(event as CustomEvent<boolean>).detail;
  modeInput.disabled=busy; filterInput.disabled=busy; tamper.disabled=busy; undo.disabled=busy;
});
tamper.addEventListener('click',()=>{
  if(!finance || finance.payload.type!=='finance')return;
  original=finance.payload.amountCents;
  finance.payload.amountCents=String(BigInt(original)*10n);
  updateAmount();
  tamper.hidden=true;undo.hidden=false;verifier.reset();
  toast('Uma linha do exemplo mudou sem refazer a marca. Aperte Conferir.');
});
undo.addEventListener('click',()=>{
  if(!finance || finance.payload.type!=='finance'||original===null)return;
  finance.payload.amountCents=original;original=null;updateAmount();
  tamper.hidden=false;undo.hidden=true;verifier.reset();
  toast('Mudança desfeita. Você pode conferir de novo.');
});
const query=new URLSearchParams(location.search);
if(query.has('exemplo'))modeInput.value='example';
const type=query.get('tipo');
if(type && ['finance','field','candidate','project'].includes(type))filterInput.value=type;
setMode();
