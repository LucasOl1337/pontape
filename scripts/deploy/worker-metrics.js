/* global crypto, TextEncoder, TextDecoder, Response */

const START_DAY = '2026-09-24';
const KINDS = new Set(['view', 'step', 'seal', 'yumi_open', 'share', 'link']);
const PATHS = new Set([
  '/', '/transparencia', '/transparencia/tecnico', '/perguntas', '/construir',
  '/construir/pecas', '/construir/gargalos', '/construir/tarefas', '/construir/codigo-aberto',
]);
const LINK_TARGETS = new Set(['github', 'linkedin', 'x', 'transparencia', 'construir', 'perguntas', 'contato', 'tecnico']);
const BOT = /bot|crawler|spider|curl|wget|headless/i;
let cachedPublic = null;

export function siteDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = kind => parts.find(item => item.type === kind)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function canonicalPath(path) {
  if (typeof path !== 'string' || path.length > 80) return null;
  const clean = path === '/' ? '/' : path.replace(/\/$/, '');
  return PATHS.has(clean) ? clean : null;
}

async function digest(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function ipKey(request, secret, scope) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  return (await digest(`${scope}\0${ip}\0${secret}`)).slice(0, 32);
}

async function uniqueHash(request, secret, day) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const agent = request.headers.get('user-agent') ?? '';
  return (await digest(`${ip}\0${agent}\0${day}\0${secret}`)).slice(0, 32);
}

export async function recordHit(db, day, kind, path, target = '') {
  await db.prepare('INSERT INTO hits(day, kind, path, target, count) VALUES (?, ?, ?, ?, 1) ON CONFLICT(day, kind, path, target) DO UPDATE SET count = count + 1')
    .bind(day, kind, path, target).run();
}

export async function recordView(request, env, path) {
  if (!env.DB || !env.SESSION_SECRET || BOT.test(request.headers.get('user-agent') ?? '')) return;
  const day = siteDay();
  if (day < START_DAY) return;
  const hash = await uniqueHash(request, env.SESSION_SECRET, day);
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO uniques(day, hash) VALUES (?, ?)').bind(day, hash),
    env.DB.prepare('INSERT INTO hits(day, kind, path, target, count) VALUES (?, ?, ?, ?, 1) ON CONFLICT(day, kind, path, target) DO UPDATE SET count = count + 1').bind(day, 'view', path, ''),
  ]);
}

