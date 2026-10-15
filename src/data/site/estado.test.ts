import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ICON_NAMES } from '../../components/site/icon-names';
import { STATE_ICON, STATE_ROLE, type StateKind } from './estado';

// F44, plano 2.2: one state component. Every state has an icon that exists, the colour is never alone,
// and the build and script versions draw the same markup.
const KINDS: StateKind[] = ['empty', 'loading', 'unavailable', 'error', 'success', 'info', 'example'];

describe('componente de estado (2.2)', () => {
  it('todo estado tem ícone do sprite, e estados diferentes não dividem ícone', () => {
    for (const k of KINDS) expect(ICON_NAMES).toContain(STATE_ICON[k]);
    expect(new Set(KINDS.map(k => STATE_ICON[k])).size).toBe(KINDS.length);
  });

  it('erro é anunciado na hora; carregando e sucesso, com calma', () => {
    expect(STATE_ROLE).toEqual({ error: 'alert', loading: 'status', success: 'status' });
  });

  it('a versão do build e a do script usam as mesmas classes', () => {
    const astro = readFileSync('src/components/site/StateNote.astro', 'utf8');
    const script = readFileSync('src/scripts/estado.ts', 'utf8');
    for (const cls of ['state-icon', 'state-text', 'state-title', 'state-body', 'state-actions']) {
      expect(astro, cls).toContain(cls);
      expect(script, cls).toContain(cls);
    }
  });

  it('cada estado tem sua cor de função no CSS, e o exemplo é listrado', () => {
    const css = readFileSync('src/styles/estado.css', 'utf8');
    for (const k of ['error', 'success', 'unavailable', 'example']) expect(css).toContain(`[data-state="${k}"]`);
    expect(css).toMatch(/example[\s\S]*repeating-linear-gradient/);
    expect(css).not.toMatch(/example[^}]*var\(--(error|warning)/);
  });
});
