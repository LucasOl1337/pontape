type HitKind = 'step' | 'seal' | 'yume_open' | 'share' | 'link';

export function sendHit(kind: HitKind, target?: string) {
  const body = JSON.stringify({ kind, path: location.pathname, ...(target ? { target } : {}) });
  const blob = new Blob([body], { type: 'application/json' });
  if (navigator.sendBeacon?.('/api/hit', blob)) return;
  void fetch('/api/hit', { method: 'POST', body: blob, keepalive: true }).catch(() => {});
}
