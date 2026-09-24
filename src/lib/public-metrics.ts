export interface PublicMetrics {
  visits: number;
  peopleToday: number;
  peopleSevenDays: number;
  sealChecks: number;
  conversations: number;
  stepsOpened: number;
}

export const METRIC_KEYS = ['visits', 'peopleToday', 'peopleSevenDays', 'sealChecks', 'conversations', 'stepsOpened'] as const;

export function isPublicMetrics(value: unknown): value is PublicMetrics {
  return Boolean(value && typeof value === 'object' && METRIC_KEYS.every(key => {
    const count = (value as Record<string, unknown>)[key];
    return typeof count === 'number' && Number.isSafeInteger(count) && count >= 0;
  }));
}

let snapshotPromise: Promise<PublicMetrics | null> | undefined;

// Astro renders static HTML at build time. The current public count is embedded in the HTML,
// so a visitor without JavaScript sees the last count known at that build.
export function buildMetricsSnapshot() {
  snapshotPromise ??= (async () => {
    try {
      const url = process.env.METRICS_SNAPSHOT_URL || 'https://pontape.org/api/stats/public';
      const response = await fetch(url, { signal: AbortSignal.timeout(2500), cache: 'no-store' });
      if (!response.ok) return null;
      const value: unknown = await response.json();
      return isPublicMetrics(value) ? value : null;
    } catch { return null; }
  })();
  return snapshotPromise;
}
