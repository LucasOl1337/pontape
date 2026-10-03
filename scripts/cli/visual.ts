import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { CliError, inputPath, integer, record, str, usage, type Context } from './core.ts';

const exec = promisify(execFile);
const SIZES = [[390, 844], [1440, 667], [1920, 1080]] as const;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function benchInfo(name: string, command: string): Promise<Record<string, unknown>> {
  try {
    const { stdout } = await exec('agent-bench', [command, name], { timeout: 15_000, maxBuffer: 1024 * 1024 });
    const info: unknown = JSON.parse(stdout);
    if (!record(info)) throw new Error('Resposta inválida');
    return info;
  } catch { throw new CliError('BENCH_UNAVAILABLE', 'Não foi possível consultar a bancada. Confira agent-bench status e browser-status.'); }
}
async function checkControl(name: string) {
  const info = await benchInfo(name, 'status');
  const workspace = Number(info.workspace);
  if (workspace < 6 || workspace > 11 || !Number.isInteger(workspace) || info.control_mode !== 'agente') {
    throw new CliError('BENCH_CONTROL', 'A bancada precisa estar nos workspaces 6 a 11 e sob controle do agente.');
  }
}

class Cdp {
  socket: WebSocket;
  timeout: number;
  next = 0;
  pending = new Map<number, { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  constructor(url: string, timeout: number) {
    this.timeout = timeout;
    this.socket = new WebSocket(url);
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.id);
      if (message.error) pending.reject(new CliError('CDP_ERROR', 'O Chromium recusou a operação de captura.'));
      else pending.resolve(message.result ?? {});
    });
    this.socket.addEventListener('close', () => {
      for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new CliError('CDP_CLOSED', 'A conexão com a bancada foi encerrada.')); }
      this.pending.clear();
    });
  }
  async open() {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { this.socket.close(); reject(new CliError('CDP_TIMEOUT', 'O Chromium não respondeu.')); }, this.timeout);
      this.socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(timer); reject(new CliError('CDP_UNAVAILABLE', 'Não foi possível conectar ao Chromium da bancada.')); }, { once: true });
    });
  }
  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<Record<string, unknown>> {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new CliError('CDP_TIMEOUT', 'A captura excedeu o prazo.')); }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
}

