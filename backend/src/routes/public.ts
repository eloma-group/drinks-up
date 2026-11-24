import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { q, tx } from '../db.js';
import { config } from '../config.js';
import { HttpError, bad, notFound, parse, rateLimit } from '../lib/http.js';
import { storeProduct, storeReview, type ProductRow, type ReviewRow } from '../lib/mappers.js';
import { applyDiscount, findDiscount, getSettings, round2, shopifyPermalink } from '../lib/commerce.js';
import { signCustomer } from '../middleware/auth.js';

export const publicRouter = Router();

const writeLimit = rateLimit(20, 60_000);
const authLimit = rateLimit(10, 60_000);

publicRouter.get('/health', async (_req, res) => {
  await q('select 1');
  res.json({ ok: true, db: true });
});

/* ---------- catalogue ---------- */
publicRouter.get('/catalog', async (_req, res) => {
  const [prods, recs, settings] = await Promise.all([
    q<ProductRow>(`
      select p.*, i.on_hand, r.avg, coalesce(r.n, 0) as n
      from products p
      left join inventory i on i.handle = p.handle
      left join (select handle, avg(rating)::float as avg, count(*) as n from reviews where status = 'Published' group by handle) r
        on r.handle = p.handle
      where p.active -- drafts are hidden from the storefront
      order by p.sort_order, p.created_at`),
    q(`select * from recipes order by sort_order, id`),
    getSettings(),
  ]);
  const recipes: Record<string, unknown> = {};
  for (const r of recs.rows) {
    recipes[r.id] = { n: r.name, b: r.brand, img: r.image, k: r.kind, d: r.description, i: r.ingredients, m: r.method, shop: r.product_handle || '' };
  }
  // always fresh: admin edits (prices, stock, drafts) must show on the storefront straight away
  res.set('Cache-Control', 'no-cache');
  res.json({ products: prods.rows.map(storeProduct), recipes, settings: { freeShip: settings.freeShip, stdRate: settings.stdRate } });
});

/* ---------- reviews ---------- */
publicRouter.get('/products/:handle/reviews', async (req, res) => {
  const r = await q<ReviewRow>(`select * from reviews where handle = $1 and status = 'Published' order by created_at desc`, [req.params.handle]);
  res.json(r.rows.map(storeReview));
});

const ReviewIn = z.object({
  n: z.string().trim().min(1).max(30),
  city: z.string().trim().max(40).optional().default(''),
  r: z.coerce.number().int().min(1).max(5),
  t: z.string().trim().min(1).max(60),
  b: z.string().trim().min(1).max(2000),
});
publicRouter.post('/products/:handle/reviews', writeLimit, async (req, res) => {
  const body = parse(ReviewIn, req.body);
  const p = await q('select 1 from products where handle = $1', [req.params.handle]);
  if (!p.rowCount) throw notFound('Product not found');
  const r = await q<ReviewRow>(
    `insert into reviews(handle, name, city, rating, title, body, status, verified) values ($1,$2,$3,$4,$5,$6,'Pending',false) returning *`,
    [req.params.handle, body.n, body.city, body.r, body.t, body.b],
  );
  res.status(201).json({ review: storeReview(r.rows[0]) });
});

/** Real published 4★+ reviews for the home page carousel (empty until customers review). */
publicRouter.get('/reviews/featured', async (_req, res) => {
  const r = await q(`select r.id, r.title, r.body, r.name, r.city, r.rating, r.verified, p.brand, p.title as product
    from reviews r join products p on p.handle = r.handle
    where r.status = 'Published' and r.rating >= 4 order by r.created_at desc limit 8`);
  res.json(r.rows.map(x => ({ id: x.id, t: x.title, b: x.body, n: x.name, city: x.city, r: x.rating, v: x.verified, brand: x.brand, product: x.product })));
});

publicRouter.post('/reviews/:id/helpful', writeLimit, async (req, res) => {
  const r = await q(`update reviews set helpful = helpful + 1 where id = $1 and status = 'Published' returning helpful`, [Number(req.params.id) || 0]);
  if (!r.rowCount) throw notFound('Review not found');
  res.json({ help: r.rows[0].helpful });
});

