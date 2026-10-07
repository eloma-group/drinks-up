# DrinksUp 2.0

A React + TypeScript + Vite rebuild of [drinksup.com.au](https://drinksup.com.au), the Australian-owned online spirit shelf run by 3Two1 Drinks.

## Run it

```bash
npm install
npm run dev              # local dev server
npm run build            # type-check + production build → dist/
npm run sync:catalogue   # re-pull products, prices, stock, recipes and policies from the live store
```

## How it works

- **Catalogue data.** `scripts/fetch-catalogue.mjs` reads the store's public Shopify JSON (products, collections, brand collections, the recipes blog and the policies) and writes it to `src/data/catalogue.json`. None of the product information is hand-copied. Re-run the sync whenever prices or stock change.
- **Images.** Images are served from the store's own Shopify CDN using `?width=`, so every image gets a responsive `srcset`, and modern browsers receive WebP or AVIF automatically.
- **Cart.** The cart is kept in React context and saved to `localStorage`, so it survives refreshes and stays in sync across tabs.
- **Checkout.** Customer, delivery and age details are collected here. The order is then handed to DrinksUp's existing **Shopify checkout** through a cart permalink (`/cart/{variantId}:{qty}`), with those details pre-filled. Payment, shipping rates, discount codes and the order confirmation all happen on Shopify. No payment is processed in this app.
- **Forms.** The contact form and the newsletter post to the store's existing Shopify `/contact` endpoint, so messages and sign-ups arrive exactly where they do today.
- **Animation.** Lenis handles smooth scrolling and runs off GSAP's ticker. GSAP ScrollTrigger drives the reveals, parallax and the pinned deals rail. Framer Motion drives the drawers, overlays, page transitions and micro-interactions. When `prefers-reduced-motion` is set, all of these switch off.

## TikTok section

The homepage TikTok rail shows the @drinks_up_please feed from the old site (`src/data/tiktok.json`, with covers in `public/tiktok/`). Clicking a video opens TikTok's official player. If tiktok.com is blocked on the visitor's network (it is banned in India, for example), the popup says so and offers an "Open on TikTok" link instead of showing an empty frame.

To play a video on the site itself, without depending on TikTok, save the clip as `public/tiktok/<video id>.mp4` and run `npm run import:tiktok <posts.json>`.

## Configuration

See `.env.example`. `VITE_SITE_URL` sets the canonical and Open Graph URLs. `VITE_SHOPIFY_STORE_URL` points to the store that handles checkout, accounts and forms.

## Deploying

The site is a static single-page app. Run `npm run build` and upload the **contents** of `dist/` to the web root. Each host type has a config file that sends every URL to `index.html` so deep links and refreshes never return a 404:

| Host | File (already included in `dist/`) |
| --- | --- |
| Apache / LiteSpeed (Hostinger, cPanel) | `.htaccess` |
| IIS (Windows hosting, Plesk, Azure) | `web.config` (needs the IIS URL Rewrite module) |
| Vercel | `vercel.json` |
| Netlify | `_redirects` |

All four serve real files (images, JS, CSS) as they are and send every other URL to the app.

`.htaccess` and `web.config` also:
- set correct MIME types for `.webp`, `.avif` and `.svg`;
- return a real 404 for a missing file under `/assets`, `/brand`, `/payments` or `/stockists`, rather than the app shell;
- cache hashed build files for a year and always revalidate `index.html`, so a new deploy shows up immediately.

`vercel.json` sets the same cache headers for `/assets` and `index.html`. Vercel and Netlify set MIME types themselves.

`.htaccess` does **not** force HTTPS. Turn that on in the host panel (Hostinger/cPanel "Force HTTPS" or Cloudflare); doing it in both places can cause redirect loops. The site must be deployed at the domain root, not in a subfolder.
