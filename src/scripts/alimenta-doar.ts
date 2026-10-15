// /alimenta/doar, turned around (F44, plano 3.2 a 3.5). Step 1: what you have, no account. Step 2: who
// takes it, by the API rule, on this device. Step 3: ready to take it, with map, contact and "precisa
// agendar?". Step 4, optional: the public book; /health is read before the e-mail field ever shows
// (1.2). ?exemplo=1 runs the same screens with an invented donation; api() refuses every write then.
// Every text from the API or the catalog goes in as text (el()), never as HTML.
import { $, ApiError, api, el, listOf, safeUrl, say, session, setExample, type Donation, type Health, type Me, type Recommendation } from './alimenta-api';
import { msg, startLogin, wake } from './alimenta-login';
import { stateNote } from './estado';
import { EXAMPLE_OFFER, mapUrl, matchDistributors, parseKg, sameCity, scheduling, type CatalogItem, type DonationCategory, type DonorKind } from '../data/alimenta/combina';

const CATALOG: CatalogItem[] = JSON.parse($('#al-catalog')?.textContent ?? '[]');
const byId = (id: string) => CATALOG.find(d => d.id === id);
const SCREENS = ['al-offer', 'al-match', 'al-ready', 'al-ledger'] as const;
type Screen = (typeof SCREENS)[number];
const LABEL: Record<string, string> = {
  dry_goods: 'não perecíveis', produce: 'frutas, legumes e verduras', bakery: 'pães', dairy: 'leite e derivados', prepared_meal: 'refeição pronta',
};
const example = new URLSearchParams(location.search).has('exemplo');
setExample(example);

interface Offer { category: DonationCategory; kind: DonorKind; storage: string; kg: number; expires: string; city: string; uf: string }
let offer: Offer | null = null;
let chosen: CatalogItem | null = null;
let me: Me = {};
let donation: Donation | null = null;
let health: Health | null = null;

function show(id: Screen, focus = true) {
  for (const s of SCREENS) $(`#${s}`)!.hidden = s !== id;
  say(msg(), '');
  if (focus) { $(`#${id}`)!.focus(); scrollTo({ top: 0 }); }
}
const fail = (error: unknown) => say(msg(), (error as Error).message, 'error');
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const plusDays = (n: number) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const kgText = (n: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n)} kg`;
const summary = (o: Offer) => `${kgText(o.kg)} de ${LABEL[o.category]}, em ${o.city}, vale até ${o.expires.split('-').reverse().join('/')}.`;

// Field states of the state component (3.3): the error sits under its own field, tied by aria-describedby.
function fieldError(input: HTMLInputElement, text: string) {
  const box = $(`#${input.getAttribute('aria-describedby')}`);
  input.setAttribute('aria-invalid', text ? 'true' : 'false');
  if (box) { box.textContent = text; box.hidden = !text; }
  return !text;
}

// Health, read once: is sign-up open, is the AI on. Read only.
async function readHealth(): Promise<Health | null> {
  if (health) return health;
  try {
    const response = await fetch('/api/alimenta/health', { headers: { accept: 'application/json' }, cache: 'no-store', credentials: 'omit' });
    health = response.ok ? await response.json() as Health : null;
  } catch { health = null; }
  return health;
}

// ---------- Step 1: what you have ----------
const offerForm = $<HTMLFormElement>('#al-offer-form')!;
offerForm.expires.min = today();
offerForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = new FormData(offerForm);
  const kg = parseKg(String(data.get('kg') ?? ''));
  const expires = String(data.get('expires') ?? '');
  const city = String(data.get('city') ?? '').trim();
  const ok = [
    fieldError(offerForm.kg, kg > 0 && kg <= 5000 ? '' : 'Escreva os quilos com número, de 0,1 a 5.000.'),
    fieldError(offerForm.expires, /^\d{4}-\d{2}-\d{2}$/.test(expires) && expires >= today() ? '' : 'A validade precisa ser hoje ou depois.'),
    fieldError(offerForm.city, city.length >= 2 ? '' : 'Escreva a cidade onde a comida está.'),
  ];
  if (ok.includes(false)) { offerForm.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
  offer = { category: data.get('category') as DonationCategory, kind: data.get('kind') as DonorKind, storage: String(data.get('storage')),
    kg, expires, city, uf: String(data.get('uf')) };
  match(offer);
});

