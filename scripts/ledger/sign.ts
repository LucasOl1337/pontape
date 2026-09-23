import { createPrivateKey, createPublicKey, sign } from 'node:crypto';
import { realpath, writeFile } from 'node:fs/promises';
import { relative, isAbsolute, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { canonicalize } from '../../src/lib/ledger/canonical.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { verifyDocument } from '../../src/lib/ledger/verify.ts';
import { signedCheckpointSchema, verifyCheckpointSignature } from '../../src/lib/ledger/signature.ts';
import { defaultLedgerPath, readCanonical, readText } from './files.ts';

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
    const keyPath = await realpath(values.key);
    const projectRoot = await realpath(new URL('../../', import.meta.url));
    // Worktrees live inside the shared repo here; reject that entire tree too.
    const sharedRoot = projectRoot.includes('/.worktrees/') ? projectRoot.split('/.worktrees/')[0]! : projectRoot;
    const relation = relative(sharedRoot, keyPath);
    if (relation !== '..' && !relation.startsWith('../') && !isAbsolute(relation)) throw new Error('Chave privada deve ficar fora do repositório e worktrees.');
    const privateKey = createPrivateKey(await readText(keyPath));
    if (privateKey.asymmetricKeyType !== 'ed25519') throw new Error('Use uma chave Ed25519.');
    const jwk = createPublicKey(privateKey).export({ format: 'jwk' });
    const publicKey = Buffer.from(jwk.x!, 'base64url').toString('hex');
    const signed = signedCheckpointSchema.parse({
      schemaVersion: 1, algorithm: 'Ed25519', publicKey, checkpoint: document.checkpoint,
      signature: sign(null, Buffer.from(canonicalize(document.checkpoint)), privateKey).toString('hex'),
    });
    if (!await verifyCheckpointSignature(signed, publicKey)) throw new Error('Falha ao conferir a assinatura produzida.');
    await writeFile(resolve(values.out), canonicalize(signed), { flag: 'wx', mode: 0o644 });
    console.log('Assinatura criada localmente. Publique apenas a chave pública, após aprovação do custodiante.');
  }
} catch (error) {
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Checkpoint fora do contrato.');
  process.exitCode = 1;
}
