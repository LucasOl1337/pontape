import { CHAT_MODELS, YUMI_SYSTEM } from './yumi.js';
/* global Response, URL, crypto, TextEncoder, fetch */

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

async function chat(request, env) {
  if (!env.NINEROUTER_TOKEN) return error('Yumi está indisponível agora.', 503);
  if (!env.CHAT_RATE_LIMITER) return error('Yumi está indisponível agora.', 503);
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

  const ip = request.headers.get('CF-Connecting-IP') ?? 'desconhecido';
  const key = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
  const { success } = await env.CHAT_RATE_LIMITER.limit({ key });
  if (!success) return error('A Yumi precisa de um tempo. Tente de novo em um minuto.', 429);

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
      return new Response(upstream.body, {
        headers: {
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-store, no-transform',
          'x-content-type-options': 'nosniff',
        },
      });
    }
    await upstream.body?.cancel();
  }
  return error('A Yumi não conseguiu responder agora. Tente daqui a pouco.', 502);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/chat/health') {
      return request.method === 'GET' ? json({ ok: true, configured: Boolean(env.NINEROUTER_TOKEN) }) : error('Método não permitido.', 405);
    }
    if (url.pathname === '/api/chat') {
      return request.method === 'POST' ? chat(request, env) : error('Método não permitido.', 405);
    }
    const local = /^localhost(?::\d+)?$/.test(request.headers.get('host') ?? '');
    if (!local && (url.hostname === 'www.pontape.org' || (url.hostname === 'pontape.org' && url.protocol === 'http:'))) {
      url.protocol = 'https:';
      url.hostname = 'pontape.org';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
