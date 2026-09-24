// Renamed from LucasOl1337/VidaNova on 23/09/2026; GitHub redirects the old URL.
// Lives in ledger-view, not in ledger, so a page script builds the same links without loading the
// verifier chunk (ledger-core, astro.config.mjs).
export const REPOSITORY_URL = 'https://github.com/LucasOl1337/pontape';

type ProjectLink = { type: string; action?: string; sourceCommit?: string; pullRequest?: string };

/** Links are derived from restricted references, never accepted as arbitrary input. */
export function projectSourceUrl(payload: ProjectLink): string | null {
  if (payload.type !== 'project' || !payload.action) return null;
  switch (payload.action) {
    case 'repository_created': return REPOSITORY_URL;
    case 'decision_recorded': return `${REPOSITORY_URL}/blob/${payload.sourceCommit}/docs/DECISOES.md`;
    case 'pull_request_merged': return `${REPOSITORY_URL}/pull/${payload.pullRequest}`;
    case 'signing_key_rotated': return `${REPOSITORY_URL}/blob/main/src/data/ledger/signing-public.pem`;
    default: return null;
  }
}
