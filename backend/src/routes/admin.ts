import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { z } from 'zod';
import type { PoolClient } from 'pg';
import { q, tx } from '../db.js';
import { HttpError, bad, notFound, parse, rateLimit } from '../lib/http.js';
import { ORDER_SELECT, adminDiscount, adminOrder, adminProduct, adminReview, type DiscountRow, type OrderRow, type ProductRow, type ReviewRow } from '../lib/mappers.js';
import { getSettings, slugify } from '../lib/commerce.js';
import { ALLOWED_TYPES, saveImage } from '../lib/storage.js';
import { requireStaff, signStaff } from '../middleware/auth.js';

export const adminRouter = Router();

/* ---------- auth ---------- */
adminRouter.post('/login', rateLimit(10, 60_000), async (req, res) => {
  const b = parse(z.object({ email: z.string().trim().min(1), password: z.string().min(1) }), req.body);
  const r = await q('select * from staff where lower(email) = lower($1)', [b.email]);
  const s = r.rows[0];
  if (!s?.password_hash || !(await bcrypt.compare(b.password, s.password_hash))) throw new HttpError(401, 'Incorrect email or password.');
  const me = meOf(s);
  res.json({ token: signStaff({ sub: String(s.id), name: s.name, role: s.role, email: s.email }), me });
});

const meOf = (s: { name: string; role: string; location: string; initials: string; email: string }) => ({
  name: s.name, role: s.location ? `${s.role} · ${s.location}` : s.role, initials: s.initials, email: s.email,
});

adminRouter.use(requireStaff);

adminRouter.get('/me', async (req, res) => {
  const r = await q('select * from staff where id = $1', [Number(req.staff!.sub)]);
  if (!r.rowCount) throw new HttpError(401, 'Please sign in');
  res.json(meOf(r.rows[0]));
});

/* ---------- shared loaders ---------- */
const INV_SQL = `
  select p.handle, i.on_hand as st, i.reorder_point as rop, p.cost, i.location as loc,
    coalesce((select sum(pi.qty) from po_items pi join purchase_orders po on po.id = pi.po_id
              where pi.handle = p.handle and po.status in ('In transit','At customs')), 0)::int as inc,
    coalesce((select sum(oi.qty) from order_items oi join orders o on o.id = oi.order_id
              where oi.handle = p.handle and o.placed_at > now() - interval '30 days'), 0)::int as s30
  from products p join inventory i on i.handle = p.handle`;

const invOf = (r: { st: number | null; rop: number; cost: number; inc: number; loc: string; s30: number }) =>
  ({ st: r.st, rop: r.rop, cost: r.cost, inc: r.inc, loc: r.loc, s30: r.s30 });

async function loadInv(handle: string) {
  const r = await q(INV_SQL + ' where p.handle = $1', [handle]);
  return r.rows[0] ? invOf(r.rows[0]) : null;
}

async function loadOrder(id: number, c?: PoolClient) {
  const sql = ORDER_SELECT + ' where o.id = $1';
  const r = c ? await c.query<OrderRow>(sql, [id]) : await q<OrderRow>(sql, [id]);
  if (!r.rowCount) throw notFound('Order not found');
  return adminOrder(r.rows[0]);
}

const DISCOUNT_SQL = `
  select d.*, case when d.type = 'Customer group'
      then (select count(*) from orders o join customers c on c.id = o.customer_id where c.trade)
      else (select count(*) from orders o where o.discount_code = d.code) end as used
  from discounts d`;

const loadPO = async (id: string) => {
  const r = await q(`select po.*, (select coalesce(json_agg(json_build_object('h', handle, 'q', qty) order by handle), '[]') from po_items where po_id = po.id) as items
                     from purchase_orders po where po.id = $1`, [id]);
  if (!r.rowCount) throw notFound('Purchase order not found');
  return poOf(r.rows[0]);
};
const poOf = (r: { id: string; supplier: string; created_at: Date; eta: Date; status: string; items: { h: string; q: number }[] }) =>
  ({ id: r.id, sup: r.supplier, dt: r.created_at.toISOString(), eta: r.eta.toISOString(), st: r.status, items: r.items });

