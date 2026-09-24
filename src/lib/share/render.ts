// Build-time images: favicon PNG/ICO and the share card (Open Graph). SVG drawn here and rasterized
// with resvg, using TTF copies of the site fonts kept in src/assets/og/ (never shipped).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { Resvg, type ResvgRenderOptions } from '@resvg/resvg-js';
import { LOGO_VIEWBOX, logoMark } from './logo';
import { ANIL } from './palette';

const ROOT = process.cwd();
// The site's own type (F38): Newsreader for the name and the headline, the turn in italic, and
// Atkinson for the small print, as on the page.
const FONT_FILES = [
  resolve(ROOT, 'src/assets/og/newsreader-display-500.ttf'),
  resolve(ROOT, 'src/assets/og/newsreader-italic-400.ttf'),
  resolve(ROOT, 'src/assets/og/atkinson-next-700.ttf'),
];
export const DISPLAY = "font-family:'Newsreader 16pt';font-weight:500";
export const ITALIC = "font-family:'Newsreader 16pt';font-style:italic;font-weight:400";
const TEXT = "font-family:'Atkinson Hyperlegible Next';font-weight:700";
const INK = ANIL.ink;

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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${ANIL.paper}"/><svg x="3" y="4.5" width="26" height="${(26 * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width}" viewBox="0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}">${logoMark(ANIL.ink, ANIL.accent, 3)}</svg></svg>`;
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
const RIGHT = W - 72;
const COLUMN = 560;

// The home staircase, as on the page (D031): the ground, seven steps and the top, a line that is
// solid up to "alguém" and dotted after, the icons under each tread, the numbers under the floor
// and the AI going along in the accent colour.
const STEP_ICONS = ['scale', 'pin', 'mic', 'plate', 'voice-ai', 'briefcase', 'chart', 'people'];
function stairsArt(): string {
  const n = 9;
  const x0 = 640;
  const w = (RIGHT - x0) / n;
  const floor = 470;
  const u = 36;
  const at = 1;
  const top = (k: number) => floor - k * u;
  let solid = `M${x0} ${floor}`;
  let dotted = '';
  for (let k = 0; k < n; k++) {
    const seg = `${k ? `V${top(k)}` : ''}H${x0 + (k + 1) * w}`;
    if (k <= at) solid += seg;
    else dotted += (dotted ? '' : `M${x0 + k * w} ${top(k - 1)}`) + seg;
  }
  const icons = STEP_ICONS.map((name, i) => icon(name, x0 + (i + 1) * w + w / 2 - 11, top(i + 1) + 8, 22, i + 1 <= at ? INK : ANIL.ink2)).join('');
  const numbers = Array.from({ length: 7 }, (_, i) =>
    `<text x="${x0 + (i + 1.5) * w}" y="${floor + 36}" text-anchor="middle" style="${ITALIC};font-size:28px" fill="${ANIL.accent}">${i + 1}</text>`).join('');
  const walker = `<circle cx="${x0 + (at + 0.5) * w}" cy="${top(at) - 1}" r="11" fill="${ANIL.accent}" stroke="${ANIL.paper}" stroke-width="5"/>`;
  const ball = `<g transform="translate(${x0 + w / 2 - 20} ${floor - 44}) scale(${40 / 48})" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"><circle cx="24" cy="24" r="21"/><path d="M24 16.5l7.1 5.2-2.7 8.4h-8.8l-2.7-8.4ZM24 16.5V3M31.1 21.7l12.8-4.2M28.4 30.1l7.9 10.9M19.6 30.1l-7.9 10.9M16.9 21.7 4.1 17.5"/></g>`;
  const railY = floor + 70;
  const railX = x0 + 1.5 * w;
  const rail = `<line x1="${railX}" y1="${railY}" x2="${RIGHT - 4}" y2="${railY}" stroke="${ANIL.accent}" stroke-width="3"/>`
    + `<path d="M${RIGHT - 14} ${railY - 10}l10 10-10 10" fill="none" stroke="${ANIL.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<rect x="${railX - 18}" y="${railY - 18}" width="36" height="36" fill="${ANIL.paper}"/>` + icon('voice-ai', railX - 14, railY - 14, 28, ANIL.accent);
  return `<line x1="${x0}" y1="${floor}" x2="${RIGHT}" y2="${floor}" stroke="${INK}" stroke-width="1.5"/>`
    + `<path d="${solid}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="miter"/>`
    + `<path d="${dotted}" fill="none" stroke="${ANIL.ink2}" stroke-width="4" stroke-dasharray="4 5"/>`
    + icons + numbers + ball + walker + rail;
}

