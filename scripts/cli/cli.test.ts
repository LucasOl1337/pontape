import { spawn, type ChildProcess } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, type Server, type RequestListener } from 'node:http';
import { mkdtemp, readFile, readdir, rm, stat, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COMMANDS } from './catalog';
import { ROOT } from './core';
import { canonicalize } from '../../src/lib/ledger/canonical';
import { createCheckpoint } from '../../src/lib/ledger/verify';
import fixture from '../../src/data/ledger/example.fixture.json';

let directory: string;
let baseUrl: string;
let mock: ChildProcess;
const servers: Server[] = [];
const entry = join(ROOT, 'bin/pontape.mjs');

function cli(args: string[], options: { input?: string; env?: Record<string, string>; cwd?: string; entry?: string } = {}) {
  return new Promise<{ code: number | null; stdout: string; stderr: string; result: ReturnType<typeof JSON.parse> }>((resolve, reject) => {
    const child = spawn(process.execPath, [options.entry ?? entry, ...args, '--json'], {
      cwd: options.cwd ?? ROOT,
      env: { ...process.env, PONTAPE_BASE_URL: baseUrl ?? 'http://127.0.0.1:8794', PONTAPE_STATE_DIR: join(directory, 'state'), ...options.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = ''; let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), 15_000);
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.once('error', reject);
    child.once('close', code => {
      clearTimeout(timer);
      try { resolve({ code, stdout, stderr, result: JSON.parse(stdout) }); }
      catch { reject(new Error(`CLI sem JSON válido: ${stdout}\n${stderr}`)); }
    });
    child.stdin.end(options.input ?? '');
  });
}
async function localServer(listener: RequestListener): Promise<string> {
  const server = createServer(listener);
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Sem porta');
  return `http://127.0.0.1:${address.port}`;
}

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'pontape-cli-test-'));
  mock = spawn(process.execPath, [entry, 'dev', 'mock', '--port', '0', '--json'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  baseUrl = await new Promise<string>((resolve, reject) => {
    let output = ''; let errors = '';
    const timer = setTimeout(() => { mock.kill('SIGKILL'); reject(new Error('Mock não iniciou')); }, 15_000);
    mock.stderr!.on('data', data => { errors += data; });
    mock.stdout!.on('data', data => {
      output += data;
      const line = output.split('\n')[0];
      if (!line || !output.includes('\n')) return;
      try {
        const parsed = JSON.parse(line);
        if (!parsed.ok || parsed.data.state !== 'ready') throw new Error(output);
        clearTimeout(timer); resolve(parsed.data.baseUrl);
      } catch (error) { clearTimeout(timer); reject(error); }
    });
    mock.once('exit', () => { clearTimeout(timer); reject(new Error(`Mock encerrou: ${output} ${errors}`)); });
  });
}, 20_000);

afterAll(async () => {
  for (const server of servers) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
  if (mock?.exitCode === null) {
    await new Promise<void>(resolve => { mock.once('exit', () => resolve()); mock.kill('SIGTERM'); });
  }
  if (directory) await rm(directory, { recursive: true, force: true });
});

describe('descoberta e contrato do executável', () => {
  it('cada comando é descobrível e tem ajuda sem executar efeitos', async () => {
    const manifest = await cli(['capabilities']);
    expect(manifest.code).toBe(0);
    expect(manifest.result.data.commands).toHaveLength(COMMANDS.length);
    for (const command of COMMANDS) {
      const response = await cli([...command.name.split(' '), '--help']);
      expect(response.code, command.name).toBe(0);
      expect(response.result.data.commands[0].name).toBe(command.name);
    }
  }, 15_000);

  it('ajuda e descoberta funcionam em cópia sem node_modules e de outro cwd', async () => {
    const isolated = join(directory, 'isolated');
    await mkdir(join(isolated, 'scripts/cli'), { recursive: true });
    await mkdir(join(isolated, 'bin'));
    for (const file of ['main.ts', 'catalog.ts', 'core.ts', 'local.ts']) await copyFile(join(ROOT, 'scripts/cli', file), join(isolated, 'scripts/cli', file));
    await copyFile(entry, join(isolated, 'bin/pontape.mjs'));
    const result = await cli(['capabilities'], { entry: join(isolated, 'bin/pontape.mjs'), cwd: directory });
    expect(result.code).toBe(0);
    expect(result.result.data.commands.length).toBeGreaterThan(30);
  });

  it('recusa erro de digitação, flags de outro comando, repetição e valores fora do domínio', async () => {
    for (const args of [['ledgr'], ['chat', 'health', '--apply'], ['ledger', 'show'], ['ledger', 'list', '--limit', '-1'], ['test', '--suite', 'unknown'], ['chat', 'health', '--base-url', 'https://x.test', '--base-url', 'https://y.test']]) {
      const result = await cli(args);
      expect(result.code, args.join(' ')).toBe(2);
      expect(result.result).toMatchObject({ schemaVersion: 1, ok: false, error: { code: 'USAGE' } });
    }
  });

  it('consulta dados e rotas da fonte, e resolve arquivos em relação ao chamador', async () => {
    const modules = await cli(['site', 'data', '--collection', 'modules', '--id', 'M4']);
    expect(modules.result.data).toMatchObject({ id: 'M4', status: 'bottleneck' });
    const routes = await cli(['site', 'routes']);
    expect(routes.result.data).toContain('/admin');
    expect(routes.result.data).toContain('/livro/ledger.json');
    expect((await cli(['docs', 'show', '--name', '../../etc/passwd'])).code).toBe(2);
    const missing = await cli(['ledger', 'show', '--sequence', '999999']);
    expect(missing.code).toBe(4);
  });
});

