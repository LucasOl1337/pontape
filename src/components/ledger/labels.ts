import type { LedgerEvent } from '../../lib/ledger/schema';
import { projectSourceUrl } from '../../lib/ledger/schema';
import { PROJECT_KIND, TYPES, phrase } from '../../lib/ledger-view/phrases';
import { DECISION_TITLES } from '../../data/site/decisions';

// Build-time text for each action, handed to the inspector as JSON. None of it is part of the
// hashed event: `what` comes from closed fields (phrase), `context` is the D013 decision title.
export interface ActionLabel { what: string; kind: string; context?: string; source?: string }

export function labelOf({ payload: p }: LedgerEvent): ActionLabel {
  const label: ActionLabel = {
    what: phrase(p),
    kind: TYPES[p.type].label + (p.type === 'project' ? ` · ${PROJECT_KIND[p.action]}` : ''),
  };
  if (p.type === 'project' && p.action === 'decision_recorded' && DECISION_TITLES[p.decisionId]) label.context = DECISION_TITLES[p.decisionId];
  const source = projectSourceUrl(p);
  if (source) label.source = source;
  return label;
}

export const labelsOf = (events: LedgerEvent[]) => Object.fromEntries(events.map(e => [e.sequence, labelOf(e)]));
