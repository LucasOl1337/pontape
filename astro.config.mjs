import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import process from 'node:process';

export default defineConfig({
  output: 'static',
  // Final address of the site, set at build (SITE_URL=https://...) once the domain exists.
  // It turns share previews and the canonical link into absolute URLs.
  site: process.env.SITE_URL || undefined,
  integrations: [react()],
  // Old phones (#87): the Android 11 of the studio phone comes with Chrome 83, and many entry-level
  // phones keep an old WebView. Without this the minifier writes media queries as ranges
  // (width>=960px, Chrome 104) and merges longhands back into shorthands those browsers drop, and the
  // scripts keep syntax like ??= (Chrome 85). With it the same rules and code come out in a form
  // they read; newer browsers get the same result.
  vite: {
    build: {
      target: ['chrome83', 'edge88', 'firefox78', 'safari14'],
      cssTarget: ['chrome83', 'edge88', 'firefox78', 'safari14'],
    },
  },
});
