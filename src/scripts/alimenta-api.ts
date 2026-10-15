// Browser side of the Rede Alimenta: every call goes to /api/alimenta/* on this origin (the Worker
// passes it to the API). The login token lives in sessionStorage only: closing the tab logs out.
import { writeAllowed } from '../data/alimenta/combina';

const KEY = 'pontape.alimenta.sessao';
const WAKE_AFTER_MS = 2500;
let awake = false;

export interface Session { token: string; until: number }
export function session(): Session | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Session | null;
    if (s && typeof s.token === 'string' && s.until > Date.now()) return s;
  } catch { /* A broken value is the same as none. */ }
  sessionStorage.removeItem(KEY);
  return null;
}
export function saveSession(token: string, expiresIn: number) {
  const seconds = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 3600;
  sessionStorage.setItem(KEY, JSON.stringify({ token, until: Date.now() + (seconds - 30) * 1000 }));
}
export const logout = () => sessionStorage.removeItem(KEY);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// The API answers FastAPI style ({detail}) and the Worker {error}. A list of detail is a form error.
function messageOf(status: number, body: unknown): string {
  const b = body as { detail?: unknown; error?: unknown } | null;
  if (typeof b?.error === 'string') return b.error;
  if (typeof b?.detail === 'string') return b.detail;
  if (Array.isArray(b?.detail)) return 'Algum campo ficou fora do formato. Confira e tente de novo.';
  if (status === 401) return 'Sua sessão acabou. Entre de novo com o e-mail.';
  if (status === 429) return 'Muitas tentativas. Espere um minuto.';
  return 'Não deu certo agora. Tente de novo em um minuto.';
}

// The API sleeps when nobody uses it (free plan). The first call can take up to a minute, so after a
// short wait the page says it is waking the server, instead of looking stuck.
// Example mode (F44, plano 3.5): once on, every write is refused here, before anything leaves the page.
// Reading (GET) still works. Nothing of the example reaches the API, the book or the numbers.
let example = false;
export const setExample = (on: boolean) => { example = on; };
export const EXAMPLE_REFUSED = 'No exemplo nada é enviado. Saia do exemplo pra doar de verdade.';

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}, wake?: HTMLElement | null): Promise<T> {
  const method = init.method ?? (init.body === undefined ? 'GET' : 'POST');
  if (!writeAllowed(method, example)) throw new ApiError(0, EXAMPLE_REFUSED);
  const headers: Record<string, string> = { accept: 'application/json' };
  const s = session();
  if (s) headers.authorization = `Bearer ${s.token}`;
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  const timer = !awake && wake ? window.setTimeout(() => {
    wake.hidden = false;
    wake.textContent = 'Acordando o servidor. A primeira vez pode levar até 1 minuto.';
  }, WAKE_AFTER_MS) : undefined;
  let response: Response;
  try {
    response = await fetch(`/api/alimenta/${path}`, { method, headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body), cache: 'no-store', credentials: 'omit' });
  } catch {
    throw new ApiError(0, 'Sem conexão. Confira a internet e tente de novo.');
  } finally {
    window.clearTimeout(timer);
    if (wake) wake.hidden = true;
  }
  awake = true;
  if (response.status === 401 && s) logout();
  if (response.status === 204) return undefined as T;
  const type = response.headers.get('content-type') ?? '';
  const body: unknown = type.includes('json') ? await response.json().catch(() => null) : await response.text();
  if (!response.ok) throw new ApiError(response.status, messageOf(response.status, body));
  return body as T;
}

export const $ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector);
export function say(el: HTMLElement | null, text: string, kind: 'ok' | 'error' | '' = '') {
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
  el.dataset.kind = kind;
}
// Text from the API or the catalog goes in as text, never as HTML.
export function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string | null | undefined)[]) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) if (c !== null && c !== undefined) node.append(c);
  return node;
}
export const safeUrl = (url: unknown) => (typeof url === 'string' && /^https:\/\/[^\s"<>]+$/.test(url) ? url : null);

export interface Health { status?: string; signup_open?: boolean; ai?: boolean }
export interface Me { email?: string; role?: string | null; org_id?: string | null; signup_open?: boolean; is_test?: boolean;
  consents?: { kind: string; version: string }[]; current_versions?: { donation_terms?: string; privacy_notice?: string } }
export interface Donation { id: string; public_ref?: string | null; category?: string; storage?: string; kg?: number; expires_at?: string;
  city?: string; uf?: string; status?: string; distributor_id?: string | null; created_at?: string; ledger_sequence?: string | null }
export interface Recommendation { mode?: 'ai' | 'rule'; web_search?: boolean; message?: string;
  ranking?: { distributor_id: string; reason?: string; sources?: string[] }[] }

export const STATUS: Record<string, string> = {
  registered: 'Registrada, sem destino', destination_chosen: 'Destino escolhido', delivered: 'Entregue (declarado por você)',
  cancelled: 'Cancelada', expired: 'Venceu sem destino',
};
export const CATEGORY: Record<string, string> = {
  dry_goods: 'Não perecíveis', produce: 'Frutas, legumes e verduras', bakery: 'Pães', dairy: 'Leite e derivados', prepared_meal: 'Refeição pronta',
};
export const kg = (n: unknown) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(Number(n) || 0)} kg`;
export const day = (iso: unknown) => {
  const d = typeof iso === 'string' ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
};
export const listOf = (body: unknown): Donation[] => (Array.isArray(body) ? body : Array.isArray((body as { items?: unknown })?.items) ? (body as { items: Donation[] }).items : []);