/* ---------- bootstrap ---------- */
adminRouter.get('/bootstrap', async (req, res) => {
  const [me, prods, inv, cust, orders, pos, sups, revs, discs, camps, staff, settings, msgs] = await Promise.all([
    q('select * from staff where id = $1', [Number(req.staff!.sub)]),
    q<ProductRow>('select * from products order by sort_order, created_at'),
    q(INV_SQL),
    q('select * from customers order by id'),
    q<OrderRow>(ORDER_SELECT + ' order by o.placed_at desc, o.id desc'),
    q(`select po.*, (select coalesce(json_agg(json_build_object('h', handle, 'q', qty) order by handle), '[]') from po_items where po_id = po.id) as items
       from purchase_orders po order by po.created_at desc`),
    q('select * from suppliers'),
    q<ReviewRow>('select * from reviews order by created_at desc, id desc'),
    q<DiscountRow>(DISCOUNT_SQL + ' order by d.created_at, d.code'),
    q('select * from campaigns order by sort_order, id'),
    q('select * from staff order by sort_order, id'),
    getSettings(),
    q('select * from contact_messages order by created_at desc limit 500'),
  ]);
  if (!me.rowCount) throw new HttpError(401, 'Please sign in');
  // keep the mockup's PO order (by id desc reads naturally, but mockup listed 0318,0317,0316,0319)
  const PO_ORDER = ['PO-0318', 'PO-0317', 'PO-0316', 'PO-0319'];
  const poRows = pos.rows.map(poOf).sort((a, b) => {
    const ia = PO_ORDER.indexOf(a.id), ib = PO_ORDER.indexOf(b.id);
    if (ia === -1 && ib === -1) return b.id.localeCompare(a.id);
    if (ia === -1) return -1;
    if (ib === -1) return 1;
    return ia - ib;
  });
  res.json({
    me: meOf(me.rows[0]),
    products: prods.rows.map(adminProduct),
    inventory: Object.fromEntries(inv.rows.map(r => [r.handle, invOf(r)])),
    customers: cust.rows.map(c => ({
      id: c.id, n: c.name, contact: c.contact || c.name, em: c.email, city: c.city, st: c.state, pc: c.postcode,
      trade: c.trade, since: c.since.toISOString(), news: c.newsletter,
    })),
    orders: orders.rows.map(adminOrder),
    pos: poRows,
    suppliers: Object.fromEntries(sups.rows.map(s => [s.brand, { n: s.name, lead: s.lead, terms: s.terms, moq: s.moq }])),
    reviews: revs.rows.map(adminReview),
    discounts: discs.rows.map(adminDiscount),
    campaigns: camps.rows.map(c => ({ n: c.name, ch: c.channel, aud: c.audience, st: c.status, dt: c.date_label, sent: c.sent, open: c.open_rate, click: c.click_rate, rev: c.revenue })),
    staff: staff.rows.map(s => ({ n: s.name, r: s.role, a: s.access })),
    settings,
    messages: msgs.rows.map(x => ({ id: x.id, n: x.name, em: x.email, ph: x.phone, topic: x.topic, msg: x.message, dt: x.created_at.toISOString() })),
  });
});

