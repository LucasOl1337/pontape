import { describe, expect, it } from 'vitest';
import { DISPLAY, faviconSvg, icoFromPngs, measure, renderPng, shareCardSvg } from './render';
import { SHARE } from '../../data/site/share';
import { PROJECT_NAME } from '../../data/site/project';
import { ANIL } from './palette';
import { LOGO_PATH } from './logo';

const pngSize = (png: Uint8Array) => {
  const view = new DataView(png.buffer, png.byteOffset);
  return { width: view.getUint32(16), height: view.getUint32(20) };
};
const texts = (svg: string) => [...svg.matchAll(/<text[^>]*font-size:(\d+)px[^>]*>([^<]*)<\/text>/g)].map(m => ({ size: Number(m[1]), text: m[2]! }));

describe('prévia de compartilhamento', () => {
  it('usa a identidade do site: Newsreader, a marca em linha e o texto alternativo sem os cinco degraus antigos', () => {
    for (const card of Object.values(SHARE)) {
      const svg = shareCardSvg(card);
      expect(svg).toContain("Newsreader 16pt");
      expect(svg).not.toContain('Archivo');
      expect(svg).toContain(LOGO_PATH);
      expect(card.alt).not.toMatch(/cinco degraus/);
    }
  });

  it('gera 1200×630 pra cada página, com o nome do projeto', () => {
    for (const card of Object.values(SHARE)) {
      expect(pngSize(renderPng(shareCardSvg(card)))).toEqual({ width: 1200, height: 630 });
      expect(texts(shareCardSvg(card)).map(t => t.text)).toContain(PROJECT_NAME);
    }
  });

  it('encolhe um nome longo e mantém o título em até quatro linhas dentro da coluna', () => {
    const svg = shareCardSvg({ ...SHARE.home, name: 'Associação Degrau por Degrau do Brasil' });
    const [name, ...rest] = texts(svg);
    expect(name!.size).toBeLessThan(54);
    expect(measure(name!.text, DISPLAY, name!.size)).toBeLessThanOrEqual(974);
    const headline = rest.filter(t => t.size > 40);
    expect(headline.length).toBeLessThanOrEqual(4);
    for (const line of headline.slice(0, -1)) expect(measure(line.text, DISPLAY, line.size)).toBeLessThanOrEqual(560);
    expect(headline.at(-1)!.text).toBe(SHARE.home.highlight);
  });
});

describe('ícone do site', () => {
  it('tem fundo de papel e a marca do site: a escada em linha e alguém em anil', () => {
    const svg = faviconSvg();
    expect(svg).toContain(ANIL.paper);
    expect(svg).toContain(LOGO_PATH);
    expect(svg).toContain(`fill="${ANIL.accent}"`);
  });

  it('monta um ICO válido com PNGs de 16, 32 e 48', () => {
    const images = [16, 32, 48].map(size => ({ size, png: renderPng(faviconSvg(), size) }));
    const ico = icoFromPngs(images);
    const view = new DataView(ico.buffer);
    expect([view.getUint16(0, true), view.getUint16(2, true), view.getUint16(4, true)]).toEqual([0, 1, 3]);
    images.forEach(({ size, png }, i) => {
      const entry = 6 + 16 * i;
      expect(view.getUint8(entry)).toBe(size);
      const offset = view.getUint32(entry + 12, true);
      expect(pngSize(ico.slice(offset, offset + png.length))).toEqual({ width: size, height: size });
    });
  });
});
