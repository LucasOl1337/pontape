import process from 'node:process';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { join, resolve, extname, sep } from 'node:path';
import { CliError, CONTRACT_VERSION, ROOT, integer, str, type Context } from './core.ts';
import { runChild } from './process.ts';

/** Minimal D1 adapter over real SQLite, for the same statements used by the Worker. */
function d1(database: DatabaseSync) {
  const prepare = (sql: string) => {
    const statement = database.prepare(sql);
    const bound = (values: SQLInputValue[] = []) => ({
      bind: (...args: SQLInputValue[]) => bound(args),
      first: async () => statement.get(...values) ?? null,
      all: async () => ({ results: statement.all(...values) }),
      run: () => { const result = statement.run(...values); return { meta: { changes: Number(result.changes) } }; },
    });
    return bound();
  };
  return {
    prepare,
    batch: (statements: ReturnType<typeof prepare>[]) => {
      database.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(statement.run());
        database.exec('COMMIT'); return results;
      } catch (error) { database.exec('ROLLBACK'); throw error; }
    },
  };
}

async function assets(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname;
  const ledgerFiles: Record<string, string> = {
    '/livro/ledger.json': 'ledger.json', '/livro/trust.json': 'trust.json',
    '/livro/checkpoint-signed.json': 'checkpoint-signed.json',
  };
  if (ledgerFiles[path]) return new Response(await readFile(join(ROOT, 'src/data/ledger', ledgerFiles[path])), { headers: { 'content-type': 'application/json' } });
  if (path === '/livro/events.json' || path === '/livro/checkpoint.json') {
    const document = JSON.parse(await readFile(join(ROOT, 'src/data/ledger/ledger.json'), 'utf8'));
    return Response.json(path.endsWith('events.json') ? document.events : document.checkpoint);
  }
  const root = join(ROOT, 'dist');
  const target = resolve(root, '.' + decodeURIComponent(path));
  if (target !== root && !target.startsWith(root + sep)) return new Response(null, { status: 404 });
  try {
    const file = extname(target) ? target : join(target, 'index.html');
    const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
    return new Response(await readFile(file), { headers: { 'content-type': types[extname(file)] ?? 'application/octet-stream' } });
  } catch {
    if (path === '/') return new Response('<!doctype html><html lang="pt-BR"><title>PontaPé fictício</title><p>Ambiente fictício do CLI. Rode pontape build para servir o site completo.</p></html>', { headers: { 'content-type': 'text/html' } });
    return new Response(null, { status: 404 });
  }
}

export async function runMock(ctx: Context): Promise<unknown> {
  const port = integer(str(ctx.values, 'port'), 8794, 0, 65535);
  await runChild({ program: process.execPath, args: ['scripts/generate-yumi-knowledge.mjs'] });
  const worker = (await import('../deploy/worker.js')).default;
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  for (const migration of (await readdir(join(ROOT, 'scripts/deploy/migrations'))).filter(name => name.endsWith('.sql')).sort()) {
    database.exec(await readFile(join(ROOT, 'scripts/deploy/migrations', migration), 'utf8'));
  }
  const db = d1(database);
  const originalFetch = globalThis.fetch;
  const dispatched: unknown[] = [];
  let checkouts = 0;
  // This process serves only the explicit mock command. No request can reach a provider.
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url === 'https://9router-production-056a.up.railway.app/v1/chat/completions') {
      const content = 'Resposta fictícia da Yume para testar o CLI. Nenhum modelo externo foi chamado.';
      return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`, { headers: { 'content-type': 'text/event-stream' } });
    }
    if (url === 'https://api-sandbox.asaas.com/v3/checkouts') {
      checkouts += 1; return Response.json({ id: `checkout_ficticio_${checkouts}` });
    }
    if (url === 'https://api.github.com/repos/LucasOl1337/pontape/actions/workflows/ledger-ingest.yml/dispatches') {
      dispatched.push(JSON.parse(String(init?.body))); return new Response(null, { status: 204 });
    }
    throw new Error('Rede externa desabilitada no ambiente fictício.');
  };
  const limiter = { limit: async () => ({ success: true }) };
  const env = {
    DB: db, ASSETS: { fetch: assets }, ADMIN_USER: 'admin-ficticio', ADMIN_PASSWORD: 'senha-ficticia',
    SESSION_SECRET: 'segredo-exclusivo-do-ambiente-ficticio', NINEROUTER_TOKEN: 'token-ficticio',
    CHAT_RATE_LIMITER: limiter, HIT_RATE_LIMITER: limiter, DONATIONS_OPEN: '1',
    ASAAS_SANDBOX_KEY: 'asaas-ficticio', ASAAS_WEBHOOK_TOKEN: 'webhook-ficticio', LEDGER_DISPATCH_TOKEN: 'dispatch-ficticio',
  };
  const server = createServer(async (incoming, outgoing) => {
    try {
      let size = 0; const chunks: Buffer[] = [];
      for await (const chunk of incoming) {
        size += chunk.length;
        if (size > 32 * 1024) { outgoing.writeHead(413).end(); return; }
        chunks.push(Buffer.from(chunk));
      }
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      headers.set('cf-connecting-ip', '192.0.2.10');
      const method = incoming.method ?? 'GET';
      const request = new Request(`http://127.0.0.1${incoming.url ?? '/'}`, {
        method, headers, ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) }),
      });
      const pending: Promise<unknown>[] = [];
      const response = new URL(request.url).pathname === '/__mock/state'
        ? Response.json({ fictitious: true, checkouts, dispatched })
        : await worker.fetch(request, env, { waitUntil: (promise: Promise<unknown>) => pending.push(promise) });
      const body = await response.arrayBuffer();
      await Promise.all(pending);
      const responseHeaders = Object.fromEntries(response.headers);
      responseHeaders['x-pontape-environment'] = 'mock';
      outgoing.writeHead(response.status, responseHeaders);
      outgoing.end(Buffer.from(body));
    } catch {
      if (!outgoing.headersSent) outgoing.writeHead(500, { 'content-type': 'application/json' });
      outgoing.end(JSON.stringify({ error: 'Falha no ambiente fictício.' }));
    }
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject); server.listen(port, '127.0.0.1', () => { server.off('error', reject); resolve(); });
    });
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    const ready = { state: 'ready', fictitious: true, baseUrl: `http://127.0.0.1:${actualPort}`,
      adminUser: env.ADMIN_USER, adminPassword: env.ADMIN_PASSWORD, webhookToken: env.ASAAS_WEBHOOK_TOKEN,
      note: 'Credenciais fictícias. Banco em memória. Asaas, Yume e dispatch simulados. Ctrl+C encerra.' };
    if (ctx.values.json) process.stdout.write(`${JSON.stringify({ schemaVersion: CONTRACT_VERSION, ok: true, command: 'dev mock', data: ready })}\n`);
    else process.stderr.write(`${JSON.stringify(ready, null, 2)}\n`);
    await new Promise<void>(resolve => {
      const stop = () => { process.off('SIGINT', stop); process.off('SIGTERM', stop); resolve(); };
      process.once('SIGINT', stop); process.once('SIGTERM', stop);
    });
    return { state: 'stopped', fictitious: true };
  } catch { throw new CliError('MOCK_SERVER', 'Não foi possível iniciar o ambiente fictício. Confira a porta e Node 24.21.'); }
  finally {
    server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve()));
    globalThis.fetch = originalFetch; database.close();
  }
}