// ---------- Step 2: who takes it ----------
function match(o: Offer) {
  const found = matchDistributors(CATALOG, o);
  const body = $('#al-match-body')!;
  const intro = $('#al-match-intro')!;
  if (!found.length) {
    const near = sameCity(CATALOG, o.city);
    intro.textContent = summary(o);
    body.replaceChildren(stateNote(near.length
      ? { kind: 'empty', title: `Em ${o.city}, ninguém da lista aceita ${LABEL[o.category]} de ${o.kind === 'person' ? 'pessoa' : 'empresa'}`,
          body: `Tem ${near.length} ${near.length === 1 ? 'lugar' : 'lugares'} na lista em ${o.city}, mas a fonte de cada um não diz que aceita isto. Troque o tipo de comida ou veja a lista inteira da cidade.`,
          actions: [{ label: `Ver a lista de ${o.city}`, href: `/alimenta/distribuidores?cidade=${encodeURIComponent(near[0]!.city)}`, primary: true }, { label: 'Mudar a doação', onClick: () => show('al-offer') }] }
      : { kind: 'empty', title: `Ainda não temos distribuidor com fonte em ${o.city}`,
          body: 'A lista cobre São Paulo e região. Se você conhece um banco de alimentos ou organização daí, sugira com a fonte pública.',
          actions: [{ label: 'Sugerir um distribuidor', href: $('#al-reco')?.dataset.suggest ?? '/alimenta/distribuidores', primary: true }, { label: 'Ver a lista inteira', href: '/alimenta/distribuidores' }] }));
    show('al-match');
    return;
  }
  intro.textContent = `${summary(o)} Pela regra da lista (mesma cidade, aceita esse tipo de comida e recebe de ${o.kind === 'person' ? 'pessoas' : 'empresas'}), ${found.length === 1 ? '1 lugar combina' : `${found.length} lugares combinam`}. Os com horário publicado vêm primeiro.`;
  body.replaceChildren(el('ol', { class: 'al-matches' }, ...found.map((d, i) => el('li', {},
    el('article', { class: i === 0 ? 'al-pick' : 'al-option' },
      i === 0 ? el('p', { class: 'al-kicker' }, 'Combina mais pela regra') : null,
      el('h3', {}, d.name), el('p', { class: 'al-hint' }, `${d.kind} · ${d.city}`),
      el('dl', { class: 'al-facts' },
        el('div', {}, el('dt', {}, 'Como doar'), el('dd', {}, d.how ?? 'A fonte não diz. Fale com o contato antes de levar.')),
        d.hours ? el('div', {}, el('dt', {}, 'Horário'), el('dd', {}, d.hours)) : null),
      el('p', { class: 'al-row' }, button(i === 0 ? 'Levar pra este' : 'Escolher este', i === 0 ? 'btn btn--ink' : 'btn', () => ready(d))))))));
  show('al-match');
}

// ---------- Step 3: ready to take it ----------
function ready(d: CatalogItem) {
  chosen = d;
  const book = scheduling(d.how);
  const sources = d.sources.map(safeUrl).filter((u): u is string => Boolean(u));
  $('#al-ready-body')!.replaceChildren(
    el('p', { class: 'al-reason' }, `Destino: ${d.name}, ${d.city}.`),
    el('p', { class: 'al-hint' }, offer ? summary(offer) : ''),
    el('dl', { class: 'al-facts' },
      el('div', {}, el('dt', {}, 'Precisa agendar?'), el('dd', { class: book === 'yes' ? 'al-must' : '' }, book === 'yes' ? 'Sim. Combine com eles antes de levar.' : 'A fonte não diz. Na dúvida, fale antes.')),
      el('div', {}, el('dt', {}, 'Como doar'), el('dd', {}, d.how ?? 'A fonte não diz.')),
      d.hours ? el('div', {}, el('dt', {}, 'Horário'), el('dd', {}, d.hours)) : null,
      el('div', {}, el('dt', {}, 'Endereço'), el('dd', {}, d.address ?? 'A fonte não publica. Pergunte no contato.', ' · ', el('a', { href: mapUrl(d), rel: 'noopener', target: '_blank' }, 'Ver no mapa'))),
      el('div', {}, el('dt', {}, 'Fonte'), el('dd', {}, `Lida em ${d.checked.split('-').reverse().join('/')}${d.confidence === 'medium' ? '. Confirme antes de levar' : ''}: `,
        ...sources.flatMap((u, i) => [i ? ', ' : '', el('a', { href: u, rel: 'noopener', target: '_blank' }, new URL(u).hostname.replace(/^www\./, ''))])))),
    el('p', { class: 'al-row' }, el('a', { class: 'btn btn--ink', href: d.contact, rel: 'noopener', target: '_blank' }, 'Falar com eles pelo contato oficial')));
  show('al-ready');
}

