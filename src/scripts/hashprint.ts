// A mark's fingerprint: 16 bars from the first 16 bytes of the hash. Change one character of an
// action and its mark changes whole, so the fingerprint changes whole too. Used at build (Astro)
// and in the browser (inspector, broken-chain view), so both draw the same picture.
export const HASHPRINT_VIEWBOX = '0 0 32 14';

export function hashPath(hash: string): string {
  let d = '';
  for (let i = 0; i < 16; i++) {
    const byte = parseInt(hash.slice(i * 2, i * 2 + 2), 16) || 0;
    const height = 1.5 + (byte / 255) * 11;
    d += `M${i * 2 + 1} 13V${(13 - height).toFixed(1)}`;
  }
  return d;
}

export const hashPrintSvg = (hash: string, className = 'hashprint') =>
  `<svg class="${className}" viewBox="${HASHPRINT_VIEWBOX}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${hashPath(hash)}" vector-effect="non-scaling-stroke"/></svg>`;

export const shortHash = (h: string) => `${h.slice(0, 4)} ${h.slice(4, 8)}`;

// "22/09/2026, às 22:24" in the project's time zone.
export function recordedText(iso: string): string {
  const d = new Date(iso);
  const tz = { timeZone: 'America/Sao_Paulo' } as const;
  return `${d.toLocaleDateString('pt-BR', tz)}, às ${d.toLocaleTimeString('pt-BR', { ...tz, hour: '2-digit', minute: '2-digit' })}`;
}
