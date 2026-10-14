import { checkoutRequest, checkoutUrl, envelopesFromWebhook, ASAAS_SANDBOX_API } from '../../src/lib/ledger/asaas.ts';
import { CHAT_MODELS, YUMI_SYSTEM } from './yumi.js';
import { canonicalPath, handleHit, publicStats, recordView, readAnswer, saveChat, purgeOldData } from './worker-metrics.js';
import { adminRoute } from './worker-admin.js';
/* global Response, URL, crypto, TextEncoder, fetch, AbortSignal */

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const error = (message, status) => json({ error: message }, status);

function containsPersonalData(text) {
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b\d{3}[.\s-]?\d{3}[.\s-]?\d{3}[-.\s]?\d{2}\b|(?:\+?\d[\d\s()-]{8,}\d)|\b(?:meu nome é|me chamo)\b/i.test(text);
}

function validMessages(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) return false;
  if (value.at(-1)?.role !== 'user') return false;
  return value.every((message, index) =>
    message && typeof message === 'object' &&
    message.role === (index % 2 === (value.length - 1) % 2 ? 'user' : 'assistant') &&
    typeof message.content === 'string' && message.content.trim().length > 0 &&
    message.content.length <= 600);
}

async function chat(request, env, ctx) {
  if (!env.NINEROUTER_TOKEN) return error('Yume está indisponível agora.', 503);
  if (!env.CHAT_RATE_LIMITER) return error('Yume está indisponível agora.', 503);
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return error('Envie uma mensagem em JSON.', 415);
  }
  if (Number(request.headers.get('content-length')) > 16_000) return error('Mensagem grande demais.', 413);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 16_000) return error('Mensagem grande demais.', 413);
    body = JSON.parse(raw);
  } catch {
    return error('Não consegui ler a mensagem.', 400);
  }
  if (!validMessages(body?.messages)) return error('Envie até 12 falas de 600 caracteres.', 400);
  if (body.chatId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.chatId)) {
    return error('Conversa inválida.', 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'desconhecido';
  const key = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const { success } = await env.CHAT_RATE_LIMITER.limit({ key });
  if (!success) return error('A Yume precisa de um tempo. Tente de novo em um minuto.', 429);

  if (body.messages.some(message => containsPersonalData(message.content))) {
    const content = 'Não guardo nem uso dados pessoais nesta conversa. Por favor, tire sua dúvida sem nome, telefone, CPF ou e-mail.';
    const stream = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
    return new Response(stream, { headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-yumi-private': '1',
    } });
  }

  const messages = [{ role: 'system', content: YUMI_SYSTEM }, ...body.messages];
  for (const model of CHAT_MODELS) {
    let upstream;
    try {
      upstream = await fetch('https://9router-production-056a.up.railway.app/v1/chat/completions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${env.NINEROUTER_TOKEN}`,
          'content-type': 'application/json',
          accept: 'text/event-stream',
        },
        body: JSON.stringify({ model, messages, stream: true, max_tokens: 320, temperature: 0.2 }),
        signal: request.signal,
      });
    } catch {
      continue;
    }
    if (upstream.ok && upstream.body) {
      const [client, archive] = upstream.body.tee();
      if (env.DB && body.chatId) {
        ctx?.waitUntil(readAnswer(archive).then(answer => {
          if (!answer || containsPersonalData(answer)) return;
          return saveChat(env.DB, body.chatId, model, body.messages.at(-1).content, answer);
        }).catch(() => { /* Recording must never interrupt the answer. */ }));
      } else {
        ctx?.waitUntil(archive.cancel());
      }
      return new Response(client, {
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store, no-transform',
          'x-content-type-options': 'nosniff',
        },
      });
    }
    await upstream.body?.cancel();
  }
  return error('A Yume não conseguiu responder agora. Tente daqui a pouco.', 502);
}

