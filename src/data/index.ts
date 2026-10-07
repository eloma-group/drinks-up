import catalogue from './catalogue.json';
import { IMG } from './site';
import type { Brand, CategoryKey, Collection, Policy, Product, Recipe } from '../types';

export const products = catalogue.products as Product[];
export const recipes = catalogue.recipes as Recipe[];
export const policies = catalogue.policies as Record<string, Policy>;
export const syncedAt = catalogue.syncedAt;
const copy = catalogue.collectionCopy as Record<string, string>;

export const brands: Brand[] = (catalogue.brands as Brand[]).map((b) => ({
  ...b,
  description: b.description || copy[b.handle] || '',
}));

const byHandle = new Map(products.map((p) => [p.handle, p]));
export const getProduct = (handle: string) => byHandle.get(handle);

/* ---------- Derived product helpers ---------- */
export const isAvailable = (p: Product) => p.variants.some((v) => v.available);
export const minPrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));
export const isOnSale = (p: Product) => p.variants.some((v) => v.compareAt !== null);
export const firstVariant = (p: Product) => p.variants.find((v) => v.available) ?? p.variants[0];

/* ---------- Categories (mirror of the store's Spirit Shelf) ---------- */
export interface CategoryMeta {
  key: CategoryKey;
  title: string;
  short: string;
  eyebrow: string;
  image: string;
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'spirits',
    title: 'Spirits',
    short: 'Spirits',
    eyebrow: 'Tequila · Rum · Bourbon · Pisco',
    image: IMG.ladamaNight,
    blurb: 'Party-starters and slow-sippers from Mexico, Cuba, Jamaica, Kentucky, Peru and Brazil.',
  },
  {
    key: 'liqueur',
    title: 'Liqueurs',
    short: 'Liqueur',
    eyebrow: 'Giffard · Lanique · Bigallet',
    image: IMG.roseBar,
    blurb: copy.liqueur ?? '',
  },
  {
    key: 'syrups',
    title: 'Syrups',
    short: 'Syrup',
    eyebrow: 'Bartender-grade, made in France',
    image: IMG.beachTiki,
    blurb: 'Premium Giffard syrups made with real fruit, botanicals, spices and pure sugar.',
  },
  {
    key: 'cocktail-packs',
    title: 'Cocktail Packs',
    short: 'Packs',
    eyebrow: 'Hand-picked by career bartenders',
    image: IMG.blueBeach,
    blurb: 'Everything you need for bar-quality cocktails at home — and the perfect gift.',
  },
  {
    key: 'fruit-for-mix',
    title: 'Fruit for Mix',
    short: 'Purées',
    eyebrow: 'Giffard fruit purées · 1L',
    image: IMG.pastelPineapple,
    blurb: 'Real fruit purées for daiquiris, coladas, smoothies and granitas.',
  },
  {
    key: 'bar-tools',
    title: 'Bar Tools',
    short: 'Tools',
    eyebrow: 'Pumps & shakers',
    image: IMG.coldBrew,
    blurb: 'The small things that make a home bar work.',
  },
  {
    key: 'gift-cards',
    title: 'Gift Cards',
    short: 'Gift cards',
    eyebrow: '$25 – $200',
    image: IMG.laniqueRoses,
    blurb: 'Let them choose their own adventure on the spirit shelf.',
  },
];

export const categoryMeta = (key: CategoryKey) => CATEGORIES.find((c) => c.key === key)!;
export const categoryCount = (key: CategoryKey) => products.filter((p) => p.category === key).length;

/* ---------- Collections (keep the store's URLs) ---------- */
const BRAND_IMAGE: Record<string, string> = {
  'black-tears': IMG.blackTears,
  'burnt-ends': IMG.burntEndsMood,
  'casa-san-matias': IMG.sanMatiasDark,
  'demonio-de-los-andes': IMG.elderflowerBar,
  giffard: IMG.spritzTable,
  'la-dama': IMG.ladamaNight,
  lanique: IMG.laniqueRoses,
  'pueblo-viejo': IMG.puebloNeon,
  'rum-bar': IMG.rumbarJungle,
  thoquino: IMG.sunsetSand,
  'whiskey-row': IMG.whiskeyRowBalcony,
  'worthy-park': IMG.poolside,
};
export const brandImage = (handle: string) => BRAND_IMAGE[handle] ?? IMG.cheers;

