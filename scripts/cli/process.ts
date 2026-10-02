import process from 'node:process';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CliError, ROOT, inputPath, integer, jsonInput, redact, str, usage, type Context } from './core.ts';

interface Invocation { program: string; args: string[]; server?: boolean }
export async function runChild(invocation: Invocation, timeout = 600_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const child = spawn(invocation.program, invocation.args, {
      cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32',
      env: { ...process.env, NO_COLOR: '1' },
    });
    let stdout = ''; let stderr = ''; let bytes = 0; let reason: string | undefined;
    let escalation: ReturnType<typeof setTimeout> | undefined;
    const signalGroup = (signal: NodeJS.Signals) => {
      try { if (child.pid && process.platform !== 'win32') process.kill(-child.pid, signal); else child.kill(signal); }
      catch { /* Process already exited. */ }
    };
    const stop = (why: string) => {
      if (reason) return;
      reason = why; signalGroup('SIGTERM');
      escalation = setTimeout(() => signalGroup('SIGKILL'), 2000); escalation.unref();
    };
    const interrupt = () => stop('INTERRUPTED');
    process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
    const timer = invocation.server ? undefined : setTimeout(() => stop('TIMEOUT'), timeout);
    const cleanup = () => { clearTimeout(timer); clearTimeout(escalation); process.off('SIGINT', interrupt); process.off('SIGTERM', interrupt); };
    const collect = (target: 'stdout' | 'stderr', data: Buffer) => {
      bytes += data.length;
      if (!invocation.server && bytes > 8 * 1024 * 1024) { stop('OUTPUT_TOO_LARGE'); return; }
      const safe = redact(data.toString());
      if (invocation.server) { process.stderr.write(safe); return; }
      if (target === 'stdout') stdout += safe; else stderr += safe;
    };
    child.stdout.on('data', (data: Buffer) => collect('stdout', data));
    child.stderr.on('data', (data: Buffer) => collect('stderr', data));
    child.once('error', () => { cleanup(); reject(new CliError('EXECUTABLE_MISSING', 'Não foi possível iniciar a ferramenta. Confira Node/npm, Python, bash ou gh conforme o comando.')); });
    child.once('close', (code, signal) => {
      cleanup();
      const result = { exitCode: code, signal, stdout: redact(stdout), stderr: redact(stderr) };
      if (stderr) process.stderr.write(redact(stderr));
      if (reason) { reject(new CliError(reason, 'Execução interrompida.', reason === 'INTERRUPTED' ? 130 : reason === 'TIMEOUT' ? 5 : 1)); return; }
      if (code !== 0) { reject(new CliError('COMMAND_FAILED', 'A ferramenta retornou falha.', 1, result)); return; }
      resolve(result);
    });
  });
}

export async function runProcess(ctx: Context): Promise<unknown> {
  const { values } = ctx;
  const name = ctx.command.name;
  const timeout = integer(str(values, 'timeout-ms'), 600_000, 1, 3_600_000);
  let invocation: Invocation;
  let temporary: string | undefined;
  try {
    if (name.startsWith('ledger ')) {
      const operation = name.slice(7);
      const args = [join(ROOT, `scripts/ledger/${operation === 'stamp' ? 'stamp-head' : operation}.ts`)];
      for (const key of ['file', 'event', 'key', 'out']) {
        const path = inputPath(ctx, key); if (path) args.push(`--${key}`, path);
      }
      if (operation === 'sign' && values.apply && (!values.key || !values.out)) usage('--apply exige --key e --out.');
      if (operation === 'reconcile' && !process.env.ASAAS_SANDBOX_KEY) throw new CliError('CONFIG_REQUIRED', 'ASAAS_SANDBOX_KEY ausente. O extrato não foi consultado.');
      if (operation === 'drain') {
        const input = await jsonInput(ctx);
        const { acceptIngest } = await import('../../src/lib/ledger/ingest.ts');
        const { envelopesFromWebhook } = await import('../../src/lib/ledger/asaas.ts');
        const object = input as { source?: unknown; envelopes?: unknown; event?: unknown } | null;
        const batch = object?.source === 'asaas' && Array.isArray(object.envelopes) ? object.envelopes
          : object && typeof object === 'object' && 'event' in object ? (() => { const result = envelopesFromWebhook(input); return result.ok ? result.envelopes : null; })() : [input];
        if (!batch || !batch.every(item => acceptIngest(item).ok)) usage('Envelope fora do contrato público.');
        temporary = await mkdtemp(join(tmpdir(), 'pontape-input-'));
        const path = join(temporary, 'input.json');
        await writeFile(path, JSON.stringify(input), { mode: 0o600, flag: 'wx' });
        args.push('--event-file', path);
      }
      if (values.apply) args.push('--apply');
      invocation = { program: process.execPath, args };
    } else if (name === 'ops migrate') {
      if (!values.apply) return { dryRun: true, script: 'scripts/deploy/migrar.sh --remote', note: 'Aplica migrações no D1 remoto. Use --apply para executar.' };
      invocation = { program: 'bash', args: [join(ROOT, 'scripts/deploy/migrar.sh'), '--remote'] };
    } else if (name === 'ops deploy') {
      invocation = { program: 'bash', args: [join(ROOT, 'scripts/deploy/publicar.sh'), ...(values.apply ? ['--apply'] : [])] };
    } else if (name === 'dev worker') {
      invocation = { program: 'bash', args: [join(ROOT, 'scripts/deploy/dev-chat.sh'), String(integer(str(values, 'port'), 8794, 1, 65535))], server: true };
    } else if (name === 'test' && values.suite === 'python') {
      invocation = { program: 'python3', args: ['-B', '-m', 'unittest', 'discover', '-s', 'tools', '-p', 'test_*.py'] };
    } else {
      let script = name;
      const extra: string[] = [];
      if (name === 'dev site' || name === 'preview') {
        script = name === 'dev site' ? 'dev' : 'preview';
        extra.push('--', '--host', '127.0.0.1', '--port', String(integer(str(values, 'port'), 4321, 1, 65535)));
      }
      if (name === 'check') {
        const scripts: Record<string, string> = { all: 'check', lint: 'lint', types: 'typecheck', tests: 'test:all', build: 'build', budget: 'budget' };
        script = scripts[String(values.scope ?? 'all')]!;
      }
      if (name === 'test') {
        const suites: Record<string, string> = { cli: 'scripts/cli', worker: 'scripts/deploy', ledger: 'src/lib/ledger' };
        const suite = str(values, 'suite') ?? 'all';
        if (suite !== 'all') extra.push('--', suites[suite]!);
        else script = 'test:all';
      }
      invocation = { program: 'npm', args: ['run', script, ...extra], server: ctx.command.effect === 'server' };
    }
    return await runChild(invocation, timeout);
  } finally { if (temporary) await rm(temporary, { recursive: true, force: true }); }
}
