import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './worker.js';
import { handleHit, publicStats, recordView, readAnswer } from './worker-metrics.js';
import { adminRoute } from './worker-admin.js';

const chatId = '5f0f6fa2-3d77-43f1-96fb-8a51b1f43157';
const request = (path: string, body?: unknown, headers: Record<string, string> = {}) => new Request(`http://localhost${path}`, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '192.0.2.34', 'user-agent': 'Teste Navegador', ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
});

afterEach(() => vi.unstubAllGlobals());

describe('coleta e privacidade', () => {
  it('recusa kind fora da lista fechada antes de escrever', async () => {
    const db = { prepare: vi.fn() };
    const result = await handleHit(request('/api/hit', { kind: 'email', path: '/' }), {
      DB: db, SESSION_SECRET: 'local-test', HIT_RATE_LIMITER: { limit: vi.fn() },
    });
    expect(result.status).toBe(400);
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('registra a abertura da Yume com o identificador novo', async () => {
    const run = vi.fn().mockResolvedValue({});
    const bind = vi.fn().mockReturnValue({ run });
    const db = { prepare: vi.fn().mockReturnValue({ bind }) };
    const env = { DB: db, SESSION_SECRET: 'local-test', HIT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } };
    const accepted = await handleHit(request('/api/hit', { kind: 'yume_open', path: '/' }), env);
    const oldName = await handleHit(request('/api/hit', { kind: 'yumi_open', path: '/' }), env);
    expect(accepted.status).toBe(204);
    expect(bind).toHaveBeenCalledWith(expect.any(String), 'yume_open', '/', '');
    expect(oldName.status).toBe(400);
    expect(run).toHaveBeenCalledOnce();
  });

  it('só conta view ao servir HTML, nunca pelo beacon do cliente', async () => {
    const db = { prepare: vi.fn() };
    const result = await handleHit(request('/api/hit', { kind: 'view', path: '/' }), {
      DB: db, SESSION_SECRET: 'local-test', HIT_RATE_LIMITER: { limit: vi.fn() },
    });
    expect(result.status).toBe(204);
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('grava só hash diário na tabela de pessoas', async () => {
    const statements: { sql: string; values: unknown[] }[] = [];
    const db = {
      prepare: (sql: string) => ({ bind: (...values: unknown[]) => {
        const statement = { sql, values };
        statements.push(statement);
        return statement;
      } }),
      batch: vi.fn().mockResolvedValue([]),
    };
    await recordView(request('/'), { DB: db, SESSION_SECRET: 'local-test' }, '/');
    expect(db.batch).toHaveBeenCalledOnce();
    const unique = statements.find(item => item.sql.includes('uniques'))!;
    expect(unique.values[1]).toMatch(/^[0-9a-f]{32}$/);
    expect(JSON.stringify(statements)).not.toContain('192.0.2.34');
    expect(JSON.stringify(statements)).not.toContain('Teste Navegador');
  });

  it('conta uma nova entrada mesmo quando o HTML vem do cache com 304', async () => {
    const waits: Promise<unknown>[] = [];
    const db = {
      prepare: () => ({ bind: () => ({}) }),
      batch: vi.fn().mockResolvedValue([]),
    };
    const result = await worker.fetch(request('/'), {
      ASSETS: { fetch: async () => new Response(null, { status: 304 }) }, DB: db, SESSION_SECRET: 'local-test',
    }, { waitUntil: (promise: Promise<unknown>) => waits.push(promise) });
    await Promise.all(waits);
    expect(result.status).toBe(304);
    expect(db.batch).toHaveBeenCalledOnce();
  });

  it('não manda mensagem pessoal ao modelo nem ao banco', async () => {
    const db = { prepare: vi.fn(), batch: vi.fn() };
    const gateway = vi.fn();
    vi.stubGlobal('fetch', gateway);
    const result = await worker.fetch(request('/api/chat', {
      chatId, messages: [{ role: 'user', content: 'Meu CPF é 123.456.789-00' }],
    }), { DB: db, NINEROUTER_TOKEN: 'test', CHAT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) } });
    expect(result.headers.get('x-yumi-private')).toBe('1');
    expect(gateway).not.toHaveBeenCalled();
    expect(db.prepare).not.toHaveBeenCalled();
    expect(db.batch).not.toHaveBeenCalled();
  });

  it('devolve apenas seis números agregados em stats/public', async () => {
    const db = { prepare: () => ({ bind: () => ({ first: async () => ({ total: 3 }) }) }) };
    const result = await publicStats({ DB: db });
    const body = await result.json() as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['conversations', 'peopleSevenDays', 'peopleToday', 'sealChecks', 'stepsOpened', 'visits']);
    expect(Object.values(body)).toEqual([3, 3, 3, 3, 3, 3]);
    expect(result.headers.get('cache-control')).toContain('60');
  });

  it('reconhece o fim do streaming real do gateway sem marcador DONE', async () => {
    const sse = 'data: {"choices":[{"delta":{"content":"Olá"},"finish_reason":null}]}\n\n' +
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n';
    expect(await readAnswer(new Response(sse).body!)).toBe('Olá');
  });
});

describe('acesso ao painel', () => {
  const db = { prepare: () => ({ bind: () => ({ first: async () => ({ count: 1 }), run: async () => ({}) }) }) };
  const env = { DB: db, ADMIN_USER: 'dono', ADMIN_PASSWORD: 'senha-local', SESSION_SECRET: 'segredo-local' };

  it('usa a mesma resposta se o usuário ou a senha estiver errada', async () => {
    const wrongUser = await adminRoute(request('/api/admin/login', { user: 'outro', password: 'senha-local' }), env, '/api/admin/login', new URLSearchParams());
    const wrongPassword = await adminRoute(request('/api/admin/login', { user: 'dono', password: 'outra' }), env, '/api/admin/login', new URLSearchParams());
    expect(wrongUser.status).toBe(401);
    expect(wrongPassword.status).toBe(401);
    expect(await wrongUser.text()).toBe(await wrongPassword.text());
  });

  it('recusa cookie forjado sem consultar o banco', async () => {
    const prepare = vi.fn();
    const result = await adminRoute(request('/api/admin/stats', undefined, { cookie: `pontape_admin=${Date.now() + 3600000}.${'0'.repeat(64)}` }),
      { ...env, DB: { prepare } }, '/api/admin/stats', new URLSearchParams());
    expect(result.status).toBe(401);
    expect(prepare).not.toHaveBeenCalled();
  });
});
