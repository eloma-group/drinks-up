# Drinks Up — API contract

Backend: Express + TypeScript, `backend/`, default `http://localhost:4000`.
All routes are under `/api`. JSON in / JSON out. Errors: `{ "error": "message" }` with a 4xx/5xx status.

Both frontends call **relative** `/api/...` (Vite dev server proxies `/api` → `http://localhost:4000`;
in Azure the Static Web Apps are linked to the App Service backend so `/api` is proxied too).
`VITE_API_URL` may override the base (e.g. `https://drinksup-api.azurewebsites.net`).

Field names deliberately match the short keys used in the HTML mockups, so the ported UI code can
keep the same logic.

## Images
* Storefront images live in `frontend/public/images/<key>.webp` → URL `/images/<key>.webp`.
  Resolve a key with: `k.startsWith('http') || k.startsWith('/') ? k : '/images/' + k + '.webp'`.
* Admin thumbnails live in `admin/public/thumbs/<key>.webp` (74 keys). If a key has no thumb, fall back
  to `${VITE_STORE_URL || 'http://localhost:5173'}/images/<key>.webp`; absolute URLs (uploads) are used as-is.

---------------------------------------------------------------------------------------------------
## Public (storefront)

### GET /api/health → `{ ok: true, db: true }`

### GET /api/catalog
```ts
{ products: Product[], recipes: Record<string, Recipe>, settings: { freeShip: number; stdRate: number } }
// active products only (drafts hidden), in catalogue order; Cache-Control: no-cache so admin edits show immediately

type Product = {
  h: string; t: string; b: string; c: 'spirits'|'liqueurs'|'syrups'|'purees'|'packs';
  v: string;            // Shopify variant id (used for checkout permalink)
  p: number; cp?: number;   // price / compare-at (cp omitted when none)
  ok: 0|1;              // 1 = active AND on_hand > 0
  best?: 1; abv?: string; size?: string; origin?: string;
  img: string[];        // image keys, cut-out already inserted at index 1 (as in the mockup)
  cut?: string;         // cut-out bottle image key
  tag?: string; d?: string; notes?: [string,string][]; serve?: string; rec?: string[];
  rating: { avg: number; n: number };   // from published reviews
}
type Recipe = { n: string; b: string; img: string; k: string; d: string; i: [string,string][]; m: string; shop: string }
```

### GET /api/products/:handle/reviews → `Review[]` (published only)
```ts
type Review = { id: number; n: string; city: string; r: number; t: string; b: string; d: string /*ISO*/; v: boolean; help: number }
```

### POST /api/products/:handle/reviews  body `{ n, city?, r (1-5), t, b }` → `201 { review: Review }`
Saved with status `Pending` (shown in admin › Reviews for moderation). The storefront still shows it
immediately in the current session (as the mockup does).

### GET /api/reviews/featured → latest 8 published 4★+ reviews `{ id, t, b, n, city, r, v, brand, product }[]` (home carousel; hidden when empty)

### POST /api/reviews/:id/helpful → `{ help: number }`

### POST /api/discounts/validate  body `{ code }` → `{ valid: boolean, code: string, title?: string }`

### POST /api/orders
```ts
body: { email, phone?, news?: boolean, first, last, address1, address2?, city, state, zip, note?,
        discount?: string, items: { h: string; q: number }[] }
→ 201 { id: '#10999', total: number, checkoutUrl: string }
```
Server re-prices from the DB, applies the discount, shipping (free ≥ settings.freeShip else settings.stdRate),
creates/links the customer by email, stores the order with `ps:'Pending payment'`, `fs:'Unfulfilled'`,
`ch:'Online store'`, and returns the Shopify cart permalink (same format the mockup builds) for payment hand-off.

### POST /api/contact  body `{ name, email, phone?, topic, message }` → `201 { ok: true }`

### POST /api/account/register  body `{ first, last, email, password, news?: boolean }` → `201 { token, customer: { id, n, em } }`
### POST /api/account/login     body `{ email, password }` → `{ token, customer: { id, n, em } }`

---------------------------------------------------------------------------------------------------
## Admin (staff)  — prefix `/api/admin`, `Authorization: Bearer <token>` on everything except login

