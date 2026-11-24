/** Row → API shape mappers. Keys intentionally match the short keys used by the mockups (see docs/API.md). */

export type ProductRow = {
  handle: string; title: string; brand: string; category: string; variant_id: string; price: number; compare_at: number | null;
  cost: number; active: boolean; best: boolean; abv: string; size: string; origin: string; images: string[]; cut: string | null;
  tagline: string; description: string; notes: [string, string][] | null; serve: string; recipe_ids: string[] | null;
  on_hand?: number | null; reorder_point?: number; location?: string; avg?: number | null; n?: number;
};

export function storeProduct(r: ProductRow) {
  const p: Record<string, unknown> = { h: r.handle, t: r.title, b: r.brand, c: r.category, v: r.variant_id, p: r.price };
  if (r.compare_at) p.cp = r.compare_at;
  p.ok = r.active && (r.on_hand == null || r.on_hand > 0) ? 1 : 0;
  if (r.best) p.best = 1;
  if (r.abv) p.abv = r.abv;
  if (r.size) p.size = r.size;
  if (r.origin) p.origin = r.origin;
  p.img = r.images;
  if (r.cut) p.cut = r.cut;
  if (r.tagline) p.tag = r.tagline;
  if (r.description) p.d = r.description;
  if (r.notes?.length) p.notes = r.notes;
  if (r.serve) p.serve = r.serve;
  if (r.recipe_ids?.length) p.rec = r.recipe_ids;
  p.rating = { avg: r.avg ? +r.avg : 0, n: r.n ?? 0 };
  return p;
}

export function adminProduct(r: ProductRow) {
  return {
    h: r.handle, t: r.title, b: r.brand, c: r.category, p: r.price, cp: r.compare_at || 0, ok: r.active ? 1 : 0,
    size: r.size, abv: r.abv, v: r.variant_id, best: r.best ? 1 : 0, img: r.cut || r.images[0] || '', origin: r.origin, d: r.description,
  };
}

export type ReviewRow = {
  id: number; handle: string; customer_id: string | null; name: string; city: string; rating: number; title: string; body: string;
  status: string; verified: boolean; helpful: number; created_at: Date;
};

export const storeReview = (r: ReviewRow) => ({
  id: r.id, n: r.name, city: r.city, r: r.rating, t: r.title, b: r.body, d: r.created_at.toISOString(), v: r.verified, help: r.helpful,
});

export const adminReview = (r: ReviewRow) => ({
  id: r.id, h: r.handle, cu: r.customer_id, name: r.name, r: r.rating, t: r.title, b: r.body, dt: r.created_at.toISOString(), st: r.status, ver: r.verified,
});

export type OrderRow = {
  id: number; placed_at: Date; customer_id: string; channel: string; subtotal: number; discount: number; shipping: number; total: number;
  fulfilment_status: string; payment_status: string; discount_code: string; carrier: string; tracking: string;
  address: Record<string, string> | null; items: { h: string; q: number; p: number }[] | null; notes: { text: string; at: string; by: string }[] | null;
};

export const adminOrder = (r: OrderRow) => ({
  id: '#' + r.id, dt: r.placed_at.toISOString(), cu: r.customer_id, ch: r.channel, items: r.items || [],
  sub: r.subtotal, disc: r.discount, ship: r.shipping, tot: r.total, fs: r.fulfilment_status, ps: r.payment_status,
  code: r.discount_code, carrier: r.carrier, track: r.tracking, addr: r.address, notes: r.notes || [],
});

/** Full order select with items + notes aggregated; append a WHERE/ORDER clause. */
export const ORDER_SELECT = `
  select o.*,
    (select coalesce(json_agg(json_build_object('h', i.handle, 'q', i.qty, 'p', i.unit_price) order by i.handle), '[]')
       from order_items i where i.order_id = o.id) as items,
    (select coalesce(json_agg(json_build_object('text', n.text, 'at', n.at, 'by', n.author) order by n.at), '[]')
       from order_notes n where n.order_id = o.id) as notes
  from orders o`;

export type DiscountRow = {
  code: string; title: string; type: string; value: number; applies_to: string; status: string; ends_label: string; uses_base: number;
  min_spend: number; usage_limit: number | null; starts_at: string | null; ends_at: string | null; once_per_customer: boolean; used?: number;
};

export const adminDiscount = (r: DiscountRow) => ({ c: r.code, t: r.title, ty: r.type, u: r.uses_base + (r.used ?? 0), st: r.status, ends: r.ends_label });

export const CAT_LABEL: Record<string, string> = { spirits: 'Spirits', liqueurs: 'Liqueurs', syrups: 'Syrups', purees: 'Fruit purées', packs: 'Cocktail packs' };