/* ---------- discounts ---------- */
publicRouter.post('/discounts/validate', writeLimit, async (req, res) => {
  const { code } = parse(z.object({ code: z.string().trim().min(1).max(40) }), req.body);
  const f = await findDiscount(code);
  if (!f.ok) return res.json({ valid: false, code: code.toUpperCase(), reason: f.reason });
  res.json({ valid: true, code: f.d.code, title: f.d.title });
});

/* ---------- orders (checkout) ---------- */
const OrderIn = z.object({
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().default(''),
  news: z.boolean().optional().default(false),
  first: z.string().trim().min(1).max(60),
  last: z.string().trim().min(1).max(60),
  address1: z.string().trim().min(1).max(200),
  address2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1).max(80),
  state: z.enum(['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']),
  zip: z.string().trim().regex(/^[0-9]{4}$/, 'Postcode must be 4 digits'),
  note: z.string().trim().max(500).optional().default(''),
  discount: z.string().trim().max(40).optional().default(''),
  items: z.array(z.object({ h: z.string().min(1).max(120), q: z.number().int().min(1).max(99) })).min(1).max(60),
});

publicRouter.post('/orders', writeLimit, async (req, res) => {
  const b = parse(OrderIn, req.body);
  const qty: Record<string, number> = {};
  for (const it of b.items) qty[it.h] = (qty[it.h] || 0) + it.q;

  const out = await tx(async c => {
    const settings = await getSettings(c);
    const pr = await c.query<ProductRow & { on_hand: number | null }>(
      `select p.*, i.on_hand from products p join inventory i on i.handle = p.handle where p.handle = any($1) for update of i`,
      [Object.keys(qty)],
    );
    const byH = new Map(pr.rows.map(r => [r.handle, r]));
    const lines = Object.entries(qty).map(([h, n]) => {
      const p = byH.get(h);
      if (!p) throw bad(`A product in your cart is no longer available (${h}).`);
      const name = (p.category === 'packs' ? '' : p.brand + ' ') + p.title;
      if (!p.active || (p.on_hand != null && p.on_hand <= 0)) throw new HttpError(409, `${name} is sold out — please remove it from your cart.`);
      if (p.on_hand != null && n > p.on_hand) throw new HttpError(409, `Only ${p.on_hand} left of ${name} — please lower the quantity.`);
      return { h, qty: n, price: p.price, category: p.category, variant: p.variant_id, tracked: p.on_hand != null };
    });
    const subtotal = round2(lines.reduce((a, l) => a + l.price * l.qty, 0));

    let discount = 0, freeShip = false, code = '';
    if (b.discount) {
      const f = await findDiscount(b.discount, c);
      if (f.ok) {
        const d = applyDiscount(f.d, lines);
        if (!d.reason) { discount = d.amount; freeShip = d.freeShip; code = f.d.code; }
      }
    }
    const shipping = freeShip || subtotal - discount >= settings.freeShip ? 0 : settings.stdRate;
    const total = round2(subtotal - discount + shipping);

    const email = b.email.toLowerCase();
    const cu = await c.query(
      `insert into customers(name, contact, email, phone, city, state, postcode, newsletter)
       values ($1, $1, $2, $3, $4, $5, $6, $7)
       on conflict (email) do update set phone = coalesce(nullif(excluded.phone, ''), customers.phone),
         city = excluded.city, state = excluded.state, postcode = excluded.postcode,
         newsletter = customers.newsletter or excluded.newsletter
       returning id`,
      [`${b.first} ${b.last}`, email, b.phone, b.city, b.state, b.zip, b.news],
    );
    const addr = { first: b.first, last: b.last, line1: b.address1, line2: b.address2, city: b.city, st: b.state, pc: b.zip, phone: b.phone, note: b.note };
    const o = await c.query(
      `insert into orders(customer_id, email, channel, subtotal, discount, shipping, total, fulfilment_status, payment_status, discount_code, carrier, address)
       values ($1,$2,'Online store',$3,$4,$5,$6,'Unfulfilled','Pending payment',$7,$8,$9) returning id`,
      [cu.rows[0].id, email, subtotal, discount, shipping, total, code, shipping ? 'Australia Post' : 'StarTrack Express', addr],
    );
    const id: number = o.rows[0].id;
    for (const l of lines) {
      await c.query('insert into order_items(order_id, handle, qty, unit_price) values ($1,$2,$3,$4)', [id, l.h, l.qty, l.price]);
      if (!l.tracked) continue;
      await c.query('update inventory set on_hand = on_hand - $2, updated_at = now() where handle = $1', [l.h, l.qty]);
      await c.query(`insert into stock_movements(handle, delta, reason, author) values ($1, $2, $3, 'storefront')`, [l.h, -l.qty, `Order #${id}`]);
    }

    const params: Record<string, string> = {
      'checkout[email]': email,
      'checkout[shipping_address][first_name]': b.first,
      'checkout[shipping_address][last_name]': b.last,
      'checkout[shipping_address][address1]': b.address1,
      'checkout[shipping_address][address2]': b.address2,
      'checkout[shipping_address][city]': b.city,
      'checkout[shipping_address][province]': b.state,
      'checkout[shipping_address][zip]': b.zip,
      'checkout[shipping_address][country]': 'Australia',
      'checkout[shipping_address][phone]': b.phone,
      'note': b.note,
      'discount': b.discount ? b.discount.toUpperCase() : '',
      'attributes[drinksup_order]': String(id),
    };
    return { id: '#' + id, total, checkoutUrl: shopifyPermalink(config.shopifyStore, lines.map(l => ({ variant: l.variant, qty: l.qty })), params) };
  });
  res.status(201).json(out);
});