// ---------- Step 4: the public book, optional ----------
$('#al-to-ledger')?.addEventListener('click', () => { void ledger(); });

async function ledger() {
  if (!offer || !chosen) { show('al-offer'); return; }
  $('#al-ledger-summary')!.textContent = `${summary(offer)} Destino escolhido: ${chosen.name}.`;
  for (const id of ['al-closed', 'al-example-end', 'al-health-wait', 'al-login', 'al-account', 'al-reco', 'al-done']) $(`#${id}`)!.hidden = true;
  show('al-ledger');
  if (example) { $('#al-example-end')!.hidden = false; return; }
  if (session()) { void account(); return; }
  $('#al-health-wait')!.hidden = false;
  const h = await readHealth();
  $('#al-health-wait')!.hidden = true;
  // Closed, or no answer: never ask for an e-mail that cannot get in (1.2).
  if (!h || h.signup_open === false) {
    if (!h) $('#al-closed-text')!.textContent = 'Não deu pra conferir agora se o registro está aberto. Sua doação não depende disso: o distribuidor que você escolheu já recebe direto.';
    $('#al-closed')!.hidden = false;
    return;
  }
  login();
}

// The login form binds its handlers once, whichever way the person reaches it.
let loginStarted = false;
function login() {
  if (loginStarted) { $('#al-login')!.hidden = Boolean(session()); if (session()) void account(); return; }
  loginStarted = true;
  startLogin(() => { void account(); });
}

// Someone with an account already can still log in while sign-up is closed.
$('#al-have-account')?.addEventListener('click', () => { $('#al-closed')!.hidden = true; login(); $<HTMLInputElement>('#al-email')?.focus(); });

async function account() {
  try { me = await api<Me>('me', {}, wake()); } catch (error) { fail(error); return; }
  const v = me.current_versions ?? {};
  const accepted = (kind: string, version?: string) => !version || (me.consents ?? []).some(c => c.kind === kind && c.version === version);
  $('#al-account')!.hidden = false;
  if (me.role === 'donor' && accepted('donation_terms', v.donation_terms) && accepted('privacy_notice', v.privacy_notice)) { register(); return; }
  if (me.role !== 'donor' && me.signup_open === false) { $('#al-account')!.hidden = true; $('#al-closed')!.hidden = false; return; }
  signup(me.role === 'donor');
}

