import type { IconName } from '../site/icon-names';

// One step of a staircase: what it is, where it lives in the address, and its live number.
export interface Stair { id: string; hash: string; label: string; value: string; caption: string; icon: IconName }
