import { readFile } from 'node:fs/promises';
import { envelopesFromStatement, statementGap } from '../../src/lib/ledger/asaas.ts';

// Daily check against Asaas /v3/financialTransactions. Without the sandbox key, nothing is written.
const key = process.env.ASAAS_SANDBOX_KEY;
if (!key) {
  console.log('Conta sandbox ainda não existe. Nada foi alterado.');
  process.exit(0);
}

const api = (process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3').replace(/\/$/, '');
const response = await fetch(`${api}/financialTransactions?limit=100&offset=0`, {
  headers: { access_token: key, accept: 'application/json', 'user-agent': 'pontape' },
});
if (!response.ok) {
  console.error('O extrato não respondeu. O livro não foi alterado.');
  process.exit(1);
}
const body = await response.json() as { data?: unknown[] };
const envelopes = envelopesFromStatement(Array.isArray(body.data) ? body.data : []);
const intake = JSON.parse(await readFile(new URL('../../src/data/ledger/intake.json', import.meta.url), 'utf8')) as { keys?: string[] };
const gap = statementGap(envelopes, intake.keys ?? []);
for (const missing of gap.missingInStatement) {
  console.warn(`AVISO: o livro tem ${missing} e o extrato não. A linha continua no livro.`);
}
if (gap.missingInBook.length === 0) {
  console.log('Extrato e livro batem. Nada foi alterado.');
  process.exit(0);
}
console.log(JSON.stringify({ source: 'asaas', envelopes: gap.missingInBook }));
if (!process.argv.includes('--apply')) console.log('DRY-RUN: o livro não foi alterado.');
