import { writeFile } from 'node:fs/promises';
import { canonicalize, parseCanonicalJson } from '../../src/lib/ledger/canonical.ts';
import { ledgerDocumentSchema } from '../../src/lib/ledger/schema.ts';
import { createCheckpoint, verifyDocument, verifyLedger } from '../../src/lib/ledger/verify.ts';
import { signedCheckpointSchema, verifyCheckpointSignature } from '../../src/lib/ledger/signature.ts';
import { defaultLedgerPath, readCanonical } from '../ledger/files.ts';
import { CliError, ROOT, inputPath, integer, str, usage, type Context } from './core.ts';
import { join } from 'node:path';

export async function runLedger(ctx: Context): Promise<unknown> {
  const { values } = ctx;
  if (ctx.command.name === 'ledger init') {
    const path = inputPath(ctx, 'out')!;
    await writeFile(path, canonicalize({ events: [], checkpoint: createCheckpoint([], new Date().toISOString()) }), { flag: 'wx', mode: 0o644 });
    return { path, events: 0, purpose: 'Livro vazio para testes locais.' };
  }
  if (values.remote && values.file) usage('--remote e --file são exclusivos.');
  if (ctx.command.name === 'ledger trust') {
    const metadata = values.remote ? await (await import('./http.ts')).getJson(ctx, '/livro/trust.json')
      : await readCanonical(join(ROOT, 'src/data/ledger/trust.json'));
    return { metadata, externalWitnessVerified: false, note: 'Metadados declarados pelo publicador. Não constituem verificação criptográfica do registro externo.' };
  }
  const input = values.remote
    ? parseCanonicalJson(await (await import('./http.ts')).getText(ctx, '/livro/ledger.json'))
    : await readCanonical(inputPath(ctx, 'file') ?? defaultLedgerPath);
  const verified = await verifyDocument(input);
  if (!verified.valid) throw new CliError('INVALID_LEDGER', 'A integridade do livro não confere.', 1, verified);
  const document = ledgerDocumentSchema.parse(input);
  switch (ctx.command.name) {
    case 'ledger verify': {
      if (Boolean(values.signed) !== Boolean(values['public-key'])) usage('--signed e --public-key devem ser usados juntos.');
      const checkpointPath = inputPath(ctx, 'checkpoint');
      if (checkpointPath) {
        const result = await verifyLedger(document.events, await readCanonical(checkpointPath));
        if (!result.valid) throw new CliError('INVALID_CHECKPOINT', 'O checkpoint guardado não confere.', 1, result);
      }
      let signature: unknown = { checked: false };
      const signedPath = inputPath(ctx, 'signed');
      if (signedPath) {
        const signed = signedCheckpointSchema.safeParse(await readCanonical(signedPath));
        const key = str(values, 'public-key')!;
        if (!signed.success || !await verifyCheckpointSignature(signed.data, key)
          || !(await verifyLedger(document.events, signed.data.checkpoint)).valid) {
          throw new CliError('INVALID_SIGNATURE', 'Assinatura, chave confiada ou vínculo com o livro não confere.');
        }
        signature = { checked: true, valid: true, signedThrough: signed.data.checkpoint.sequence,
          coversHead: signed.data.checkpoint.sequence === document.checkpoint.sequence };
      }
      return { ...verified, savedCheckpointChecked: Boolean(checkpointPath), signature, externalWitnessVerified: false };
    }
    case 'ledger summary': return { ...verified, checkpoint: document.checkpoint,
      byType: document.events.reduce<Record<string, number>>((counts, event) => {
        counts[event.payload.type] = (counts[event.payload.type] ?? 0) + 1; return counts;
      }, {}) };
    case 'ledger list': {
      const after = integer(str(values, 'after'), 0, 0);
      const limit = integer(str(values, 'limit'), 50, 1, 1000);
      const matching = document.events.filter(event => Number(event.sequence) > after && (!values.type || event.payload.type === values.type));
      const events = matching.slice(0, limit);
      return { total: document.events.length, matching: matching.length, events,
        nextAfter: matching.length > events.length ? events.at(-1)!.sequence : null };
    }
    case 'ledger show': {
      const sequence = integer(str(values, 'sequence'), 1);
      const event = document.events[sequence - 1];
      if (!event) throw new CliError('NOT_FOUND', 'Evento não encontrado.', 4);
      return event;
    }
    case 'ledger export': {
      const out = inputPath(ctx, 'out');
      if (!out) return document;
      await writeFile(out, canonicalize(document), { flag: 'wx', mode: 0o644 });
      return { path: out, events: document.events.length };
    }
  }
}
