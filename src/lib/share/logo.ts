// The mark of the site (LogoMark.astro): the steps drawn as one line, with someone, the dot in the
// accent colour, at the foot of them (F38; before, the images still drew the provisional blocks).
// One source for the favicon and the share cards.
import { ANIL } from './palette';

export const LOGO_VIEWBOX = { width: 36, height: 30 };
export const LOGO_PATH = 'M1.5 28.5h9v-9h9v-9h9v-9h6';

export const logoMark = (ink: string = ANIL.ink, accent: string = ANIL.accent, strokeWidth = 2.4) =>
  `<path d="${LOGO_PATH}" fill="none" stroke="${ink}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<circle cx="5.5" cy="23.5" r="3.4" fill="${accent}"/>`;
