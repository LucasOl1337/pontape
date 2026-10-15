import { describe, expect, it } from 'vitest';
import { EXAMPLE_OFFER, mapUrl, matchDistributors, norm, parseKg, sameCity, scheduling, writeAllowed, type CatalogItem } from './combina';
import { DISTRIBUTORS, browserCatalog } from './rede';

// F44, plano 3.2 a 3.5. Exact cases on fictitious records, plus the real catalog for the cases the page
// shows in the example. The rule mirrors alimenta/core/recommend.py candidates().
const item = (over: Partial<CatalogItem>): CatalogItem => ({
  id: 'ficticio', name: 'Ficticio', city: 'Cidade Ficticia', kind: 'Organização social', accepts: [], acceptIds: [], from: ['individuals', 'companies'],
  preparedMeals: null, how: null, hours: null, address: null, contact: 'https://exemplo.invalid', sources: ['https://exemplo.invalid/fonte'],
  checked: '2026-10-01', confidence: 'high', ...over,
});

describe('regra de combinação no aparelho (3.2)', () => {
  const A = item({ id: 'a', name: 'Alfa', acceptIds: ['bakery'], hours: 'seg a sex', confidence: 'medium' });
  const B = item({ id: 'b', name: 'Beta', acceptIds: ['bakery', 'dry_goods'], from: ['companies'] });
  const C = item({ id: 'c', name: 'Gama', acceptIds: [] });
  const D = item({ id: 'd', name: 'Delta', acceptIds: ['produce'] });
  const E = item({ id: 'e', name: 'Épsilon', city: 'Outra', acceptIds: ['bakery'] });
  const F = item({ id: 'f', name: 'Zeta', acceptIds: ['prepared'], from: ['individuals'] });
  const G = item({ id: 'g', name: 'Eta', acceptIds: [], preparedMeals: false });
  const catalog = [A, B, C, D, E, F, G];

  it('mesma cidade, aceita o tipo e recebe desse doador; quem não lista tipo fica por último', () => {
    expect(matchDistributors(catalog, { category: 'bakery', kind: 'company', city: 'Cidade Ficticia' }).map(d => d.id)).toEqual(['a', 'b', 'g', 'c']);
    expect(matchDistributors(catalog, { category: 'bakery', kind: 'person', city: 'cidade  ficticia' }).map(d => d.id)).toEqual(['a', 'g', 'c']);
  });

  it('cidade compara sem acento, maiúscula nem espaço a mais', () => {
    expect(norm('  São   Paulo ')).toBe('sao paulo');
    expect(matchDistributors(catalog, { category: 'bakery', kind: 'company', city: 'CIDADE FICTÍCIA' })).toHaveLength(4);
  });

  it('refeição pronta vale para "prepared" e nunca vai onde a fonte diz que não', () => {
    expect(matchDistributors(catalog, { category: 'prepared_meal', kind: 'person', city: 'Cidade Ficticia' }).map(d => d.id)).toEqual(['f', 'c']);
  });

  it('cidade curta demais ou sem ninguém não inventa destino', () => {
    expect(matchDistributors(catalog, { category: 'bakery', kind: 'person', city: 'C' })).toEqual([]);
    expect(matchDistributors(catalog, { category: 'dairy', kind: 'person', city: 'Nenhuma' })).toEqual([]);
    expect(sameCity(catalog, 'cidade ficticia')).toHaveLength(6);
  });

  it('no catálogo real, o exemplo (pães de empresa em Osasco) acha distribuidor com fonte', () => {
    const found = matchDistributors(browserCatalog() as CatalogItem[], EXAMPLE_OFFER);
    expect(found.length).toBeGreaterThan(0);
    for (const d of found) {
      expect(norm(d.city)).toBe('osasco');
      expect(d.sources.length).toBeGreaterThan(0);
    }
  });

  it('o catálogo do navegador leva tudo que a regra precisa e nada de citação', () => {
    const slim = browserCatalog();
    expect(slim).toHaveLength(DISTRIBUTORS.length);
    for (const d of slim) {
      expect(d.from.length).toBeGreaterThan(0);
      expect(JSON.stringify(d)).not.toMatch(/"quote"/);
    }
  });
});

describe('tela Pronto (3.4)', () => {
  it('"precisa agendar?" diz sim só quando a fonte pede contato antes; senão diz que a fonte não diz', () => {
    expect(scheduling('Agende a entrega pelo telefone.')).toBe('yes');
    expect(scheduling('Entre em contato antes de levar.')).toBe('yes');
    expect(scheduling('Leve no galpão, de segunda a sexta.')).toBe('unknown');
    expect(scheduling(null)).toBe('unknown');
  });

  it('o mapa usa o endereço público, ou o nome e a cidade quando não há endereço', () => {
    expect(mapUrl({ name: 'Alfa', city: 'Osasco', address: 'Rua Ficticia, 1' })).toBe('https://www.google.com/maps/search/?api=1&query=Rua%20Ficticia%2C%201%2C%20Osasco');
    expect(mapUrl({ name: 'Alfa', city: 'Osasco', address: null })).toBe('https://www.google.com/maps/search/?api=1&query=Alfa%2C%20Osasco');
  });

  it('quilos como a pessoa digita', () => {
    expect(parseKg('12,5')).toBe(12.5);
    expect(parseKg('12.5')).toBe(12.5);
    expect(parseKg('1.200')).toBe(1200);
    expect(parseKg('1.200,5')).toBe(1200.5);
    expect(Number.isNaN(parseKg('doze'))).toBe(true);
  });
});

describe('modo exemplo (3.5)', () => {
  it('no exemplo só leitura passa; toda escrita é recusada antes de sair da página', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'post']) expect(writeAllowed(method, true)).toBe(false);
    expect(writeAllowed('GET', true)).toBe(true);
    for (const method of ['GET', 'POST', 'DELETE']) expect(writeAllowed(method, false)).toBe(true);
  });
});
