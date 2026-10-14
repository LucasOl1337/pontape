// /alimenta/doar: login, donor account, donation, AI suggestion, destination. Every text from the API or
// the catalog goes in as text (el()), never as HTML.
import { $, ApiError, api, el, listOf, safeUrl, say, type Donation, type Me, type Recommendation } from './alimenta-api';
import { msg, startLogin, wake } from './alimenta-login';

interface Item { id: string; name: string; city: string; kind: string; accepts: string[]; how: string | null; hours: string | null;
  address: string | null; contact: string; sources: string[] }
const CATALOG: Item[] = JSON.parse($('#al-catalog')?.textContent ?? '[]');
const byId = (id: string) => CATALOG.find(d => d.id === id);
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const show = (id: string) => { for (const s of ['al-signup', 'al-closed', 'al-donate', 'al-reco', 'al-done']) $(`#${s}`)!.hidden = s !== id; };
const fail = (error: unknown) => say(msg(), (error as Error).message, 'error');
let me: Me = {};
let donation: Donation | null = null;

async function ready() {
  try { me = await api<Me>('me', {}, wake()); } catch (error) { fail(error); if ((error as ApiError).status === 401) location.reload(); return; }
  const v = me.current_versions ?? {};
  const accepted = (kind: string, version?: string) => !version || (me.consents ?? []).some(c => c.kind === kind && c.version === version);
  if (me.role === 'donor' && accepted('donation_terms', v.donation_terms) && accepted('privacy_notice', v.privacy_notice)) {
    const pending = new URLSearchParams(location.search).get('doacao');
    if (pending) { await resume(pending); return; }
    show('al-donate');
    return;
  }
  if (me.role !== 'donor' && me.signup_open === false) { show('al-closed'); return; }
  signup(me.role === 'donor');
}

function signup(onlyTerms: boolean) {
  show('al-signup');
  const form = $<HTMLFormElement>('#al-signup-form')!;
  const v = me.current_versions ?? {};
  $('#al-versions')!.textContent = [v.donation_terms, v.privacy_notice].filter(Boolean).length ? `(${[v.donation_terms, v.privacy_notice].filter(Boolean).join(' e ')})` : '';
  for (const [kind, target] of [['donation_terms', '#al-terms-text'], ['privacy_notice', '#al-privacy-text']] as const) {
    api<string>(`legal/${kind}`).then(text => { $(target)!.textContent = typeof text === 'string' ? text : ''; })
      .catch(() => { $(target)!.textContent = 'O texto não carregou agora. Tente abrir de novo em um minuto.'; });
  }
  if (onlyTerms) {
    $('#al-signup-title')!.textContent = 'Os textos mudaram';
    form.querySelectorAll<HTMLElement>('fieldset, .al-grid2').forEach(n => { n.hidden = true; });
  }
  const cnpj = $('#al-cnpj-field')!;
  form.addEventListener('change', () => { cnpj.hidden = form.kind.value === 'person'; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = new FormData(form);
    const city = String(data.get('city') ?? '').trim();
    if (!onlyTerms && city.length < 2) { say(msg(), 'Escreva a cidade.', 'error'); return; }
    if (!data.get('accept')) { say(msg(), 'Pra criar a conta, marque que aceita o termo e o aviso.', 'error'); return; }
    const button = form.querySelector('button')!;
    button.disabled = true;
    try {
      for (const kind of ['donation_terms', 'privacy_notice'] as const) {
        if (v[kind] && !(me.consents ?? []).some(c => c.kind === kind && c.version === v[kind])) await api('me/consents', { body: { kind, version: v[kind] } }, wake());
      }
      if (!onlyTerms) {
        const doc = String(data.get('cnpj') ?? '').replace(/\D/g, '');
        await api('donors', { body: { kind: data.get('kind'), city, uf: data.get('uf'), ...(doc && data.get('kind') !== 'person' ? { cnpj: doc } : {}),
          donation_terms_version: v.donation_terms, privacy_notice_version: v.privacy_notice } }, wake());
        const donate = $<HTMLFormElement>('#al-donate-form')!;
        donate.city.value = city;
        donate.uf.value = String(data.get('uf'));
      }
      say(msg(), 'Conta pronta.', 'ok');
      show('al-donate');
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) { $('#al-closed-text')!.textContent = `${error.message} A lista de distribuidores segue aberta pra doar direto.`; show('al-closed'); say(msg(), ''); }
      else fail(error);
    } finally { button.disabled = false; }
  });
}

$<HTMLFormElement>('#al-donate-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const data = new FormData(form);
  const kg = Number(String(data.get('kg') ?? '').replace(/\./g, '').replace(',', '.'));
  const expires = String(data.get('expires') ?? '');
  const city = String(data.get('city') ?? '').trim();
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  if (!(kg > 0 && kg <= 5000)) { say(msg(), 'Escreva os quilos com número, de 0,1 a 5.000.', 'error'); return; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expires) || expires < today) { say(msg(), 'A validade precisa ser hoje ou depois.', 'error'); return; }
  if (city.length < 2) { say(msg(), 'Escreva a cidade onde a comida está.', 'error'); return; }
  if (!data.get('declare')) { say(msg(), 'Marque a declaração sobre a comida pra seguir.', 'error'); return; }
  const button = form.querySelector('button')!;
  button.disabled = true;
  say(msg(), '');
  try {
    donation = await api<Donation>('donations', { body: { category: data.get('category'), storage: data.get('storage'), kg,
      expires_at: `${expires}T23:59:00-03:00`, city, uf: data.get('uf') } }, wake());
    show('al-reco');
    $('#al-reco-intro')!.textContent = 'A AI está lendo as fontes dos distribuidores. Pode levar alguns segundos.';
    $('#al-reco-body')!.replaceChildren();
    const reco = await api<Recommendation>(`donations/${encodeURIComponent(donation.id)}/recommend`, { body: {} }, wake());
    recommend(reco, city);
  } catch (error) { fail(error); } finally { button.disabled = false; }
});

