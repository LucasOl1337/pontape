import process from 'node:process';
import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { COMMANDS, DOCS, GLOBAL_OPTIONS } from './catalog.ts';
import { CliError, ROOT, str, usage, type Context } from './core.ts';

async function exists(path: string): Promise<boolean> { try { await access(path); return true; } catch { return false; } }
async function collection(name: string): Promise<unknown> {
  switch (name) {
    case 'modules': return (await import('../../src/data/site/modules.ts')).MODULES;
    case 'journey': return (await import('../../src/data/site/journey.ts')).STEPS;
    case 'bottlenecks': return (await import('../../src/data/site/bottlenecks.ts')).BOTTLENECKS;
    case 'contributions': return JSON.parse(await readFile(join(ROOT, 'docs/contribuicoes/contribuicoes.json'), 'utf8'));
    case 'transparency': return JSON.parse(await readFile(join(ROOT, 'src/data/transparency.json'), 'utf8'));
    case 'project': {
      const { PROJECT_NAME, STATUS_DATE, REPOSITORY_OPEN } = await import('../../src/data/site/project.ts');
      return { name: PROJECT_NAME, statusDate: STATUS_DATE, repositoryOpen: REPOSITORY_OPEN };
    }
    default: return usage('Coleção desconhecida.');
  }
}
async function routes(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const parts = await Promise.all(entries.map(async entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routes(path);
    if (!/\.(astro|ts)$/.test(entry.name)) return [];
    return ['/' + relative(join(ROOT, 'src/pages'), path).replace(/\.(astro|ts)$/, '').replace(/(^|\/)index$/, '')];
  }));
  return parts.flat().sort();
}
export async function runLocal(ctx: Context): Promise<unknown> {
  switch (ctx.command.name) {
    case 'capabilities': return { commands: COMMANDS, globalOptions: GLOBAL_OPTIONS,
      unavailable: ['Captação e seleção de candidatos', 'Entrevista por voz', 'Operação de entregas', 'Rede de vagas', 'AI contínua por pessoa'],
      note: 'Esses módulos ainda não têm serviço operacional. Consulte site data --collection modules.' };
    case 'doctor': {
      const [major, minor] = process.versions.node.split('.').map(Number);
      const checks = [
        { name: 'node', ok: major === 24 && minor! >= 21, actual: process.versions.node, expected: '>=24.21.0 <25' },
        { name: 'dependencies', ok: await exists(join(ROOT, 'node_modules/zod/package.json')), expected: 'npm ci' },
        { name: 'ledger', ok: await exists(join(ROOT, 'src/data/ledger/ledger.json')) },
        { name: 'worker', ok: await exists(join(ROOT, 'scripts/deploy/worker.js')) },
      ];
      const result = { root: ROOT, checks, optional: {
        build: await exists(join(ROOT, 'dist/index.html')),
        yumeKnowledge: await exists(join(ROOT, 'scripts/deploy/yumi-knowledge.js')),
      } };
      if (checks.some(check => !check.ok)) throw new CliError('REQUIREMENTS', 'Há requisito local pendente.', 1, result);
      return result;
    }
    case 'status': {
      const { runLedger } = await import('./ledger.ts');
      return { root: ROOT, project: await collection('project'), modules: await collection('modules'),
        transparency: await collection('transparency'), ledger: await runLedger({ ...ctx, command: { ...ctx.command, name: 'ledger summary' } }),
        note: 'Estado do checkout. Disponibilidade remota: chat health e metrics public.' };
    }
    case 'docs list': return Object.entries(DOCS).map(([name, path]) => ({ name, path }));
    case 'docs show': {
      const name = str(ctx.values, 'name')!;
      const path = DOCS[name];
      if (!path) usage('Documento desconhecido. Use docs list.');
      return { name, path, content: await readFile(join(ROOT, path), 'utf8') };
    }
    case 'site routes': return routes(join(ROOT, 'src/pages'));
    case 'site data': {
      const data = await collection(str(ctx.values, 'collection')!);
      const id = str(ctx.values, 'id');
      if (!id) return data;
      if (!Array.isArray(data)) usage('--id exige uma coleção de itens.');
      const item = data.find(item => String(item.id) === id);
      if (!item) throw new CliError('NOT_FOUND', 'Item não encontrado.', 4);
      return item;
    }
  }
}