/* ---------- contact ---------- */
const ContactIn = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().default(''),
  topic: z.string().trim().max(60).optional().default(''),
  message: z.string().trim().min(1).max(5000),
});
publicRouter.post('/contact', writeLimit, async (req, res) => {
  const b = parse(ContactIn, req.body);
  await q('insert into contact_messages(name, email, phone, topic, message) values ($1,$2,$3,$4,$5)', [b.name, b.email, b.phone, b.topic, b.message]);
  res.status(201).json({ ok: true });
});

/* ---------- customer accounts ---------- */
const RegisterIn = z.object({
  first: z.string().trim().min(1).max(60),
  last: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(200),
  password: z.string().min(6).max(200),
  news: z.boolean().optional().default(false),
});
publicRouter.post('/account/register', authLimit, async (req, res) => {
  const b = parse(RegisterIn, req.body);
  const email = b.email.toLowerCase();
  const hash = await bcrypt.hash(b.password, 10);
  const name = `${b.first} ${b.last}`;
  const existing = await q('select id, password_hash from customers where email = $1', [email]);
  let id: string;
  if (existing.rowCount) {
    if (existing.rows[0].password_hash) throw new HttpError(409, 'An account with this email already exists — please sign in.');
    id = existing.rows[0].id;
    await q('update customers set password_hash = $2, name = $3, contact = $3, newsletter = newsletter or $4 where id = $1', [id, hash, name, b.news]);
  } else {
    const r = await q('insert into customers(name, contact, email, newsletter, password_hash) values ($1,$1,$2,$3,$4) returning id', [name, email, b.news, hash]);
    id = r.rows[0].id;
  }
  res.status(201).json({ token: signCustomer(id), customer: { id, n: name, em: email } });
});

publicRouter.post('/account/login', authLimit, async (req, res) => {
  const b = parse(z.object({ email: z.string().trim().email(), password: z.string().min(1) }), req.body);
  const r = await q('select id, name, email, password_hash from customers where email = $1', [b.email.toLowerCase()]);
  const u = r.rows[0];
  if (!u?.password_hash || !(await bcrypt.compare(b.password, u.password_hash))) throw new HttpError(401, 'Incorrect email or password.');
  res.json({ token: signCustomer(u.id), customer: { id: u.id, n: u.name, em: u.email } });
});