// From "Escolher destino" in Minhas doações: the AI suggestion for a donation already registered.
async function resume(id: string) {
  try {
    donation = listOf(await api('donations/mine', {}, wake())).find(d => d.id === id && d.status === 'registered') ?? null;
    if (!donation) { show('al-donate'); return; }
    show('al-reco');
    $('#al-reco-intro')!.textContent = 'A AI está lendo as fontes dos distribuidores. Pode levar alguns segundos.';
    recommend(await api<Recommendation>(`donations/${encodeURIComponent(id)}/recommend`, { body: {} }, wake()), donation.city ?? '');
  } catch (error) { fail(error); }
}

function facts(d: Item) {
  const dl = el('dl', { class: 'al-facts' });
  for (const [label, value] of [['Como doar', d.how], ['Horário', d.hours], ['Endereço', d.address]] as const) {
    if (value) dl.append(el('div', {}, el('dt', {}, label), el('dd', {}, value)));
  }
  return dl;
}

function recommend(reco: Recommendation, city: string) {
  const body = $('#al-reco-body')!;
  const ranking = (reco.ranking ?? []).filter(r => byId(r.distributor_id));
  const top = ranking[0];
  const intro = $('#al-reco-intro')!;
  if (!top) {
    intro.textContent = reco.message || 'Ainda não achamos distribuidor com fonte na sua cidade.';
    body.replaceChildren(el('p', { class: 'al-hint' }, 'A doação ficou registrada. Se conhecer um banco de alimentos ou organização daqui, ',
      el('a', { href: $('#al-reco')!.dataset.suggest ?? '/alimenta/distribuidores', rel: 'noopener' }, 'sugira com a fonte pública'),
      '. Dá pra cancelar a doação em Minhas doações.'), pickOther([], city));
    return;
  }
  intro.textContent = reco.mode === 'ai'
    ? `A AI comparou ${ranking.length > 1 ? `${ranking.length} distribuidores` : 'o distribuidor'} da lista com a sua doação.${reco.web_search === false ? ' Sem busca na web agora: ela leu só as fontes da lista.' : ''}`
    : 'A AI não respondeu agora. Esta sugestão vem pela regra: mesma cidade, aceita esse tipo de comida e tem horário publicado.';
  const d = byId(top.distributor_id)!;
  const sources = (top.sources ?? []).map(safeUrl).filter((u): u is string => Boolean(u));
  const card = el('article', { class: 'al-pick' },
    el('p', { class: 'al-kicker' }, reco.mode === 'ai' ? 'Sugestão da AI' : 'Sugestão pela regra'),
    el('h3', {}, d.name), el('p', { class: 'al-hint' }, `${d.kind} · ${d.city}`),
    top.reason ? el('p', { class: 'al-reason' }, top.reason) : null, facts(d),
    el('ul', { class: 'al-sources' }, ...(sources.length ? sources : d.sources).map(u => el('li', {}, 'Fonte: ', el('a', { href: u, rel: 'noopener', target: '_blank' }, new URL(u).hostname.replace(/^www\./, ''))))),
    el('p', { class: 'al-row' }, button('Levar pra este', 'btn btn--ink', () => choose(d.id, true)), button('Escolher outro', 'btn', () => { other.hidden = false; other.querySelector('input')?.focus(); })));
  const other = pickOther(ranking.slice(1).map(r => r.distributor_id), city, d.id);
  other.hidden = true;
  body.replaceChildren(card, other);
}

function pickOther(first: string[], city: string, skip?: string) {
  const near = CATALOG.filter(d => norm(d.city) === norm(city));
  const ids = [...new Set([...first, ...near.map(d => d.id), ...CATALOG.map(d => d.id)])].filter(id => id !== skip);
  const select = el('select', { id: 'al-other' }, ...ids.map(id => el('option', { value: id }, `${byId(id)!.name} (${byId(id)!.city})`)));
  return el('div', { class: 'al-others' }, el('label', { class: 'al-field', for: 'al-other' }, el('span', {}, 'Outro distribuidor da lista'), select),
    el('p', { class: 'al-row' }, button('Levar pra este', 'btn btn--ink', () => choose((select as HTMLSelectElement).value, false))));
}

function button(text: string, cls: string, onClick: () => void) {
  const b = el('button', { type: 'button', class: cls }, text);
  b.addEventListener('click', onClick);
  return b;
}

async function choose(id: string, fromRecommendation: boolean) {
  if (!donation) return;
  try {
    donation = await api<Donation>(`donations/${encodeURIComponent(donation.id)}/destination`, { body: { distributor_id: id, from_recommendation: fromRecommendation } }, wake());
    const d = byId(id)!;
    $('#al-done-body')!.replaceChildren(el('p', { class: 'al-reason' }, `Destino: ${d.name}, ${d.city}.`), facts(d),
      el('p', { class: 'al-row' }, el('a', { class: 'more-link', href: d.contact, rel: 'noopener', target: '_blank' }, 'Contato oficial pra combinar')),
      donation?.public_ref ? el('p', { class: 'al-ref' }, `Código público da doação: ${donation.public_ref}`) : '');
    say(msg(), '');
    show('al-done');
    $('#al-done')!.focus();
  } catch (error) { fail(error); }
}

$('#al-again')?.addEventListener('click', () => { donation = null; show('al-donate'); });
startLogin(ready);