export async function runCapture(ctx: Context): Promise<unknown> {
  const bench = str(ctx.values, 'bench')!;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(bench)) usage('Use o nome de uma bancada agent-bench.');
  let origin: URL;
  try { origin = new URL(str(ctx.values, 'base-url') ?? 'http://127.0.0.1:4321'); }
  catch { return usage('--base-url precisa ser uma origem local.'); }
  if (!['http:', 'https:'].includes(origin.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname) || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
    usage('A captura aceita apenas uma origem local, sem caminho, query ou credenciais.');
  }
  const timeout = integer(str(ctx.values, 'timeout-ms'), 30_000, 1, 120_000);
  const output = inputPath(ctx, 'out')!;
  await checkControl(bench);
  const browser = await benchInfo(bench, 'browser-status');
  if (browser.lives_in !== bench || !browser.prepared) throw new CliError('BENCH_PROFILE', 'O Chromium precisa usar o perfil próprio da bancada.');
  const endpoint = await benchInfo(bench, 'cdp');
  if (endpoint.lives_in !== bench || !endpoint.prepared) throw new CliError('BENCH_PROFILE', 'Endpoint sem vínculo com a bancada.');
  const ws = new URL(String(endpoint.webSocketDebuggerUrl));
  if (ws.protocol !== 'ws:' || ws.hostname !== '127.0.0.1') throw new CliError('BENCH_ENDPOINT', 'Endpoint CDP local inválido.');
  const cdp = new Cdp(ws.href, timeout);
  let targetId: string | undefined;
  const checks: unknown[] = [];
  const screenshots: string[] = [];
  try {
    await cdp.open();
    // The new tab belongs to this invocation; existing tabs are never resized or navigated.
    targetId = String((await cdp.send('Target.createTarget', { url: 'about:blank' })).targetId);
    const sessionId = String((await cdp.send('Target.attachToTarget', { targetId, flatten: true })).sessionId);
    const send = (method: string, params: Record<string, unknown> = {}) => cdp.send(method, params, sessionId);
    const evaluate = async <T>(expression: string): Promise<T> => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails || !record(result.result)) throw new CliError('PAGE_ERROR', 'Não foi possível ler o estado da página local.');
      return result.result.value as T;
    };
    await send('Page.enable');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await mkdir(output); // Existing evidence is never overwritten.
    const navigate = async (path: string) => {
      const url = new URL(path, origin).href;
      const result = await send('Page.navigate', { url });
      if (result.errorText) throw new CliError('PAGE_UNAVAILABLE', 'O servidor local não respondeu.');
      const deadline = Date.now() + timeout;
      while (!await evaluate<boolean>(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && !!document.querySelector('[data-escada]')`)) {
        if (Date.now() > deadline) throw new CliError('PAGE_UNAVAILABLE', 'A home ou /dev/vitrine não carregou. Inicie pontape dev site.');
        await pause(100);
      }
      await evaluate('document.fonts.ready.then(() => true)');
      await evaluate("document.querySelector('astro-dev-toolbar')?.remove(); true");
    };
    const screenshot = async (name: string, full = false) => {
      const params: Record<string, unknown> = { format: 'png', captureBeyondViewport: full };
      if (full) {
        const size = await evaluate<{ width: number; height: number }>('({width: innerWidth, height: document.documentElement.scrollHeight})');
        params.clip = { x: 0, y: 0, ...size, scale: 1 };
      }
      const shot = await send('Page.captureScreenshot', params);
      const path = join(output, name);
      await writeFile(path, Buffer.from(String(shot.data), 'base64'), { flag: 'wx' });
      screenshots.push(path);
    };
    for (const [width, height] of SIZES) {
      await checkControl(bench);
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await navigate('/');
      const initial = await evaluate<{ title: number; stair: number }>('({title: document.querySelector(".stage-title").getBoundingClientRect().top, stair: document.querySelector(".stair").getBoundingClientRect().top})');
      for (let step = 0; step < 9; step++) {
        await checkControl(bench);
        await evaluate(`document.querySelector('#degrau-tab-${step}').click(); scrollTo(0, 0); true`);
        await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))');
        const metrics = await evaluate<Record<string, unknown>>(`(() => {
          const q = s => document.querySelector(s), rect = s => q(s).getBoundingClientRect();
          const panel = rect('.panels'), stair = rect('.stair');
          const names = [...document.querySelectorAll('.tread-name')].map(n => n.getBoundingClientRect()).filter(r => r.width > 1);
          return {
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            panelScroll: q('.panels').scrollHeight > q('.panels').clientHeight + 2,
            overlap: panel.left < stair.right - 1 && panel.right > stair.left + 1 && panel.top < stair.bottom - 1 && panel.bottom > stair.top + 1,
            railBottom: rect('.rail').bottom,
            titleTop: rect('.stage-title').top, stairTop: stair.top,
            labelSpread: names.length ? Math.max(...names.map(r => r.top)) - Math.min(...names.map(r => r.top)) : 0,
            labelsOverlapRail: names.some(r => r.bottom > rect('.rail').top + 1),
            selected: q('#degrau-tab-${step}').getAttribute('aria-selected') === 'true',
            activePanels: document.querySelectorAll('.panel.is-active').length
          };
        })()`);
        const failures: string[] = [];
        for (const key of ['horizontalOverflow', 'panelScroll', 'overlap', 'labelsOverlapRail']) if (metrics[key]) failures.push(key);
        if (!metrics.selected || metrics.activePanels !== 1) failures.push('selection');
        if (Math.abs(Number(metrics.titleTop) - initial.title) > 1 || Math.abs(Number(metrics.stairTop) - initial.stair) > 1) failures.push('layout-shift');
        if (Number(metrics.labelSpread) > 1) failures.push('labels');
        if (width >= 1180 && step === 0 && Number(metrics.railBottom) > height) failures.push('stairs-clipped');
        checks.push({ width, height, step, ...metrics, failures });
        if ([0, 1, 8].includes(step)) await screenshot(`home-${width}x${height}-s${step}.png`);
      }
      await navigate('/dev/vitrine');
      await screenshot(`vitrine-${width}x${height}.png`, true);
    }
    const failed = checks.filter(check => record(check) && Array.isArray(check.failures) && check.failures.length);
    const report = { origin: origin.origin, bench, screenshots, checks, failed: failed.length };
    await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    if (failed.length) throw new CliError('VISUAL_LAYOUT', 'As capturas encontraram desalinhamento. Confira report.json e os PNGs.', 1, { output, failed: failed.length });
    return { output, screenshots, checkedStates: checks.length, failed: 0 };
  } finally {
    if (targetId && cdp.socket.readyState === WebSocket.OPEN) await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
    cdp.socket.close();
  }
}
