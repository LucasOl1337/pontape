import { createHash } from 'node:crypto';
import console from 'node:console';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import process from 'node:process';

const HASH_TOKEN = /^'sha256-[A-Za-z0-9+/]+={0,2}'$/;
const CSP_LINE = /^[ \t]+Content-Security-Policy:[ \t]*([^\r\n]+)$/gm;

async function htmlPaths(directory) {
  const paths = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await htmlPaths(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) paths.push(path);
  }
  return paths;
}

async function inlineScriptHashes(directory) {
  const files = await htmlPaths(directory);
  if (files.length === 0) throw new Error('Nenhum HTML encontrado no build.');
  const hashes = new Set();
  for (const file of files) {
    const html = await readFile(file, 'utf8');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
    const openings = [...html.matchAll(/<script\b/gi)];
    if (openings.length !== scripts.length) throw new Error(`Tag <script> sem fechamento reconhecido: ${file}`);
    for (const [, attributes, body] of scripts) {
      if (/(?:^|\s)src(?:\s|=|$)/i.test(attributes)) continue;
      const hash = createHash('sha256').update(body, 'utf8').digest('base64');
      hashes.add(`'sha256-${hash}'`);
    }
  }
  return { files: files.length, hashes: [...hashes].sort() };
}

function policyIn(headers) {
  const matches = [...headers.matchAll(CSP_LINE)];
  if (matches.length !== 1) throw new Error('Esperada uma única linha Content-Security-Policy em _headers.');
  const line = matches[0];
  const directives = line[1].split(';').map((part) => part.trim()).filter(Boolean);
  if (directives.some((part) => /^script-src-elem(?:\s|$)/.test(part))) {
    throw new Error('script-src-elem substituiria os hashes de script-src; remova essa diretiva.');
  }
  if (directives.some((part) => /^script-src(?:-attr)?(?:\s|$)/.test(part) && /'unsafe-inline'/i.test(part))) {
    throw new Error('unsafe-inline não é permitido para scripts.');
  }
  const indexes = directives.flatMap((part, index) => /^script-src(?:\s|$)/.test(part) ? [index] : []);
  if (indexes.length !== 1) throw new Error('Esperada uma única diretiva script-src.');
  const index = indexes[0];
  const tokens = directives[index].split(/\s+/).slice(1);
  if (!tokens.includes("'self'")) throw new Error("script-src deve conter 'self'.");
  for (const token of tokens) {
    if (token !== "'self'" && !HASH_TOKEN.test(token)) {
      throw new Error(`Fonte não permitida em script-src: ${token}`);
    }
  }
  return { line: line[0], directives, index, tokens };
}

function verify(headers, expected) {
  const { tokens } = policyIn(headers);
  const actual = tokens.filter((token) => token !== "'self'");
  if (actual.length !== expected.length || actual.some((token, index) => token !== expected[index])) {
    throw new Error('script-src não corresponde aos scripts embutidos do build. Rode a geração da CSP.');
  }
}

async function main() {
  const action = process.argv[2];
  if (action !== 'generate' && action !== 'verify') {
    throw new Error('Uso: node scripts/csp-headers.mjs generate|verify [diretório-dist]');
  }
  const directory = resolve(process.argv[3] ?? 'dist');
  const { files, hashes } = await inlineScriptHashes(directory);
  const headersPath = join(directory, '_headers');
  let headers = await readFile(headersPath, 'utf8');
  if (action === 'generate') {
    const { line, directives, index } = policyIn(headers);
    directives[index] = ["script-src 'self'", ...hashes].join(' ');
    const replacement = line.replace(/Content-Security-Policy:[ \t]*[^\r\n]+$/, `Content-Security-Policy: ${directives.join('; ')}`);
    if (replacement.length > 2000) throw new Error('Linha CSP excede 2.000 caracteres do _headers. Externalize scripts.');
    headers = headers.replace(line, replacement);
    await writeFile(headersPath, headers);
  }
  verify(headers, hashes);
  console.log(`CSP ${action}: ${files} HTML, ${hashes.length} hash(es) de script embutido.`);
}

main().catch((error) => {
  console.error(`CSP: ${error.message}`);
  process.exitCode = 1;
});
