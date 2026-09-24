import { open, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ed25519Seed, importPkcs8Pem, pemBody, publicKeyMatches } from '../../src/lib/ledger/keys.ts';
import { drainOne } from '../../src/lib/ledger/pipeline.ts';
import { PREVIOUS_SIGNING_PUBLIC_KEY, SIGNING_PUBLIC_KEY } from '../../src/lib/ledger/signing-keys.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { defaultLedgerPath, readCanonical, replaceAtomic } from './files.ts';

const intakePath = fileURLToPath(new URL('../../src/data/ledger/intake.json', import.meta.url));
const trustPath = fileURLToPath(new URL('../../src/data/ledger/trust.json', import.meta.url));
const signedPath = fileURLToPath(new URL('../../src/data/ledger/checkpoint-signed.json', import.meta.url));

try {
  const { values } = parseArgs({ options: {
    'event-json': { type: 'string' }, apply: { type: 'boolean', default: false },
  } });
  if (!values['event-json']) throw new Error('Use --event-json \'{"source","eventId","payload"}\' [--apply].');
  const envelope: unknown = JSON.parse(values['event-json']);
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
    const document = ledgerDocumentSchema.parse(await readCanonical(defaultLedgerPath));
    const intake = JSON.parse(await readFile(intakePath, 'utf8')) as { keys: string[] };
    const result = await drainOne({
      document, intake, envelope, privateKey, seed, publicKeyHex: SIGNING_PUBLIC_KEY,
      previousPublicKey: PREVIOUS_SIGNING_PUBLIC_KEY, now: new Date().toISOString(),
    });
    if ('rejected' in result) throw new Error('Envelope recusado.');
    if (result.duplicate) {
      console.log('Evento já registrado. Nada foi alterado.');
    } else {
      await replaceAtomic(ledgerPath, result.document);
      await replaceAtomic(intakePath, result.intake);
      await replaceAtomic(trustPath, result.trust);
      await replaceAtomic(signedPath, result.signed);
      console.log(`Evento gravado. Registro ${result.trust.witness.id}.`);
    }
  } finally {
    await lock.close();
    await rm(lockPath);
  }
} catch (error) {
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Evento ou livro fora do contrato.');
  process.exitCode = 1;
}