/* ---------- orders ---------- */
const FS = ['Unfulfilled', 'Packing', 'Ready to ship', 'Shipped', 'Delivered', 'Returned'] as const;
const PS = ['Paid', 'Pending payment', 'Refunded', 'Partially refunded', 'Due in 14 days'] as const;
const orderId = (s: string) => {
  const n = Number(String(s).replace(/^#|%23/, ''));
  if (!Number.isInteger(n) || n <= 0) throw bad('Invalid order id');
  return n;
};

adminRouter.patch('/orders/:id', async (req, res) => {
  const id = orderId(req.params.id);
  const b = parse(z.object({ fs: z.enum(FS).optional(), ps: z.enum(PS).optional() }), req.body);
  const order = await tx(async c => {
    const cur = await c.query('select fulfilment_status, payment_status from orders where id = $1 for update', [id]);
    if (!cur.rowCount) throw notFound('Order not found');
    const wasRefunded = cur.rows[0].payment_status === 'Refunded';
    if (b.ps === 'Refunded' && !wasRefunded) {
      const items = await c.query('select handle, qty from order_items where order_id = $1', [id]);
      for (const it of items.rows) {
        await c.query('update inventory set on_hand = on_hand + $2, updated_at = now() where handle = $1', [it.handle, it.qty]);
        await c.query('insert into stock_movements(handle, delta, reason, author) values ($1,$2,$3,$4)', [it.handle, it.qty, `Refund #${id}`, req.staff!.name]);
      }
    }
    const ship = b.fs === 'Shipped' && !['Shipped', 'Delivered', 'Returned'].includes(cur.rows[0].fulfilment_status);
    await c.query(
      `update orders set fulfilment_status = coalesce($2, fulfilment_status), payment_status = coalesce($3, payment_status),
         tracking = case when $4 and tracking = '' then '33XK' || (100000 + floor(random() * 899999))::int || '01' else tracking end
       where id = $1`,
      [id, b.fs ?? null, b.ps ?? null, ship],
    );
    const label = [b.fs && `Fulfilment → ${b.fs}`, b.ps && `Payment → ${b.ps}`].filter(Boolean).join(' · ');
    if (label) await c.query('insert into order_notes(order_id, text, author) values ($1,$2,$3)', [id, label, req.staff!.name]);
    return loadOrder(id, c);
  });
  res.json(order);
});

adminRouter.post('/orders/bulk', async (req, res) => {
  const b = parse(z.object({ ids: z.array(z.string()).min(1).max(500), action: z.enum(['fulfil', 'labels', 'slips']) }), req.body);
  const ids = b.ids.map(orderId);
  if (b.action !== 'fulfil') return res.json({ updated: ids.length });
  const r = await q(
    `update orders set fulfilment_status = 'Shipped',
       tracking = case when tracking = '' then '33XK' || (100000 + floor(random() * 899999))::int || '01' else tracking end
     where id = any($1) and fulfilment_status in ('Unfulfilled','Packing','Ready to ship') returning id`,
    [ids],
  );
  res.json({ updated: r.rowCount });
});

adminRouter.post('/orders/:id/notes', async (req, res) => {
  const id = orderId(req.params.id);
  const b = parse(z.object({ text: z.string().trim().min(1).max(2000) }), req.body);
  const exists = await q('select 1 from orders where id = $1', [id]);
  if (!exists.rowCount) throw notFound('Order not found');
  const r = await q('insert into order_notes(order_id, text, author) values ($1,$2,$3) returning text, at, author as by', [id, b.text, req.staff!.name]);
  res.status(201).json(r.rows[0]);
});

/* ---------- products ---------- */
const CATS = ['spirits', 'liqueurs', 'syrups', 'purees', 'packs'] as const;
const money = z.coerce.number().min(0).max(100000);
const ProductIn = z.object({
  t: z.string().trim().min(1).max(160),
  b: z.string().trim().min(1).max(80),
  c: z.enum(CATS),
  p: money,
  cp: money.optional().default(0),
  cost: money.optional(),
  size: z.string().trim().max(20).optional().default(''),
  abv: z.string().trim().max(20).optional().default(''),
  origin: z.string().trim().max(120).optional().default(''),
  d: z.string().trim().max(5000).optional().default(''),
  active: z.boolean().optional().default(true),
  best: z.boolean().optional(),
  images: z.array(z.string().min(1).max(500)).max(12).optional(),
  img: z.string().min(1).max(500).optional(), // single uploaded image to append
  v: z.string().trim().max(30).optional(),
});

adminRouter.post('/products', async (req, res) => {
  const b = parse(ProductIn, req.body);
  const base = slugify(`${b.b === 'Cocktail Pack' ? '' : b.b} ${b.t}`) || 'product';
  const p = await tx(async c => {
    let handle = base;
    for (let i = 2; (await c.query('select 1 from products where handle = $1', [handle])).rowCount; i++) handle = `${base}-${i}`;
    const order = await c.query('select coalesce(max(sort_order), 0) + 1 as n from products');
    const r = await c.query<ProductRow>(
      `insert into products(handle, sort_order, title, brand, category, variant_id, price, compare_at, cost, active, best, abv, size, origin, images, description)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning *`,
      [handle, order.rows[0].n, b.t, b.b, b.c, b.v || '', b.p, b.cp || null, b.cost ?? +(b.p * 0.48).toFixed(2), b.active, b.best ?? false,
        b.abv, b.size, b.origin, JSON.stringify([...(b.images || []), ...(b.img ? [b.img] : [])]), b.d],
    );
    await c.query(`insert into inventory(handle, on_hand, reorder_point, location) values ($1, null, 6, '')`, [handle]);
    return r.rows[0];
  });
  res.status(201).json({ product: adminProduct(p), inventory: await loadInv(p.handle) });
});

const ProductPatch = z.object({
  t: z.string().trim().min(1).max(160), b: z.string().trim().min(1).max(80), c: z.enum(CATS), p: money, cp: money, cost: money,
  size: z.string().trim().max(20), abv: z.string().trim().max(20), origin: z.string().trim().max(120), d: z.string().trim().max(5000),
  active: z.boolean(), best: z.boolean(), images: z.array(z.string().min(1).max(500)).max(12), img: z.string().min(1).max(500), v: z.string().trim().max(30),
}).partial();

adminRouter.put('/products/:h', async (req, res) => {
  const b = parse(ProductPatch, req.body);
  const cur = await q<ProductRow>('select * from products where handle = $1', [req.params.h]);
  if (!cur.rowCount) throw notFound('Product not found');
  const o = cur.rows[0];
  const r = await q<ProductRow>(
    `update products set title=$2, brand=$3, category=$4, price=$5, compare_at=$6, cost=$7, size=$8, abv=$9, origin=$10, description=$11,
       active=$12, best=$13, images=$14, variant_id=$15, updated_at=now() where handle=$1 returning *`,
    [o.handle, b.t ?? o.title, b.b ?? o.brand, b.c ?? o.category, b.p ?? o.price, b.cp === undefined ? o.compare_at : (b.cp || null),
      b.cost ?? o.cost, b.size ?? o.size, b.abv ?? o.abv, b.origin ?? o.origin, b.d ?? o.description, b.active ?? o.active, b.best ?? o.best,
      JSON.stringify([...(b.images ?? o.images), ...(b.img && !(b.images ?? o.images).includes(b.img) ? [b.img] : [])]), b.v ?? o.variant_id],
  );
  res.json({ product: adminProduct(r.rows[0]), inventory: await loadInv(o.handle) });
});

/* ---------- inventory ---------- */
adminRouter.patch('/inventory/:h', async (req, res) => {
  const b = parse(z.object({
    st: z.coerce.number().int().min(0).max(1_000_000).optional(),
    rop: z.coerce.number().int().min(0).max(100_000).optional(),
    loc: z.string().trim().max(60).optional(),
    cost: money.optional(),
    reason: z.string().trim().max(200).optional(),
  }), req.body);
  await tx(async c => {
    const cur = await c.query('select on_hand from inventory where handle = $1 for update', [req.params.h]);
    if (!cur.rowCount) throw notFound('Product not found');
    if (b.st !== undefined && b.st !== cur.rows[0].on_hand) {
      await c.query('insert into stock_movements(handle, delta, reason, author) values ($1,$2,$3,$4)',
        [req.params.h, b.st - (cur.rows[0].on_hand ?? 0), b.reason || 'Manual adjustment', req.staff!.name]);
    }
    await c.query(`update inventory set on_hand = coalesce($2, on_hand), reorder_point = coalesce($3, reorder_point),
                   location = coalesce($4, location), updated_at = now() where handle = $1`, [req.params.h, b.st ?? null, b.rop ?? null, b.loc ?? null]);
    if (b.cost !== undefined) await c.query('update products set cost = $2 where handle = $1', [req.params.h, b.cost]);
  });
  res.json(await loadInv(req.params.h));
});

/* ---------- reviews ---------- */
adminRouter.patch('/reviews/:id', async (req, res) => {
  const b = parse(z.object({ st: z.enum(['Pending', 'Published', 'Hidden']) }), req.body);
  const r = await q<ReviewRow>('update reviews set status = $2 where id = $1 returning *', [Number(req.params.id) || 0, b.st]);
  if (!r.rowCount) throw notFound('Review not found');
  res.json(adminReview(r.rows[0]));
});

/* ---------- discounts ---------- */
const fmtDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
adminRouter.post('/discounts', async (req, res) => {
  const b = parse(z.object({
    c: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9_-]+$/, 'Use letters, numbers, - or _'),
    t: z.string().trim().max(120).optional(),
    ty: z.enum(['Percentage', 'Fixed amount', 'Free shipping', 'Buy X get Y']),
    value: z.union([z.number(), z.string()]).optional(),
    applies: z.string().trim().max(60).optional().default('All products'),
    min: z.union([z.number(), z.string()]).optional(),
    limit: z.union([z.number(), z.string()]).optional(),
    starts: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    ends: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    once: z.boolean().optional().default(false),
  }), req.body);
  const num = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
  const code = b.c.toUpperCase();
  const value = num(b.value);
  if ((b.ty === 'Percentage' && (value <= 0 || value > 100)) || (b.ty === 'Fixed amount' && value <= 0)) throw bad('Enter a valid discount value');
  const today = new Date().toISOString().slice(0, 10);
  const scheduled = !!b.starts && b.starts > today;
  const status = scheduled ? 'Scheduled' : b.ends && b.ends < today ? 'Expired' : 'Active';
  const ends_label = scheduled ? `Starts ${fmtDay(b.starts!)}` : b.ends ? fmtDay(b.ends) : 'No end date';
  const title = b.t || (b.ty === 'Percentage' ? `${value}% off ${b.applies === 'All products' ? 'everything' : b.applies.toLowerCase()}`
    : b.ty === 'Fixed amount' ? `$${value} off ${b.applies === 'All products' ? 'your order' : b.applies.toLowerCase()}`
    : b.ty === 'Free shipping' ? 'Free shipping' : 'Buy X get Y');
  const limit = num(b.limit) || null;
  try {
    const r = await q<DiscountRow>(
      `insert into discounts(code, title, type, value, applies_to, status, ends_label, min_spend, usage_limit, starts_at, ends_at, once_per_customer)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *, 0 as used`,
      [code, title, b.ty, value, b.applies, status, ends_label, num(b.min), limit, b.starts || null, b.ends || null, b.once],
    );
    res.status(201).json(adminDiscount(r.rows[0]));
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw new HttpError(409, `Code ${code} already exists`);
    throw e;
  }
});