describe('livro sem alterar o checkout', () => {
  it('simula, aplica e verifica o mesmo arquivo; impede sobrescrita e corrupção', async () => {
    const file = join(directory, 'ledger.json');
    const event = join(directory, 'event.json');
    const initial = canonicalize({ events: [], checkpoint: createCheckpoint([], '2000-01-01T00:00:00.000Z') });
    await writeFile(file, initial);
    await writeFile(event, JSON.stringify(fixture.payloads[2]));
    const dryRun = await cli(['ledger', 'append', '--file', 'ledger.json', '--event', 'event.json'], { cwd: directory });
    expect(dryRun.code).toBe(0);
    expect(await readFile(file, 'utf8')).toBe(initial);
    expect((await cli(['ledger', 'append', '--file', file, '--event', event, '--apply'])).code).toBe(0);
    const summary = await cli(['ledger', 'summary', '--file', file]);
    expect(summary.result.data).toMatchObject({ valid: true, eventCount: 1 });
    const listed = await cli(['ledger', 'list', '--file', file, '--limit', '1']);
    expect(listed.result.data.events).toHaveLength(1);
    const out = join(directory, 'export.json');
    expect((await cli(['ledger', 'export', '--file', file, '--out', out])).code).toBe(0);
    expect((await cli(['ledger', 'export', '--file', file, '--out', out])).result.error.code).toBe('EEXIST');
    expect(await readFile(out, 'utf8')).toBe(await readFile(file, 'utf8'));
    const damaged = JSON.parse(await readFile(file, 'utf8'));
    damaged.events[0].hash = '0'.repeat(64);
    await writeFile(file, canonicalize(damaged));
    const corrupt = await cli(['ledger', 'verify', '--file', file]);
    expect(corrupt.result).toMatchObject({ ok: false, error: { code: 'INVALID_LEDGER' } });
    expect(corrupt.code).toBe(1);
  });

  it('cria livro isolado e verifica assinatura com chave confiada sem aceitar outra chave', async () => {
    const file = join(directory, 'empty.json');
    expect((await cli(['ledger', 'init', '--out', file])).code).toBe(0);
    expect((await cli(['ledger', 'init', '--out', file])).result.error.code).toBe('EEXIST');
    const key = join(directory, 'signing-ficticio.pem');
    const signed = join(directory, 'signed-ficticio.json');
    const { privateKey } = generateKeyPairSync('ed25519');
    await writeFile(key, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 });
    expect((await cli(['ledger', 'sign', '--file', file, '--key', key, '--out', signed, '--apply'])).code).toBe(0);
    const publicKey = JSON.parse(await readFile(signed, 'utf8')).publicKey;
    const verified = await cli(['ledger', 'verify', '--file', file, '--signed', signed, '--public-key', publicKey]);
    expect(verified.result.data.signature).toMatchObject({ valid: true, coversHead: true });
    expect((await cli(['ledger', 'verify', '--file', file, '--signed', signed, '--public-key', 'b'.repeat(64)])).result.error.code).toBe('INVALID_SIGNATURE');
    expect((await cli(['ledger', 'verify', '--file', file, '--signed', signed])).code).toBe(2);
  });

  it('valida envelopes até em dry-run e preserva simulação de carimbo/assinatura', async () => {
    const bad = await cli(['ledger', 'drain', '--input', '-'], { input: '{"cpf":"FICTICIO"}' });
    expect(bad.code).toBe(2);
    const envelope = { source: 'asaas', eventId: 'pay_ficticio_cli', payload: fixture.payloads[2] };
    const simulated = await cli(['ledger', 'drain', '--input', '-'], { input: JSON.stringify(envelope) });
    expect(simulated.code).toBe(0);
    expect(simulated.result.data.stdout).toContain('DRY-RUN');
    for (const name of ['stamp', 'sign']) expect((await cli(['ledger', name])).code).toBe(0);
    expect((await cli(['ledger', 'sign', '--apply'])).code).toBe(2);
    const remote = await cli(['ledger', 'verify', '--remote']);
    expect(remote.result.data.valid).toBe(true);
    expect(remote.result.data.signature.checked).toBe(false);
    expect(remote.result.data.externalWitnessVerified).toBe(false);
  });
});

