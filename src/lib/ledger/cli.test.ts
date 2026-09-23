import { generateKeyPairSync } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import fixture from '../../data/ledger/example.fixture.json';
import { canonicalize } from './canonical';
import { createCheckpoint, verifyDocument } from './verify';
import { verifyCheckpointSignature } from './signature';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'vidanova-ledger-test-')); directories.push(dir);
  const file = join(dir, 'ledger.json'); const event = join(dir, 'event.json');
  await writeFile(file, canonicalize({ events: [], checkpoint: createCheckpoint([], '2000-01-01T00:00:00.000Z') }));
  await writeFile(event, JSON.stringify(fixture.payloads[2]));
  return { file, event };
}
function append(file: string, event: string, ...flags: string[]): string {
  return execFileSync(process.execPath, ['scripts/ledger/append.ts', '--file', file, '--event', event, ...flags], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
describe('CLI de publicação', () => {
  it('não altera bytes no dry-run; --apply grava documento verificável', async () => {
    const { file, event } = await setup(); const before = await readFile(file, 'utf8');
    expect(append(file, event)).toContain('DRY-RUN');
    expect(await readFile(file, 'utf8')).toBe(before);
    expect(append(file, event, '--apply')).toContain('gravado');
    const document = JSON.parse(await readFile(file, 'utf8'));
    expect(await verifyDocument(document)).toMatchObject({ valid: true, eventCount: 1 });
    expect(execFileSync(process.execPath, ['scripts/ledger/verify.ts', '--file', file], { encoding: 'utf8' })).toContain('"valid": true');
  });
  it('recusa campo privado e entrada duplicada antes de gravar', async () => {
    const { file, event } = await setup(); const before = await readFile(file, 'utf8');
    for (const input of [JSON.stringify({ ...fixture.payloads[2], cpf: 'FICTÍCIO' }), '{"type":"field","type":"project"}']) {
      await writeFile(event, input);
      expect(() => append(file, event, '--apply')).toThrow();
      expect(await readFile(file, 'utf8')).toBe(before);
    }
  });
  it('não remove lock de outro escritor', async () => {
    const { file, event } = await setup(); await writeFile(`${file}.lock`, 'outro escritor');
    expect(() => append(file, event, '--apply')).toThrow();
    expect(await readFile(`${file}.lock`, 'utf8')).toBe('outro escritor');
  });
  it('serializa escritores concorrentes sem perder evento nem bifurcar', async () => {
    const { file, event } = await setup();
    const run = () => new Promise<number | null>((resolve) => {
      const child = spawn(process.execPath, ['scripts/ledger/append.ts', '--file', file, '--event', event, '--apply'], { stdio: 'ignore' });
      child.on('close', resolve);
    });
    const results = await Promise.all([run(), run()]);
    const successes = results.filter(code => code === 0).length;
    expect(successes).toBeGreaterThanOrEqual(1);
    const document = JSON.parse(await readFile(file, 'utf8'));
    expect(await verifyDocument(document)).toMatchObject({ valid: true, eventCount: successes });
  });
  it('assina somente com chave externa e nunca sobrescreve a assinatura', async () => {
    const { file } = await setup();
    const key = `${file}.test-key.pem`; const out = `${file}.signed.json`;
    const { privateKey } = generateKeyPairSync('ed25519');
    await writeFile(key, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    const args = ['scripts/ledger/sign.ts', '--file', file, '--key', key, '--out', out, '--apply'];
    execFileSync(process.execPath, args, { stdio: 'pipe' });
    const signed = JSON.parse(await readFile(out, 'utf8'));
    expect(await verifyCheckpointSignature(signed, signed.publicKey)).toBe(true);
    expect(await readFile(out, 'utf8')).not.toContain('PRIVATE');
    expect(() => execFileSync(process.execPath, args, { stdio: 'pipe' })).toThrow();
    expect(() => execFileSync(process.execPath, ['scripts/ledger/sign.ts', '--file', file,
      '--key', 'package.json', '--out', out, '--apply'], { stdio: 'pipe' })).toThrow(/fora do repositório/);
  });
  it('assinatura em dry-run não precisa nem lê uma chave', async () => {
    const { file } = await setup();
    expect(execFileSync(process.execPath, ['scripts/ledger/sign.ts', '--file', file, '--key', '/nonexistent/key.pem'], { encoding: 'utf8' })).toContain('DRY-RUN');
  });
});
