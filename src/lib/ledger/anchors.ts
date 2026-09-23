// Build/operator only. Never export this filesystem reader from the browser barrel.
import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseJson, parseCanonicalJson } from './canonical.ts';
import { anchorIndexSchema, createTrust, verifyPublishedSignature, type PublishedAuthentication } from './trust.ts';
import { signedCheckpointSchema } from './signature.ts';

export const fileDigest = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
export async function publicBytes(path: string): Promise<Buffer> {
  const info = await lstat(path);
  if (!info.isFile() || info.size > 4 * 1024 * 1024) throw new Error('Arquivo público inválido ou acima de 4 MiB.');
  return readFile(path);
}
export async function readAnchors(directory: string, events: unknown, configuration: unknown) {
  const index = anchorIndexSchema.parse(parseJson((await publicBytes(join(directory, 'index.json'))).toString('utf8')));
  let authentication: PublishedAuthentication = { trust: createTrust(configuration, index), signedCheckpoint: null };
  for (const anchor of index.anchors) {
    for (const ref of [anchor.signedCheckpoint, ...anchor.proofs]) {
      if (fileDigest(await publicBytes(join(directory, ref.file))) !== ref.sha256) throw new Error('Hash de arquivo da âncora não confere.');
    }
    const signedCheckpoint = signedCheckpointSchema.parse(parseCanonicalJson((await publicBytes(join(directory, anchor.signedCheckpoint.file))).toString('utf8')));
    const trust = createTrust(configuration, { schemaVersion: 1, anchors: [anchor] });
    if (!(await verifyPublishedSignature(events, trust, signedCheckpoint)).valid) throw new Error('Assinatura ou prefixo da âncora não confere.');
    authentication = { trust, signedCheckpoint };
  }
  return { index, authentication };
}