let signupBound = false;
function signup(onlyTerms: boolean) {
  const form = $<HTMLFormElement>('#al-signup-form')!;
  form.hidden = false;
  $('#al-register-form')!.hidden = true;
  const v = me.current_versions ?? {};
  $('#al-versions')!.textContent = [v.donation_terms && `termo ${v.donation_terms}`, v.privacy_notice && `aviso ${v.privacy_notice}`].filter(Boolean).join(', ').replace(/^(.+)$/, '($1)');
  for (const [kind, target] of [['donation_terms', '#al-terms-text'], ['privacy_notice', '#al-privacy-text']] as const) {
    api<string>(`legal/${kind}`).then(text => { $(target)!.textContent = typeof text === 'string' ? text : ''; })
      .catch(() => { $(target)!.textContent = 'O texto não carregou agora. Tente abrir de novo em um minuto.'; });
  }
  // The account's city and kind come from the donation (3.3): nobody types them twice.
  if (offer) { form.city.value = offer.city; form.uf.value = offer.uf; for (const r of form.querySelectorAll<HTMLInputElement>('input[name=kind]')) r.checked = r.value === offer.kind; }
  const cnpj = $('#al-cnpj-field')!;
  cnpj.hidden = form.kind.value === 'person';
  if (onlyTerms) {
    $('#al-signup-title')!.textContent = 'Os textos mudaram';
    form.querySelectorAll<HTMLElement>('fieldset, .al-grid2').forEach(n => { n.hidden = true; });
  }
  if (signupBound) return;
  signupBound = true;
  form.addEventListener('change', () => { cnpj.hidden = form.kind.value === 'person'; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    const city = String(data.get('city') ?? '').trim();
    if (!onlyTerms && city.length < 2) { say(msg(), 'Escreva a cidade.', 'error'); return; }
    if (!data.get('accept')) { say(msg(), 'Pra criar a conta, marque que aceita o termo e o aviso.', 'error'); return; }
    const submit = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
    submit.disabled = true;
    try {
      for (const kind of ['donation_terms', 'privacy_notice'] as const) {
        if (v[kind] && !(me.consents ?? []).some(c => c.kind === kind && c.version === v[kind])) await api('me/consents', { body: { kind, version: v[kind] } }, wake());
      }
      if (!onlyTerms) {
        const doc = String(data.get('cnpj') ?? '').replace(/\D/g, '');
        await api('donors', { body: { kind: data.get('kind'), city, uf: data.get('uf'), ...(doc && data.get('kind') !== 'person' ? { cnpj: doc } : {}),
          donation_terms_version: v.donation_terms, privacy_notice_version: v.privacy_notice } }, wake());
      }
      say(msg(), 'Conta pronta.', 'ok');
      register();
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) { $('#al-closed-text')!.textContent = `${error.message} O distribuidor que você escolheu já recebe direto.`; $('#al-account')!.hidden = true; $('#al-closed')!.hidden = false; say(msg(), ''); }
      else fail(error);
    } finally { submit.disabled = false; }
  });
}

function register() {
  $('#al-signup-form')!.hidden = true;
  $('#al-register-form')!.hidden = false;
}

$<HTMLFormElement>('#al-register-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  if (!offer) { show('al-offer'); return; }
  if (!new FormData(form).get('declare')) { say(msg(), 'Marque a declaração sobre a comida pra seguir.', 'error'); return; }
  const submit = form.querySelector('button')!;
  submit.disabled = true;
  try {
    donation = await api<Donation>('donations', { body: { category: offer.category, storage: offer.storage, kg: offer.kg,
      expires_at: `${offer.expires}T23:59:00-03:00`, city: offer.city, uf: offer.uf } }, wake());
    $('#al-account')!.hidden = true;
    await suggest(donation.id);
  } catch (error) { fail(error); } finally { submit.disabled = false; }
});

// The AI reads the sources and confirms or changes the pick. The person decides.
async function suggest(id: string) {
  const box = $('#al-reco')!;
  box.hidden = false;
  $('#al-reco-intro')!.textContent = 'A AI está lendo as fontes dos distribuidores. Pode levar alguns segundos.';
  $('#al-reco-body')!.replaceChildren();
  const reco = await api<Recommendation>(`donations/${encodeURIComponent(id)}/recommend`, { body: {} }, wake());
  const ranking = (reco.ranking ?? []).filter(r => byId(r.distributor_id));
  const top = ranking[0] ? byId(ranking[0].distributor_id)! : null;
  $('#al-reco-intro')!.textContent = reco.mode === 'ai'
    ? (top && chosen && top.id === chosen.id ? 'A AI leu as fontes e concorda com a sua escolha.' : 'A AI leu as fontes e sugere outro. Você decide.')
    : 'A AI não respondeu agora. Fica a sua escolha, feita pela regra da lista.';
  const options = [...new Map([chosen, top].filter((d): d is CatalogItem => Boolean(d)).map(d => [d.id, d])).values()];
  $('#al-reco-body')!.replaceChildren(
    ranking[0]?.reason ? el('p', { class: 'al-reason' }, ranking[0].reason) : '',
    el('p', { class: 'al-row' }, ...options.map((d, i) => button(`Levar pra ${d.name}`, i === 0 ? 'btn btn--ink' : 'btn', () => { void destination(d.id, d.id === top?.id); }))));
}

