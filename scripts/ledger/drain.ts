import { open, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { envelopesFromWebhook } from '../../src/lib/ledger/asaas.ts';
import { ed25519Seed, importPkcs8Pem, pemBody, publicKeyMatches } from '../../src/lib/ledger/keys.ts';
import { drainAll } from '../../src/lib/ledger/pipeline.ts';
import { PREVIOUS_SIGNING_PUBLIC_KEY, SIGNING_PUBLIC_KEY } from '../../src/lib/ledger/signing-keys.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { defaultLedgerPath, readCanonical, replaceAtomic } from './files.ts';

const intakePath = fileURLToPath(new URL('../../src/data/ledger/intake.json', import.meta.url));
const trustPath = fileURLToPath(new URL('../../src/data/ledger/trust.json', import.meta.url));
const signedPath = fileURLToPath(new URL('../../src/data/ledger/checkpoint-signed.json', import.meta.url));

function batchOf(input: unknown): unknown[] | null {
  if (!input || typeof input !== 'object') return [input];
  const record = input as { source?: unknown; envelopes?: unknown; event?: unknown };
  if (record.source === 'asaas' && Array.isArray(record.envelopes)) return record.envelopes;
  if ('event' in record) {
    const parsed = envelopesFromWebhook(input);
    return parsed.ok ? parsed.envelopes : null;
  }
  return [input];
}

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
    const envelopes = batchOf(envelope);
    if (!envelopes) throw new Error('Envelope recusado.');
    if (envelopes.length === 0) {
      console.log('Evento ignorado. Nada foi alterado.');
    } else {
      const result = await drainAll({
        document, intake, envelopes, privateKey, seed, publicKeyHex: SIGNING_PUBLIC_KEY,
        previousPublicKey: PREVIOUS_SIGNING_PUBLIC_KEY, now: new Date().toISOString(),
      });
      if (result.rejected) throw new Error('Envelope recusado.');
      if (result.appended === 0) {
        console.log('Evento já registrado. Nada foi alterado.');
      } else {
        await replaceAtomic(ledgerPath, result.document);
        await replaceAtomic(intakePath, result.intake);
        if (result.signed) await replaceAtomic(signedPath, result.signed);
        if (result.trust) {
          await replaceAtomic(trustPath, result.trust);
          console.log(`Evento gravado. Registro ${result.trust.witness.id}.`);
        }
        if (result.stampFailed) {
          console.warn('AVISO: o carimbo público falhou. A ação entrou no livro e o carimbo fica pra próxima tentativa.');
        }
      }
    }
  } finally {
    await lock.close();
    await rm(lockPath);
  }
} catch (error) {
  console.error(error instanceof Error && error.name !== 'ZodError' ? error.message : 'Evento ou livro fora do contrato.');
  process.exitCode = 1;
}
