# Drinks Up — e-commerce (React + TypeScript, Azure)

| Folder | What | Tech | Azure |
|---|---|---|---|
| `frontend/` | Customer storefront (exact port of the DrinksUp website mockup) | React 19, TypeScript, Vite, React Router | Static Web App |
| `admin/` | Admin dashboard (port of the admin mockup, Drinks Up branding) | React 19, TypeScript, Vite, React Router | Static Web App |
| `backend/` | REST API | Node 22, Express 5, TypeScript, zod, JWT | App Service (Linux) |
| `database/` | Schema, seed data, local dev database | PostgreSQL 16 | Azure Database for PostgreSQL Flexible Server |
| `infra/` | Infrastructure as code + deploy script | Bicep, Azure CLI | — |
| `docs/API.md` | API contract shared by all three apps | | |

## Run locally

```bash
npm install            # root tooling (concurrently, wait-on)
npm run install:all    # installs database/, backend/, frontend/, admin/
npm run dev            # starts everything:
#   PostgreSQL  postgres://postgres:postgres@localhost:5433/drinksup  (embedded, no install needed)
#   API         http://localhost:4000/api
#   Storefront  http://localhost:5173
#   Admin       http://localhost:5174   →  admin@drinksup.com.au / DrinksUp!2026
```

The first `npm run dev` initialises the local database in `database/.pgdata` and seeds it.
`npm run db:reset` wipes it and re-seeds the real catalogue (73 products, 13 recipes). There is **no sample data**: orders, customers, reviews and messages only come from real use.

Each app can also be run on its own (`npm run dev` inside the folder). The Vite dev servers proxy `/api` to port 4000.

## What lives where

* **Catalogue** (73 products, prices, images, tasting notes), **recipes** and **reviews** are in PostgreSQL and served by
  `GET /api/catalog`. Editing a product in the admin changes the storefront.
* **Stock**: products start with stock "not set" — they keep selling until staff enter a real count in admin › Inventory (the 13 products that are sold out on the live site start at 0). The storefront shows "Sold out" when a product is inactive or its count is 0. Orders reserve stock;
  refunds and received purchase orders put it back (every change is logged in `stock_movements`).
* **Checkout**: the storefront validates the form, the API re-prices the cart from the database, applies the discount code and
  shipping rule (free over $150, otherwise $12.95 — editable in admin › Settings), saves the order as *Pending payment*, and hands
  the customer to the existing Drinks Up Shopify checkout (same cart permalink the mockup used). Staff mark it *Paid* in the admin.
* **Reviews** written on the storefront arrive in admin › Reviews as *Pending* and appear on the site once published. The home page review carousel shows real published 4★+ reviews and stays hidden until there are some.
* **Messages**: contact-form messages and "Email me when it’s back" requests appear in admin › Messages.
* **Accounts**: customers can register/sign in (bcrypt-hashed passwords, JWT). Staff sign in to the admin with their own accounts.
* **Images**: storefront images ship with the storefront (`frontend/public/images`). Images uploaded in the admin go to Azure Blob
  Storage in production (local `backend/uploads/` in development).
* Cart, wishlist and recently-viewed persist in the browser (localStorage). The 18+ age gate shows once per browser session.

## Deploy to Azure

Requirements: [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (`az login`), Node 20+.

```powershell
# first deployment — creates all resources and loads the product catalogue
./infra/deploy.ps1 -PgAdminPassword '<strong password>' -JwtSecret '<long random string>' -Seed

# later deployments (code only, keeps data) — reuse the same JwtSecret
./infra/deploy.ps1 -PgAdminPassword '<same>' -JwtSecret '<same>'
```

`infra/main.bicep` creates, in its own resource group `drinksup-ecommerce-rg` (separate from any other web app — the script refuses to deploy into an existing group it did not create):

* Azure Database for PostgreSQL Flexible Server (Burstable B1ms, PG 16, 7-day backups), database `drinksup`
* App Service plan (Linux B1) + Web App for the API (Node 22, health check `/api/health`, HTTPS only)
* Two Static Web Apps (Standard) — storefront and admin (SPA routing via `staticwebapp.config.json`)
* Storage account with a public `product-images` blob container for admin uploads

The script builds each app with the right URLs (`VITE_API_URL`, `VITE_STORE_URL`), sets the API's `CORS_ORIGINS` to the two Static
Web App hostnames, runs the schema migration against Azure PostgreSQL (opening the firewall for your IP), and deploys everything.
Custom domains (e.g. `drinksup.com.au`, `admin.drinksup.com.au`) can then be added on each Static Web App; add them to the API's
`CORS_ORIGINS` app setting too.

### API environment variables (`backend/.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL`, `DATABASE_SSL` | PostgreSQL connection (`DATABASE_SSL=true` on Azure) |
| `JWT_SECRET` | Signs staff/customer sessions — required in production |
| `CORS_ORIGINS` | Comma-separated storefront + admin origins |
| `SHOPIFY_STORE_URL` | Store that takes the payment hand-off (default `https://drinksup.com.au`) |
| `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` | Image uploads |

Change the seeded admin password after the first sign-in by re-seeding with `ADMIN_PASSWORD` set, or update the `staff` table.