### POST /api/admin/login  body `{ email, password }` → `{ token, me: Me }`
Default seeded login: **admin@drinksup.com.au / DrinksUp!2026** (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` when seeding).
### GET /api/admin/me → `Me`
```ts
type Me = { name: string; role: string; initials: string; email: string }
```

### GET /api/admin/bootstrap → everything the dashboard needs (the admin computes KPIs/charts client-side, like the mockup)
```ts
{
  me: Me,
  products: AProduct[],                          // mockup order
  inventory: Record<string /*h*/, Inv>,
  customers: ACustomer[],
  orders: AOrder[],                              // newest first
  pos: PO[],
  suppliers: Record<string /*brand*/, { n: string; lead: string; terms: string; moq: string }>,
  reviews: AReview[],                            // newest first
  discounts: Discount[],
  campaigns: Campaign[],
  staff: { n: string; r: string; a: string }[],
  settings: Settings,
  messages: { id: number; n: string; em: string; ph: string; topic: string; msg: string; dt: string }[]   // contact form + back-in-stock requests
}
type AProduct = { h; t; b; c; p: number; cp: number /*0 = none*/; ok: 0|1 /*active*/; size: string; abv: string;
                  v: string; best: 0|1; img: string /*thumb key = cut || img[0]*/; origin: string; d: string }
type Inv = { st: number | null /* null = not counted yet */; rop: number; cost: number; inc: number /*units on open POs*/; loc: string; s30: number /*sold last 30d*/ }
type ACustomer = { id: 'C4100'; n: string; contact: string; em: string; city: string; st: string; pc: string;
                   trade: boolean; since: string /*ISO*/; news: boolean }
type AOrder = { id: '#10981'; dt: string /*ISO*/; cu: string /*customer id*/; ch: string;
                items: { h: string; q: number; p: number }[]; sub: number; disc: number; ship: number; tot: number;
                fs: 'Unfulfilled'|'Packing'|'Ready to ship'|'Shipped'|'Delivered'|'Returned';
                ps: 'Paid'|'Pending payment'|'Refunded'|'Partially refunded'|'Due in 14 days';
                code: string; carrier: string; track: string;
                addr: { first; last; line1; line2; city; st; pc; phone; note } | null;
                notes: { text: string; at: string; by: string }[] }
type PO = { id: 'PO-0318'; sup: string; dt: string; eta: string; st: 'Draft'|'In transit'|'At customs'|'Received'; items: { h: string; q: number }[] }
type AReview = { id: number; h: string; cu: string|null; name: string; r: number; t: string; b: string; dt: string; st: 'Pending'|'Published'|'Hidden'; ver: boolean }
type Discount = { c: string; t: string; ty: string; u: number; st: 'Active'|'Scheduled'|'Expired'; ends: string }
type Campaign = { n; ch; aud; st; dt; sent: number; open: number; click: number; rev: number }
type Settings = { freeShip: number; stdRate: number; signature: boolean; sameDay: boolean; licence: string;
                  ageGate: boolean; rsMessage: boolean; gstInclusive: boolean }
```

### Mutations (all return the updated entity unless noted)
| Method | Route | Body | Notes |
|---|---|---|---|
| PATCH | /api/admin/orders/:id | `{ fs?, ps? }` | `:id` is the number without `#` (e.g. `10981`). Refund → `{ps:'Refunded', fs:'Returned'}` restocks. |
| POST | /api/admin/orders/bulk | `{ ids: string[], action: 'fulfil'|'labels'|'slips' }` | `fulfil` sets fs=`Shipped`. → `{ updated: number }` |
| POST | /api/admin/orders/:id/notes | `{ text }` | → note |
| POST | /api/admin/products | AProduct-like `{ t,b,c,p,cp,size,abv,origin,d,active,cost }` | → AProduct (handle generated) |
| PUT | /api/admin/products/:h | same fields, all optional | → AProduct |
| PATCH | /api/admin/inventory/:h | `{ st?, rop?, loc?, cost?, reason? }` | → Inv |
| PATCH | /api/admin/reviews/:id | `{ st }` | → AReview |
| POST | /api/admin/discounts | `{ c, t, ty, value, min?, limit?, starts?, ends?, once? }` | → Discount |
| POST | /api/admin/pos | `{ sup, items: {h,q}[], st? }` | → PO |
| PATCH | /api/admin/pos/:id | `{ st }` | `Received` adds the units to on-hand stock |
| PUT | /api/admin/settings | Partial<Settings> | → Settings |
| POST | /api/admin/uploads | multipart `file` | → `{ url }` (Azure Blob if configured, else served from backend `/uploads`) |
