import { CADERNOS, CONSTRUIR } from './cadernos';
import { LIVRO } from './livro';
import { PERGUNTAS } from './perguntas';

// The pages a search engine should know (F38), in the same form as the canonical link: absolute,
// with the final slash of the built folders. The 404 stays out (it is noindex).
export const SITEMAP_PATHS = ['/', LIVRO.href, LIVRO.tecnico, CONSTRUIR.href, ...CADERNOS.map(c => c.href), PERGUNTAS.href];

// The published address. SITE_URL sets it at build (astro.config.mjs); a build without it, on a
// computer, still writes the real domain, since a sitemap only takes absolute addresses.
export const DEFAULT_ORIGIN = 'https://pontape.org';

const absolute = (path: string, origin: URL | string) => new URL(path.endsWith('/') ? path : `${path}/`, origin).href;

export function sitemapXml(origin: URL | string = DEFAULT_ORIGIN): string {
  const urls = SITEMAP_PATHS.map(path => `  <url><loc>${absolute(path, origin)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(origin: URL | string = DEFAULT_ORIGIN): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', origin).href}\n`;
}
