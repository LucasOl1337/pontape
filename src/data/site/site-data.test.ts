import { describe, expect, it } from 'vitest';
import { MODULES } from './modules';
import { STEPS } from './journey';
import { BOTTLENECKS } from './bottlenecks';
import { CONTRIBUTIONS } from './contributions';
import { DECISION_TITLES, parseDecisionTitles } from './decisions';
import { ICON_NAMES } from '../../components/site/icon-names';

describe('dados do site', () => {
  it('tem os nove módulos do PRD, em ordem', () => {
    expect(MODULES.map(m => m.id)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9']);
  });

  it('todo passo da jornada aponta pra um módulo que existe', () => {
    expect(STEPS).toHaveLength(7);
    for (const step of STEPS) expect(MODULES.some(m => m.id === step.module)).toBe(true);
  });

  it('toda contribuição que aponta um gargalo aponta um que existe', () => {
    expect(CONTRIBUTIONS.length).toBeGreaterThan(0);
    for (const c of CONTRIBUTIONS) {
      if (c.bottleneck) expect(BOTTLENECKS.some(b => b.id === c.bottleneck)).toBe(true);
    }
  });

  it('texto público não tem travessão', () => {
    const text = JSON.stringify([MODULES, STEPS, BOTTLENECKS]);
    expect(text).not.toContain('—');
  });

  it('todo ícone usado nos dados existe no desenho', () => {
    for (const icon of STEPS.map(s => s.icon)) expect(ICON_NAMES).toContain(icon);
  });
});

describe('título das decisões (D013)', () => {
  it('lê cada decisão do DECISOES.md, sem marcação', () => {
    expect(Object.keys(DECISION_TITLES)).toContain('D001');
    expect(Object.keys(DECISION_TITLES)).toContain('D013');
    for (const title of Object.values(DECISION_TITLES)) {
      expect(title).not.toMatch(/\*\*|`|\]\(/);
    }
  });

  it('ignora linhas que não são decisão', () => {
    expect(parseDecisionTitles('| ID | Data | Decisão |\n|---|---|---|\n| D042 | 1 | **Algo** [x](y) |')).toEqual({ D042: 'Algo x' });
  });
});