describe('Worker real por HTTP com provedores fictícios', () => {
  const chatId = '11111111-1111-4111-8111-111111111111';
  it('envia chat, lê SSE completo e preserva a proteção de dados pessoais', async () => {
    expect((await cli(['chat', 'health'])).result.data).toMatchObject({ configured: true });
    const answer = await cli(['chat', 'ask', '--message', 'Como funciona?', '--chat-id', chatId]);
    expect(answer.code).toBe(0);
    expect(answer.result.data.answer).toContain('fictícia');
    const privateMessage = await cli(['chat', 'ask', '--input', '-'], { input: JSON.stringify({ messages: [{ role: 'user', content: 'Meu CPF é 123.456.789-00' }] }) });
    expect(privateMessage.result.data.private).toBe(true);
    expect(privateMessage.result.data.answer).toContain('dados pessoais');
    expect((await cli(['chat', 'ask', '--message', 'x'.repeat(601)])).code).toBe(2);
    expect((await cli(['chat', 'ask', '--input', '-'], { input: '{broken' })).code).toBe(2);
  });

  it('admin usa login, sessão, estatísticas e histórico; logout limpa a sessão', async () => {
    expect((await cli(['admin', 'stats'])).code).toBe(3);
    const env = { PONTAPE_ADMIN_USER: 'admin-ficticio', PONTAPE_ADMIN_PASSWORD: 'errada-ficticia' };
    expect((await cli(['auth', 'login'], { env })).code).toBe(3);
    const logged = await cli(['auth', 'login', '--user', 'admin-ficticio', '--password-stdin'], { input: 'senha-ficticia\n' });
    expect(logged.code).toBe(0);
    expect(logged.stdout + logged.stderr).not.toContain('senha-ficticia');
    expect(logged.stdout + logged.stderr).not.toContain('pontape_admin=');
    const sessionFile = join(directory, 'state', (await readdir(join(directory, 'state')))[0]!);
    expect((await stat(sessionFile)).mode & 0o777).toBe(0o600);
    expect((await cli(['auth', 'session'])).code).toBe(0);
    const originalSession = await readFile(sessionFile, 'utf8');
    await writeFile(sessionFile, JSON.stringify({ ...JSON.parse(originalSession), expiresAt: 0 }));
    expect((await cli(['auth', 'session'])).result.error.code).toBe('AUTH_EXPIRED');
    await writeFile(sessionFile, originalSession);
    expect((await cli(['admin', 'stats'])).result.data.conversations).toBe(1);
    expect((await cli(['admin', 'chats', '--page', '1'])).result.data.chats[0].id).toBe(chatId);
    expect((await cli(['admin', 'chat', '--id', chatId])).result.data.messages).toHaveLength(2);
    expect((await cli(['admin', 'chats', '--page', '0'])).code).toBe(2);
    let receivedCookie: string | undefined;
    const otherOrigin = await localServer((req, res) => { receivedCookie = req.headers.cookie; res.writeHead(200).end('{}'); });
    expect((await cli(['admin', 'stats', '--base-url', otherOrigin])).code).toBe(3);
    expect(receivedCookie).toBeUndefined();
    expect((await cli(['auth', 'logout'])).code).toBe(0);
    expect(await readdir(join(directory, 'state'))).toEqual([]);
    expect((await cli(['auth', 'session'])).code).toBe(3);
  });

  it('métrica, checkout e webhook só enviam com apply e usam o contrato do Worker', async () => {
    const hit = JSON.stringify({ kind: 'seal', path: '/transparencia' });
    expect((await cli(['metrics', 'hit', '--input', '-'], { input: hit })).result.data.dryRun).toBe(true);
    const stats = await cli(['metrics', 'public']);
    expect(stats.result.data.sealChecks).toBe(0);
    expect((await cli(['metrics', 'hit', '--input', '-', '--apply'], { input: hit })).code).toBe(0);
    expect((await cli(['metrics', 'hit', '--input', '-', '--apply'], { input: '{"kind":"step","path":"/","target":"99"}' })).code).toBe(2);
    const initial = await (await fetch(`${baseUrl}/__mock/state`)).json();
    expect(initial.checkouts).toBe(0);
    expect((await cli(['donation', 'checkout', '--amount-cents', '1000'])).result.data.dryRun).toBe(true);
    expect((await (await fetch(`${baseUrl}/__mock/state`)).json()).checkouts).toBe(0);
    expect((await cli(['donation', 'checkout', '--amount-cents', '1000', '--apply'])).result.data.url).toContain('checkout_ficticio_1');
    const webhook = JSON.stringify({ event: 'PAYMENT_RECEIVED', payment: { id: 'pay_ficticio_cli', paymentDate: '2026-09-24', value: 10, netValue: 9.5, customer: 'pessoa_ficticia' } });
    expect((await cli(['donation', 'webhook', '--input', '-'], { input: webhook })).result.data.dryRun).toBe(true);
    expect((await (await fetch(`${baseUrl}/__mock/state`)).json()).dispatched).toHaveLength(0);
    const result = await cli(['donation', 'webhook', '--input', '-', '--apply'], { input: webhook, env: { PONTAPE_WEBHOOK_TOKEN: 'webhook-ficticio' } });
    expect(result.code).toBe(0);
    const final = await (await fetch(`${baseUrl}/__mock/state`)).json();
    expect(final.dispatched).toHaveLength(1);
    expect(JSON.stringify(final.dispatched)).not.toContain('pessoa_ficticia');
  });
});

