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

  it('as imagens geradas no build usam os mesmos valores do CSS', () => {
    expect(ANIL.paper).toBe(colors['--paper']);
    expect(ANIL.paper2).toBe(colors['--paper-2']);
    expect(ANIL.paper3).toBe(colors['--paper-3']);
    expect(ANIL.ink).toBe(colors['--ink']);
    expect(ANIL.ink2).toBe(colors['--ink-2']);
    expect(ANIL.accent).toBe(colors['--red']);
    expect(ANIL.accentLight).toBe(colors['--night-red']);
    expect(ANIL.building).toBe(colors['--status-building']);
    expect(ANIL.buildingBg).toBe(colors['--status-building-bg']);
  });
});
