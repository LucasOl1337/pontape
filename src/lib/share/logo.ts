// The provisional mark: three blocks rising like steps (DIRECAO §10). One source for the header,
// the favicon and the share card.
export const LOGO_VIEWBOX = { width: 36, height: 30 };
export const LOGO_RECTS = [
  { x: 1, y: 19, width: 10, height: 10, fill: '#FF6B3D' },
  { x: 13, y: 10, width: 10, height: 19, fill: '#1F3FD1' },
  { x: 25, y: 1, width: 10, height: 28, fill: '#16181D' },
] as const;
export const LOGO_STROKE = '#16181D';

export const logoRects = () => LOGO_RECTS
  .map(r => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="2" fill="${r.fill}" stroke="${LOGO_STROKE}" stroke-width="2"/>`)
  .join('');
