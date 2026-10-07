/**
 * Pulls the live DrinksUp catalogue (Shopify storefront JSON) into
 * src/data/catalogue.json so the UI never hand-copies product info.
 *
 *   node scripts/fetch-catalogue.mjs
 *
 * Re-run whenever products, prices or stock change on the store.
 */
import { writeFile, mkdir } from 'node:fs/promises';

const STORE = 'https://drinksup.com.au';
const UA = { 'User-Agent': 'Mozilla/5.0 (DrinksUp catalogue sync)' };

const getJson = async (path) => {
  const res = await fetch(STORE + path, { headers: UA });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
};
const getText = async (path) => (await fetch(STORE + path, { headers: UA })).text();

/* ---------- HTML sanitising (descriptions come from the Shopify editor) ---------- */
const ALLOWED = new Set(['p', 'br', 'strong', 'b', 'em', 'i', 'ul', 'ol', 'li', 'h3', 'h4', 'h5', 'a', 'blockquote']);
const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

function sanitize(html = '') {
  let out = html
    .replace(/<(script|style|iframe|img|svg|table|meta)[\s\S]*?(<\/\1>|\/?>)/gi, '')
    .replace(/<h[12](\s[^>]*)?>/gi, '<h3>')
    .replace(/<\/h[12]>/gi, '</h3>')
    .replace(/<h6(\s[^>]*)?>/gi, '<h5>')
    .replace(/<\/h6>/gi, '</h5>')
    .replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (tag, name, attrs = '') => {
      const n = name.toLowerCase();
      if (!ALLOWED.has(n)) return '';
      if (tag.startsWith('</')) return `</${n}>`;
      if (n === 'a') {
        const href = /href="([^"]+)"/i.exec(attrs)?.[1] ?? '#';
        const local = href.replace(/^https?:\/\/(www\.)?drinksup\.com\.au/i, '');
        const ext = /^https?:/i.test(local);
        return ext ? `<a href="${local}" target="_blank" rel="noopener noreferrer">` : `<a href="${local}">`;
      }
      return `<${n}>`;
    })
    .replace(/<(p|li|h3|h4|h5|strong|em)>\s*(&nbsp;|\s)*<\/\1>/gi, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return out;
}
const plain = (html) => decode((html ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/* ---------- Categorisation (mirrors the store's “Spirit Shelf” menu) ---------- */
const SPIRIT_TYPES = ['Tequila', 'Rum', 'Bourbon', 'Whiskey', 'Pisco', 'Cachaca'];
function categoryOf(p) {
  const t = p.product_type;
  const h = p.handle;
  if (SPIRIT_TYPES.includes(t)) return 'spirits';
  if (t === 'Liqueur') return 'liqueur';
  if (t === 'Syrups') return 'syrups';
  if (t === 'Fruit For Mix' || /puree/.test(h)) return 'fruit-for-mix';
  if (t === 'Cocktail Packs') return 'cocktail-packs';
  if (/gift-card/.test(h) || p.title === 'Gift Cards') return 'gift-cards';
  return 'bar-tools';
}
const SPIRIT_LABEL = { Syrups: 'Syrup', 'Fruit For Mix': 'Fruit purée', Cachaca: 'Cachaça', Whiskey: 'Whiskey', Bourbon: 'Bourbon', Pisco: 'Pisco', Rum: 'Rum', Tequila: 'Tequila' };
const ORIGINS = { France: 'France', Mexico: 'Mexico', Cuban: 'Cuba', Cuba: 'Cuba', Jamaica: 'Jamaica', Peru: 'Peru', Brazil: 'Brazil', Hawaii: 'Hawaii' };

function specs(p, text) {
  const s = [];
  const vol = /(\d+(?:[.,]\d+)?)\s?(ml|mL|ML|cl|L|lt|Litre|litre)\b/.exec(p.title + ' ' + text);
  if (vol) s.push({ label: 'Volume', value: `${vol[1]}${/l$|litre|lt/i.test(vol[2]) && !/ml|cl/i.test(vol[2]) ? 'L' : vol[2].toLowerCase()}` });
  const abv = /(\d{1,2}(?:[.,]\d)?)\s?%\s?(?:abv|alc|alcohol|vol)?/i.exec(p.title + ' ' + text);
  if (abv && +abv[1].replace(',', '.') > 0 && +abv[1].replace(',', '.') < 80 && !/discount|off/i.test(text.slice(abv.index - 20, abv.index)))
    s.push({ label: 'ABV', value: `${abv[1]}%` });
  const origin = p.tags.map((t) => ORIGINS[t]).find(Boolean);
  if (origin) s.push({ label: 'Origin', value: origin });
  if (p.product_type) s.push({ label: 'Type', value: SPIRIT_LABEL[p.product_type] ?? p.product_type });
  const sku = p.variants[0]?.sku;
  if (sku) s.push({ label: 'SKU', value: sku });
  return s;
}

/* ---------- Images: promo tiles (“Summer deals”, sale banners) are uploaded as
   numbered files like 13_<uuid>.png — keep them, but lead with a clean shot ---------- */
const PROMO = /\/\d+_[0-9a-f]{8}-[0-9a-f]{4}-|promo|ig_post|untitled_design/i;
function orderImages(images) {
  const clean = images.filter((i) => !PROMO.test(i.src.split('?')[0]));
  const promo = images.filter((i) => PROMO.test(i.src.split('?')[0]));
  return [...clean, ...promo];
}

/* ---------- Brand collections that exist on the store ---------- */
const BRAND_HANDLES = [
  'black-tears', 'burnt-ends', 'casa-san-matias', 'demonio-de-los-andes', 'giffard', 'la-dama',
  'lanique', 'pueblo-viejo', 'rum-bar', 'thoquino', 'whiskey-row', 'worthy-park-1',
];

async function main() {
  const { products } = await getJson('/products.json?limit=250');
  const { collections } = await getJson('/collections.json?limit=250');
  const best = (await getJson('/collections/best-selling-collection/products.json?limit=250')).products.map((p) => p.handle);
  const aperitif = (await getJson('/collections/aperitif/products.json?limit=250')).products.map((p) => p.handle);

  const brandOf = {};
  const brands = [];
  for (const handle of BRAND_HANDLES) {
    const c = collections.find((x) => x.handle === handle);
    if (!c) continue;
    const members = (await getJson(`/collections/${handle}/products.json?limit=250`)).products.map((p) => p.handle);
    if (!members.length) continue;
    const name = c.title.trim();
    members.forEach((m) => (brandOf[m] ??= name));
    brands.push({
      handle: handle.replace(/-1$/, ''),
      name,
      description: plain(c.description),
      image: c.image?.src ?? null,
      products: members,
    });
  }

  const out = products
    .map((p) => {
      const text = plain(p.body_html);
      const variants = p.variants.map((v) => ({
        id: String(v.id),
        title: v.title === 'Default Title' ? null : v.title,
        price: +v.price,
        compareAt: v.compare_at_price && +v.compare_at_price > +v.price ? +v.compare_at_price : null,
        available: v.available,
        sku: v.sku || null,
      }));
      const rank = best.indexOf(p.handle);
      return {
        id: String(p.id),
        handle: p.handle,
        title: p.title.replace(/\s+/g, ' ').replace(/- Extra/, ' - Extra').trim(),
        category: categoryOf(p),
        type: SPIRIT_LABEL[p.product_type] ?? (p.product_type || null),
        brand: brandOf[p.handle] ?? (/giffard/i.test(p.title) ? 'Giffard' : null),
        tags: p.tags,
        aperitif: aperitif.includes(p.handle),
        descriptionHtml: sanitize(p.body_html),
        excerpt: text.slice(0, 220),
        specs: specs(p, text),
        images: orderImages(p.images).map((i) => ({ src: i.src, width: i.width, height: i.height })),
        variants,
        rank: rank === -1 ? 999 : rank,
        createdAt: p.created_at,
      };
    })
    .sort((a, b) => a.rank - b.rank);

  /* Recipes blog (Atom feed) */
  const atom = await getText('/blogs/recipes.atom');
  const recipes = [...atom.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const pick = (tag) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(e)?.[1] ?? '';
    const url = /<link[^>]+href="([^"]+)"/.exec(e)?.[1] ?? '';
    const content = decode(pick('content'));
    const image = /<img[^>]+src="([^"]+)"/.exec(content)?.[1] ?? null;
    const summary = plain(decode(pick('summary')) || content).slice(0, 200);
    return {
      handle: url.split('/').pop(),
      title: decode(pick('title')).trim(),
      publishedAt: pick('published'),
      image: image?.startsWith('//') ? 'https:' + image : image,
      summary,
      bodyHtml: sanitize(content),
    };
  });

  /* Store policies */
  const policies = {};
  for (const slug of ['shipping-policy', 'refund-policy', 'privacy-policy', 'terms-of-service']) {
    try {
      const { policy } = await getJson(`/policies/${slug}.json`);
      policies[slug] = { title: policy.title, bodyHtml: sanitize(policy.body) };
    } catch (e) {
      console.warn('policy', slug, e.message);
    }
  }

  /* Copy written for the store's own category collections */
  const collectionCopy = {};
  for (const c of collections) {
    const d = plain(c.description);
    if (d) collectionCopy[c.handle] = d;
  }

  await mkdir('src/data', { recursive: true });
  await writeFile(
    'src/data/catalogue.json',
    JSON.stringify({ syncedAt: new Date().toISOString(), products: out, brands, recipes, policies, collectionCopy }, null, 0),
  );
  console.log(`✓ ${out.length} products · ${brands.length} brands · ${recipes.length} recipes · ${Object.keys(policies).length} policies`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
