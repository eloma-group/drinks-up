import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { categoryMeta, isAvailable, isOnSale, minPrice } from '../../data';
import { searchProducts } from '../../utils/search';
import type { Product } from '../../types';

export const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'saving', label: 'Biggest saving' },
  { value: 'newest', label: 'Newest' },
  { value: 'az', label: 'Alphabetical: A–Z' },
  { value: 'za', label: 'Alphabetical: Z–A' },
] as const;
export type SortKey = (typeof SORTS)[number]['value'];

export const PRICE_BANDS = [
  { value: '0-30', label: 'Under $30', min: 0, max: 30 },
  { value: '30-60', label: '$30 – $60', min: 30, max: 60 },
  { value: '60-100', label: '$60 – $100', min: 60, max: 100 },
  { value: '100-', label: '$100 +', min: 100, max: Infinity },
] as const;

export interface Facet {
  value: string;
  label: string;
  count: number;
}

const saving = (p: Product) => Math.max(0, ...p.variants.map((v) => (v.compareAt ? 1 - v.price / v.compareAt : 0)));

function facet(list: Product[], key: (p: Product) => string | null, label: (v: string) => string = (v) => v): Facet[] {
  const m = new Map<string, number>();
  list.forEach((p) => {
    const k = key(p);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m.entries()].map(([value, count]) => ({ value, label: label(value), count })).sort((a, b) => b.count - a.count);
}

/** All listing state lives in the URL, so filtered views are shareable and survive refresh/back. */
export function useCatalogFilters(base: Product[]) {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const cats = params.getAll('category');
  const brandsSel = params.getAll('brand');
  const types = params.getAll('type');
  const price = params.get('price') ?? '';
  const inStock = params.get('stock') === '1';
  const onSale = params.get('sale') === '1';
  const sort = (SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'featured') as SortKey;

  const update = useCallback(
    (fn: (p: URLSearchParams) => void) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          fn(next);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const toggle = useCallback(
    (key: string, value: string) =>
      update((p) => {
        const all = p.getAll(key);
        p.delete(key);
        (all.includes(value) ? all.filter((v) => v !== value) : [...all, value]).forEach((v) => p.append(key, v));
      }),
    [update],
  );
  const set = useCallback((key: string, value: string | null) => update((p) => (value ? p.set(key, value) : p.delete(key))), [update]);
  const clear = useCallback(
    () =>
      update((p) => {
        ['category', 'brand', 'type', 'price', 'stock', 'sale'].forEach((k) => p.delete(k));
      }),
    [update],
  );

  const facets = useMemo(
    () => ({
      category: facet(base, (p) => p.category, (v) => categoryMeta(v as Product['category']).title),
      type: facet(
        base.filter((p) => p.category === 'spirits'),
        (p) => p.type,
      ),
      brand: facet(base, (p) => p.brand),
    }),
    [base],
  );

  const results = useMemo(() => {
    const band = PRICE_BANDS.find((b) => b.value === price);
    let list = q ? searchProducts(base, q) : base;
    list = list.filter(
      (p) =>
        (!cats.length || cats.includes(p.category)) &&
        (!brandsSel.length || (p.brand !== null && brandsSel.includes(p.brand))) &&
        (!types.length || (p.type !== null && types.includes(p.type))) &&
        (!inStock || isAvailable(p)) &&
        (!onSale || isOnSale(p)) &&
        (!band || (minPrice(p) >= band.min && minPrice(p) < band.max)),
    );
    const sorted = [...list];
    const cmp: Record<SortKey, (a: Product, b: Product) => number> = {
      featured: () => 0,
      'price-asc': (a, b) => minPrice(a) - minPrice(b),
      'price-desc': (a, b) => minPrice(b) - minPrice(a),
      saving: (a, b) => saving(b) - saving(a),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      az: (a, b) => a.title.localeCompare(b.title),
      za: (a, b) => b.title.localeCompare(a.title),
    };
    if (sort === 'featured' && !q) sorted.sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)) || a.rank - b.rank);
    else if (sort !== 'featured') sorted.sort(cmp[sort]);
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, q, cats.join(), brandsSel.join(), types.join(), price, inStock, onSale, sort]);

  const active: { key: string; value: string; label: string }[] = [
    ...cats.map((v) => ({ key: 'category', value: v, label: categoryMeta(v as Product['category'])?.title ?? v })),
    ...types.map((v) => ({ key: 'type', value: v, label: v })),
    ...brandsSel.map((v) => ({ key: 'brand', value: v, label: v })),
    ...(price ? [{ key: 'price', value: price, label: PRICE_BANDS.find((b) => b.value === price)?.label ?? price }] : []),
    ...(inStock ? [{ key: 'stock', value: '1', label: 'In stock' }] : []),
    ...(onSale ? [{ key: 'sale', value: '1', label: 'On sale' }] : []),
  ];

  return {
    q,
    sort,
    selected: { category: cats, brand: brandsSel, type: types, price, inStock, onSale },
    facets,
    results,
    active,
    toggle,
    set,
    clear,
    removeActive: (a: { key: string; value: string }) => (['price', 'stock', 'sale'].includes(a.key) ? set(a.key, null) : toggle(a.key, a.value)),
  };
}
