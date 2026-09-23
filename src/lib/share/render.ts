// Build-time images: favicon PNG/ICO and the share card (Open Graph). SVG drawn here and rasterized
// with resvg, using TTF copies of the site fonts kept in src/assets/og/ (never shipped).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { Resvg, type ResvgRenderOptions } from '@resvg/resvg-js';
import { LOGO_VIEWBOX, logoRects } from './logo';

const ROOT = process.cwd();
const FONT_FILES = [
  resolve(ROOT, 'src/assets/og/archivo-condensed-800.ttf'),
  resolve(ROOT, 'src/assets/og/atkinson-next-700.ttf'),
];
const POSTER = "font-family:'Archivo Condensed';font-weight:800";
const TEXT = "font-family:'Atkinson Hyperlegible Next';font-weight:700";
const INK = '#16181D';

const resvgOptions = (width?: number): ResvgRenderOptions => ({
  font: { fontFiles: FONT_FILES, loadSystemFonts: false, defaultFontFamily: 'Atkinson Hyperlegible Next' },
  ...(width ? { fitTo: { mode: 'width' as const, value: width } } : {}),
});

// Copied into a plain ArrayBuffer-backed array, which is what Response accepts.
export const renderPng = (svg: string, width?: number): Uint8Array<ArrayBuffer> => new Uint8Array(new Resvg(svg, resvgOptions(width)).render().asPng());

const escapeXml = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

// Width of a line of text, measured by the same renderer that draws it.
export function measure(text: string, style: string, size: number): number {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="${size * 2}"><text x="0" y="${size}" style="${style};font-size:${size}px">${escapeXml(text)}</text></svg>`;
  return new Resvg(svg, resvgOptions()).getBBox()?.width ?? 0;
}

// Greedy wrap by measured width.
export function wrap(text: string, style: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/)) {
    const candidate = lines.length ? `${lines[lines.length - 1]} ${word}` : word;
    if (lines.length && measure(candidate, style, size) <= maxWidth) lines[lines.length - 1] = candidate;
    else lines.push(word);
  }
  return lines;
}

/* ---------- Icons, read from the site's own sprite ---------- */

const SPRITE = readFileSync(resolve(ROOT, 'src/components/site/IconSprite.astro'), 'utf8');
export function iconMarkup(name: string): string {
  const match = SPRITE.match(new RegExp(`<symbol id="i-${name}" viewBox="0 0 24 24">([\\s\\S]*?)</symbol>`));
  if (!match?.[1]) throw new Error(`Ícone não encontrado: ${name}`);
  return match[1];
}
const icon = (name: string, x: number, y: number, size: number, color: string) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconMarkup(name)}</g>`;

/* ---------- Favicon ---------- */

// Paper tile behind the mark so it survives dark browser chrome.
export function faviconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#F4F1EA"/><svg x="3" y="4.5" width="26" height="${(26 * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width}" viewBox="0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}">${logoRects()}</svg></svg>`;
}

