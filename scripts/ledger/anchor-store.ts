import { execFileSync } from 'node:child_process';
import { mkdtemp, open, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalize, parseJson } from '../../src/lib/ledger/canonical.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { verifyDocument } from '../../src/lib/ledger/verify.ts';
import { readAnchors, fileDigest, publicBytes } from '../../src/lib/ledger/anchors.ts';
import { anchorIndexSchema, anchorSchema, trustConfigurationSchema, type Anchor } from '../../src/lib/ledger/trust.ts';
import { readCanonical, readText, replaceAtomic } from './files.ts';
import { signCheckpoint } from './signing.ts';

export type OtsAdapter = (operation: 'stamp' | 'upgrade', target: string) => Promise<Pick<Anchor, 'status' | 'bitcoin'>>;
export function otsAdapter(python: string): OtsAdapter {
  return async (operation, target) => JSON.parse(execFileSync(python,
    [fileURLToPath(new URL('./ots-proof.py', import.meta.url)), operation, target],
    { encoding: 'utf8', timeout: 120_000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }));
}
interface Options { file: string; configuration: string; directory: string; apply: boolean; key?: string; ots: OtsAdapter }

async function immutableFile(path: string, bytes: Uint8Array) {
  try { await writeFile(path, bytes, { flag: 'wx', mode: 0o644 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || !Buffer.from(bytes).equals(await publicBytes(path))) throw error;
    // Recover after an interrupted index write, only if the orphan is byte-identical.
  }
}

export async function updateAnchors(operation: 'anchor' | 'upgrade', options: Options): Promise<string> {
  const indexPath = join(options.directory, 'index.json');
  const lock = options.apply ? await open(`${indexPath}.lock`, 'wx', 0o600) : undefined;
  let temporary: string | undefined;
  try {
    const document = ledgerDocumentSchema.parse(await readCanonical(options.file));
    if (!(await verifyDocument(document)).valid) throw new Error('Livro inválido.');
    const config = trustConfigurationSchema.parse(parseJson(await readText(options.configuration)));
    const { index } = await readAnchors(options.directory, document.events, config);
    const sequence = document.checkpoint.sequence;
    if (operation === 'anchor' && index.anchors.some(anchor => anchor.sequence === sequence)) return `Checkpoint ${sequence} já ancorado no índice. Sem alteração.`;
    const pending = index.anchors.filter(anchor => anchor.status === 'pending');
    if (!options.apply) return `DRY-RUN: ${operation === 'anchor' ? `assinar e carimbar checkpoint ${sequence}` : `conferir ${pending.length} âncora(s) pendente(s)`}. Sem ler chave, acessar rede ou gravar.`;
    temporary = await mkdtemp(join(tmpdir(), 'pontape-anchor-'));
    if (operation === 'anchor') {
      if (!options.key) throw new Error('--apply exige --key externo.');
      if (sequence === '0' || (index.anchors.at(-1) && BigInt(sequence) <= BigInt(index.anchors.at(-1)!.sequence))) throw new Error('Checkpoint precisa avançar.');
      const signed = await signCheckpoint(document.checkpoint, options.key, config.signature.publicKey);
      const bytes = Buffer.from(canonicalize(signed));
      const name = `checkpoint-${sequence}-assinado.json`;
      const target = join(temporary, name);
      await writeFile(target, bytes);
      const state = await options.ots('stamp', target);
      const proof = await publicBytes(`${target}.ots`);
      const anchor = anchorSchema.parse({ sequence, signedCheckpoint: { file: name, sha256: fileDigest(bytes) },
        proofs: [{ file: `${name}.ots`, sha256: fileDigest(proof) }], ...state });
      // A newly submitted receipt is always pending, regardless of calendar metadata.
      if (anchor.status !== 'pending') throw new Error('Carimbo inicial precisa ficar pendente.');
      await immutableFile(join(options.directory, name), bytes);
      await immutableFile(join(options.directory, `${name}.ots`), proof);
      index.anchors.push(anchor);
    } else {
      for (const anchor of pending) {
        const target = join(temporary, anchor.signedCheckpoint.file);
        await writeFile(target, await publicBytes(join(options.directory, anchor.signedCheckpoint.file)));
        await writeFile(`${target}.ots`, await publicBytes(join(options.directory, anchor.proofs.at(-1)!.file)));
        const state = await options.ots('upgrade', target);
        const proof = await publicBytes(`${target}.ots`);
        const hash = fileDigest(proof);
        const ref = anchor.proofs.find(item => item.sha256 === hash) ?? { file: `${anchor.signedCheckpoint.file}.${hash}.ots`, sha256: hash };
        const next = anchorSchema.parse({ ...anchor, ...state, proofs: anchor.proofs.some(item => item.sha256 === hash) ? anchor.proofs : [...anchor.proofs, ref] });
        await immutableFile(join(options.directory, ref.file), proof);
        Object.assign(anchor, next);
      }
    }
    const updated = anchorIndexSchema.parse(index);
    if (canonicalize(updated) === canonicalize(parseJson((await readFile(indexPath)).toString('utf8')))) return 'Provas continuam pendentes ou já confirmadas. Sem alteração.';
    await replaceAtomic(indexPath, updated);
    return `Índice atualizado localmente. ${updated.anchors.filter(anchor => anchor.status === 'pending').length} pendente(s). Revise o diff antes de integrar.`;
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true });
    if (lock) { await lock.close(); await rm(`${indexPath}.lock`); }
  }
}
