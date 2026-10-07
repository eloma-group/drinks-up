import { useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { shortTitle } from '../utils/format';
import { sized } from '../utils/image';
import type { Product, ProductVariant } from '../types';

/** Add → badge pulse → toast with a shortcut to the cart. */
export function useAddToCart() {
  const { add } = useCart();
  const { notify, pulseCart, open } = useUI();

  return useCallback(
    (product: Product, variant: ProductVariant, quantity = 1) => {
      if (!variant.available) return false;
      add(product, variant, quantity);
      pulseCart();
      notify({
        title: 'Added to your cart',
        body: `${quantity} × ${shortTitle(product.title)}${variant.title ? ` — ${variant.title}` : ''}`,
        image: product.images[0] ? sized(product.images[0].src, 160) : undefined,
        action: { label: 'View cart', onClick: () => open('cart') },
      });
      return true;
    },
    [add, pulseCart, notify, open],
  );
}
