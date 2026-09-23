import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { defaultLedgerPath } from './files.ts';
import { otsAdapter, updateAnchors } from './anchor-store.ts';

export async function anchorCli(operation: 'anchor' | 'upgrade') {
  try {
    const { values } = parseArgs({ options: {
      apply: { type: 'boolean', default: false }, key: { type: 'string' }, python: { type: 'string', default: 'python3' },
      file: { type: 'string', default: fileURLToPath(defaultLedgerPath) },
      configuration: { type: 'string', default: fileURLToPath(new URL('../../src/data/ledger/trust.json', import.meta.url)) },
      directory: { type: 'string', default: fileURLToPath(new URL('../../public/livro/ancoras/', import.meta.url)) },
    } });
    console.log(await updateAnchors(operation, { ...values, ots: otsAdapter(values.python) }));
  } catch {
    console.error('Âncora não aplicada. Confira livro, índice/lock, chave externa correspondente e ambiente OTS. Nenhuma publicação foi feita.');
    process.exitCode = 1;
  }
}
