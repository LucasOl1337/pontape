import { canonicalize } from '../../lib/ledger/canonical';
import { ledgerTrust } from '../../lib/ledger/published';

export function GET() {
  return new Response(canonicalize(ledgerTrust), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
