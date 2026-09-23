import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MODULES } from './modules';
import { NOW_LEAD, STEPS } from './journey';
import { BOTTLENECKS } from './bottlenecks';
import { CONTRIBUTIONS } from './contributions';
import { DECISION_TITLES, parseDecisionTitles } from './decisions';
import { CADERNOS, CONSTRUIR, MOVED } from './cadernos';
import { ICON_NAMES } from '../../components/site/icon-names';

describe('dados do site', () => {
  it('tem os nove módulos do PRD, em ordem', () => {
    expect(MODULES.map(m => m.id)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9']);
  });

  it('todo passo da jornada aponta pra um módulo que existe', () => {
    expect(STEPS).toHaveLength(7);
    for (const step of STEPS) expect(MODULES.some(m => m.id === step.module)).toBe(true);
  });

  it('o apoio da IA vem antes do trabalho (D028)', () => {
    const at = (module: string) => STEPS.findIndex(s => s.module === module);
    expect(at('M7')).toBeGreaterThan(at('M5'));
    expect(at('M7')).toBeLessThan(at('M6'));
  });

  it('o "já funciona?" de cada passo bate com o estado da peça', () => {
    for (const step of STEPS) {
      const status = MODULES.find(m => m.id === step.module)!.status;
      expect(step.now.startsWith(`${NOW_LEAD[status]} `), `${step.title}: comece com "${NOW_LEAD[status]}"`).toBe(true);
      for (const lead of Object.values(NOW_LEAD).filter(l => l !== NOW_LEAD[status])) expect(step.now).not.toContain(lead);
    }
  });

  it('a jornada fala palavra de gente, sem o jargão de quem constrói (F29)', () => {
    const text = STEPS.map(s => [s.shortName, s.title, s.text, s.now].join(' ')).join(' ');
    expect(text).not.toMatch(/\b(m[oó]dulos?|pe[çc]as?|gargalos?|edi[çc][ãa]o|classificados|expediente|issues?|reposit[oó]rio|hash|cnpj|M[1-9])\b/i);
  });

  it('toda contribuição que aponta um gargalo aponta um que existe', () => {
    expect(CONTRIBUTIONS.length).toBeGreaterThan(0);
    for (const c of CONTRIBUTIONS) {
      if (c.bottleneck) expect(BOTTLENECKS.some(b => b.id === c.bottleneck)).toBe(true);
    }
  });

  it('texto público não tem travessão', () => {
    const text = JSON.stringify([MODULES, STEPS, BOTTLENECKS, CADERNOS]);
    expect(text).not.toContain('—');
  });

  it('todo ícone usado nos dados existe no desenho', () => {
    for (const icon of [...STEPS, ...CADERNOS].map(s => s.icon)) expect(ICON_NAMES).toContain(icon);
  });
});

describe('cadernos com endereço próprio (F31)', () => {
  it('todo link antigo da home leva a uma página que existe', () => {
    expect(Object.keys(MOVED).sort()).toEqual(['codigo-aberto', 'construir', 'contribuicoes', 'gargalos', 'modulos']);
    for (const href of Object.values(MOVED)) {
      const page = href === CONSTRUIR.href ? `src/pages${href}/index.astro` : `src/pages${href}.astro`;
      expect(existsSync(page), `${href}: falta ${page}`).toBe(true);
    }
  });

  it('todo caderno mora dentro de "Construir junto"', () => {
    for (const c of CADERNOS) expect(c.href).toBe(`${CONSTRUIR.href}/${c.id}`);
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
