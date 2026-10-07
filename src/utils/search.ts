import type { Product } from '../types';

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ');

const index = new WeakMap<Product, { title: string; rest: string }>();
function fields(p: Product) {
  let f = index.get(p);
  if (!f) {
    f = {
      title: norm(p.title),
      rest: norm([p.brand, p.type, p.category.replace(/-/g, ' '), ...p.tags, p.excerpt].filter(Boolean).join(' ')),
    };
    index.set(p, f);
  }
  return f;
}

/** Every query word must match somewhere; title hits rank above description hits. */
export function searchProducts(list: Product[], query: string): Product[] {
  const words = norm(query).split(' ').filter(Boolean);
  if (!words.length) return list;
  const scored: [Product, number][] = [];
  for (const p of list) {
    const f = fields(p);
    let score = 0;
    let ok = true;
    for (const w of words) {
      const inTitle = f.title.includes(w);
      const wordStart = new RegExp(`\\b${w}`).test(f.title);
      if (inTitle) score += wordStart ? 10 : 6;
      else if (f.rest.includes(w)) score += 2;
      else {
        ok = false;
        break;
      }
    }
    if (ok) scored.push([p, score - p.rank / 1000]);
  }
  return scored.sort((a, b) => b[1] - a[1]).map(([p]) => p);
}

export const POPULAR_SEARCHES = ['Tequila', 'Rum', 'Cocktail pack', 'Passionfruit', 'Coconut', 'Elderflower', 'Mango', 'Gift card'];
