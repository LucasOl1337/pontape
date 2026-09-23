import { canonicalize } from '../../lib/ledger/canonical';
import { publishedLedger } from '../../lib/ledger/published';

export async function GET() {
  const { events } = await publishedLedger();
  return new Response(canonicalize(events), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
