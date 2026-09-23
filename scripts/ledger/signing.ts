import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { realpath } from 'node:fs/promises';
import { relative, isAbsolute } from 'node:path';
import { canonicalize } from '../../src/lib/ledger/canonical.ts';
import { ledgerCheckpointSchema } from '../../src/lib/ledger/schema.ts';
import { signedCheckpointSchema, verifyCheckpointSignature } from '../../src/lib/ledger/signature.ts';
import { readText } from './files.ts';

/** Only called after --apply. Never returns/logs private material. */
export async function signCheckpoint(input: unknown, path: string, expectedPublicKey?: string) {
  const checkpoint = ledgerCheckpointSchema.parse(input);
  const keyPath = await realpath(path);
  const projectRoot = await realpath(new URL('../../', import.meta.url));
  const sharedRoot = projectRoot.includes('/.worktrees/') ? projectRoot.split('/.worktrees/')[0]! : projectRoot;
  const relation = relative(sharedRoot, keyPath);
  if (relation !== '..' && !relation.startsWith('../') && !isAbsolute(relation)) throw new Error('Chave privada deve ficar fora do repositório e worktrees.');
  const privateKey = createPrivateKey(await readText(keyPath));
  if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Use uma chave Ed25519.');
  const jwk = createPublicKey(privateKey).export({ format: 'jwk' });
  const publicKey = Buffer.from(jwk.x!, 'base64url').toString('hex');
  if (expectedPublicKey && publicKey !== expectedPublicKey) throw new Error('Chave não corresponde à configuração pública.');
  const signed = signedCheckpointSchema.parse({
    schemaVersion: 1, algorithm: 'Ed25519', publicKey, checkpoint,
    signature: sign(null, Buffer.from(canonicalize(checkpoint)), privateKey).toString('hex'),
  });
  if (!await verifyCheckpointSignature(signed, publicKey)) throw new Error('Falha ao conferir a assinatura produzida.');
  return signed;
}
