import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { ALIMENTA_TIMEOUT_MS } from './worker.js';

// The proxy /api/alimenta/* to the Rede Alimenta API (Q4 of round 6). Exact cases, fictitious data.
const ORIGIN = 'https://api-ficticia.example';
const env = (origin: string | undefined = ORIGIN) => ({ ALIMENTA_API_ORIGIN: origin, ASSETS: { fetch: vi.fn() } });
const call = (path: string, init: RequestInit = {}) => new Request(`https://pontape.org/api/alimenta/${path}`, init);
const sentTo = (upstream: ReturnType<typeof vi.fn>) => {
  const [url, init] = upstream.mock.calls[0] as [string, RequestInit & { headers: Record<string, string> }];
  return { url, init, headers: init.headers };
};

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Proxy da Rede Alimenta no Worker', () => {
  it('repassa método, corpo, Authorization e IP, e não leva cookie nem query', async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({ id: 'doacao-ficticia-1' }, { status: 201 }));
    vi.stubGlobal('fetch', upstream);
    const body = JSON.stringify({ category: 'dry_goods', kg: 12.5 });
    const result = await worker.fetch(call('donations?x=1', {
      method: 'POST', body,
      headers: { 'content-type': 'application/json', authorization: 'Bearer jwt.ficticio.1', cookie: 'pontape_admin=segredo',
        'CF-Connecting-IP': '192.0.2.7', 'x-outro': 'nao-vai' },
    }), env());
    expect(result.status).toBe(201);
    expect(await result.json()).toEqual({ id: 'doacao-ficticia-1' });
    expect(result.headers.get('cache-control')).toBe('no-store');
    const { url, init, headers } = sentTo(upstream);
    expect(url).toBe(`${ORIGIN}/donations`);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(body);
    expect(init.redirect).toBe('manual');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(headers).toEqual({ accept: 'application/json', 'user-agent': 'pontape-alimenta',
      authorization: 'Bearer jwt.ficticio.1', 'x-forwarded-for': '192.0.2.7', 'content-type': 'application/json' });
  });

  it('só aceita a lista fechada de rotas e métodos', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    expect((await worker.fetch(call('ops/sweep', { method: 'POST' }), env())).status).toBe(404);
    expect((await worker.fetch(call('ngos/me/route'), env())).status).toBe(404);
    expect((await worker.fetch(call('donations/..%2Fops/cancel', { method: 'POST' }), env())).status).toBe(404);
    expect((await worker.fetch(call('donations/mine', { method: 'DELETE' }), env())).status).toBe(405);
    expect((await worker.fetch(call('legal/outro'), env())).status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('sem ALIMENTA_API_ORIGIN responde 503 sem chamar ninguém', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    const result = await worker.fetch(call('health'), env(''));
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ error: 'A Rede Alimenta ainda não está ligada.' });
    expect(upstream).not.toHaveBeenCalled();
  });

  it('recusa Authorization fora do formato Bearer e corpo grande ou fora de JSON', async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal('fetch', upstream);
    await worker.fetch(call('me', { headers: { authorization: 'Basic dXNlcjpzZW5oYQ==' } }), env());
    expect(sentTo(upstream).headers.authorization).toBeUndefined();
    const big = await worker.fetch(call('donations', { method: 'POST', body: 'a'.repeat(16_001), headers: { 'content-type': 'application/json' } }), env());
    expect(big.status).toBe(413);
    const form = await worker.fetch(call('auth/code', { method: 'POST', body: 'email=x', headers: { 'content-type': 'application/x-www-form-urlencoded' } }), env());
    expect(form.status).toBe(415);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it('erro da API em JSON passa como está (401, 403, 422, 503)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ detail: 'cadastro fechado' }, { status: 403 })));
    const result = await worker.fetch(call('donors', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } }), env());
    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ detail: 'cadastro fechado' });
  });

  it('API fora do ar, página de erro HTML ou redirecionamento viram 502 com frase curta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const down = await worker.fetch(call('health'), env());
    expect(down.status).toBe(502);
    expect(await down.json()).toEqual({ error: 'O servidor da Rede Alimenta não respondeu. Tente de novo em um minuto.' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502, headers: { 'content-type': 'text/html' } })));
    const html = await worker.fetch(call('health'), env());
    expect(html.status).toBe(502);
    expect(await html.text()).not.toContain('<html>');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 302, headers: { location: 'https://outro.example' } })));
    expect((await worker.fetch(call('health'), env())).status).toBe(502);
  });

  it('espera até 60 s o Render acordar e depois devolve 502', async () => {
    expect(ALIMENTA_TIMEOUT_MS).toBe(60_000);
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      if (init.signal?.aborted) reject(init.signal.reason);
      init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
    })));
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => AbortSignal.abort(new DOMException('tempo', 'TimeoutError')));
    const result = await worker.fetch(call('health'), env());
    expect(timeout).toHaveBeenCalledWith(60_000);
    expect(result.status).toBe(502);
    expect(await result.json()).toEqual({ error: 'O servidor da Rede Alimenta demorou demais pra acordar. Tente de novo.' });
    timeout.mockRestore();
  });

  it('repassa o texto do termo como texto e o 204 de apagar a conta', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('# Termo', { headers: { 'content-type': 'text/plain; charset=utf-8' } })));
    const terms = await worker.fetch(call('legal/donation_terms'), env());
    expect(terms.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await terms.text()).toBe('# Termo');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const gone = await worker.fetch(call('me', { method: 'DELETE', headers: { authorization: 'Bearer jwt.ficticio.2' } }), env());
    expect(gone.status).toBe(204);
  });
});

describe('alimenta.pontape.org', () => {
  const assetsEnv = () => {
    const fetch = vi.fn().mockResolvedValue(new Response('<html></html>', { headers: { 'content-type': 'text/html' } }));
    return { env: { ALIMENTA_API_ORIGIN: ORIGIN, ASSETS: { fetch } }, fetch };
  };
  it('mostra a página da Rede Alimenta na raiz, sem redirecionar', async () => {
    const { env: e, fetch } = assetsEnv();
    const result = await worker.fetch(new Request('https://alimenta.pontape.org/'), e);
    expect(result.status).toBe(200);
    expect(new URL((fetch.mock.calls[0]?.[0] as Request).url).pathname).toBe('/alimenta/');
  });
  it('serve as páginas e os arquivos da Rede Alimenta no próprio endereço', async () => {
    const { env: e, fetch } = assetsEnv();
    for (const path of ['/alimenta/distribuidores/', '/_astro/site.js', '/favicon.svg']) {
      const result = await worker.fetch(new Request(`https://alimenta.pontape.org${path}`), e);
      expect(result.status).toBe(200);
    }
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('manda o resto do site pro pontape.org e o http pro https', async () => {
    const { env: e } = assetsEnv();
    const other = await worker.fetch(new Request('https://alimenta.pontape.org/transparencia/'), e);
    expect(other.status).toBe(301);
    expect(other.headers.get('location')).toBe('https://pontape.org/transparencia/');
    const http = await worker.fetch(new Request('http://alimenta.pontape.org/alimenta/doar/'), e);
    expect(http.headers.get('location')).toBe('https://alimenta.pontape.org/alimenta/doar/');
  });
  it('a API continua passando pelo proxy no subdomínio', async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({ status: 'ok' }));
    vi.stubGlobal('fetch', upstream);
    const result = await worker.fetch(new Request('https://alimenta.pontape.org/api/alimenta/health'), env());
    expect(result.status).toBe(200);
    expect(sentTo(upstream).url).toBe(`${ORIGIN}/health`);
  });
});
