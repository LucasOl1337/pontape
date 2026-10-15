// One state component for every screen (F44, plano 2.2): empty, loading, unavailable, error, success
// and example. Title, body, icon and, when there is one, an action that works. The colour never comes
// alone: the icon and the title say the same thing. StateNote.astro draws the same markup at build;
// stateNote() draws it from a script. Text always goes in as text, never as HTML.
import type { IconName } from '../../components/site/icon-names';

export type StateKind = 'empty' | 'loading' | 'unavailable' | 'error' | 'success' | 'info' | 'example';

export const STATE_ICON: Record<StateKind, IconName> = {
  empty: 'search', loading: 'clock', unavailable: 'pause', error: 'alert', success: 'check-circle', info: 'eye', example: 'doc',
};
// Errors and the loading line are announced; the rest is read in its place.
export const STATE_ROLE: Partial<Record<StateKind, 'alert' | 'status'>> = { error: 'alert', loading: 'status', success: 'status' };

export interface StateAction { label: string; href?: string; onClick?: () => void; primary?: boolean }
export interface StateInput { kind: StateKind; title: string; body?: string | Node | (string | Node)[]; actions?: StateAction[]; id?: string }
