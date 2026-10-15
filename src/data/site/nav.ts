import { ALIMENTA } from '../alimenta/rede';
import { CONSTRUIR } from './cadernos';
import { CURRICULO } from './curriculo';
import { DIREITOS } from './direitos';
import { LIVRO } from './livro';
import { PERGUNTAS } from './perguntas';

// Where each link of the header, the strip and the footer goes (F44, plano 1.1, 2.3 e 2.6). The same
// HTML is served on pontape.org and on alimenta.pontape.org, and there a relative "/" lands on the Rede
// Alimenta. So a link to the project uses the project address in full. A link of the service stays
// relative: it keeps the person on the host she came in by. Without SITE_URL (a build on a computer)
// every link stays relative.
export const projectHref = (path: string, site?: URL | string) => (site ? new URL(path, site).href : path);

// The ids the home really has (Escada.astro and index.astro). A link to the home only points at these;
// the checker in nav.test.ts holds the list against the markup.
export const HOME_IDS = { comecar: 'comecar', comoFunciona: 'como-funciona' } as const;

export type Section = 'home' | 'alimenta' | 'transparencia' | 'construir' | 'perguntas' | 'ferramentas' | 'not-found';
export interface NavLink { href: string; label: string; path?: string; section?: Section; hit?: string }

export function projectNav(site?: URL | string, onHome = false): NavLink[] {
  const p = (path: string) => projectHref(path, site);
  return [
    { href: onHome ? `#${HOME_IDS.comoFunciona}` : p(`/#${HOME_IDS.comoFunciona}`), label: 'Como funciona' },
    { href: ALIMENTA.href, label: ALIMENTA.name, path: ALIMENTA.href, section: 'alimenta' },
    { href: p(LIVRO.href), label: 'Transparência', path: LIVRO.href, section: 'transparencia' },
    { href: p(CONSTRUIR.href), label: CONSTRUIR.name, path: CONSTRUIR.href, section: 'construir' },
    { href: p(PERGUNTAS.href), label: PERGUNTAS.name, path: PERGUNTAS.href, section: 'perguntas' },
  ];
}

// The service header of the Rede Alimenta (2.3): its own short menu and, last, the way back.
export function serviceNav(site?: URL | string): NavLink[] {
  return [
    { href: ALIMENTA.distribuidores, label: 'Onde doar', path: ALIMENTA.distribuidores },
    { href: ALIMENTA.doar, label: 'Registrar', path: ALIMENTA.doar },
    { href: ALIMENTA.minhas, label: 'Minhas doações', path: ALIMENTA.minhas },
    { href: projectHref('/', site), label: 'Voltar ao PontaPé' },
  ];
}

// The footer in four groups (2.6): the project, the service, the free tools and how to reach someone.
export function footerGroups(site?: URL | string): { title: string; links: NavLink[] }[] {
  const p = (path: string) => projectHref(path, site);
  return [
    { title: 'O projeto', links: [
      { href: p('/'), label: 'O que é o PontaPé' },
      { href: p(LIVRO.href), label: 'Livro público de todas as ações', hit: 'transparencia' },
      { href: p(CONSTRUIR.href), label: 'Pra quem quer construir junto' },
    ] },
    { title: ALIMENTA.name, links: [
      { href: ALIMENTA.distribuidores, label: 'Onde doar comida' },
      { href: ALIMENTA.doar, label: 'Registrar uma doação' },
      { href: ALIMENTA.minhas, label: 'Minhas doações' },
    ] },
    { title: 'Ferramentas de graça', links: [
      { href: p(CURRICULO.href), label: CURRICULO.name },
      { href: p(DIREITOS.href), label: DIREITOS.name },
    ] },
    { title: 'Falar com a gente', links: [
      { href: p(`${PERGUNTAS.href}#${PERGUNTAS.contactHash}`), label: 'Falar com quem cuida do projeto' },
      { href: p(PERGUNTAS.href), label: 'Perguntas e respostas', hit: 'perguntas' },
    ] },
  ];
}

// Where the person is (2.3): the compact trail on the service pages. The first step goes back to the
// project, in full, for whoever arrived at an inner page by a link from WhatsApp or a QR code.
export function serviceTrail(here: string | null, site?: URL | string) {
  const trail: { href?: string; label: string }[] = [{ href: projectHref('/', site), label: 'PontaPé' }];
  trail.push(here ? { href: ALIMENTA.href, label: ALIMENTA.name } : { label: ALIMENTA.name });
  if (here) trail.push({ label: here });
  return trail;
}
