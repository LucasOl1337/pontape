import { adminStats, chatList, chatTranscript, ipKey } from './worker-metrics.js';
/* global crypto, TextEncoder, Response, URL */

const COOKIE = 'pontape_admin';
const TWELVE_HOURS = 12 * 60 * 60;

const reply = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
});
const unauthorized = () => reply({ error: 'Não autorizado.' }, 401);
const bytes = text => new TextEncoder().encode(text);

async function equal(a, b) {
  const [first, second] = await Promise.all([crypto.subtle.digest('SHA-256', bytes(a)), crypto.subtle.digest('SHA-256', bytes(b))]);
  const left = new Uint8Array(first), right = new Uint8Array(second);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function signingKey(secret) {
  return crypto.subtle.importKey('raw', bytes(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(secret, value) {
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await signingKey(secret), bytes(value)));
  return [...signature].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function validSession(request, env) {
  if (!env.SESSION_SECRET) return false;
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`));
  const value = cookie?.slice(COOKIE.length + 1) ?? '';
  const match = /^(\d{10,13})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return false;
  const expires = Number(match[1]);
  if (!Number.isSafeInteger(expires) || expires < Date.now() || expires > Date.now() + TWELVE_HOURS * 1000) return false;
  const key = await signingKey(env.SESSION_SECRET);
  const signature = Uint8Array.from(match[2].match(/../g), pair => parseInt(pair, 16));
  return crypto.subtle.verify('HMAC', key, signature, bytes(match[1]));
}

async function login(request, env) {
  if (!env.DB || !env.ADMIN_USER || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) return reply({ error: 'Acesso indisponível.' }, 503);
  if (Number(request.headers.get('content-length')) > 1024) return reply({ error: 'Pedido inválido.' }, 400);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return unauthorized();
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 1024) return reply({ error: 'Pedido inválido.' }, 400);
    body = JSON.parse(raw);
  } catch { return reply({ error: 'Pedido inválido.' }, 400); }
  const user = typeof body?.user === 'string' ? body.user.slice(0, 320) : '';
  const password = typeof body?.password === 'string' ? body.password.slice(0, 512) : '';
  const key = await ipKey(request, env.SESSION_SECRET, 'admin-login');
  const now = Date.now();
  const attempt = await env.DB.prepare(`INSERT INTO login_attempts(key, count, started_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = CASE WHEN started_at <= ? THEN 1 ELSE count + 1 END,
    started_at = CASE WHEN started_at <= ? THEN excluded.started_at ELSE started_at END RETURNING count`)
    .bind(key, now, now - 900_000, now - 900_000).first();
  if (Number(attempt?.count) > 5) return reply({ error: 'Tente de novo em 15 minutos.' }, 429);
  const [rightUser, rightPassword] = await Promise.all([equal(user, env.ADMIN_USER), equal(password, env.ADMIN_PASSWORD)]);
  if (!rightUser || !rightPassword) return unauthorized();
  await env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();
  const expires = String(now + TWELVE_HOURS * 1000);
  const cookie = `${COOKIE}=${expires}.${await sign(env.SESSION_SECRET, expires)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TWELVE_HOURS}`;
  return reply({ ok: true }, 200, { 'set-cookie': cookie });
}

export async function adminRoute(request, env, pathname, searchParams) {
  if (pathname === '/api/admin/login') return request.method === 'POST' ? login(request, env) : reply({ error: 'Método não permitido.' }, 405);
  if (!await validSession(request, env)) return unauthorized();
  if (pathname === '/api/admin/logout') {
    if (request.method !== 'POST') return reply({ error: 'Método não permitido.' }, 405);
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return unauthorized();
    return reply({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }
  if (request.method !== 'GET') return reply({ error: 'Método não permitido.' }, 405);
  if (pathname === '/api/admin/session') return reply({ ok: true });
  if (pathname === '/api/admin/stats') return reply(await adminStats(env.DB));
  if (pathname === '/api/admin/chats') {
    const raw = searchParams.get('page') ?? '1';
    if (!/^[1-9]\d{0,3}$/.test(raw)) return reply({ error: 'Página inválida.' }, 400);
    return reply(await chatList(env.DB, Number(raw)));
  }
  const id = /^\/api\/admin\/chats\/([0-9a-f-]{36})$/.exec(pathname)?.[1];
  if (id) {
    const transcript = await chatTranscript(env.DB, id);
    return transcript ? reply(transcript) : reply({ error: 'Conversa não encontrada.' }, 404);
  }
  return reply({ error: 'Não encontrado.' }, 404);
}
