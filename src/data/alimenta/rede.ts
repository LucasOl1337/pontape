import { z } from 'zod';
import catalog from './distribuidores.json';
import { REPO_URL } from '../site/contributions';

// Rede Alimenta (round 6): who has food to spare registers it, the AI suggests a distributor that
// already exists in public, and each step goes to the public book. The catalog is the Mapa research
// (entregas/alimenta-distribuidores.json), copied byte for byte; the API reads the same file.
export const ALIMENTA = {
  name: 'Rede Alimenta',
  href: '/alimenta',
  distribuidores: '/alimenta/distribuidores',
  doar: '/alimenta/doar',
  minhas: '/alimenta/minhas-doacoes',
  code: `${REPO_URL}/tree/main/alimenta`,
  siteCode: `${REPO_URL}/tree/main/src/pages/alimenta`,
  checker: `${REPO_URL}/blob/main/tools/conferir.py`,
} as const;

const sourceSchema = z.strictObject({ url: z.url(), accessed: z.iso.date(), quote: z.string().min(1), note: z.string().optional() });
export const distributorSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  kind: z.enum(['food_bank', 'network', 'ngo', 'public_program', 'community_kitchen']),
  city: z.string().min(2),
  region: z.enum(['center', 'north', 'south', 'east', 'west', 'metro']),
  accepts: z.array(z.enum(['produce', 'bakery', 'dairy', 'meat', 'beverages', 'dry_goods', 'prepared'])),
  receives_from: z.array(z.enum(['individuals', 'companies'])).min(1),
  how_to_donate: z.string().nullable(),
  public_contact_url: z.url(),
  address_public: z.string().nullable(),
  hours_public: z.string().nullable(),
  capacity_note: z.string().nullable(),
  accepts_prepared_meals: z.boolean().nullable(),
  sources: z.array(sourceSchema).min(1),
  confidence: z.enum(['high', 'medium']),
});
export type Distributor = z.infer<typeof distributorSchema>;

// A record without a source does not get in: the build stops.
export const DISTRIBUTORS: Distributor[] = z.array(distributorSchema).parse(catalog)
  .sort((a, b) => a.city.localeCompare(b.city, 'pt-BR') || a.name.localeCompare(b.name, 'pt-BR'));

export const CATEGORY: Record<Distributor['accepts'][number], string> = {
  dry_goods: 'Não perecíveis', produce: 'Frutas, legumes e verduras', bakery: 'Pães',
  dairy: 'Leite e derivados', meat: 'Carnes', beverages: 'Bebidas', prepared: 'Refeição pronta',
};
// What the donation form sends: the API categories (schemas.Category).
export const DONATION_CATEGORIES = [
  { id: 'dry_goods', label: 'Não perecíveis', hint: 'Arroz, feijão, óleo, enlatados' },
  { id: 'produce', label: 'Frutas, legumes e verduras', hint: 'Da feira, da horta, do mercado' },
  { id: 'bakery', label: 'Pães', hint: 'Pão, bolo, salgado de padaria' },
  { id: 'dairy', label: 'Leite e derivados', hint: 'Leite, iogurte, queijo' },
  { id: 'prepared_meal', label: 'Refeição pronta', hint: 'Marmita ou lanche feito hoje' },
] as const;
export const STORAGE = [
  { id: 'ambient', label: 'Fora da geladeira' },
  { id: 'refrigerated', label: 'Na geladeira' },
  { id: 'frozen', label: 'No congelador' },
] as const;
export const DONOR_KINDS = [
  { id: 'person', label: 'Pessoa', hint: 'Doo por conta própria' },
  { id: 'company', label: 'Empresa', hint: 'Mercado, padaria, restaurante, indústria' },
  { id: 'distributor', label: 'Distribuidor', hint: 'Banco de alimentos ou rede com sobra pra repassar' },
] as const;

export const KIND: Record<Distributor['kind'], string> = {
  food_bank: 'Banco de alimentos', network: 'Rede', ngo: 'Organização social',
  public_program: 'Programa público', community_kitchen: 'Cozinha comunitária',
};
export const FROM: Record<Distributor['receives_from'][number], string> = { individuals: 'pessoa', companies: 'empresa' };
export const REGION: Record<Distributor['region'], string> = {
  center: 'Centro', north: 'Zona Norte', south: 'Zona Sul', east: 'Zona Leste', west: 'Zona Oeste', metro: 'Grande São Paulo',
};

export const cities = (list = DISTRIBUTORS) => [...new Set(list.map(d => d.city))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
export const lastAccess = (d: Distributor) => d.sources.map(s => s.accessed).sort().at(-1)!;
export const distributorName = (id: string | null | undefined) => DISTRIBUTORS.find(d => d.id === id)?.name ?? null;

// "Sugerir ou corrigir" opens a GitHub issue from the template, open to anyone (Q6).
export const suggestUrl = (d?: Pick<Distributor, 'id' | 'name'>) => {
  const title = d ? `Distribuidor: corrigir ${d.name}` : 'Distribuidor: sugerir um novo';
  const params = new URLSearchParams({ template: 'distribuidor-alimenta.md', title });
  if (d) params.set('body', `Registro: ${d.id}\n\nO que está errado ou mudou:\n\nFonte pública (link):\n`);
  return `${REPO_URL}/issues/new?${params}`;
};

// The slim catalog the browser needs on /alimenta/doar: no quotes, no notes.
export const browserCatalog = () => DISTRIBUTORS.map(d => ({
  id: d.id, name: d.name, city: d.city, kind: KIND[d.kind], accepts: d.accepts.map(c => CATEGORY[c]),
  how: d.how_to_donate, hours: d.hours_public, address: d.address_public, contact: d.public_contact_url,
  sources: [...new Set(d.sources.map(s => s.url))],
}));
export type BrowserDistributor = ReturnType<typeof browserCatalog>[number];