// The chain of the book, as on /transparencia: sheets, each tied to the one before, all checked.
function chainArt(): string {
  const sheets = 4;
  const w = 92;
  const h = 116;
  const gap = 34;
  const x0 = RIGHT - sheets * w - (sheets - 1) * gap;
  const y = 250;
  return Array.from({ length: sheets }, (_, i) => {
    const x = x0 + i * (w + gap);
    const lines = [26, 44, 62, 80].map(dy => `<line x1="${x + 16}" y1="${y + dy}" x2="${x + w - (dy === 80 ? 40 : 16)}" y2="${y + dy}" stroke="${ANIL.ink2}" stroke-width="3" stroke-linecap="round"/>`).join('');
    const link = i ? `<rect x="${x - gap - 8}" y="${y + h / 2 - 11}" width="${gap + 16}" height="22" rx="11" fill="none" stroke="${INK}" stroke-width="3"/>` : '';
    const seal = `<circle cx="${x + w - 18}" cy="${y + h - 18}" r="15" fill="${ANIL.live}"/><path d="M${x + w - 25} ${y + h - 18}l5 5 9-10" fill="none" stroke="${ANIL.paper}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${ANIL.paper}" stroke="${INK}" stroke-width="3"/>${lines}${link}${seal}`;
  }).join('')
    + `<text x="${x0}" y="${y + h + 56}" style="${TEXT};font-size:22px" fill="${ANIL.ink2}">Cada ação presa na anterior.</text>`;
}

export function shareCardSvg(card: ShareCard): string {
  // Name: as in the header, the mark and the name in Newsreader, across the whole top; shrinks if
  // a long name needs it.
  let nameSize = 54;
  while (nameSize > 32 && measure(card.name, DISPLAY, nameSize) > RIGHT - LEFT - 82) nameSize -= 2;
  // Headline: biggest size that fits the column above the footer; the turn in italic, in anil, on
  // its own line, like "mudar de vida." on the home.
  const topOf = (s: number) => 200 + s * 0.78;
  const lastBaseline = 500;
  let size = 96;
  let lines: string[] = [];
  for (; size >= 48; size -= 4) {
    lines = wrap(card.lead, DISPLAY, size, COLUMN);
    const fitsWidth = measure(card.highlight, ITALIC, size) <= COLUMN;
    if (fitsWidth && topOf(size) + lines.length * size * 1.02 <= lastBaseline) break;
  }
  const lineHeight = size * 1.02;
  const top = topOf(size);
  const headline = [...lines.map((line, i) =>
    `<text x="${LEFT}" y="${top + i * lineHeight}" style="${DISPLAY};font-size:${size}px;letter-spacing:-0.02em" fill="${INK}">${escapeXml(line)}</text>`),
    `<text x="${LEFT}" y="${top + lines.length * lineHeight}" style="${ITALIC};font-size:${size}px;letter-spacing:-0.02em" fill="${ANIL.accent}">${escapeXml(card.highlight)}</text>`].join('');
  const markWidth = 64;
  const markHeight = (markWidth * LOGO_VIEWBOX.height) / LOGO_VIEWBOX.width;
  const markY = 62;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${ANIL.paper}"/>
  <svg x="${LEFT}" y="${markY}" width="${markWidth}" height="${markHeight}" viewBox="-1 -1 ${LOGO_VIEWBOX.width + 2} ${LOGO_VIEWBOX.height + 2}">${logoMark(INK, ANIL.accent, 2.6)}</svg>
  <text x="${LEFT + markWidth + 18}" y="${markY + markHeight - 2}" style="${DISPLAY};font-size:${nameSize}px;letter-spacing:-0.01em" fill="${INK}">${escapeXml(card.name)}</text>
  <rect x="${LEFT}" y="146" width="${RIGHT - LEFT}" height="1.5" fill="${INK}"/>
  <rect x="${LEFT}" y="150.5" width="${RIGHT - LEFT}" height="1.5" fill="${INK}"/>
  ${card.art === 'stairs' ? stairsArt() : chainArt()}
  ${headline}
  <text x="${LEFT}" y="${H - 50}" style="${TEXT};font-size:22px;letter-spacing:0.02em" fill="${ANIL.ink2}">${escapeXml(card.footer)}</text>
</svg>`;
}
