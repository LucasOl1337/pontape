import { canonicalize } from '../../lib/ledger/canonical';
import { publishedLedger } from '../../lib/ledger/published';

export async function GET() {
  return new Response(canonicalize(await publishedLedger()), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
