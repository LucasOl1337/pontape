// Build-only data loader. The browser imports index.ts, never this module.
import source from '../../data/ledger/ledger.json';
import trust from '../../data/ledger/trust.json';
import { z } from 'zod';
import { ledgerDocumentSchema } from './schema';
import { verifyDocument } from './verify';

export async function publishedLedger() {
  const result = await verifyDocument(source);
  if (!result.valid) throw new Error(`Build interrompido: livro inválido (${result.code}).`);
  return ledgerDocumentSchema.parse(source);
}
export const ledgerTrust = z.strictObject({
  signature: z.literal('not_configured'), timestamp: z.literal('not_anchored'), mirror: z.literal('not_configured'),
}).parse(trust);