function sameToken(left, right) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function startDonation(request, env) {
  if (env.DONATIONS_OPEN !== '1') return error('A doação ainda não está aberta.', 403);
  if (!env.ASAAS_SANDBOX_KEY) return error('A conta de teste ainda não existe.', 503);
  let amount;
  const type = request.headers.get('content-type')?.toLowerCase() ?? '';
  if (type.startsWith('application/json')) {
    const body = await request.json().catch(() => null);
    amount = Number(body?.amountCents);
  } else {
    const form = await request.formData().catch(() => null);
    amount = Number(form?.get('amountCents'));
  }
  const origin = new URL(request.url).origin;
  const payload = checkoutRequest(amount, origin);
  if (!payload) return error('Escolha R$ 10, R$ 20, R$ 50 ou R$ 100.', 400);
  const api = env.ASAAS_API_URL || ASAAS_SANDBOX_API;
  const created = await fetch(`${api.replace(/\/$/, '')}/checkouts`, {
    method: 'POST',
    headers: { access_token: env.ASAAS_SANDBOX_KEY, 'content-type': 'application/json', 'user-agent': 'pontape' },
    body: JSON.stringify(payload),
  });
  if (!created.ok) return error('O pagamento não abriu agora.', 502);
  const checkout = await created.json().catch(() => null);
  if (!checkout?.id || typeof checkout.id !== 'string') return error('O pagamento não abriu agora.', 502);
  return json({ url: checkoutUrl(api, checkout.id) });
}

