// Build-only data loader. The browser imports index.ts, never this module.
import source from '../../data/ledger/ledger.json';
import trust from '../../data/ledger/trust.json';
import { ledgerDocumentSchema } from './schema';
import { trustDocumentSchema } from './trust-doc';
import { verifyDocument } from './verify';

export async function publishedLedger() {
  const result = await verifyDocument(source);
  if (!result.valid) throw new Error(`Build interrompido: livro inválido (${result.code}).`);
  return ledgerDocumentSchema.parse(source);
}
export const ledgerTrust = trustDocumentSchema.parse(trust);