describe('falhas HTTP e de processo', () => {
  it('retorna falha em timeout e não repete um POST cujo resultado é incerto', async () => {
    let calls = 0;
    const url = await localServer((_req, res) => { calls += 1; res.on('error', () => {}); });
    const result = await cli(['donation', 'checkout', '--amount-cents', '1000', '--apply', '--base-url', url, '--timeout-ms', '100']);
    expect(result.code).toBe(5);
    expect(result.result.error.code).toBe('TIMEOUT');
    expect(calls).toBe(1);
  });

  it('não segue redirect com credenciais nem expõe erro bruto da origem', async () => {
    const url = await localServer((_req, res) => res.writeHead(302, { location: baseUrl }).end('senha-privada'));
    const result = await cli(['chat', 'health', '--base-url', url]);
    expect(result.result.error.code).toBe('HTTP_302');
    expect(result.stdout + result.stderr).not.toContain('senha-privada');
    expect((await cli(['chat', 'health', '--base-url', 'http://example.com'])).code).toBe(2);
  });

  it('rejeita SSE truncado e aceita fragmentos UTF-8/CRLF com finish_reason stop', async () => {
    const truncated = await localServer((_req, res) => res.writeHead(200, { 'content-type': 'text/event-stream' }).end('data: {"choices":[{"delta":{"content":"parcial"}}]}\n\n'));
    expect((await cli(['chat', 'ask', '--message', 'teste', '--base-url', truncated])).result.error.code).toBe('INCOMPLETE_STREAM');
    const complete = await localServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const bytes = Buffer.from('data: {"choices":[{"delta":{"content":"Olá"}}]}\r\n\r\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\r\n\r\n');
      for (const byte of bytes) res.write(Buffer.from([byte]));
      res.end();
    });
    expect((await cli(['chat', 'ask', '--message', 'teste', '--base-url', complete])).result.data.answer).toBe('Olá');
  });

  it('preserva exit não zero do script e saída JSON sem banner npm', async () => {
    const result = await cli(['ledger', 'append', '--event', join(directory, 'inexistente.json')]);
    expect(result.code).toBe(1);
    expect(result.result.error.code).toBe('COMMAND_FAILED');
    expect(result.result.error.details.exitCode).toBe(1);
  });
});