async function destination(id: string, fromRecommendation: boolean) {
  if (!donation) return;
  try {
    donation = await api<Donation>(`donations/${encodeURIComponent(donation.id)}/destination`, { body: { distributor_id: id, from_recommendation: fromRecommendation } }, wake());
    const d = byId(id)!;
    $('#al-reco')!.hidden = true;
    $('#al-done-body')!.replaceChildren(el('p', {}, `Destino: ${d.name}, ${d.city}.`),
      donation?.public_ref ? el('p', { class: 'al-ref' }, `Código público da doação: ${donation.public_ref}`) : '');
    $('#al-done')!.hidden = false;
    $('#al-done')!.focus();
  } catch (error) { fail(error); }
}

// From "Escolher destino" in Minhas doações: a donation already registered, straight to the AI.
async function resume(idRef: string) {
  try {
    donation = listOf(await api('donations/mine', {}, wake())).find(d => d.id === idRef && d.status === 'registered') ?? null;
    if (!donation) { show('al-offer'); return; }
    offer = { category: (donation.category ?? 'dry_goods') as DonationCategory, kind: 'person', storage: donation.storage ?? 'ambient', kg: Number(donation.kg) || 0,
      expires: (donation.expires_at ?? today()).slice(0, 10), city: donation.city ?? '', uf: donation.uf ?? 'SP' };
    chosen = null;
    $('#al-ledger-summary')!.textContent = summary(offer);
    for (const id of ['al-closed', 'al-example-end', 'al-health-wait', 'al-login', 'al-account', 'al-done']) $(`#${id}`)!.hidden = true;
    show('al-ledger');
    await suggest(idRef);
  } catch (error) { fail(error); }
}

function button(text: string, cls: string, onClick: () => void) {
  const b = el('button', { type: 'button', class: cls }, text);
  b.addEventListener('click', onClick);
  return b;
}

for (const back of document.querySelectorAll<HTMLButtonElement>('[data-goto]')) back.addEventListener('click', () => show(back.dataset.goto as Screen));
$('#al-again')?.addEventListener('click', () => { donation = null; chosen = null; offerForm.reset(); show('al-offer'); });

// ---------- Start ----------
if (example) {
  // The same screens with an invented donation. The strip, a tag on each step and the striped boxes
  // say it in text. Every write is refused in api(); the book and the numbers never see it.
  document.body.classList.add('is-example-mode');
  for (const tag of document.querySelectorAll<HTMLElement>('.al-example-tag')) tag.hidden = false;
  for (const s of document.querySelectorAll<HTMLElement>('.status-strip .strip-context')) s.hidden = true;
  for (const s of document.querySelectorAll<HTMLElement>('.status-strip .strip-example')) s.hidden = false;
  document.body.removeAttribute('data-strip');
  for (const r of offerForm.querySelectorAll<HTMLInputElement>('input[type=radio]')) r.checked = r.value === EXAMPLE_OFFER.category || r.value === EXAMPLE_OFFER.kind || r.value === EXAMPLE_OFFER.storage;
  offerForm.kg.value = EXAMPLE_OFFER.kg;
  offerForm.expires.value = plusDays(1);
  offerForm.city.value = EXAMPLE_OFFER.city;
  $('#al-offer')!.hidden = false;
  say(msg(), '');
} else {
  const pending = new URLSearchParams(location.search).get('doacao');
  if (pending && session()) void resume(pending);
  else show('al-offer', false);
  // The sign-up state is said on step 1 too, before anyone gets near an e-mail field (1.2).
  void readHealth().then(h => {
    const note = $('#al-signup-note')!;
    if (h?.signup_open === false) {
      note.replaceChildren(stateNote({ kind: 'info', title: 'O registro no livro ainda está fechado',
        body: 'Não precisa dele pra doar: diga o que tem e a gente mostra quem recebe. O registro com e-mail abre em breve.' }));
      note.hidden = false;
    }
  });
}
