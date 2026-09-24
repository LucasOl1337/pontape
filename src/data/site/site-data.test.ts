import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MODULES } from './modules';
import { NOW_LEAD, OPENING, STEPS } from './journey';
import { BOTTLENECKS } from './bottlenecks';
import { CONTRIBUTIONS } from './contributions';
import { DECISIONS, DECISION_TITLES, PLAIN_FALLBACK, decisionPlain, parseDecisions, parseDecisionTitles } from './decisions';
import { LIVRO, PLAIN } from './livro';
import { TECHNICAL_WORDS, recentLines } from '../../lib/ledger-view/plain';
import { getPublicLedger } from '../../lib/ledger-view/source';
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

  it('o apoio da AI vem antes do trabalho (D028)', () => {
    const at = (module: string) => STEPS.findIndex(s => s.module === module);
    expect(at('M7')).toBeGreaterThan(at('M5'));
    expect(at('M7')).toBeLessThan(at('M6'));
  });

  it('a escada começa pelo sistema de escolha, e a AI vai junto desde ali (D032)', () => {
    expect(STEPS.filter(s => s.aiFrom)).toEqual([STEPS[0]]);
    expect(STEPS[0]!.module).toBe('M3');
    const at = (module: string) => STEPS.findIndex(s => s.module === module);
    expect(at('M5'), 'a comida vem depois da conversa').toBeGreaterThan(at('M4'));
    expect(OPENING.indexOf('AI'), 'a home abre pela AI, não pelo básico ou pelo trabalho').toBeLessThan(OPENING.indexOf('trabalho'));
    expect(OPENING).not.toContain('comida');
  });

  it('o "já funciona?" de cada passo bate com o estado da peça', () => {
    for (const step of STEPS) {
      const status = MODULES.find(m => m.id === step.module)!.status;
      expect(step.now.startsWith(`${NOW_LEAD[status]} `), `${step.title}: comece com "${NOW_LEAD[status]}"`).toBe(true);
      for (const lead of Object.values(NOW_LEAD).filter(l => l !== NOW_LEAD[status])) expect(step.now).not.toContain(lead);
    }
  });

  it('a jornada fala palavra de gente, sem o jargão de quem constrói (F29)', () => {
    const text = [OPENING, ...STEPS.map(s => [s.shortName, s.title, s.text, s.now].join(' '))].join(' ');
    expect(text).not.toMatch(/\b(m[oó]dulos?|pe[çc]as?|gargalos?|edi[çc][ãa]o|classificados|expediente|issues?|reposit[oó]rio|hash|cnpj|M[1-9])\b/i);
  });

  it('toda contribuição que aponta um gargalo aponta um que existe', () => {
    expect(CONTRIBUTIONS.length).toBeGreaterThan(0);
    for (const c of CONTRIBUTIONS) {
      if (c.bottleneck) expect(BOTTLENECKS.some(b => b.id === c.bottleneck)).toBe(true);
    }
  });

  it('texto público diz AI, nunca IA', () => {
    const text = JSON.stringify([OPENING, MODULES, STEPS, BOTTLENECKS, CADERNOS]);
    expect(text).not.toMatch(/(?<![\p{L}])IAs?(?![\p{L}])|intelig[êe]ncia artificial/iu);
  });

  it('texto público não tem travessão', () => {
    const text = JSON.stringify([OPENING, MODULES, STEPS, BOTTLENECKS, CADERNOS]);
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

describe('decisões em palavras simples (F32)', () => {
  // Fails to warn whoever records a decision; the site itself falls back and the build goes on.
  it('toda decisão do DECISOES.md tem a frase da coluna "Em palavras simples"', () => {
    const missing = Object.entries(DECISIONS).filter(([, d]) => !d.plain).map(([id]) => id);
    expect(missing, `sem frase simples: ${missing.join(', ')}`).toEqual([]);
  });

  it('a frase simples não tem palavra técnica nem travessão', () => {
    for (const [id, d] of Object.entries(DECISIONS)) {
      expect(d.plain ?? '', id).not.toMatch(TECHNICAL_WORDS);
      expect(d.plain ?? '', id).not.toContain('—');
    }
  });

  it('lê a sexta coluna e, sem ela, cai na frase genérica', () => {
    const table = '| ID | Data | Decisão | Por quê | Quem | Em palavras simples |\n|---|---|---|---|---|---|\n| D042 | 1 | **Algo** | x | y | O projeto faz algo |\n| D043 | 1 | Outro | x | y | |';
    expect(parseDecisions(table)).toEqual({ D042: { title: 'Algo', plain: 'O projeto faz algo' }, D043: { title: 'Outro' } });
    expect(decisionPlain('D999')).toBe(PLAIN_FALLBACK);
  });
});

describe('primeira camada da transparência (F32)', () => {
  it('fala palavra de gente: sem GitHub, PR, hash, marca, nem travessão', () => {
    const text = JSON.stringify(PLAIN);
    expect(text).not.toMatch(TECHNICAL_WORDS);
    expect(text).not.toContain('—');
  });

  it('as últimas ações do livro de verdade também', async () => {
    const lines = recentLines((await getPublicLedger()).events, decisionPlain, 50);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(`${line.lead ?? ''} ${line.text}`).not.toMatch(TECHNICAL_WORDS);
  });

  it('a parte técnica existe e recebe os endereços antigos da página única', () => {
    expect(existsSync(`src/pages${LIVRO.tecnico}.astro`)).toBe(true);
    const technical = ['LivroTopo', 'LivroMais'].map(c => readFileSync(`src/components/cronica/${c}.astro`, 'utf8')).join('\n');
    for (const hash of LIVRO.movedHashes) expect(technical, `#${hash}`).toMatch(new RegExp(`id(=|: )["']${hash}["']`));
  });
});
