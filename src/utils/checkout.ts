import { SITE } from '../data/site';
import type { CartLine } from '../types';

export interface CheckoutDetails {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  note: string;
}

/**
 * Hand-off to DrinksUp's existing Shopify checkout.
 *
 * Shopify cart permalinks (`/cart/{variant}:{qty},…`) build a real cart on the
 * store and redirect to its secure checkout, where payment, shipping rates,
 * discount codes and order confirmation are handled. The `checkout[...]` params
 * pre-fill the customer details collected here so nothing is typed twice.
 */
export function shopifyCheckoutUrl(lines: CartLine[], d?: Partial<CheckoutDetails>): string {
  const items = lines.map((l) => `${l.variantId}:${l.quantity}`).join(',');
  const url = new URL(`/cart/${items}`, SITE.store);
  if (d) {
    const set = (k: string, v?: string) => v && url.searchParams.set(k, v.trim());
    set('checkout[email]', d.email);
    set('checkout[shipping_address][first_name]', d.firstName);
    set('checkout[shipping_address][last_name]', d.lastName);
    set('checkout[shipping_address][address1]', d.address1);
    set('checkout[shipping_address][address2]', d.address2);
    set('checkout[shipping_address][city]', d.city);
    set('checkout[shipping_address][province]', d.state);
    set('checkout[shipping_address][zip]', d.postcode);
    set('checkout[shipping_address][country]', 'Australia');
    set('checkout[shipping_address][phone]', d.phone);
    set('note', d.note);
  }
  url.searchParams.set('ref', 'drinksup-web');
  return url.toString();
}
