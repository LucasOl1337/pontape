import { open, readFile, rename, rm, stat } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { canonicalize, parseCanonicalJson } from '../../src/lib/ledger/canonical.ts';

export const defaultLedgerPath = new URL('../../src/data/ledger/ledger.json', import.meta.url);

export async function readText(path: string | URL): Promise<string> {
  if ((await stat(path)).size > 32 * 1024 * 1024) throw new Error('Arquivo excede 32 MiB.');
  return readFile(path, 'utf8');
}

export async function readCanonical(path: string | URL): Promise<unknown> {
  return parseCanonicalJson(await readText(path));
}

/** Caller holds the cooperative writer lock; rename publishes a complete document. */
export async function replaceAtomic(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const file = await open(temporary, 'wx', 0o644);
    try {
      await file.writeFile(canonicalize(value));
      await file.sync();
    } finally { await file.close(); }
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}
