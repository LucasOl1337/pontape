// Build-only data loader. The browser imports index.ts, never this module.
import { fileURLToPath } from 'node:url';
import source from '../../data/ledger/ledger.json';
import configuration from '../../data/ledger/trust.json';
import anchors from '../../../public/livro/ancoras/index.json';
import { ledgerDocumentSchema } from './schema';
import { verifyDocument } from './verify';
import { anchorIndexSchema, createTrust } from './trust';
import { readAnchors } from './anchors';

export const anchorIndex = anchorIndexSchema.parse(anchors);
export const ledgerTrust = createTrust(configuration, anchorIndex);
export const latestAnchor = anchorIndex.anchors.at(-1);
export async function publishedAuthentication() {
  return (await readAnchors(fileURLToPath(new URL('../../../public/livro/ancoras/', import.meta.url)), source.events, configuration)).authentication;
}
export async function publishedLedger() {
  const result = await verifyDocument(source);
  if (!result.valid) throw new Error(`Build interrompido: livro inválido (${result.code}).`);
  await publishedAuthentication();
  return ledgerDocumentSchema.parse(source);
}