const byType = (...types: string[]) => products.filter((p) => p.type !== null && types.includes(p.type));

function build(): Map<string, Collection> {
  const m = new Map<string, Collection>();
  const add = (c: Collection) => m.set(c.handle, c);

  add({
    handle: 'all',
    title: 'The Spirit Shelf',
    kind: 'all',
    eyebrow: `${products.length} bottles & essentials`,
    description:
      'A carefully curated collection of your favourite spirits and cocktail essentials — delivered Australia-wide.',
    image: IMG.beachTiki,
    products,
  });

  for (const c of CATEGORIES) {
    add({
      handle: c.key,
      title: c.title,
      kind: 'category',
      eyebrow: c.eyebrow,
      description: (c.key === 'syrups' ? copy.syrups : c.key === 'fruit-for-mix' ? copy['cocktail-mixers'] : null) ?? c.blurb,
      image: c.image,
      products: products.filter((p) => p.category === c.key),
    });
  }

  const types: [string, string, string[], string, string][] = [
    ['tequila', 'Tequila', ['Tequila'], IMG.puebloNeon, copy.tequila ?? ''],
    ['rum', 'Rum', ['Rum'], IMG.blackTears, copy.rum ?? ''],
    ['bourbon', 'Bourbon & Whiskey', ['Bourbon', 'Whiskey'], IMG.whiskeyRowBalcony, copy['whiskey-row'] ?? ''],
    ['pisco', 'Pisco', ['Pisco'], IMG.elderflowerBar, copy.pisco ?? ''],
  ];
  for (const [handle, title, t, image, description] of types) {
    add({ handle, title, kind: 'type', eyebrow: 'Spirits', description, image, products: byType(...t) });
  }

  add({
    handle: 'aperitif',
    title: 'Aperitif',
    kind: 'type',
    eyebrow: 'Bitter, botanical, before dinner',
    description: 'Bittersweet openers for spritzes, Negronis and long sundowners.',
    image: IMG.bitterSpritz,
    products: products.filter((p) => p.aperitif),
  });

  add({
    handle: 'sale',
    title: 'The Deals',
    kind: 'edit',
    eyebrow: 'Limited-time prices',
    description: 'Stock up on your favourites or find a thoughtful gift — while stocks last.',
    image: IMG.sunsetSand,
    products: products.filter(isOnSale),
  });

  for (const b of brands) {
    add({
      handle: b.handle,
      title: b.name,
      kind: 'brand',
      eyebrow: 'The house of',
      description: b.description,
      image: brandImage(b.handle),
      products: b.products.map(getProduct).filter((p): p is Product => Boolean(p)),
    });
  }
  return m;
}

export const collections = build();
/** Old Shopify collection handles that should land on the new equivalents */
const ALIASES: Record<string, string> = {
  liqueurs: 'liqueur',
  syrup: 'syrups',
  'cocktail-mixers': 'syrups',
  spirits: 'spirits',
  blackfriday: 'sale',
  'winter-sale': 'sale',
  'best-selling-collection': 'all',
  'new-collection': 'all',
  'your-favorites': 'all',
  'pueblo-viejo-1': 'pueblo-viejo',
  'worthy-park-1': 'worthy-park',
};
export const getCollection = (handle: string) => collections.get(ALIASES[handle] ?? handle);

export const getRecipe = (handle: string) => recipes.find((r) => r.handle === handle);

/** Products a recipe mentions by brand/name — used to make recipes shoppable */
export function productsForText(text: string, limit = 4): Product[] {
  const t = text.toLowerCase();
  const hits = products.filter((p) => {
    const core = p.title
      .toLowerCase()
      .replace(/giffard|syrup|liqueur|- 1l|1l|700ml|750ml|- classic|- premium|cr[eè]me|\(.*?\)|[-|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return (p.brand && p.brand !== 'Giffard' && t.includes(p.brand.toLowerCase())) || (core.length > 3 && t.includes(core));
  });
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit);
}

export function relatedProducts(p: Product, limit = 8): Product[] {
  const score = (o: Product) =>
    (o.brand && o.brand === p.brand ? 2 : 0) + (o.category === p.category ? 3 : 0) + (o.type === p.type ? 1 : 0);
  return products
    .filter((o) => o.handle !== p.handle && isAvailable(o))
    .map((o) => [o, score(o)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1] || a[0].rank - b[0].rank)
    .slice(0, limit)
    .map(([o]) => o);
}
