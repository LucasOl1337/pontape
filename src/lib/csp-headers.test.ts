import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../scripts/csp-headers.mjs', import.meta.url));
const template = readFileSync(fileURLToPath(new URL('../../public/_headers', import.meta.url)), 'utf8');

function run(action: 'generate' | 'verify', directory: string) {
  return spawnSync(process.execPath, [script, action, directory], { encoding: 'utf8' });
}

function hash(content: string) {
  return `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
}

describe('CSP dos HTML gerados', () => {
  it('falha antes da geração e cobre scripts embutidos de todas as páginas depois', () => {
    const directory = mkdtempSync(join(tmpdir(), 'vidanova-csp-'));
    try {
      mkdirSync(join(directory, 'subpagina'));
      writeFileSync(join(directory, '_headers'), template);
      writeFileSync(join(directory, 'index.html'), '<script>window.a = 1;</script><script src="/_astro/app.js"></script>');
      writeFileSync(join(directory, 'subpagina', 'index.html'), '<script type="module">window.b = 2;</script>');

      expect(run('verify', directory).status).not.toBe(0);
      expect(run('generate', directory).status).toBe(0);
      expect(run('verify', directory).status).toBe(0);
      const headers = readFileSync(join(directory, '_headers'), 'utf8');
      expect(headers).toContain(hash('window.a = 1;'));
      expect(headers).toContain(hash('window.b = 2;'));
      expect(headers).not.toContain("script-src 'self' 'unsafe-inline'");

      writeFileSync(join(directory, 'subpagina', 'index.html'), '<script type="module">window.b = 3;</script>');
      expect(run('verify', directory).status).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejeita unsafe-inline em script-src', () => {
    const directory = mkdtempSync(join(tmpdir(), 'vidanova-csp-'));
    try {
      writeFileSync(join(directory, 'index.html'), '<script>window.a = 1;</script>');
      writeFileSync(join(directory, '_headers'), template.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"));
      expect(run('generate', directory).status).not.toBe(0);
      expect(run('verify', directory).status).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejeita script-src-elem que substituiria os hashes gerados', () => {
    const directory = mkdtempSync(join(tmpdir(), 'vidanova-csp-'));
    try {
      writeFileSync(join(directory, 'index.html'), '<script>window.a = 1;</script>');
      writeFileSync(join(directory, '_headers'), template.replace("script-src-attr 'none'", "script-src-elem 'self'; script-src-attr 'none'"));
      expect(run('generate', directory).status).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('libera só o arquivo do contador da Cloudflare, e nenhuma outra origem (#55)', () => {
    const directory = mkdtempSync(join(tmpdir(), 'vidanova-csp-'));
    try {
      writeFileSync(join(directory, 'index.html'), '<script>window.a = 1;</script>');
      writeFileSync(join(directory, '_headers'), template);
      expect(run('generate', directory).status).toBe(0);
      const headers = readFileSync(join(directory, '_headers'), 'utf8');
      expect(headers).toContain("script-src 'self' https://static.cloudflareinsights.com/beacon.min.js 'sha256-");
      expect(headers).toContain("connect-src 'self' https://cloudflareinsights.com;");
      expect(run('verify', directory).status).toBe(0);

      writeFileSync(join(directory, '_headers'), template.replace("script-src 'self'", "script-src 'self' https://static.cloudflareinsights.com"));
      expect(run('generate', directory).status).not.toBe(0);
      writeFileSync(join(directory, '_headers'), template.replace("script-src 'self'", "script-src 'self' https://exemplo.com/x.js"));
      expect(run('generate', directory).status).not.toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
