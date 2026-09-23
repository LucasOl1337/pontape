import { describe, expect, it } from 'vitest';
import { decisionsFromMarkdown, planProjectEvents, pullFacts, type ProjectFact } from '../../../scripts/ledger/project-plan';
import { appendEvent } from './verify';
import { canonicalize } from './canonical';

const at = '2000-01-02T12:00:00.000Z';
const a = 'a'.repeat(40), b = 'b'.repeat(40);
const decision: ProjectFact = { order: 2, payload: {
  type: 'project', action: 'decision_recorded', occurredOn: '2000-01-01', correctionOf: null,
  decisionId: 'D001', sourceCommit: a,
} };
const pull: ProjectFact = { order: 1, payload: {
  type: 'project', action: 'pull_request_merged', occurredOn: '2000-01-01', correctionOf: null,
  pullRequest: '9', mergeCommit: b,
} };
const apiPull = { number: 9, merged_at: '2000-01-02T01:30:00Z', merge_commit_sha: b,
  base: { ref: 'main', repo: { full_name: 'LucasOl1337/pontape' } } };

describe('plano de reconciliação do projeto (dados fictícios, sem rede)', () => {
  it('acrescenta PR nova e decisão nova em ordem de histórico, não ordem da API', () => {
    expect(planProjectEvents([], [decision, pull])).toEqual([pull.payload, decision.payload]);
  });
  it('PR repetida e decisão já registrada são sucesso sem nova escrita', async () => {
    let events = await appendEvent([], pull.payload, at);
    events = await appendEvent(events, decision.payload, at);
    const before = canonicalize(events);
    expect(planProjectEvents(events, [decision, pull, pull])).toEqual([]);
    expect(canonicalize(events)).toBe(before);
  });
  it('reprocessar o mesmo push é idempotente e preserva a cabeça', async () => {
    const pending = planProjectEvents([], [decision, pull, decision]);
    let events = await appendEvent([], pending[0], at);
    events = await appendEvent(events, pending[1], at);
    expect(pending).toHaveLength(2);
    expect(planProjectEvents(events, [pull, decision])).toEqual([]);
  });
  it('push sem fatos não propõe evento', () => {
    expect(planProjectEvents([], [])).toEqual([]);
  });
  it('recupera fatos antigos faltantes sem reordenar eventos publicados', async () => {
    const events = await appendEvent([], decision.payload, at);
    const before = canonicalize(events[0]);
    const pending = planProjectEvents(events, [decision, pull]);
    expect(pending).toEqual([pull.payload]);
    const next = await appendEvent(events, pending[0], at);
    expect(canonicalize(next[0])).toBe(before);
    expect(next[1]!.payload).toEqual(pull.payload);
  });
  it('não automatiza dinheiro, campo, candidato, criação do repo ou correção', () => {
    for (const payload of [
      { type: 'field', action: 'food_delivered', occurredOn: '2000-01-01', correctionOf: null, quantity: '1' },
      { type: 'candidate', action: 'contact_completed', occurredOn: '2000-01-01', correctionOf: null, count: '1' },
      { type: 'finance', action: 'movement_recorded', occurredOn: '2000-01-01', correctionOf: null, amountCents: '100', category: 'donation', currency: 'BRL', evidence: 'pending' },
      { type: 'project', action: 'repository_created', occurredOn: '2000-01-01', correctionOf: null, repository: 'LucasOl1337/VidaNova' },
      { ...decision.payload, correctionOf: '1' },
    ]) {
      // Deliberately bypass the compile-time type to exercise the runtime boundary.
      expect(() => planProjectEvents([], [{ order: 1, payload } as ProjectFact])).toThrow();
    }
  });
});

describe('fontes públicas permitidas', () => {
  it('lê somente linhas de decisão com data brasileira válida', () => {
    expect(decisionsFromMarkdown('# D999 citado em título\n| D001 | 01/01/2000 | DADO FICTÍCIO |\n| D002 | 02/01/2000 | DADO FICTÍCIO |'))
      .toEqual([{ id: 'D001', date: '2000-01-01' }, { id: 'D002', date: '2000-01-02' }]);
    expect(() => decisionsFromMarkdown('| D001 | 30/02/2000 | DADO FICTÍCIO |')).toThrow();
    expect(() => decisionsFromMarkdown('| D001 | sem data | DADO FICTÍCIO |')).toThrow();
    expect(() => decisionsFromMarkdown('| D001 | 01/01/2000 | A |\n| D001 | 01/01/2000 | B |')).toThrow();
  });
  it('converte merged_at para São Paulo e não copia título/corpo/autor', () => {
    expect(pullFacts([{ ...apiPull, title: 'DADO FICTÍCIO $(touch /tmp/unsafe)', body: 'FICTÍCIO' }], new Map([[b, 1]])))
      .toEqual([pull]);
  });
  it('ignora PR aberta, outra base, outro repo e merge posterior ao checkout', () => {
    const fixtures = [
      { ...apiPull, merged_at: null },
      { ...apiPull, base: { ...apiPull.base, ref: 'outra' } },
      { ...apiPull, base: { ref: 'main', repo: { full_name: 'example/fictitious' } } },
      { ...apiPull, merge_commit_sha: a },
    ];
    expect(pullFacts(fixtures, new Map([[b, 1]]))).toEqual([]);
  });
  it('recusa PR integrada sem commit, e não usa o número como comando', () => {
    expect(() => pullFacts([{ ...apiPull, merge_commit_sha: null }], new Map())).toThrow();
    expect(() => pullFacts([{ ...apiPull, number: '1; echo unsafe' }], new Map())).toThrow();
  });
});
