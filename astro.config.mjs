import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import process from 'node:process';

export default defineConfig({
  output: 'static',
  // Final address of the site, set at build (SITE_URL=https://...) once the domain exists.
  // It turns share previews and the canonical link into absolute URLs.
  site: process.env.SITE_URL || undefined,
  integrations: [react()],
});
