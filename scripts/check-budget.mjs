// Measures the DIRECAO §11 budget on the built site: per page, HTML + CSS + JS (following static
// imports) gzipped up to 60 KB; all fonts up to 120 KB. Run after `npm run build`.
/* global console, process */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const PAGE_LIMIT = 60 * 1024;
const FONT_LIMIT = 120 * 1024;
const PAGES = ['index.html', 'transparencia/index.html'];

const gz = buffer => gzipSync(buffer, { level: 9 }).length;
const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`;

function assetsOf(html) {
  const found = new Set(html.match(/\/_astro\/[^"')\s]+\.(?:css|js)/g) ?? []);
  const queue = [...found].filter(p => p.endsWith('.js'));
  while (queue.length) {
    const js = readFileSync(join(DIST, queue.pop()), 'utf8');
    for (const [, name] of js.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) {
      const path = `/_astro/${name}`;
      if (!found.has(path)) { found.add(path); queue.push(path); }
    }
  }
  return [...found];
}

let failed = false;
for (const page of PAGES) {
  const html = readFileSync(join(DIST, page), 'utf8');
  const rows = [[page, gz(html)], ...assetsOf(html).map(p => [p, gz(readFileSync(join(DIST, p)))])];
  const total = rows.reduce((sum, [, size]) => sum + size, 0);
  const ok = total <= PAGE_LIMIT;
  failed ||= !ok;
  console.log(`${ok ? 'ok ' : 'NÃO'} ${page}: ${kb(total)} de ${kb(PAGE_LIMIT)}`);
  for (const [name, size] of rows) console.log(`      ${kb(size).padStart(8)}  ${name}`);
}

const fonts = readdirSync(join(DIST, 'fonts')).filter(f => f.endsWith('.woff2'));
const fontTotal = fonts.reduce((sum, f) => sum + readFileSync(join(DIST, 'fonts', f)).length, 0);
failed ||= fontTotal > FONT_LIMIT;
console.log(`${fontTotal <= FONT_LIMIT ? 'ok ' : 'NÃO'} fontes: ${kb(fontTotal)} de ${kb(FONT_LIMIT)} (${fonts.length} arquivos)`);

if (failed) process.exit(1);
