import { parseArgs } from 'node:util';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { verifyDocument, verifyLedger } from '../../src/lib/ledger/verify.ts';
import { defaultLedgerPath, readCanonical } from './files.ts';

try {
  const { values } = parseArgs({ options: { file: { type: 'string' }, checkpoint: { type: 'string' } } });
  const document = ledgerDocumentSchema.parse(await readCanonical(values.file ?? defaultLedgerPath));
  const current = await verifyDocument(document);
  if (!current.valid) throw new Error(`Livro inválido: ${current.code}.`);
  if (values.checkpoint) {
    const known = await verifyLedger(document.events, await readCanonical(values.checkpoint));
    if (!known.valid) throw new Error(`Checkpoint guardado não confere: ${known.code}.`);
  }
  console.log(JSON.stringify(current, null, 2));
  console.log('Integridade interna confere. Assinatura e carimbo externo não são presumidos.');
} catch (error) {
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Livro fora do contrato público.');
  process.exitCode = 1;
}
