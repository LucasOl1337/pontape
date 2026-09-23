import { canonicalize } from '../../lib/ledger/canonical';
import { publishedAuthentication } from '../../lib/ledger/published';

export async function GET() {
  return new Response(canonicalize((await publishedAuthentication()).trust), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
