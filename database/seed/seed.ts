/**
 * Seed the Drinks Up database with REAL data only:
 *   - the 73 products on the storefront (titles, brands, prices, images, descriptions, tasting notes,
 *     Shopify variant ids) and their availability (sold-out products start with stock 0),
 *   - the 13 cocktail recipes,
 *   - store settings and the first admin login.
 * No sample orders, customers, reviews, discounts, campaigns or purchase orders are created —
 * those tables fill up from real activity. Stock counts of available products start as "not set"
 * (null) until staff enter them; the product keeps selling meanwhile.
 *
 * Usage:  DATABASE_URL=… npm run seed      (WIPES all data and re-inserts the catalogue)
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { clientFor } from '../scripts/migrate.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const load = (f: string) => JSON.parse(readFileSync(path.join(here, 'data', f), 'utf8'));

type SP = {
  h: string; t: string; b: string; c: string; v: string; p: number; cp?: number; ok: number; best?: number;
  abv?: string; size?: string; origin?: string; img: string[]; cut?: string; tag?: string; d?: string;
  notes?: [string, string][]; serve?: string; rec?: string[];
};
type SR = { n: string; b: string; img: string; k: string; d: string; i: [string, string][]; m: string; shop: string };

/** Brand → supplier (who the stock is bought from). Lead time / terms / MOQ are entered by staff. */
const SUPPLIERS: Record<string, string> = {
  'Giffard': 'Giffard (Angers, France)',
  'Black Tears': 'Black Tears (Cuba)',
  'Burnt Ends': 'Burnt Ends (USA)',
  'San Matías': 'Casa San Matías (Jalisco, MX)',
  'Pueblo Viejo': 'Casa San Matías (Jalisco, MX)',
  'Demonio de los Andes': 'Demonio de los Andes (Peru)',
  'Thoquino': 'Toquinho (Brazil)',
  'Whiskey Row': 'Whiskey Row (Kentucky, USA)',
  'Worthy Park': 'Worthy Park Estate (Jamaica)',
  'Cocktail Pack': 'Assembled in-house',
};

export async function seed(url: string) {
  const P: SP[] = load('products.json');
  const R: Record<string, SR> = load('recipes.json');
  const handles = new Set(P.map(p => p.h));

  const db = clientFor(url);
  await db.connect();
  const ins = (table: string, rows: object[]) =>
    rows.length ? db.query(`insert into ${table} select * from jsonb_populate_recordset(null::${table}, $1::jsonb)`, [JSON.stringify(rows)]) : null;
  try {
    await db.query('begin');
    await db.query(`truncate settings, staff, suppliers, products, inventory, stock_movements, recipes, customers, orders,
      order_items, order_notes, purchase_orders, po_items, reviews, discounts, campaigns, contact_messages restart identity cascade`);
    await db.query(`select setval('customer_seq', 4100, false), setval('order_seq', 10981, false)`);

    await db.query('insert into settings(id, data) values (1, $1)', [{
      freeShip: 150, stdRate: 12.95, signature: true, sameDay: true, licence: '616214992620',
      ageGate: true, rsMessage: true, gstInclusive: true,
    }]);

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@drinksup.com.au').toLowerCase();
    const adminHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'DrinksUp!2026', 10);
    await db.query(
      `insert into staff(name, role, access, email, password_hash, initials, location, sort_order) values ($1,$2,$3,$4,$5,$6,$7,0)`,
      [process.env.ADMIN_NAME || 'Store admin', 'Owner', 'Full access', adminEmail, adminHash, 'DU', ''],
    );

    await ins('suppliers', Object.entries(SUPPLIERS).map(([brand, name]) => ({ brand, name, lead: '—', terms: '—', moq: '—' })));

    const now = new Date();
    await ins('products', P.map((p, i) => ({
      handle: p.h, sort_order: i, title: p.t, brand: p.b, category: p.c, variant_id: p.v, price: p.p, compare_at: p.cp ?? null,
      cost: 0, active: true, best: !!p.best, abv: p.abv || '', size: p.size || '', origin: p.origin || '',
      images: p.img, cut: p.cut || null, tagline: p.tag || '', description: p.d || '', notes: p.notes || null, serve: p.serve || '',
      recipe_ids: p.rec || null, created_at: now, updated_at: now,
    })));
    await ins('inventory', P.map(p => ({
      handle: p.h, on_hand: p.ok ? null : 0, reorder_point: 6, location: p.c === 'packs' ? 'Packing bench' : '', updated_at: now,
    })));
    await ins('recipes', Object.entries(R).map(([id, r], i) => ({
      id, sort_order: i, name: r.n, brand: r.b, image: r.img, kind: r.k, description: r.d, ingredients: r.i, method: r.m,
      product_handle: handles.has(r.shop) ? r.shop : null,
    })));

    await db.query('commit');
    console.log(`[seed] ${P.length} products (${P.filter(p => p.ok).length} in stock) · ${Object.keys(R).length} recipes · no sample data`);
    console.log(`[seed] admin login: ${adminEmail} / ${process.env.ADMIN_PASSWORD ? '(ADMIN_PASSWORD)' : 'DrinksUp!2026'}`);
  } catch (e) {
    await db.query('rollback');
    throw e;
  } finally {
    await db.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await seed(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/drinksup');
}
