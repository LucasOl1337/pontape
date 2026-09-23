import { canonicalize } from '../../lib/ledger/canonical';
import { publishedLedger } from '../../lib/ledger/published';

export async function GET() {
  const { checkpoint } = await publishedLedger();
  return new Response(canonicalize(checkpoint), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
