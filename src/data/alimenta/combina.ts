// What the donation page decides in the browser, kept pure so the tests run it as it is (F44).
// 3.2: who receives, by the public rule, before any account. 3.4: does it need booking. 3.5: example
// mode never writes. Nothing here calls the API.

export type DonationCategory = 'dry_goods' | 'produce' | 'bakery' | 'dairy' | 'prepared_meal';
export type DonorKind = 'person' | 'company' | 'distributor';

export interface CatalogItem {
  id: string; name: string; city: string; kind: string; accepts: string[]; acceptIds: string[]; from: string[];
  preparedMeals: boolean | null; how: string | null; hours: string | null; address: string | null; contact: string;
  sources: string[]; checked: string; confidence: 'high' | 'medium';
}

export interface Offer { category: DonationCategory; kind: DonorKind; city: string }

// City as the API compares it (alimenta/core/catalog.py city_key): no accents, lower case, single spaces.
export const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const RECEIVES: Record<DonorKind, string> = { person: 'individuals', company: 'companies', distributor: 'companies' };
const CONFIDENCE = { high: 0, medium: 1 } as const;

// What a record accepts, in the form's words (catalog.py categories_of): "prepared" is a prepared meal,
// and so is a record that says it takes prepared meals.
const categoriesOf = (d: CatalogItem) => {
  const cats = new Set(d.acceptIds.map(c => (c === 'prepared' ? 'prepared_meal' : c)));
  if (d.preparedMeals === true) cats.add('prepared_meal');
  return cats;
};

// The same rule the API uses before the AI (alimenta/core/recommend.py candidates): same city; a record
// that lists categories must list this one (one that lists none stays, marked by the order); a prepared
// meal never goes where the source says no; the donor kind must be one it takes. Order: the ones that
// list this food, then published hours, then the sure ones, then the name.
export function matchDistributors(catalog: CatalogItem[], offer: Offer): CatalogItem[] {
  const city = norm(offer.city);
  if (city.length < 2) return [];
  const wanted = RECEIVES[offer.kind];
  return catalog
    .filter(d => {
      if (norm(d.city) !== city) return false;
      const cats = categoriesOf(d);
      if (cats.size > 0 && !cats.has(offer.category)) return false;
      if (offer.category === 'prepared_meal' && d.preparedMeals === false) return false;
      return d.from.length === 0 || d.from.includes(wanted);
    })
    .sort((a, b) => Number(!categoriesOf(a).has(offer.category)) - Number(!categoriesOf(b).has(offer.category))
      || Number(!a.hours) - Number(!b.hours)
      || CONFIDENCE[a.confidence] - CONFIDENCE[b.confidence]
      || a.name.localeCompare(b.name, 'pt-BR'));
}

// Same city, but no one there takes this food or this donor: the page says so instead of an empty list.
export const sameCity = (catalog: CatalogItem[], city: string) => catalog.filter(d => norm(d.city) === norm(city));

// "Precisa agendar?" (3.4), read from the source text only. Words that mean "talk first" say yes; a
// silent source says "the source does not say", never "no".
const BOOK = /agend|combin|marcar|previamente|antes de levar|entre em contato|contato pr[eé]vio|retirada|telefone|e-mail|email/i;
export function scheduling(how: string | null): 'yes' | 'unknown' {
  return how && BOOK.test(how) ? 'yes' : 'unknown';
}

export const mapUrl = (d: Pick<CatalogItem, 'name' | 'city' | 'address'>) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address ? `${d.address}, ${d.city}` : `${d.name}, ${d.city}`)}`;

// Example mode (3.5): reading is allowed, any write to the API is refused before it leaves the page.
export const writeAllowed = (method: string, example: boolean) => !example || method.toUpperCase() === 'GET';

// The fictional donation of the example. Real distributors, invented donation, marked everywhere.
export const EXAMPLE_OFFER = { category: 'bakery', kind: 'company', city: 'Osasco', storage: 'ambient', kg: '10' } as const;

// Kilos as a person types them: "12,5", "12.5", "1.200".
export function parseKg(text: string): number {
  const t = text.trim();
  const value = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.');
  return Number(value);
}
