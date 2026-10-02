import process from 'node:process';
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { COMMANDS, GLOBAL_OPTIONS, type Command } from './catalog.ts';
import { CliError, CONTRACT_VERSION, ROOT, record, redact, usage, type Values } from './core.ts';

function help(prefix = '') {
  const commands = COMMANDS.filter(command => command.name === prefix || command.name.startsWith(`${prefix} `) || !prefix);
  if (!commands.length) usage('Comando desconhecido. Use pontape help.');
  return { usage: 'pontape <comando> [opções]', contractVersion: CONTRACT_VERSION,
    defaults: { baseUrl: 'http://127.0.0.1:8794', repository: ROOT }, globalOptions: GLOBAL_OPTIONS, commands };
}
function helpText(info: ReturnType<typeof help>): string {
  const lines = ['PontaPé CLI', info.usage, '', ...info.commands.map(c => `  ${c.name.padEnd(22)} ${c.description}`)];
  if (info.commands.length === 1) {
    const command = info.commands[0]!;
    lines.push('', `Efeito: ${command.effect}`, ...Object.entries(command.options).map(([name, option]) =>
      `  --${name}${option.type === 'string' ? ' <valor>' : ''}${option.required ? ' (obrigatório)' : ''}: ${option.description}${option.choices ? ` Valores: ${option.choices.join(', ')}.` : ''}`), '', `Exemplo: ${command.example}`);
  }
  lines.push('', ...Object.entries(GLOBAL_OPTIONS).map(([name, option]) => `  --${name}: ${option.description}`), '', 'Guia: docs/cli/README.md. Descoberta: pontape capabilities --json.');
  return lines.join('\n');
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  let json = args.includes('--json') || args.includes('-j');
  let commandName = 'help';
  try {
    // Locate commands while respecting option values, then parse again against only that command.
    const allOptions = Object.assign({}, GLOBAL_OPTIONS, ...COMMANDS.map(c => c.options));
    const discovered = parseArgs({ args, options: allOptions, allowPositionals: true, strict: true, tokens: true });
    const positionals = discovered.positionals;
    const wantsHelp = positionals[0] === 'help' || (discovered.values as Values).help || positionals.length === 0;
    commandName = (positionals[0] === 'help' ? positionals.slice(1) : positionals).join(' ') || 'help';
    const command = COMMANDS.find(c => c.name === commandName);
    const parsed = parseArgs({ args, options: { ...GLOBAL_OPTIONS, ...(command?.options ?? {}) }, allowPositionals: true, strict: true, tokens: true });
    const values = parsed.values as Values;
    json = Boolean(values.json);
    const seen = new Set<string>();
    for (const token of parsed.tokens) {
      if (token.kind !== 'option') continue;
      if (seen.has(token.name)) usage(`Opção repetida: --${token.name}.`);
      seen.add(token.name);
    }
    let data: unknown;
    let plain: string | undefined;
    if (values.version) {
      const pkg = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
      data = { version: pkg.version, contractVersion: CONTRACT_VERSION };
      plain = `PontaPé ${pkg.version} (contrato CLI ${CONTRACT_VERSION})`;
    } else if (wantsHelp) {
      const info = help(commandName === 'help' ? '' : commandName);
      data = info; plain = helpText(info);
    } else {
      if (!command) usage('Comando desconhecido. Use pontape help.');
      for (const [name, option] of Object.entries(command.options)) {
        if (option.required && (values[name] === undefined || values[name] === '')) usage(`Falta --${name}. Use pontape ${command.name} --help.`);
        if (option.choices && values[name] !== undefined && !option.choices.includes(String(values[name]))) usage(`--${name} aceita: ${option.choices.join(', ')}.`);
      }
      data = await execute(command, values);
      if (record(data)) {
        if (typeof data.stdout === 'string') plain = data.stdout.trimEnd() || 'Concluído.';
        if (commandName === 'chat ask' && typeof data.answer === 'string') plain = data.answer;
        if (commandName === 'docs show' && typeof data.content === 'string') plain = data.content;
      }
    }
    const envelope = { schemaVersion: CONTRACT_VERSION, ok: true, command: commandName, data };
    process.stdout.write(`${json ? JSON.stringify(envelope) : plain ?? JSON.stringify(data, null, 2)}\n`);
  } catch (error) {
    const nodeCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const failure = error instanceof CliError ? error
      : nodeCode.startsWith('ERR_PARSE_ARGS') ? new CliError('USAGE', 'Argumentos inválidos. Use pontape help ou <comando> --help.', 2)
        : ['ENOENT', 'EACCES', 'EEXIST'].includes(nodeCode) ? new CliError(nodeCode, `Arquivo ausente, inacessível ou já existente (${nodeCode}). Confira os caminhos.`)
          : new CliError('INTERNAL', 'Falha ao executar. Confira os requisitos com pontape doctor e os argumentos com --help.');
    const detail = { code: failure.code, message: redact(failure.message), ...(failure.details === undefined ? {} : { details: failure.details }) };
    if (json) process.stdout.write(`${JSON.stringify({ schemaVersion: CONTRACT_VERSION, ok: false, command: commandName, error: detail })}\n`);
    else process.stderr.write(`${detail.code}: ${detail.message}\n`);
    process.exitCode = failure.exitCode;
  }
}

async function execute(command: Command, values: Values): Promise<unknown> {
  const ctx = { command, values, cwd: process.cwd() };
  // Help and discovery never import Astro, Zod, SQLite or network code.
  switch (command.handler) {
    case 'local': return (await import('./local.ts')).runLocal(ctx);
    case 'ledger': return (await import('./ledger.ts')).runLedger(ctx);
    case 'http': return (await import('./http.ts')).runHttp(ctx);
    case 'process': return (await import('./process.ts')).runProcess(ctx);
    case 'mock': return (await import('./mock.ts')).runMock(ctx);
  }
}
