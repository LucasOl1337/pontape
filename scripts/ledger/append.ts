import { open, realpath, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { canonicalize, parseJson } from '../../src/lib/ledger/canonical.ts';
import { ledgerDocumentSchema, ledgerPayloadSchema } from '../../src/lib/ledger/schema.ts';
import { appendEvent, createCheckpoint, verifyDocument } from '../../src/lib/ledger/verify.ts';
import { defaultLedgerPath, readCanonical, readText, replaceAtomic } from './files.ts';

try {
  const { values } = parseArgs({ options: {
    event: { type: 'string' }, file: { type: 'string' }, apply: { type: 'boolean', default: false },
  } });
  if (!values.event) throw new Error('Use --event caminho.json [--file livro.json] [--apply].');
  // Validate before taking a lock or writing anything.
  const payload = ledgerPayloadSchema.parse(parseJson(await readText(values.event)));
  const file = await realpath(resolve(values.file ?? fileURLToPath(defaultLedgerPath)));
  const lockPath = `${file}.lock`;
  const lock = values.apply ? await open(lockPath, 'wx', 0o600) : undefined;
  try {
    const document = ledgerDocumentSchema.parse(await readCanonical(file));
    const result = await verifyDocument(document);
    if (!result.valid) throw new Error(`Livro inválido: ${result.code}.`);
    const now = new Date().toISOString();
    const events = await appendEvent(document.events, payload, now);
    const updated = { events, checkpoint: createCheckpoint(events, now) };
    if (values.apply) await replaceAtomic(file, updated);
    console.log(values.apply ? 'Evento gravado localmente. Nenhum deploy realizado.' : 'DRY-RUN: nenhum arquivo foi alterado.');
    console.log(canonicalize(events.at(-1)));
  } finally {
    if (lock) { await lock.close(); await rm(lockPath); }
  }
} catch (error) {
  // Do not print submitted values or full Zod details to logs.
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Evento ou livro fora do contrato público.');
  process.exitCode = 1;
}
