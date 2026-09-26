import process from 'node:process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { CliError, ROOT, integer, jsonInput, record, stdinText, str, usage, type Context } from './core.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function baseUrl(ctx: Context): string {
  let url: URL;
  try { url = new URL(str(ctx.values, 'base-url') ?? process.env.PONTAPE_BASE_URL ?? 'http://127.0.0.1:8794'); }
  catch { return usage('--base-url deve ser uma origem HTTP válida.'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    usage('Use uma origem HTTPS sem caminho/credencial, ou HTTP em loopback para desenvolvimento.');
  }
  return url.origin;
}

async function request(ctx: Context, path: string, init: RequestInit = {}): Promise<Response> {
  const origin = baseUrl(ctx);
  const timeout = integer(str(ctx.values, 'timeout-ms'), 30_000, 1, 3_600_000);
  try {
    const headers = new Headers(init.headers);
    headers.set('user-agent', 'pontape-cli/1');
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    const response = await fetch(new URL(path, origin), { ...init, headers, redirect: 'manual', signal: AbortSignal.timeout(timeout) });
    if (!response.ok) {
      await response.body?.cancel();
      const exitCode = [401, 403].includes(response.status) ? 3 : response.status === 404 ? 4 : 1;
      throw new CliError(`HTTP_${response.status}`, `A origem respondeu HTTP ${response.status}.`, exitCode,
        { status: response.status, path, retryAfter: response.headers.get('retry-after') });
    }
    return response;
  } catch (error) { return networkError(error); }
}
function networkError(error: unknown): never {
  if (error instanceof CliError) throw error;
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) throw new CliError('TIMEOUT', 'O prazo acabou. Nenhuma tentativa automática foi feita.', 5);
  throw new CliError('NETWORK', 'Não foi possível concluir a chamada HTTP. Confira a origem e o servidor.', 5);
}
async function responseText(response: Response, limit = 32 * 1024 * 1024): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder(); let text = ''; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new CliError('RESPONSE_TOO_LARGE', 'Resposta excede o limite.'); }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) { return networkError(error); }
  finally { reader.releaseLock(); }
}
async function responseJson(response: Response): Promise<unknown> {
  if (response.status === 204) return { accepted: true };
  const raw = await responseText(response);
  try { return JSON.parse(raw); } catch { throw new CliError('INVALID_RESPONSE', 'A origem não retornou JSON válido.'); }
}
export async function getText(ctx: Context, path: string): Promise<string> { return responseText(await request(ctx, path)); }
export async function getJson(ctx: Context, path: string): Promise<unknown> { return responseJson(await request(ctx, path)); }
function post(body: unknown, extra: Record<string, string> = {}): RequestInit {
  return { method: 'POST', headers: { 'content-type': 'application/json', ...extra }, body: JSON.stringify(body) };
}

function sessionPath(ctx: Context): string {
  const directory = resolve(process.env.PONTAPE_STATE_DIR ?? join(process.env.XDG_STATE_HOME ?? join(homedir(), '.local/state'), 'pontape'));
  const sharedRoot = ROOT.split('/.worktrees/')[0]!;
  const relation = relative(sharedRoot, directory);
  if (relation !== '..' && !relation.startsWith('../') && !isAbsolute(relation)) usage('PONTAPE_STATE_DIR deve ficar fora do repositório.');
  return join(directory, `${createHash('sha256').update(baseUrl(ctx)).digest('hex')}.json`);
}
interface Session { origin: string; cookie: string; expiresAt: number }
async function loadSession(ctx: Context): Promise<Session> {
  let session: unknown;
  try { session = JSON.parse(await readFile(sessionPath(ctx), 'utf8')); }
  catch { throw new CliError('AUTH_REQUIRED', 'Entre com auth login para esta origem.', 3); }
  if (!record(session) || session.origin !== baseUrl(ctx) || typeof session.cookie !== 'string'
    || !/^pontape_admin=\d{10,13}\.[0-9a-f]{64}$/.test(session.cookie)
    || typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) {
    throw new CliError('AUTH_EXPIRED', 'Sessão inválida ou expirada. Use auth login.', 3);
  }
  return session as unknown as Session;
}
async function saveSession(ctx: Context, response: Response): Promise<unknown> {
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  const match = /^pontape_admin=(\d{10,13})\.[0-9a-f]{64}$/.exec(cookie ?? '');
  if (!cookie || !match || Number(match[1]) <= Date.now()) throw new CliError('INVALID_SESSION', 'O servidor não forneceu uma sessão válida.');
  const path = sessionPath(ctx);
  await mkdir(resolve(path, '..'), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ origin: baseUrl(ctx), cookie, expiresAt: Number(match[1]) }), { mode: 0o600, flag: 'wx' });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
  return { authenticated: true, origin: baseUrl(ctx), expiresAt: new Date(Number(match[1])).toISOString() };
}

