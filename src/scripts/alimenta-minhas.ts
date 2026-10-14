// /alimenta/minhas-doacoes: the donor's list, deliver, cancel, the book link, delete the account.
import { $, CATEGORY, STATUS, api, day, el, kg, listOf, logout, say, session, type Donation, type Me } from './alimenta-api';
import { msg, startLogin, wake } from './alimenta-login';

const CATALOG: { id: string; name: string; city: string; contact: string }[] = JSON.parse($('#al-catalog')?.textContent ?? '[]');
const fail = (error: unknown) => say(msg(), (error as Error).message, 'error');

function act(text: string, cls: string, run: () => Promise<void>) {
  const b = el('button', { type: 'button', class: cls }, text) as HTMLButtonElement;
  b.addEventListener('click', async () => { b.disabled = true; try { await run(); } catch (error) { fail(error); } finally { b.disabled = false; } });
  return b;
}

function row(d: Donation) {
  const to = CATALOG.find(c => c.id === d.distributor_id);
  const status = d.status ?? 'registered';
  const open = status === 'registered' || status === 'destination_chosen';
  const ref = d.public_ref ?? '';
  const call = (path: string, done: string) => async () => {
    await api(`donations/${encodeURIComponent(d.id)}/${path}`, { body: {} }, wake());
    say(msg(), done, 'ok');
    await load();
  };
  return el('li', { class: 'al-don' },
    el('span', { class: 'al-state', 'data-s': status }, STATUS[status] ?? status),
    el('h3', {}, `${kg(d.kg)} de ${(CATEGORY[d.category ?? ''] ?? 'comida').toLowerCase()}`),
    el('p', { class: 'al-hint' }, [d.city, d.expires_at ? `vale até ${day(d.expires_at)}` : '', d.created_at ? `registrada em ${day(d.created_at)}` : ''].filter(Boolean).join(' · ')),
    to ? el('p', {}, 'Destino: ', el('a', { href: to.contact, rel: 'noopener', target: '_blank' }, `${to.name}, ${to.city}`)) : el('p', { class: 'al-hint' }, open ? 'Ainda sem destino.' : ''),
    ref ? el('p', { class: 'al-ref' }, 'No livro: ', el('a', { href: `/alimenta#d-${encodeURIComponent(ref)}` }, ref), d.ledger_sequence ? ` · ação nº ${d.ledger_sequence}` : ' · entrando no livro') : null,
    open ? el('p', { class: 'al-row' },
      status === 'destination_chosen' ? act('Marquei entregue', 'btn btn--ink', call('delivered', 'Entrega marcada. Obrigado.')) : el('a', { class: 'btn btn--ink', href: `/alimenta/doar?doacao=${encodeURIComponent(d.id)}` }, 'Escolher destino'),
      act('Cancelar', 'btn al-quiet', async () => { if (confirm('Cancelar esta doação? No livro ela aparece como cancelada.')) await call('cancel', 'Doação cancelada.')(); })) : null);
}

async function load() {
  const list = listOf(await api('donations/mine', {}, wake()));
  $('#al-mine-list')!.replaceChildren(...list.map(row));
  $('#al-mine-empty')!.hidden = list.length > 0;
}

async function ready() {
  $('#al-mine')!.hidden = false;
  try {
    const me = await api<Me>('me', {}, wake());
    $('#al-who')!.textContent = me.email ?? 'doador';
    await load();
  } catch (error) { fail(error); }
}

$('#al-logout')?.addEventListener('click', () => { logout(); location.reload(); });
$('#al-delete')?.addEventListener('click', async () => {
  if (!session() || !confirm('Apagar sua conta? Seu e-mail e seus dados somem. Isso não tem volta.')) return;
  try { await api('me', { method: 'DELETE' }, wake()); logout(); $('#al-mine')!.hidden = true; say(msg(), 'Conta apagada. No livro ficou só o código anônimo de cada doação.', 'ok'); } catch (error) { fail(error); }
});
startLogin(ready);
