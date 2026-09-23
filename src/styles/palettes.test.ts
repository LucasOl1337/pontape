import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('./palettes.css', import.meta.url)), 'utf8');
const names = ['jornal', 'mata', 'mar', 'ipe', 'sol', 'noite'];

function palette(name: string) {
  const block = css.match(new RegExp(`html\\[data-palette="${name}"\\][^{]*\\{([^}]+)\\}`))?.[1];
  if (!block) throw new Error(`Paleta ${name} ausente`);
  return Object.fromEntries(Array.from(block.matchAll(/(--[\w-]+):\s*(#[\da-fA-F]{6})/g), match => [match[1], match[2]]));
}

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
  ['--ink', '--paper'], ['--ink-2', '--paper'], ['--red', '--paper'],
  ['--paper', '--ink'], ['--paper', '--red'],
  ['--night-ink', '--night'], ['--night-ink-2', '--night'], ['--night-red', '--night'],
  ['--night', '--night-red'], ['--inverse-muted', '--ink'], ['--inverse-accent', '--ink'],
  ['--status-live', '--paper'], ['--status-building', '--paper'],
  ['--status-bottleneck', '--paper'], ['--status-planned', '--paper'],
  ['--status-building', '--status-building-bg'],
  ['--paper', '--status-live'], ['--paper', '--status-bottleneck'],
  ['--status-ok-icon', '--paper'], ['--status-broken-icon', '--paper'],
  ['--night-ok-icon', '--night'], ['--night-broken-icon', '--night'],
] as const;

describe('contraste AA das paletas', () => {
  it.each(names)('%s: texto e estados têm contraste mínimo de 4,5:1', name => {
    const colors = palette(name);
    expect(Object.keys(colors).length).toBeGreaterThanOrEqual(19);
    for (const [foreground, background] of pairs) {
      expect(contrast(colors[foreground]!, colors[background]!), `${name}: ${foreground} em ${background}`).toBeGreaterThanOrEqual(4.5);
    }
    if (name === 'noite') expect(luminance(colors['--night']!)).toBeGreaterThan(luminance(colors['--paper']!));
  });
});
