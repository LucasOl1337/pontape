import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectHistory } from '../../../scripts/ledger/project-sources';

it('encontra decisões antigas na revisão que entrou na main, inclusive após remoção', () => {
  // Isolated fictitious repository; never modifies any project checkout.
  const cwd = mkdtempSync(join(tmpdir(), 'vidanova-project-history-'));
  const git = (...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();
  try {
    git('init', '-b', 'main'); git('config', 'user.name', 'Fictício'); git('config', 'user.email', 'fixture@example.invalid');
    mkdirSync(join(cwd, 'docs'));
    writeFileSync(join(cwd, 'docs/DECISOES.md'), '| D001 | 01/01/2000 | DADO FICTÍCIO |\n');
    git('add', '.'); git('commit', '-m', 'Decisão fictícia inicial'); const first = git('rev-parse', 'HEAD');
    git('switch', '-c', 'fictitious-change');
    writeFileSync(join(cwd, 'docs/DECISOES.md'), '| D001 | 01/01/2000 | DADO FICTÍCIO |\n| D002 | 01/01/2000 | DADO FICTÍCIO |\n');
    git('add', '.'); git('commit', '-m', 'Decisão em branch'); const branchCommit = git('rev-parse', 'HEAD');
    git('switch', 'main'); git('merge', '--no-ff', 'fictitious-change', '-m', 'Integra decisão fictícia'); const merge = git('rev-parse', 'HEAD');
    writeFileSync(join(cwd, 'docs/DECISOES.md'), '| D002 | 01/01/2000 | DADO FICTÍCIO |\n');
    git('add', '.'); git('commit', '-m', 'Remove linha fictícia');
    const history = projectHistory(cwd);
    expect(history.decisions.map(fact => fact.payload)).toMatchObject([
      { decisionId: 'D001', sourceCommit: first }, { decisionId: 'D002', sourceCommit: merge },
    ]);
    expect(history.decisions[1]!.payload).not.toMatchObject({ sourceCommit: branchCommit });
    expect(history.decisions[0]!.order).toBeLessThan(history.decisions[1]!.order);
  } finally { rmSync(cwd, { recursive: true, force: true }); }
});

describe('repositório sem decisões', () => {
  it('não inventa linhas', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'vidanova-no-decisions-'));
    try {
      for (const args of [['init', '-b', 'main'], ['config', 'user.name', 'Fictício'], ['config', 'user.email', 'fixture@example.invalid'], ['commit', '--allow-empty', '-m', 'FICTÍCIO']]) {
        execFileSync('git', args, { cwd, stdio: 'pipe' });
      }
      expect(projectHistory(cwd).decisions).toEqual([]);
    } finally { rmSync(cwd, { recursive: true, force: true }); }
  });
});