/* ---------- purchase orders ---------- */
adminRouter.post('/pos', async (req, res) => {
  const b = parse(z.object({
    sup: z.string().trim().min(1).max(120),
    items: z.array(z.object({ h: z.string().min(1), q: z.coerce.number().int().min(1).max(100000) })).min(1).max(200),
    st: z.enum(['Draft', 'In transit', 'At customs']).optional().default('Draft'),
  }), req.body);
  const id = await tx(async c => {
    // add to an existing draft for the same supplier when there is one (mockup: "Added … to draft PO")
    const draft = await c.query(`select id from purchase_orders where supplier = $1 and status = 'Draft' order by created_at desc limit 1`, [b.sup]);
    let poId: string = draft.rows[0]?.id;
    if (!poId || b.st !== 'Draft') {
      const n = await c.query(`select coalesce(max(substring(id from 4)::int), 315) + 1 as n from purchase_orders`);
      poId = 'PO-' + String(n.rows[0].n).padStart(4, '0');
      await c.query(`insert into purchase_orders(id, supplier, eta, status) values ($1,$2, now() + interval '8 weeks', $3)`, [poId, b.sup, b.st]);
    }
    for (const it of b.items) {
      const ok = await c.query('select 1 from products where handle = $1', [it.h]);
      if (!ok.rowCount) throw bad(`Unknown product ${it.h}`);
      await c.query(`insert into po_items(po_id, handle, qty) values ($1,$2,$3) on conflict (po_id, handle) do update set qty = po_items.qty + excluded.qty`, [poId, it.h, it.q]);
    }
    return poId;
  });
  res.status(201).json(await loadPO(id));
});

