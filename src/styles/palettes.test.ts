import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ANIL } from '../lib/share/palette';

const css = readFileSync(fileURLToPath(new URL('./palettes.css', import.meta.url)), 'utf8');
const block = css.match(/:root\s*\{([^}]+)\}/)?.[1];
if (!block) throw new Error('Bloco :root ausente em palettes.css');
const colors = Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+):\s*(#[\da-fA-F]{6})/g), match => [match[1], match[2]]));

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0]! + .7152 * channels[1]! + .0722 * channels[2]!;
}

function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0]! + .05) / (values[1]! + .05);
}

const pairs = [
  ['--ink', '--paper'], ['--ink-2', '--paper'], ['--accent', '--paper'],
  ['--paper', '--ink'], ['--paper', '--accent'],
  ['--night-ink', '--night'], ['--night-ink-2', '--night'], ['--night-accent', '--night'],
  ['--night', '--night-accent'], ['--inverse-muted', '--ink'], ['--inverse-accent', '--ink'],
  ['--status-live', '--paper'], ['--status-building', '--paper'],
  ['--status-bottleneck', '--paper'], ['--status-planned', '--paper'],
  ['--status-building', '--status-building-bg'],
  ['--paper', '--status-live'], ['--paper', '--status-bottleneck'],
  ['--status-ok-icon', '--paper'], ['--status-broken-icon', '--paper'],
  ['--night-ok-icon', '--night'], ['--night-broken-icon', '--night'],
  ['--success', '--success-bg'], ['--error', '--error-bg'], ['--info', '--info-bg'], ['--warning', '--warning-bg'],
  ['--example-ink', '--example-a'], ['--example-ink', '--example-b'],
] as const;

// Borda de controle e foco: componente, não texto. WCAG 1.4.11 pede 3:1 contra o fundo ao lado.
const components = [
  ['--control-border', '--paper'], ['--control-border', '--paper-2'],
  ['--focus-on-dark', '--night'], ['--focus-on-dark', '--night-2'], ['--accent', '--paper'], ['--accent', '--paper-2'],
] as const;

describe('paleta Anil', () => {
  it('é a única paleta e vive no :root', () => {
    expect(Object.keys(colors).length).toBeGreaterThanOrEqual(19);
    expect(css).not.toMatch(/data-palette|data-swatch/);
  });

  it('texto e estados têm contraste mínimo de 4,5:1', () => {
    for (const [foreground, background] of pairs) {
      expect(contrast(colors[foreground]!, colors[background]!), `${foreground} em ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('borda de controle e anel de foco têm 3:1 no fundo onde aparecem (F44)', () => {
    for (const [foreground, background] of components) {
      expect(contrast(colors[foreground]!, colors[background]!), `${foreground} em ${background}`).toBeGreaterThanOrEqual(3);
    }
    // O azul do foco no claro não serve no escuro: foi o 2,36:1 da faixa.
    expect(contrast(colors['--accent']!, colors['--night']!)).toBeLessThan(3);
  });

  it('o exemplo não usa a cor de erro nem a de aviso (F44)', () => {
    const example = [colors['--example-a'], colors['--example-b'], colors['--example-ink']];
    for (const taken of ['--error', '--error-bg', '--warning', '--warning-bg', '--status-bottleneck', '--status-building', '--status-building-bg']) {
      expect(example).not.toContain(colors[taken]);
    }
  });

  it('a tinta em canais (--ink-rgb) é a mesma tinta, também no ::backdrop', () => {
    const channels = colors['--ink']!.slice(1).match(/../g)!.map((channel: string) => parseInt(channel, 16)).join(',');
    const copies = Array.from(css.matchAll(/--ink-rgb:\s*([\d,\s]+)/g), match => match[1]!.replace(/\s/g, ''));
    expect(copies).toHaveLength(2);
    for (const copy of copies) expect(copy).toBe(channels);
  });

  it('as imagens geradas no build usam os mesmos valores do CSS', () => {
    expect(ANIL.paper).toBe(colors['--paper']);
    expect(ANIL.paper2).toBe(colors['--paper-2']);
    expect(ANIL.paper3).toBe(colors['--paper-3']);
    expect(ANIL.ink).toBe(colors['--ink']);
    expect(ANIL.ink2).toBe(colors['--ink-2']);
    expect(ANIL.accent).toBe(colors['--accent']);
    expect(ANIL.accentLight).toBe(colors['--night-accent']);
    expect(ANIL.building).toBe(colors['--status-building']);
    expect(ANIL.buildingBg).toBe(colors['--status-building-bg']);
  });
});
