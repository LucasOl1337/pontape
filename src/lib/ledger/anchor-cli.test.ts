import { generateKeyPairSync } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateAnchors, type OtsAdapter } from '../../../scripts/ledger/anchor-store';
import { canonicalize } from './canonical';
import { appendEvent, createCheckpoint } from './verify';
import { readAnchors } from './anchors';

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'pontape-anchor-test-')); dirs.push(dir);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const key = join(dir, 'key.pem'); await writeFile(key, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  const configuration = join(dir, 'trust.json');
  const config = { schemaVersion: 1, signature: { status: 'configured', algorithm: 'Ed25519', custodian: 'Regente', publicKey: Buffer.from(publicKey.export({ format: 'jwk' }).x!, 'base64url').toString('hex') }, mirror: 'not_configured' };
  await writeFile(configuration, JSON.stringify(config));
  const events = await appendEvent([], { type: 'field', action: 'food_delivered', quantity: '1', occurredOn: '2000-01-01', correctionOf: null }, '2000-01-02T12:00:00.000Z');
  const file = join(dir, 'ledger.json'); await writeFile(file, canonicalize({ events, checkpoint: createCheckpoint(events, '2000-01-02T12:00:00.000Z') }));
  const directory = join(dir, 'anchors'); await mkdir(directory);
  await writeFile(join(directory, 'index.json'), canonicalize({ schemaVersion: 1, anchors: [] }));
  // Simulated transport; no real timestamp submission or Bitcoin connection in Node tests.
  const ots = vi.fn<OtsAdapter>(async (_operation, target) => { await writeFile(`${target}.ots`, 'RECIBO FICTÍCIO'); return { status: 'pending', bitcoin: null }; });
  return { file, configuration, directory, key, ots, apply: true, config, events };
}

describe('operação de âncoras sem rede e com chave efêmera', () => {
  it('dry-run não lê chave, chama OTS ou grava; CLI funciona sem Python instalado', async () => {
    const options = await setup(); const before = await readdir(options.directory);
    expect(await updateAnchors('anchor', { ...options, key: '/inexistente', apply: false })).toContain('DRY-RUN');
    expect(options.ots).not.toHaveBeenCalled(); expect(await readdir(options.directory)).toEqual(before);
    expect(execFileSync(process.execPath, ['scripts/ledger/anchor-upgrade.ts', '--file', options.file, '--configuration', options.configuration, '--directory', options.directory, '--python', '/inexistente'], { encoding: 'utf8' })).toContain('DRY-RUN');
  });
  it('assina, indexa, repete sem rede e mantém originais ao completar prova', async () => {
    const options = await setup();
    await updateAnchors('anchor', options);
    const original = await readFile(join(options.directory, 'checkpoint-1-assinado.json'));
    expect(original.toString()).not.toContain('PRIVATE');
    expect((await readAnchors(options.directory, options.events, options.config)).index.anchors).toHaveLength(1);
    expect(await updateAnchors('anchor', options)).toContain('Sem alteração'); expect(options.ots).toHaveBeenCalledTimes(1);
    const indexBefore = await readFile(join(options.directory, 'index.json'));
    expect(await updateAnchors('upgrade', options)).toContain('Sem alteração');
    expect(await readFile(join(options.directory, 'index.json'))).toEqual(indexBefore);
    const upgraded: OtsAdapter = async (_operation, target) => { await writeFile(`${target}.ots`, 'PROVA COMPLETA FICTÍCIA'); return { status: 'confirmed', bitcoin: { height: '1', blockHash: 'a'.repeat(64), attestedAt: '2000-01-01T00:00:00.000Z', verifiedAt: '2000-01-02T00:00:00.000Z' } }; };
    await updateAnchors('upgrade', { ...options, ots: upgraded });
    const updated = (await readAnchors(options.directory, options.events, options.config)).index.anchors[0]!;
    expect(updated.status).toBe('confirmed'); expect(updated.proofs).toHaveLength(2);
    expect(await readFile(join(options.directory, 'checkpoint-1-assinado.json'))).toEqual(original);
    expect(await readFile(join(options.directory, 'checkpoint-1-assinado.json.ots'), 'utf8')).toBe('RECIBO FICTÍCIO');
  });
  it('recusa chave no repo, chave diferente, falha de OTS e confirmação inventada', async () => {
    const options = await setup(); const indexBefore = await readFile(join(options.directory, 'index.json'));
    await expect(updateAnchors('anchor', { ...options, key: 'package.json' })).rejects.toThrow('fora do repositório');
    const other = await setup();
    await expect(updateAnchors('anchor', { ...options, key: other.key })).rejects.toThrow('não corresponde');
    await expect(updateAnchors('anchor', { ...options, ots: async () => { throw new Error('network'); } })).rejects.toThrow();
    await expect(updateAnchors('anchor', { ...options, ots: async (_operation, target) => { await writeFile(`${target}.ots`, 'FICTÍCIO'); return { status: 'confirmed', bitcoin: null }; } })).rejects.toThrow();
    expect(await readFile(join(options.directory, 'index.json'))).toEqual(indexBefore);
    expect(await readdir(options.directory)).toEqual(['index.json']);
  });
  it('recusa arquivo alterado e preserva lock de outro escritor', async () => {
    const options = await setup(); await updateAnchors('anchor', options);
    const indexBefore = await readFile(join(options.directory, 'index.json'));
    await writeFile(join(options.directory, 'checkpoint-1-assinado.json.ots'), 'ADULTERADO');
    await expect(updateAnchors('upgrade', options)).rejects.toThrow('Hash');
    expect(await readFile(join(options.directory, 'index.json'))).toEqual(indexBefore);
    const lock = join(options.directory, 'index.json.lock'); await writeFile(lock, 'outro');
    await expect(updateAnchors('anchor', options)).rejects.toThrow();
    expect(await readFile(lock, 'utf8')).toBe('outro');
  });
});