async function asaasWebhook(request, env) {
  if (!env.ASAAS_WEBHOOK_TOKEN) return error('O aviso de pagamento ainda não está ligado.', 503);
  if (!sameToken(request.headers.get('asaas-access-token') ?? '', env.ASAAS_WEBHOOK_TOKEN)) {
    return error('Aviso recusado.', 401);
  }
  const body = await request.json().catch(() => null);
  const parsed = envelopesFromWebhook(body);
  if (!parsed.ok) return error('Aviso fora do formato.', 400);
  if (parsed.envelopes.length === 0) return json({ ok: true, ignored: true });
  if (!env.LEDGER_DISPATCH_TOKEN) return error('O escrevente ainda não está ligado.', 503);
  const sent = JSON.stringify({ source: 'asaas', envelopes: parsed.envelopes });
  if (/@|cpf|nome/i.test(sent)) return error('Aviso recusado.', 400);
  const dispatched = await fetch('https://api.github.com/repos/LucasOl1337/pontape/actions/workflows/ledger-ingest.yml/dispatches', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.LEDGER_DISPATCH_TOKEN}`,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'user-agent': 'pontape-doar',
    },
    body: JSON.stringify({ ref: 'main', inputs: { event: sent } }),
  });
  if (dispatched.status !== 204) return error('O livro não recebeu o aviso agora.', 502);
  return json({ ok: true });
}

// Rede Alimenta: the browser talks to /api/alimenta/* on this origin and the Worker passes the call
// to the Python API (ALIMENTA_API_ORIGIN). Same origin keeps the CSP at connect-src 'self' and needs
// no CORS. Closed list of routes; only the headers the API needs go out, never the site cookies.
const ALIMENTA_ID = '[A-Za-z0-9_-]{1,64}';
const ALIMENTA_ROUTES = [
  ['POST', 'auth/code'], ['POST', 'auth/verify'],
  ['GET', 'me'], ['DELETE', 'me'], ['POST', 'me/consents'], ['POST', 'donors'],
  ['POST', 'donations'], ['GET', 'donations/mine'],
  ['POST', `donations/${ALIMENTA_ID}/(?:recommend|destination|delivered|cancel)`],
  ['GET', 'distributors'], ['GET', 'health'], ['GET', 'kpis'], ['GET', 'legal/(?:donation_terms|privacy_notice)'],
].map(([method, path]) => [method, new RegExp(`^${path}$`)]);
export const ALIMENTA_TIMEOUT_MS = 60_000;
const ALIMENTA_BODY_LIMIT = 16_000;

async function alimentaProxy(request, env, path) {
  const allowed = ALIMENTA_ROUTES.filter(([, pattern]) => pattern.test(path));
  if (allowed.length === 0) return error('Caminho desconhecido.', 404);
  if (!allowed.some(([method]) => method === request.method)) return error('Método não permitido.', 405);
  const origin = (env.ALIMENTA_API_ORIGIN ?? '').replace(/\/+$/, '');
  if (!/^https?:\/\/[^/?#]+$/.test(origin)) return error('A Rede Alimenta ainda não está ligada.', 503);

  const headers = { accept: 'application/json', 'user-agent': 'pontape-alimenta' };
  const auth = request.headers.get('authorization') ?? '';
  if (/^Bearer [A-Za-z0-9._~+/=-]{1,4096}$/.test(auth)) headers.authorization = auth;
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) headers['x-forwarded-for'] = ip;
  let body;
  if (request.method !== 'GET') {
    if (Number(request.headers.get('content-length')) > ALIMENTA_BODY_LIMIT) return error('Mensagem grande demais.', 413);
    body = await request.text();
    if (body.length > ALIMENTA_BODY_LIMIT) return error('Mensagem grande demais.', 413);
    if (body) {
      if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return error('Envie em JSON.', 415);
      headers['content-type'] = 'application/json';
    } else body = undefined;
  }

  let upstream;
  try {
    upstream = await fetch(`${origin}/${path}`, { method: request.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(ALIMENTA_TIMEOUT_MS) });
  } catch (cause) {
    const late = cause?.name === 'TimeoutError' || cause?.name === 'AbortError';
    return error(late ? 'O servidor da Rede Alimenta demorou demais pra acordar. Tente de novo.' : 'O servidor da Rede Alimenta não respondeu. Tente de novo em um minuto.', 502);
  }
  const type = upstream.headers.get('content-type')?.toLowerCase() ?? '';
  const known = type.startsWith('application/json') || type.startsWith('text/plain');
  if (upstream.status >= 500 && !type.startsWith('application/json')) {
    await upstream.body?.cancel();
    return error('O servidor da Rede Alimenta está fora do ar agora. Tente de novo em um minuto.', 502);
  }
  if (upstream.status >= 300 && upstream.status < 400) {
    await upstream.body?.cancel();
    return error('O servidor da Rede Alimenta respondeu fora do combinado.', 502);
  }
  const out = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  if (known) out['content-type'] = type.startsWith('text/plain') ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8';
  if (upstream.status === 204) return new Response(null, { status: 204, headers: out });
  if (!known) { await upstream.body?.cancel(); return error('O servidor da Rede Alimenta respondeu fora do combinado.', 502); }
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/alimenta/')) return alimentaProxy(request, env, url.pathname.slice('/api/alimenta/'.length));
    if (url.pathname === '/api/chat/health') {
      return request.method === 'GET' ? json({ ok: true, configured: Boolean(env.NINEROUTER_TOKEN) }) : error('Método não permitido.', 405);
    }
    if (url.pathname === '/api/chat') {
      return request.method === 'POST' ? chat(request, env, ctx) : error('Método não permitido.', 405);
    }
    if (url.pathname === '/api/doar') {
      return request.method === 'POST' ? startDonation(request, env) : error('Método não permitido.', 405);
    }
    if (url.pathname === '/api/asaas/webhook') {
      return request.method === 'POST' ? asaasWebhook(request, env) : error('Método não permitido.', 405);
    }
    if (url.pathname === '/api/hit') return request.method === 'POST' ? handleHit(request, env) : error('Método não permitido.', 405);
    if (url.pathname === '/api/stats/public') return request.method === 'GET' ? publicStats(env) : error('Método não permitido.', 405);
    if (url.pathname.startsWith('/api/admin/')) return adminRoute(request, env, url.pathname, url.searchParams);
    const local = /^localhost(?::\d+)?$/.test(request.headers.get('host') ?? '');
    if (!local && (url.hostname === 'www.pontape.org' || (url.hostname === 'pontape.org' && url.protocol === 'http:'))) {
      url.protocol = 'https:';
      url.hostname = 'pontape.org';
      return Response.redirect(url.toString(), 301);
    }
    const response = await env.ASSETS.fetch(request);
    const path = canonicalPath(url.pathname);
    if (request.method === 'GET' && path &&
      ((response.status === 200 && response.headers.get('content-type')?.includes('text/html')) || response.status === 304)) {
      ctx?.waitUntil(recordView(request, env, path).catch(() => { /* Analytics cannot break the page. */ }));
    }
    return response;
  },
  async scheduled(_event, env) {
    if (env.DB) await purgeOldData(env.DB);
  },
};
