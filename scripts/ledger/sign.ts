import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { canonicalize } from '../../src/lib/ledger/canonical.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { verifyDocument } from '../../src/lib/ledger/verify.ts';
import { signCheckpoint } from './signing.ts';
import { defaultLedgerPath, readCanonical } from './files.ts';

try {
  const { values } = parseArgs({ options: {
    key: { type: 'string' }, out: { type: 'string' }, file: { type: 'string' }, apply: { type: 'boolean', default: false },
  } });
  const document = ledgerDocumentSchema.parse(await readCanonical(values.file ?? defaultLedgerPath));
  const result = await verifyDocument(document);
  if (!result.valid) throw new Error(`Livro inválido: ${result.code}.`);
  if (!values.apply) {
    console.log('DRY-RUN: nenhuma chave lida, assinatura criada ou arquivo alterado.');
    console.log(canonicalize(document.checkpoint));
  } else {
    if (!values.key || !values.out) throw new Error('--apply exige --key arquivo.pem externo e --out arquivo.json novo.');
    const signed = await signCheckpoint(document.checkpoint, values.key);
    await writeFile(resolve(values.out), canonicalize(signed), { flag: 'wx', mode: 0o644 });
    console.log('Assinatura criada localmente. Publique apenas a chave pública, após aprovação do custodiante.');
  }
} catch (error) {
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Checkpoint fora do contrato.');
  process.exitCode = 1;
}