export async function handleHit(request, env) {
  if (!env.DB || !env.HIT_RATE_LIMITER || !env.SESSION_SECRET) return new Response(null, { status: 503 });
  if (Number(request.headers.get('content-length')) > 512) return new Response(null, { status: 413 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json') &&
      !request.headers.get('content-type')?.toLowerCase().startsWith('text/plain')) return new Response(null, { status: 415 });
  let body;
  try {
    const raw = await request.text();
    if (raw.length > 512) return new Response(null, { status: 413 });
    body = JSON.parse(raw);
  } catch { return new Response(null, { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['kind', 'path', 'target'].includes(key)) ||
      !KINDS.has(body.kind)) return new Response(null, { status: 400 });
  const path = canonicalPath(body.path);
  if (!path) return new Response(null, { status: 400 });
  const target = body.target ?? '';
  if (typeof target !== 'string') return new Response(null, { status: 400 });
  const validTarget = body.kind === 'step' ? /^[0-8]$/.test(target) :
    body.kind === 'link' ? LINK_TARGETS.has(target) : target === '';
  if (!validTarget) return new Response(null, { status: 400 });
  // A page view is accepted by this closed schema, but only the HTML response records it.
  if (body.kind === 'view') return new Response(null, { status: 204 });
  if (BOT.test(request.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });
  const key = await ipKey(request, env.SESSION_SECRET, 'hit');
  const { success } = await env.HIT_RATE_LIMITER.limit({ key });
  if (!success) return new Response(null, { status: 429 });
  await recordHit(env.DB, siteDay(), body.kind, path, target);
  return new Response(null, { status: 204 });
}

const numeric = value => Number(value ?? 0);
const sum = async (db, sql, ...args) => numeric((await db.prepare(sql).bind(...args).first())?.total);

export async function publicStats(env) {
  if (!env.DB) return new Response(JSON.stringify({ error: 'Contagem indisponível.' }), { status: 503, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  if (cachedPublic && cachedPublic.until > Date.now()) return new Response(cachedPublic.body, { headers: cachedPublic.headers });
  const today = siteDay();
  const sevenDays = new Date(`${today}T12:00:00Z`);
  sevenDays.setUTCDate(sevenDays.getUTCDate() - 6);
  const from = sevenDays.toISOString().slice(0, 10);
  const [visits, peopleToday, peopleSevenDays, sealChecks, conversations, stepsOpened] = await Promise.all([
    sum(env.DB, "SELECT SUM(count) AS total FROM hits WHERE kind = 'view' AND day >= ?", START_DAY),
    sum(env.DB, 'SELECT COUNT(*) AS total FROM uniques WHERE day = ?', today),
    sum(env.DB, 'SELECT COUNT(*) AS total FROM uniques WHERE day BETWEEN ? AND ?', from, today),
    sum(env.DB, "SELECT SUM(count) AS total FROM hits WHERE kind = 'seal' AND day >= ?", START_DAY),
    sum(env.DB, "SELECT SUM(count) AS total FROM hits WHERE kind = 'conversation' AND day >= ?", START_DAY),
    sum(env.DB, "SELECT SUM(count) AS total FROM hits WHERE kind = 'step' AND day >= ?", START_DAY),
  ]);
  const body = JSON.stringify({ visits, peopleToday, peopleSevenDays, sealChecks, conversations, stepsOpened });
  const headers = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' };
  cachedPublic = { until: Date.now() + 60_000, body, headers };
  return new Response(body, { headers });
}

export async function adminStats(db) {
  const today = siteDay();
  const fromDate = new Date(`${today}T12:00:00Z`);
  fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  const from = fromDate.toISOString().slice(0, 10);
  const [visits, people, clicks, pages, chats] = await Promise.all([
    db.prepare("SELECT day, SUM(count) AS count FROM hits WHERE kind = 'view' AND day BETWEEN ? AND ? GROUP BY day ORDER BY day").bind(from, today).all(),
    db.prepare('SELECT day, COUNT(*) AS count FROM uniques WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day').bind(from, today).all(),
    db.prepare("SELECT kind, SUM(count) AS count FROM hits WHERE kind != 'view' AND day BETWEEN ? AND ? GROUP BY kind ORDER BY count DESC").bind(from, today).all(),
    db.prepare("SELECT path, SUM(count) AS count FROM hits WHERE kind = 'view' AND day BETWEEN ? AND ? GROUP BY path ORDER BY count DESC LIMIT 10").bind(from, today).all(),
    db.prepare("SELECT SUM(count) AS total FROM hits WHERE kind = 'conversation'").first(),
  ]);
  return { from, through: today, visits: visits.results, people: people.results, clicks: clicks.results, pages: pages.results, conversations: numeric(chats?.total) };
}

export async function chatList(db, page) {
  const offset = (page - 1) * 20;
  const rows = await db.prepare("SELECT c.id, c.started_at, c.model, COALESCE((SELECT m.content FROM messages m WHERE m.chat_id = c.id AND m.role = 'user' ORDER BY m.id LIMIT 1), '') AS first_question FROM chats c ORDER BY c.started_at DESC LIMIT 20 OFFSET ?").bind(offset).all();
  const total = await db.prepare('SELECT COUNT(*) AS total FROM chats').first();
  return { page, total: numeric(total?.total), chats: rows.results };
}

export async function chatTranscript(db, id) {
  const chat = await db.prepare('SELECT id, started_at, model FROM chats WHERE id = ?').bind(id).first();
  if (!chat) return null;
  const messages = await db.prepare('SELECT role, content, at FROM messages WHERE chat_id = ? ORDER BY id').bind(id).all();
  return { ...chat, messages: messages.results };
}

export async function saveChat(db, id, model, user, assistant) {
  const at = new Date().toISOString();
  const results = await db.batch([
    db.prepare('INSERT OR IGNORE INTO chats(id, started_at, model) VALUES (?, ?, ?)').bind(id, at, model),
    db.prepare('INSERT INTO messages(chat_id, role, content, at) VALUES (?, ?, ?, ?)').bind(id, 'user', user, at),
    db.prepare('INSERT INTO messages(chat_id, role, content, at) VALUES (?, ?, ?, ?)').bind(id, 'assistant', assistant, at),
  ]);
  if (results[0]?.meta?.changes === 1) await recordHit(db, siteDay(), 'conversation', '/');
}

export async function readAnswer(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  let doneEvent = false;
  while (true) {
    const chunk = await reader.read();
    buffer += decoder.decode(chunk.value, { stream: !chunk.done }).replace(/\r\n/g, '\n');
    let end;
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
      if (data === '[DONE]') { doneEvent = true; continue; }
      if (!data) continue;
      try {
        const choice = JSON.parse(data).choices?.[0];
        if (choice?.finish_reason === 'stop') doneEvent = true;
        const token = choice?.delta?.content;
        if (typeof token === 'string') answer += token;
      } catch { /* A non-text SSE event. */ }
    }
    if (chunk.done || answer.length > 8000) break;
  }
  return doneEvent ? answer.trim() : '';
}

export async function purgeOldData(db) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 180);
  const instant = cutoff.toISOString();
  const day = instant.slice(0, 10);
  await db.prepare('DELETE FROM messages WHERE chat_id IN (SELECT id FROM chats WHERE started_at < ?)').bind(instant).run();
  await db.prepare('DELETE FROM chats WHERE started_at < ?').bind(instant).run();
  await db.prepare('DELETE FROM uniques WHERE day < ?').bind(day).run();
  await db.prepare('DELETE FROM login_attempts WHERE started_at < ?').bind(Date.now() - 900_000).run();
}