export async function runHttp(ctx: Context): Promise<unknown> {
  const { values } = ctx;
  const name = ctx.command.name;
  if (name === 'chat health') return getJson(ctx, '/api/chat/health');
  if (name === 'metrics public') return getJson(ctx, '/api/stats/public');
  if (name === 'auth login') {
    const user = str(values, 'user') ?? process.env.PONTAPE_ADMIN_USER;
    const password = values['password-stdin'] ? (await stdinText(1024)).replace(/\r?\n$/, '') : process.env.PONTAPE_ADMIN_PASSWORD;
    if (!user || !password) usage('Use --user/PONTAPE_ADMIN_USER e --password-stdin/PONTAPE_ADMIN_PASSWORD.');
    if (user.length > 320 || password.length > 512 || Buffer.byteLength(JSON.stringify({ user, password })) > 1024) usage('Credenciais excedem o limite da API.');
    // Validate destination of session storage before authenticating.
    sessionPath(ctx);
    const response = await request(ctx, '/api/admin/login', post({ user, password }));
    await responseJson(response);
    return saveSession(ctx, response);
  }
  if (name.startsWith('admin ') || name === 'auth session' || name === 'auth logout') {
    let session: Session;
    try { session = await loadSession(ctx); }
    catch (error) {
      if (name !== 'auth logout') throw error;
      await rm(sessionPath(ctx), { force: true });
      return { authenticated: false, localSessionRemoved: true };
    }
    const headers = { cookie: session.cookie };
    if (name === 'auth logout') {
      try { await responseJson(await request(ctx, '/api/admin/logout', { method: 'POST', headers })); }
      catch (error) { if (!(error instanceof CliError && error.code === 'HTTP_401')) throw error; }
      await rm(sessionPath(ctx), { force: true });
      return { authenticated: false, localSessionRemoved: true };
    }
    let path = name === 'auth session' ? '/api/admin/session' : '/api/admin/stats';
    if (name === 'admin chats') path = `/api/admin/chats?page=${integer(str(values, 'page'), 1, 1, 9999)}`;
    if (name === 'admin chat') {
      const id = str(values, 'id')!;
      if (!UUID.test(id)) usage('--id deve ser UUID v4.');
      path = `/api/admin/chats/${id}`;
    }
    return responseJson(await request(ctx, path, { headers }));
  }
  if (name === 'chat ask') {
    if (Boolean(values.message) === Boolean(values.input)) usage('Use exatamente uma opção: --message ou --input.');
    const body = values.input ? await jsonInput(ctx) : { messages: [{ role: 'user', content: values.message }] };
    if (!record(body) || Object.keys(body).some(key => !['messages', 'chatId'].includes(key))) usage('Use JSON {messages, chatId?}.');
    if (values['chat-id']) {
      if (body.chatId !== undefined) usage('Forneça chatId apenas no JSON ou em --chat-id.');
      body.chatId = values['chat-id'];
    }
    if (body.chatId !== undefined && (typeof body.chatId !== 'string' || !UUID.test(body.chatId))) usage('chatId deve ser UUID v4.');
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 12 || messages.at(-1)?.role !== 'user'
      || !messages.every((message, index) => record(message)
        && Object.keys(message).every(key => ['role', 'content'].includes(key))
        && message.role === (index % 2 === (messages.length - 1) % 2 ? 'user' : 'assistant')
        && typeof message.content === 'string' && message.content.trim().length > 0 && message.content.length <= 600)) {
      usage('Envie até 12 falas alternadas de 1 a 600 caracteres, terminando em user.');
    }
    const response = await request(ctx, '/api/chat', post(body, { accept: 'text/event-stream' }));
    if (!response.headers.get('content-type')?.includes('text/event-stream')) {
      await response.body?.cancel(); throw new CliError('INVALID_STREAM', 'O chat não retornou SSE.');
    }
    const raw = (await responseText(response, 1024 * 1024)).replace(/\r\n/g, '\n');
    let answer = ''; let completed = false;
    for (const event of raw.split('\n\n')) {
      const data = event.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
      if (data === '[DONE]') { completed = true; continue; }
      if (!data) continue;
      let parsed;
      try { parsed = JSON.parse(data); } catch { throw new CliError('INVALID_STREAM', 'Evento SSE inválido.'); }
      if (parsed.error) throw new CliError('UPSTREAM_ERROR', 'O provedor retornou um erro durante a resposta.');
      const choice = parsed.choices?.[0];
      if (choice?.finish_reason === 'stop') completed = true;
      if (typeof choice?.delta?.content === 'string') answer += choice.delta.content;
    }
    if (!completed || !answer.trim()) throw new CliError('INCOMPLETE_STREAM', 'A resposta terminou incompleta. Nenhuma repetição automática foi feita.');
    return { answer: answer.trim(), chatId: body.chatId ?? null, private: response.headers.get('x-yumi-private') === '1' };
  }
  let path: string;
  let body: unknown;
  const headers: Record<string, string> = {};
  if (name === 'donation checkout') {
    path = '/api/doar'; body = { amountCents: Number(values['amount-cents']) };
  } else if (name === 'donation webhook') {
    path = '/api/asaas/webhook'; body = await jsonInput(ctx);
    const { envelopesFromWebhook } = await import('../../src/lib/ledger/asaas.ts');
    if (!envelopesFromWebhook(body).ok) usage('Webhook fora do contrato Asaas.');
    if (values.apply) {
      const token = process.env.PONTAPE_WEBHOOK_TOKEN;
      if (!token) usage('Defina PONTAPE_WEBHOOK_TOKEN para enviar.');
      headers['asaas-access-token'] = token;
    }
  } else if (name === 'metrics hit') {
    path = '/api/hit'; body = await jsonInput(ctx);
    const { canonicalPath } = await import('../deploy/worker-metrics.js');
    if (!record(body) || Object.keys(body).some(key => !['kind', 'path', 'target'].includes(key))
      || !['view', 'step', 'seal', 'yume_open', 'share', 'link'].includes(String(body.kind)) || !canonicalPath(body.path)) usage('Evento de métrica fora do contrato.');
    const target = body.target ?? '';
    const valid = typeof target === 'string' && (body.kind === 'step' ? /^[0-8]$/.test(target)
      : body.kind === 'link' ? ['github', 'linkedin', 'x', 'transparencia', 'construir', 'perguntas', 'contato', 'tecnico'].includes(target) : target === '');
    if (!valid) usage('Alvo da métrica inválido.');
  } else { return usage('Comando HTTP desconhecido.'); }
  if (!values.apply) return { dryRun: true, method: 'POST', origin: baseUrl(ctx), path, note: 'Entrada validada; nenhuma chamada enviada. Use --apply.' };
  return responseJson(await request(ctx, path, post(body, headers)));
}