// ICO container holding PNG images (supported by every current browser).
export function icoFromPngs(images: { size: number; png: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const header = 6 + 16 * images.length;
  const total = header + images.reduce((sum, i) => sum + i.png.length, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  let offset = header;
  images.forEach(({ size, png }, i) => {
    const entry = 6 + 16 * i;
    view.setUint8(entry, size >= 256 ? 0 : size);
    view.setUint8(entry + 1, size >= 256 ? 0 : size);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, png.length, true);
    view.setUint32(entry + 12, offset, true);
    out.set(png, offset);
    offset += png.length;
  });
  return out;
}

/* ---------- Share card, 1200×630 ---------- */

export interface ShareCard {
  name: string;
  lead: string;
  highlight: string;
  footer: string;
  art: 'stairs' | 'chain';
}

const W = 1200;
const H = 630;
const LEFT = 72;
const COLUMN = 600;

function stairsArt(): string {
  const steps = [
    { fill: '#FFFFFF', icon: 'plate', color: INK },
    { fill: '#DCE2FF', icon: 'shirt', color: INK },
    { fill: '#FF6B3D', icon: 'soap', color: INK },
    { fill: '#1F3FD1', icon: 'voice-ai', color: '#FFFFFF' },
    { fill: INK, icon: 'briefcase', color: '#FF6B3D' },
  ];
  const x0 = 740;
  const w = 76;
  const gap = 12;
  const base = 548;
  const sun = `<circle cx="1060" cy="190" r="118" fill="#FFD8CB" stroke="${INK}" stroke-width="3"/>`;
  return sun + steps.map((s, i) => {
    const h = 120 + i * 62;
    const x = x0 + i * (w + gap);
    const y = base - h;
    return `<rect x="${x + 6}" y="${y + 6}" width="${w}" height="${h}" rx="12" fill="${INK}"/>`
      + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${s.fill}" stroke="${INK}" stroke-width="3"/>`
      + icon(s.icon, x + 18, y + 16, 40, s.color);
  }).join('');
}

function chainArt(): string {
  const links = [
    { fill: '#E9E4D8', icon: 'flag', color: INK, label: 'nº 4' },
    { fill: '#EDE4FB', icon: 'person', color: '#5B21B6', label: 'nº 3' },
    { fill: '#DCE2FF', icon: 'package', color: '#1730A8', label: 'nº 2' },
    { fill: '#FFE4D6', icon: 'coin', color: '#9A3412', label: 'nº 1' },
  ];
  return links.map((l, i) => {
    const x = 770 + (i % 2) * 36;
    const y = 96 + i * 118;
    const connector = i ? `<line x1="${900}" y1="${y - 46}" x2="${900}" y2="${y}" stroke="${INK}" stroke-width="3" stroke-dasharray="8 6"/>` : '';
    return connector
      + `<rect x="${x + 6}" y="${y + 6}" width="330" height="72" rx="14" fill="${INK}"/>`
      + `<rect x="${x}" y="${y}" width="330" height="72" rx="14" fill="${l.fill}" stroke="${INK}" stroke-width="3"/>`
      + icon(l.icon, x + 22, y + 18, 36, l.color)
      + `<text x="${x + 306}" y="${y + 47}" text-anchor="end" style="${TEXT};font-size:26px" fill="#4A4F5A">${l.label}</text>`;
  }).join('');
}

export function shareCardSvg(card: ShareCard): string {
  // Name: shrinks to fit the column when the definitive name is long.
  let nameSize = 58;
  while (nameSize > 32 && measure(card.name, POSTER, nameSize) > COLUMN - 90) nameSize -= 2;
  // Headline: biggest size that fits the column and ends above the footer, the highlight on its own line.
  const topOf = (s: number) => 196 + s * 0.8;
  const lastBaseline = 522;
  let size = 104;
  let lines: string[] = [];
  for (; size >= 48; size -= 4) {
    lines = [...wrap(card.lead, POSTER, size, COLUMN), card.highlight];
    const fitsWidth = measure(card.highlight, POSTER, size) <= COLUMN;
    if (fitsWidth && topOf(size) + (lines.length - 1) * size * 0.98 <= lastBaseline) break;
  }
  const lineHeight = size * 0.98;
  const top = topOf(size);
  const last = lines.length - 1;
  const highlightWidth = measure(card.highlight, POSTER, size);
  const headline = lines.map((line, i) => {
    const y = top + i * lineHeight;
    const band = i === last ? `<rect x="${LEFT - 6}" y="${y - size * 0.34}" width="${highlightWidth + 12}" height="${size * 0.36}" fill="#FF6B3D"/>` : '';
    return `${band}<text x="${LEFT}" y="${y}" style="${POSTER};font-size:${size}px" fill="${INK}">${escapeXml(line)}</text>`;
  }).join('');
  const markWidth = 72;
  const markHeight = (markWidth * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1.4" fill="${INK}" fill-opacity="0.16"/></pattern>
    <pattern id="stripe" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="28" fill="#F4C20D"/><rect x="14" width="14" height="28" fill="${INK}"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#F4F1EA"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <rect width="${W}" height="14" fill="url(#stripe)"/>
  <svg x="${LEFT}" y="68" width="${markWidth}" height="${markHeight}" viewBox="0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}">${logoRects()}</svg>
  <text x="${LEFT + markWidth + 18}" y="${68 + markHeight - 4}" style="${POSTER};font-size:${nameSize}px" fill="${INK}">${escapeXml(card.name)}</text>
  ${card.art === 'stairs' ? stairsArt() : chainArt()}
  ${headline}
  <text x="${LEFT}" y="${H - 44}" style="${TEXT};font-size:26px" fill="#4A4F5A">${escapeXml(card.footer)}</text>
</svg>`;
}
