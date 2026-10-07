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

## Configuration

See `.env.example`. `VITE_SITE_URL` sets the canonical and Open Graph URLs. `VITE_SHOPIFY_STORE_URL` points to the store that handles checkout, accounts and forms.

## Deploying

The site is a static SPA. `vercel.json` (Vercel) and `public/_redirects` (Netlify) rewrite every route to `index.html`.
