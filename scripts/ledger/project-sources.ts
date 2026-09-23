import { execFileSync } from 'node:child_process';
import { decisionsFromMarkdown, pullFacts, type ProjectFact } from './project-plan.ts';

const options = { encoding: 'utf8' as const, maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'] };

/** Read only from the checked-out commit. Never from uncommitted docs or a PR head. */
export function projectHistory(cwd = process.cwd()): { head: string; commitOrder: Map<string, number>; decisions: ProjectFact[] } {
  const git = (...args: string[]) => execFileSync('git', args, { ...options, cwd }).trimEnd();
  if (git('rev-parse', '--is-shallow-repository') !== 'false') throw new Error('Reconciliação exige histórico completo.');
  const head = git('rev-parse', 'HEAD');
  const commits = git('rev-list', '--reverse', '--topo-order', head).split('\n');
  const commitOrder = new Map(commits.map((sha, index) => [sha, index]));
  const revisions = git('log', '--first-parent', '--full-history', '--reverse', '--format=%H', head, '--', 'docs/DECISOES.md').split('\n').filter(Boolean);
  const seen = new Set<string>();
  const decisions: ProjectFact[] = [];
  for (const sha of revisions) {
    const files = git('ls-tree', '--name-only', sha, '--', 'docs/DECISOES.md');
    if (!files) continue; // A historical deletion does not erase facts already discovered.
    const markdown = git('show', `${sha}:docs/DECISOES.md`);
    for (const { id, date } of decisionsFromMarkdown(markdown)) {
      if (seen.has(id)) continue;
      seen.add(id);
      decisions.push({ order: commitOrder.get(sha)!, payload: {
        type: 'project', action: 'decision_recorded', decisionId: id,
        sourceCommit: sha, occurredOn: date, correctionOf: null,
      } });
    }
  }
  return { head, commitOrder, decisions };
}

export function collectProjectFacts(): { head: string; facts: ProjectFact[] } {
  const history = projectHistory();
  // No title/body/author from GitHub is ever copied to the ledger or a shell command.
  // --paginate avoids a silent 100-PR cutoff; --slurp wraps pages for unambiguous parsing.
  const response = execFileSync('gh', ['api', '--paginate', '--slurp',
    'repos/LucasOl1337/pontape/pulls?state=all&base=main&sort=created&direction=asc&per_page=100'], options);
  const pages: unknown = JSON.parse(response);
  if (!Array.isArray(pages) || !pages.every(Array.isArray)) throw new Error('Resposta de PRs inválida.');
  return { head: history.head, facts: [...history.decisions, ...pullFacts(pages.flat(), history.commitOrder)] };
}
