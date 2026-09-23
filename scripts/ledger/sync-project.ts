import { open, realpath, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { appendEvent, createCheckpoint, verifyDocument } from '../../src/lib/ledger/verify.ts';
import { defaultLedgerPath, readCanonical, replaceAtomic } from './files.ts';
import { collectProjectFacts } from './project-sources.ts';
import { planProjectEvents } from './project-plan.ts';

try {
  const { values } = parseArgs({ options: { apply: { type: 'boolean', default: false } } });
  const { head, facts } = collectProjectFacts();
  const file = await realpath(fileURLToPath(defaultLedgerPath));
  const lockPath = `${file}.lock`;
  const lock = values.apply ? await open(lockPath, 'wx', 0o600) : undefined;
  try {
    const document = ledgerDocumentSchema.parse(await readCanonical(file));
    const checked = await verifyDocument(document);
    if (!checked.valid) throw new Error(`Livro inválido: ${checked.code}.`);
    const pending = planProjectEvents(document.events, facts);
    if (pending.length === 0) {
      console.log(`Projeto já conciliado em ${head}. Nenhum arquivo alterado.`);
    } else {
      const now = new Date().toISOString();
      let events = document.events;
      for (const payload of pending) events = await appendEvent(events, payload, now);
      const updated = { events, checkpoint: createCheckpoint(events, now) };
      const result = await verifyDocument(updated);
      if (!result.valid) throw new Error(`Livro resultante inválido: ${result.code}.`);
      if (values.apply) await replaceAtomic(file, updated);
      console.log(`${values.apply ? 'APLICADO' : 'DRY-RUN'}: ${pending.length} fato(s) do projeto em ${head}.`);
      console.log(JSON.stringify(pending, null, 2));
    }
  } finally {
    if (lock) { await lock.close(); await rm(lockPath); }
  }
} catch {
  // Avoid dumping API responses, command environments or any credential into the log.
  console.error('Falha ao reconciliar projeto. Confira autenticação, histórico completo, tabela de decisões e ledger:verify. Nenhum push foi feito por este comando.');
  process.exitCode = 1;
}
