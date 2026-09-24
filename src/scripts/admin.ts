type DayCount = { day: string; count: number };
type NamedCount = { kind?: string; path?: string; count: number };
const COUNTING_SINCE = '2026-09-24';

type Stats = { from: string; through: string; visits: DayCount[]; people: DayCount[]; clicks: NamedCount[]; pages: NamedCount[]; conversations: number };
type Chat = { id: string; started_at: string; model: string; first_question: string };
type ChatPage = { page: number; total: number; chats: Chat[] };
type Transcript = { id: string; started_at: string; model: string; messages: { role: 'user' | 'assistant'; content: string; at: string }[] };

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const login = $('admin-login');
const dashboard = $('admin-dashboard');
const loginStatus = $('admin-login-status');
const dashboardStatus = $('admin-status');
const number = new Intl.NumberFormat('pt-BR');
let page = 1;

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: 'no-store', credentials: 'same-origin', ...options });
  if (!response.ok) throw new Error(response.status === 401 ? 'Sessão encerrada. Entre de novo.' : 'Não deu pra carregar os dados.');
  return response.json() as Promise<T>;
}

function showLogin(message = '') {
  dashboard.hidden = true;
  login.hidden = false;
  loginStatus.textContent = message;
}

function date(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
    ...(iso.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function appendRow(body: HTMLElement, cells: string[], button?: { id: string; label: string }) {
  const row = document.createElement('tr');
  for (const value of cells) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.append(cell);
  }
  if (button) {
    const cell = document.createElement('td');
    const open = document.createElement('button');
    open.type = 'button';
    open.dataset.chat = button.id;
    open.textContent = button.label;
    cell.append(open);
    row.append(cell);
  }
  body.append(row);
}

function chart(visits: DayCount[], people: DayCount[], from: string) {
  const svg = $('admin-chart') as unknown as SVGSVGElement;
  svg.replaceChildren();
  const counts = (rows: DayCount[]) => new Map(rows.map(row => [row.day, row.count]));
  const views = counts(visits), humans = counts(people);
  const days = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(`${from}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  const max = Math.max(1, ...visits.map(row => row.count), ...people.map(row => row.count));
  const ns = 'http://www.w3.org/2000/svg';
  for (const [series, color] of [[views, '#29241e'], [humans, '#315fe2']] as const) {
    const path = document.createElementNS(ns, 'polyline');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '3');
    path.setAttribute('points', days.map((day, index) => `${28 + index * 22.5},${190 - (series.get(day) ?? 0) / max * 155}`).join(' '));
    svg.append(path);
  }
  for (const [label, y] of [[number.format(max), 32], ['0', 193]] as const) {
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', '0'); text.setAttribute('y', String(y)); text.setAttribute('fill', '#5d5952'); text.setAttribute('font-size', '12');
    text.textContent = label;
    svg.append(text);
  }
  const legend = document.createElementNS(ns, 'text');
  legend.setAttribute('x', '28'); legend.setAttribute('y', '214'); legend.setAttribute('fill', '#29241e'); legend.setAttribute('font-size', '13');
  legend.textContent = 'Escuro: visitas   Azul: pessoas por dia';
  svg.append(legend);
}

function renderStats(stats: Stats) {
  const visits = new Map(stats.visits.map(row => [row.day, row.count]));
  const people = new Map(stats.people.map(row => [row.day, row.count]));
  const days = $('admin-days');
  days.replaceChildren();
  // Newest day first, and nothing before the counter started (24/09/2026).
  for (let index = 0; index < 30; index++) {
    const day = new Date(`${stats.through}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() - index);
    const key = day.toISOString().slice(0, 10);
    if (key < COUNTING_SINCE) break;
    appendRow(days, [date(key), number.format(visits.get(key) ?? 0), number.format(people.get(key) ?? 0)]);
  }
  chart(stats.visits, stats.people, stats.from);
  const clickNames: Record<string, string> = { step: 'Passos da escada', seal: 'Conferências do selo', yume_open: 'Yume aberta', share: 'Compartilhar', link: 'Links' };
  const clicks = $('admin-clicks'); clicks.replaceChildren();
  stats.clicks.forEach(row => appendRow(clicks, [clickNames[row.kind ?? ''] ?? row.kind ?? '', number.format(row.count)]));
  const pages = $('admin-pages'); pages.replaceChildren();
  stats.pages.forEach(row => appendRow(pages, [row.path ?? '', number.format(row.count)]));
}

async function loadChats() {
  const result = await api<ChatPage>(`/api/admin/chats?page=${page}`);
  const body = $('admin-chat-list'); body.replaceChildren();
  result.chats.forEach(chat => appendRow(body, [date(chat.started_at), chat.model], { id: chat.id, label: chat.first_question }));
  $('admin-chat-total').textContent = `${number.format(result.total)} conversas guardadas`;
  $('admin-page').textContent = `Página ${result.page}`;
  ($<HTMLButtonElement>('admin-prev')).disabled = page === 1;
  ($<HTMLButtonElement>('admin-next')).disabled = page * 20 >= result.total;
}

async function openChat(id: string) {
  const chat = await api<Transcript>(`/api/admin/chats/${encodeURIComponent(id)}`);
  const transcript = $('admin-transcript');
  $('admin-transcript-meta').textContent = `${date(chat.started_at)} · ${chat.model}`;
  const list = $('admin-messages'); list.replaceChildren();
  for (const message of chat.messages) {
    const item = document.createElement('li');
    item.dataset.role = message.role;
    const role = document.createElement('strong');
    role.textContent = message.role === 'user' ? 'Pessoa' : 'Yume';
    item.append(role, document.createTextNode(message.content));
    list.append(item);
  }
  transcript.hidden = false;
  transcript.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function showDashboard() {
  login.hidden = true;
  dashboard.hidden = false;
  dashboardStatus.textContent = 'Carregando...';
  try {
    const stats = await api<Stats>('/api/admin/stats');
    renderStats(stats);
    await loadChats();
    dashboardStatus.textContent = '';
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith('Sessão')) showLogin(cause.message);
    else dashboardStatus.textContent = cause instanceof Error ? cause.message : 'Falha ao carregar.';
  }
}

($<HTMLFormElement>('admin-form')).addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const user = $<HTMLInputElement>('admin-user');
  const password = $<HTMLInputElement>('admin-password');
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  button.disabled = true;
  loginStatus.textContent = 'Entrando...';
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', cache: 'no-store',
      body: JSON.stringify({ user: user.value, password: password.value }),
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'Muitas tentativas. Tente em 15 minutos.' : 'Usuário ou senha inválidos.');
    password.value = '';
    await showDashboard();
  } catch (cause) {
    loginStatus.textContent = cause instanceof Error ? cause.message : 'Não deu pra entrar.';
  } finally { button.disabled = false; }
});

($<HTMLButtonElement>('admin-logout')).addEventListener('click', async () => {
  try { await api('/api/admin/logout', { method: 'POST' }); } finally { showLogin(); }
});
($<HTMLButtonElement>('admin-prev')).addEventListener('click', () => { page--; void loadChats(); });
($<HTMLButtonElement>('admin-next')).addEventListener('click', () => { page++; void loadChats(); });
($<HTMLButtonElement>('admin-close-chat')).addEventListener('click', () => { $('admin-transcript').hidden = true; });
$('admin-chat-list').addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLButtonElement>('button[data-chat]');
  if (button?.dataset.chat) void openChat(button.dataset.chat);
});

void api('/api/admin/session').then(showDashboard).catch(() => showLogin());
