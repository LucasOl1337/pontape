import { open, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ed25519Seed, importPkcs8Pem, pemBody, publicKeyMatches } from '../../src/lib/ledger/keys.ts';
import { stampHead } from '../../src/lib/ledger/pipeline.ts';
import { PREVIOUS_SIGNING_PUBLIC_KEY, SIGNING_PUBLIC_KEY } from '../../src/lib/ledger/signing-keys.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { verifyDocument } from '../../src/lib/ledger/verify.ts';
import { defaultLedgerPath, readCanonical, replaceAtomic } from './files.ts';

const trustPath = fileURLToPath(new URL('../../src/data/ledger/trust.json', import.meta.url));
const signedPath = fileURLToPath(new URL('../../src/data/ledger/checkpoint-signed.json', import.meta.url));

try {
  const { values } = parseArgs({ options: { apply: { type: 'boolean', default: false } } });
  if (!values.apply) {
    console.log('DRY-RUN: nenhum arquivo foi alterado e o secret não foi lido.');
    process.exit(0);
  }
  const pem = process.env.LEDGER_SIGNING_PKCS8;
  if (!pem) throw new Error('LEDGER_SIGNING_PKCS8 ausente.');
  const privateKey = await importPkcs8Pem(pem);
  const seed = ed25519Seed(pemBody(pem));
  if (!await publicKeyMatches(privateKey, SIGNING_PUBLIC_KEY)) throw new Error('O secret não é a chave pública publicada.');
  const ledgerPath = fileURLToPath(defaultLedgerPath);
  const lockPath = `${ledgerPath}.lock`;
  const lock = await open(lockPath, 'wx', 0o600);
  try {
    const raw = await readCanonical(defaultLedgerPath);
    const verdict = await verifyDocument(raw);
    if (!verdict.valid) throw new Error('O livro não confere. Nada foi carimbado.');
    const document = ledgerDocumentSchema.parse(raw);
    const result = await stampHead({
      checkpoint: document.checkpoint, privateKey, seed, publicKeyHex: SIGNING_PUBLIC_KEY,
      previousPublicKey: PREVIOUS_SIGNING_PUBLIC_KEY,
    });
    await replaceAtomic(trustPath, result.trust);
    await replaceAtomic(signedPath, result.signed);
    console.log(`Checkpoint ${document.checkpoint.sequence} carimbado. Registro ${result.trust.witness.id}.`);
  } finally {
    await lock.close();
    await rm(lockPath);
  }
} catch (error) {
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Livro ou carimbo fora do contrato.');
  process.exitCode = 1;
}
