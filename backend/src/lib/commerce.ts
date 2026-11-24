import type { PoolClient } from 'pg';
import { q } from '../db.js';
import { CAT_LABEL, type DiscountRow } from './mappers.js';

export type Settings = {
  freeShip: number; stdRate: number; signature: boolean; sameDay: boolean; licence: string;
  ageGate: boolean; rsMessage: boolean; gstInclusive: boolean;
};

export async function getSettings(c?: PoolClient): Promise<Settings> {
  const r = await (c ? c.query('select data from settings where id = 1') : q('select data from settings where id = 1'));
  return r.rows[0]?.data ?? { freeShip: 150, stdRate: 12.95, signature: true, sameDay: true, licence: '', ageGate: true, rsMessage: true, gstInclusive: true };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Look up a discount code and check it is usable right now. Returns the row or a reason. */
export async function findDiscount(code: string, c?: PoolClient): Promise<{ ok: true; d: DiscountRow } | { ok: false; reason: string }> {
  const sql = `select d.*, (select count(*) from orders o where o.discount_code = d.code) as used from discounts d where upper(d.code) = upper($1)`;
  const r = c ? await c.query(sql, [code.trim()]) : await q(sql, [code.trim()]);
  const d = r.rows[0] as DiscountRow | undefined;
  if (!d) return { ok: false, reason: 'That code isn’t valid.' };
  const today = new Date().toISOString().slice(0, 10);
  const startsAt = d.starts_at ? new Date(d.starts_at).toISOString().slice(0, 10) : null;
  const endsAt = d.ends_at ? new Date(d.ends_at).toISOString().slice(0, 10) : null;
  if (d.status === 'Expired' || (endsAt && endsAt < today)) return { ok: false, reason: 'That code has expired.' };
  if (d.status === 'Scheduled' && (!startsAt || startsAt > today)) return { ok: false, reason: 'That code isn’t active yet.' };
  if (d.type === 'Customer group') return { ok: false, reason: 'That code is for trade accounts only.' };
  if (d.usage_limit != null && (d.uses_base + (d.used ?? 0)) >= d.usage_limit) return { ok: false, reason: 'That code has reached its usage limit.' };
  return { ok: true, d };
}

/** Discount amount + whether shipping becomes free, for priced lines. */
export function applyDiscount(d: DiscountRow, lines: { category: string; price: number; qty: number }[]) {
  const eligible = lines.filter(l => d.applies_to === 'All products' || CAT_LABEL[l.category] === d.applies_to);
  const base = eligible.reduce((a, l) => a + l.price * l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  if (subtotal < d.min_spend) return { amount: 0, freeShip: false, reason: `Spend $${d.min_spend.toFixed(2)} to use this code.` };
  if (!eligible.length) return { amount: 0, freeShip: false, reason: `This code applies to ${d.applies_to.toLowerCase()} only.` };
  if (d.type === 'Percentage') return { amount: round2(base * d.value / 100), freeShip: false };
  if (d.type === 'Fixed amount') return { amount: round2(Math.min(base, d.value)), freeShip: false };
  if (d.type === 'Free shipping') return { amount: 0, freeShip: true };
  return { amount: 0, freeShip: false };
}

/** Shopify cart permalink, same format the mockup builds (variant:qty list + checkout prefill params). */
export function shopifyPermalink(store: string, lines: { variant: string; qty: number }[], params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const s = qs.toString();
  return `${store.replace(/\/$/, '')}/cart/${lines.map(l => `${l.variant}:${l.qty}`).join(',')}${s ? '?' + s : ''}`;
}

export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
