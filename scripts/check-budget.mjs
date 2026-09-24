// Measures the DIRECAO §11 budget on the built site: per page, HTML + CSS + JS (following static
// imports) gzipped up to 60 KB; all fonts up to 120 KB. Run after `npm run build`.
/* global console, process */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const PAGE_LIMIT = 60 * 1024;
const FONT_LIMIT = 120 * 1024;
const PAGES = [
  'index.html', 'transparencia/index.html',
  // The technical layer of the book (F32), behind "Parte técnica".
  'transparencia/tecnico/index.html',
  // The builder cadernos (F31), each a page of its own.
  'construir/index.html', 'construir/pecas/index.html', 'construir/gargalos/index.html',
  'construir/tarefas/index.html', 'construir/codigo-aberto/index.html',
];

const gz = buffer => gzipSync(buffer, { level: 9 }).length;
const kb = bytes => `${(bytes / 1024).toFixed(1)} KB`;

// Static imports load with the page; dynamic ones (import("./x.js")) load on demand, e.g. the
// ledger verifier on the first Conferir. Both must fit: the page alone and the page after a click.
function assetsOf(html) {
  const found = new Set(html.match(/\/_astro\/[^"')\s]+\.(?:css|js)/g) ?? []);
  const lazy = new Set();
  const queue = [...found].filter(p => p.endsWith('.js'));
  while (queue.length) {
    const js = readFileSync(join(DIST, queue.pop()), 'utf8');
    for (const [, name] of js.matchAll(/(?:from|import)\s*["'`]\.\/([^"'`]+\.js)["'`]/g)) {
      const path = `/_astro/${name}`;
      if (!found.has(path)) { found.add(path); queue.push(path); }
    }
    for (const [, name] of js.matchAll(/import\(\s*["'`]\.\/([^"'`]+\.js)["'`]\s*\)/g)) lazy.add(`/_astro/${name}`);
  }
  return { eager: [...found], lazy: [...lazy].filter(p => !found.has(p)) };
}

let failed = false;
for (const page of PAGES) {
  const html = readFileSync(join(DIST, page), 'utf8');
  const { eager, lazy } = assetsOf(html);
  const rows = [[page, gz(html)], ...eager.map(p => [p, gz(readFileSync(join(DIST, p)))])];
  const lazyRows = lazy.map(p => [p, gz(readFileSync(join(DIST, p)))]);
  const total = rows.reduce((sum, [, size]) => sum + size, 0);
  const withLazy = total + lazyRows.reduce((sum, [, size]) => sum + size, 0);
  const limit = PAGE_LIMIT;
  const ok = withLazy <= limit;
  failed ||= !ok;
  console.log(`${ok ? 'ok ' : 'NÃO'} ${page}: ${kb(total)} ao abrir, ${kb(withLazy)} com o que carrega sob demanda, de ${kb(limit)}`);
  for (const [name, size] of rows) console.log(`      ${kb(size).padStart(8)}  ${name}`);
  for (const [name, size] of lazyRows) console.log(`      ${kb(size).padStart(8)}  ${name} (sob demanda)`);
}

const fonts = readdirSync(join(DIST, 'fonts')).filter(f => f.endsWith('.woff2'));
const fontTotal = fonts.reduce((sum, f) => sum + readFileSync(join(DIST, 'fonts', f)).length, 0);
failed ||= fontTotal > FONT_LIMIT;
console.log(`${fontTotal <= FONT_LIMIT ? 'ok ' : 'NÃO'} fontes: ${kb(fontTotal)} de ${kb(FONT_LIMIT)} (${fonts.length} arquivos)`);

if (failed) process.exit(1);