adminRouter.patch('/pos/:id', async (req, res) => {
  const b = parse(z.object({ st: z.enum(['Draft', 'In transit', 'At customs', 'Received']) }), req.body);
  await tx(async c => {
    const cur = await c.query('select status from purchase_orders where id = $1 for update', [req.params.id]);
    if (!cur.rowCount) throw notFound('Purchase order not found');
    if (b.st === 'Received' && cur.rows[0].status !== 'Received') {
      const items = await c.query('select handle, qty from po_items where po_id = $1', [req.params.id]);
      for (const it of items.rows) {
        await c.query('update inventory set on_hand = coalesce(on_hand, 0) + $2, updated_at = now() where handle = $1', [it.handle, it.qty]);
        await c.query('insert into stock_movements(handle, delta, reason, author) values ($1,$2,$3,$4)', [it.handle, it.qty, `Received ${req.params.id}`, req.staff!.name]);
      }
    }
    await c.query('update purchase_orders set status = $2 where id = $1', [req.params.id, b.st]);
  });
  res.json(await loadPO(req.params.id));
});

/* ---------- settings ---------- */
adminRouter.put('/settings', async (req, res) => {
  const b = parse(z.object({
    freeShip: z.coerce.number().min(0).max(100000).optional(),
    stdRate: z.coerce.number().min(0).max(1000).optional(),
    signature: z.boolean().optional(),
    sameDay: z.boolean().optional(),
    licence: z.string().trim().max(60).optional(),
    ageGate: z.boolean().optional(),
    rsMessage: z.boolean().optional(),
    gstInclusive: z.boolean().optional(),
  }), req.body);
  const next = { ...(await getSettings()), ...b };
  await q('update settings set data = $1, updated_at = now() where id = 1', [next]);
  res.json(next);
});

/* ---------- uploads ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, f, cb) => (ALLOWED_TYPES.includes(f.mimetype) ? cb(null, true) : cb(bad('Upload a JPG, PNG, WebP or AVIF image'))),
});
adminRouter.post('/uploads', upload.single('file'), async (req, res) => {
  if (!req.file) throw bad('No file uploaded');
  res.status(201).json({ url: await saveImage(req.file.buffer, req.file.mimetype) });
});
