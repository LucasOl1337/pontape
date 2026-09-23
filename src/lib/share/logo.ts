// The provisional mark: three blocks rising like steps (DIRECAO §10), in the Anil palette (D030):
// light anil, anil, ink. One source for the favicon and the share card.
import { ANIL } from './palette';

export const LOGO_VIEWBOX = { width: 36, height: 30 };
export const LOGO_RECTS = [
  { x: 1, y: 19, width: 10, height: 10, fill: ANIL.accentLight },
  { x: 13, y: 10, width: 10, height: 19, fill: ANIL.accent },
  { x: 25, y: 1, width: 10, height: 28, fill: ANIL.ink },
] as const;
export const LOGO_STROKE = ANIL.ink;

export const logoRects = () => LOGO_RECTS
  .map(r => `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" rx="2" fill="${r.fill}" stroke="${LOGO_STROKE}" stroke-width="2"/>`)
  .join('');
