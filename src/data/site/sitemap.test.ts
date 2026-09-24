import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITEMAP_PATHS, robotsTxt, sitemapXml } from './sitemap';

const PAGES = fileURLToPath(new URL('../../pages/', import.meta.url));
const astroPages = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? astroPages(join(dir, entry.name)) : entry.name.endsWith('.astro') ? [join(dir, entry.name)] : []);
const routeOf = (file: string) => `/${relative(PAGES, file).replace(/\.astro$/, '').replace(/(^|\/)index$/, '')}`.replace(/\/$/, '') || '/';

describe('sitemap', () => {
  it('lista toda página do site, menos o 404', () => {
    const routes = astroPages(PAGES).map(routeOf).filter(r => r !== '/404' && r !== '/doar').sort();
    expect([...SITEMAP_PATHS].sort()).toEqual(routes);
  });

  it('usa endereço absoluto, com a barra final do link canônico', () => {
    const xml = sitemapXml(new URL('https://pontape.org'));
    expect(xml).toContain('<loc>https://pontape.org/</loc>');
    expect(xml).toContain('<loc>https://pontape.org/transparencia/tecnico/</loc>');
    expect(xml.match(/<loc>/g)).toHaveLength(SITEMAP_PATHS.length);
  });

  it('o robots.txt aponta pro sitemap', () => {
    expect(robotsTxt(new URL('https://pontape.org'))).toContain('Sitemap: https://pontape.org/sitemap.xml');
  });
});
