-- Drinks Up — PostgreSQL schema (Azure Database for PostgreSQL Flexible Server, PG 16)
-- Apply with:  npm run migrate      (reads DATABASE_URL)

create table if not exists settings (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists staff (
  id             serial primary key,
  name           text not null,
  role           text not null,
  access         text not null default '',
  email          text unique,
  password_hash  text,
  initials       text not null default '',
  location       text not null default '',
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists suppliers (
  brand  text primary key,
  name   text not null,
  lead   text not null,
  terms  text not null,
  moq    text not null
);

create table if not exists products (
  handle       text primary key,
  sort_order   int not null default 0,
  title        text not null,
  brand        text not null,
  category     text not null check (category in ('spirits','liqueurs','syrups','purees','packs')),
  variant_id   text not null default '',
  price        numeric(10,2) not null check (price >= 0),
  compare_at   numeric(10,2),
  cost         numeric(10,2) not null default 0,
  active       boolean not null default true,
  best         boolean not null default false,
  abv          text not null default '',
  size         text not null default '',
  origin       text not null default '',
  images       jsonb not null default '[]',
  cut          text,
  tagline      text not null default '',
  description  text not null default '',
  notes        jsonb,
  serve        text not null default '',
  recipe_ids   jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists products_category_idx on products(category);

create table if not exists inventory (
  handle         text primary key references products(handle) on delete cascade,
  on_hand        int,                 -- null = stock count not set yet (product sells while active)
  reorder_point  int not null default 6,
  location       text not null default '',
  updated_at     timestamptz not null default now()
);

create table if not exists stock_movements (
  id       serial primary key,
  handle   text not null references products(handle) on delete cascade,
  delta    int not null,
  reason   text not null,
  author   text not null default 'system',
  at       timestamptz not null default now()
);

create table if not exists recipes (
  id              text primary key,
  sort_order      int not null default 0,
  name            text not null,
  brand           text not null,
  image           text not null,
  kind            text not null,
  description     text not null,
  ingredients     jsonb not null,
  method          text not null,
  product_handle  text references products(handle) on delete set null
);

create sequence if not exists customer_seq start 4100;
create table if not exists customers (
  id             text primary key default ('C' || nextval('customer_seq')),
  name           text not null,
  contact        text not null default '',
  email          text not null unique,
  phone          text not null default '',
  city           text not null default '',
  state          text not null default '',
  postcode       text not null default '',
  trade          boolean not null default false,
  newsletter     boolean not null default false,
  password_hash  text,
  since          timestamptz not null default now()
);

create sequence if not exists order_seq start 10981;
create table if not exists orders (
  id                 int primary key default nextval('order_seq'),
  placed_at          timestamptz not null default now(),
  customer_id        text not null references customers(id),
  email              text not null default '',
  channel            text not null default 'Online store',
  subtotal           numeric(10,2) not null,
  discount           numeric(10,2) not null default 0,
  shipping           numeric(10,2) not null default 0,
  total              numeric(10,2) not null,
  fulfilment_status  text not null default 'Unfulfilled'
    check (fulfilment_status in ('Unfulfilled','Packing','Ready to ship','Shipped','Delivered','Returned')),
  payment_status     text not null default 'Pending payment'
    check (payment_status in ('Paid','Pending payment','Refunded','Partially refunded','Due in 14 days')),
  discount_code      text not null default '',
  carrier            text not null default '',
  tracking           text not null default '',
  address            jsonb
);
create index if not exists orders_placed_idx on orders(placed_at desc);
create index if not exists orders_customer_idx on orders(customer_id);

create table if not exists order_items (
  order_id    int not null references orders(id) on delete cascade,
  handle      text not null references products(handle),
  qty         int not null check (qty > 0),
  unit_price  numeric(10,2) not null,
  primary key (order_id, handle)
);

create table if not exists order_notes (
  id        serial primary key,
  order_id  int not null references orders(id) on delete cascade,
  text      text not null,
  author    text not null,
  at        timestamptz not null default now()
);

create table if not exists purchase_orders (
  id          text primary key,
  supplier    text not null,
  created_at  timestamptz not null default now(),
  eta         timestamptz not null,
  status      text not null check (status in ('Draft','In transit','At customs','Received'))
);
create table if not exists po_items (
  po_id   text not null references purchase_orders(id) on delete cascade,
  handle  text not null references products(handle),
  qty     int not null check (qty > 0),
  primary key (po_id, handle)
);

create table if not exists reviews (
  id           serial primary key,
  handle       text not null references products(handle) on delete cascade,
  customer_id  text references customers(id) on delete set null,
  name         text not null,
  city         text not null default '',
  rating       int not null check (rating between 1 and 5),
  title        text not null,
  body         text not null,
  status       text not null default 'Pending' check (status in ('Pending','Published','Hidden')),
  verified     boolean not null default false,
  helpful      int not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists reviews_handle_idx on reviews(handle, status);

create table if not exists discounts (
  code               text primary key,
  title              text not null,
  type               text not null,
  value              numeric(10,2) not null default 0,   -- percent for Percentage, dollars for Fixed amount
  applies_to         text not null default 'All products', -- or a category label, e.g. 'Cocktail packs'
  status             text not null check (status in ('Active','Scheduled','Expired')),
  ends_label         text not null default 'No end date',
  uses_base          int not null default 0,
  min_spend          numeric(10,2) not null default 0,
  usage_limit        int,
  starts_at          date,
  ends_at            date,
  once_per_customer  boolean not null default false,
  created_at         timestamptz not null default now()
);

create table if not exists campaigns (
  id          serial primary key,
  sort_order  int not null default 0,
  name        text not null,
  channel     text not null,
  audience    text not null,
  status      text not null,
  date_label  text not null,
  sent        int not null default 0,
  open_rate   numeric(5,1) not null default 0,
  click_rate  numeric(5,1) not null default 0,
  revenue     numeric(10,2) not null default 0
);

create table if not exists contact_messages (
  id          serial primary key,
  name        text not null,
  email       text not null,
  phone       text not null default '',
  topic       text not null default '',
  message     text not null,
  created_at  timestamptz not null default now()
);
