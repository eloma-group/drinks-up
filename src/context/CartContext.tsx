import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { getProduct } from '../data';
import type { CartLine, Product, ProductVariant } from '../types';

const STORAGE_KEY = 'drinksup.cart.v1';
const MAX_QTY = 24;

type Action =
  | { type: 'add'; line: CartLine }
  | { type: 'set'; variantId: string; quantity: number }
  | { type: 'remove'; variantId: string }
  | { type: 'clear' };

function reducer(state: CartLine[], a: Action): CartLine[] {
  switch (a.type) {
    case 'add': {
      const existing = state.find((l) => l.variantId === a.line.variantId);
      if (existing)
        return state.map((l) =>
          l === existing ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + a.line.quantity) } : l,
        );
      return [...state, { ...a.line, quantity: Math.min(MAX_QTY, a.line.quantity) }];
    }
    case 'set':
      if (a.quantity <= 0) return state.filter((l) => l.variantId !== a.variantId);
      return state.map((l) => (l.variantId === a.variantId ? { ...l, quantity: Math.min(MAX_QTY, a.quantity) } : l));
    case 'remove':
      return state.filter((l) => l.variantId !== a.variantId);
    case 'clear':
      return [];
  }
}

/** Load the saved cart, dropping anything no longer sold on the store */
function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartLine[];
    return raw.filter((l) => getProduct(l.handle)?.variants.some((v) => v.id === l.variantId) && l.quantity > 0);
  } catch {
    return [];
  }
}

export interface ResolvedLine extends CartLine {
  product: Product;
  variant: ProductVariant;
  lineTotal: number;
}

interface CartValue {
  lines: CartLine[];
  resolved: ResolvedLine[];
  count: number;
  subtotal: number;
  savings: number;
  add: (product: Product, variant: ProductVariant, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable (private mode) — cart still works for the session */
    }
  }, [lines]);

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      dispatch({ type: 'clear' });
      load().forEach((line) => dispatch({ type: 'add', line }));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product: Product, variant: ProductVariant, quantity = 1) => {
    dispatch({ type: 'add', line: { variantId: variant.id, handle: product.handle, quantity } });
  }, []);
  const setQuantity = useCallback((variantId: string, quantity: number) => dispatch({ type: 'set', variantId, quantity }), []);
  const remove = useCallback((variantId: string) => dispatch({ type: 'remove', variantId }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);

  const value = useMemo<CartValue>(() => {
    const resolved: ResolvedLine[] = [];
    for (const l of lines) {
      const product = getProduct(l.handle);
      const variant = product?.variants.find((v) => v.id === l.variantId);
      if (product && variant) resolved.push({ ...l, product, variant, lineTotal: variant.price * l.quantity });
    }
    return {
      lines,
      resolved,
      count: resolved.reduce((n, l) => n + l.quantity, 0),
      subtotal: resolved.reduce((n, l) => n + l.lineTotal, 0),
      savings: resolved.reduce((n, l) => n + (l.variant.compareAt ? (l.variant.compareAt - l.variant.price) * l.quantity : 0), 0),
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
