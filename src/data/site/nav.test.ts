import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { footerGroups, projectHref, projectNav, serviceNav, serviceTrail } from './nav';

// F44, plano 1.1, 2.3 e 2.6. The same HTML is served on pontape.org and on alimenta.pontape.org. On the
// service host the Worker serves /alimenta/* and the assets, and sends the rest to pontape.org
// (worker.js). So a relative link to the project, opened on the service host, lands somewhere else.
const SITE = 'https://pontape.org';
const SERVICE = 'https://alimenta.pontape.org';

// Where a link opens, by the Worker rule for the service host: the root is the Rede Alimenta page,
// /alimenta/* stays, everything else goes to the project. Fragment kept apart.
function opens(href: string, host: string): { page: string; hash: string } {
  const url = new URL(href, `${host}/`);
  let page = url.origin + url.pathname.replace(/\/$/, '');
  if (url.origin === SERVICE) {
    if (url.pathname === '/' || url.pathname === '') page = `${SITE}/alimenta`;
    else if (url.pathname.startsWith('/alimenta')) page = `${SITE}${url.pathname.replace(/\/$/, '')}`;
    else page = `${SITE}${url.pathname.replace(/\/$/, '')}`;
  }
  return { page, hash: url.hash.slice(1) };
}

describe('links do cabeçalho e do rodapé por host (1.1)', () => {
  const project = projectNav(SITE);
  it('com SITE_URL, todo link do projeto é absoluto no endereço do projeto', () => {
    for (const l of project.filter(x => x.section !== 'alimenta')) expect(l.href.startsWith(`${SITE}/`)).toBe(true);
    for (const g of footerGroups(SITE)) for (const l of g.links) if (!l.href.startsWith('/alimenta')) expect(l.href.startsWith(`${SITE}/`)).toBe(true);
  });

  it('o mesmo link abre a mesma página nos dois hosts', () => {
    const all = [...project, ...serviceNav(SITE), ...footerGroups(SITE).flatMap(g => g.links), ...serviceTrail('Doar', SITE).filter(t => t.href).map(t => ({ href: t.href! }))];
    for (const l of all) expect(opens(l.href, SERVICE), l.href).toEqual(opens(l.href, SITE));
  });

  it('"Voltar ao PontaPé" e o primeiro passo da trilha levam ao início do projeto, não à Rede Alimenta', () => {
    const back = serviceNav(SITE).at(-1)!;
    expect(back.label).toBe('Voltar ao PontaPé');
    expect(opens(back.href, SERVICE).page).toBe(SITE);
    expect(opens(serviceTrail('Doar', SITE)[0]!.href!, SERVICE).page).toBe(SITE);
  });

  it('sem SITE_URL (build num computador) os links ficam relativos', () => {
    expect(projectHref('/perguntas')).toBe('/perguntas');
    expect(projectNav(undefined).every(l => l.href.startsWith('/'))).toBe(true);
  });

  it('o menu do serviço é curto: onde doar, registrar, minhas doações e voltar', () => {
    expect(serviceNav(SITE).map(l => l.label)).toEqual(['Onde doar', 'Registrar', 'Painel', 'Minhas doações', 'Voltar ao PontaPé']);
  });

  it('o rodapé tem 4 grupos: projeto, serviço, ferramentas e contato (2.6)', () => {
    expect(footerGroups(SITE).map(g => g.title)).toEqual(['O projeto', 'Rede Alimenta', 'Ferramentas de graça', 'Falar com a gente']);
  });
});

// The ids the menu promises live in the home source. The built pages are checked link by link, on both
// hosts, by the F44 measurement (links-f44.py), against the preview.
describe('âncoras da home existem (1.1)', () => {
  it('o código-fonte da home declara os ids do menu', () => {
    const source = readFileSync('src/components/cronica/PortasHoje.astro', 'utf8') + readFileSync('src/components/cronica/Escada.astro', 'utf8');
    expect(source).toContain('id={HOME_IDS.comecar}');
    expect(source).toContain('id="como-funciona"');
  });

  it('nenhum link do site aponta para #ajudar, que a home nunca teve', () => {
    expect(JSON.stringify([projectNav(SITE), footerGroups(SITE)])).not.toContain('#ajudar');
  });
});
