import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { products, isAvailable } from '../../data';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { money } from '../../utils/format';
import { Button } from '../Button/Button';
import { ProductCard } from '../ProductCard/ProductCard';
import { CartLineItem } from './CartLineItem';
import { FreeShippingMeter } from './FreeShippingMeter';
import './CartDrawer.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function CartDrawer() {
  const { panel, close } = useUI();
  const { resolved, count, subtotal, savings } = useCart();
  const isOpen = panel === 'cart';
  const closeRef = useRef<HTMLButtonElement>(null);
  const blocked = resolved.some((l) => !l.variant.available);
  const suggestions = products.filter((p) => isAvailable(p) && p.variants.length === 1 && !resolved.some((l) => l.handle === p.handle)).slice(0, 2);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} aria-hidden="true" />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease }}
          >
            <header className="drawer__head">
              <h2 id="cart-title" className="h3">
                Your cart <sup>{count}</sup>
              </h2>
              <button ref={closeRef} type="button" className="drawer__close" onClick={close} aria-label="Close cart">
                <X size={22} />
              </button>
            </header>

            {resolved.length > 0 && <FreeShippingMeter subtotal={subtotal} />}

            <div className="drawer__body" data-lenis-prevent>
              {resolved.length === 0 ? (
                <div className="drawer__empty">
                  <p className="h2">
                    Your basket <span className="accent">is empty</span>
                  </p>
                  <p className="muted">Tired of boring drinks? Start with something from the shelf.</p>
                  <Button to="/collections/all" arrow onClick={close}>
                    Continue shopping
                  </Button>
                  <p className="label muted drawer__suggest">Popular right now</p>
                  <div className="drawer__suggestions">
                    {suggestions.map((p) => (
                      <ProductCard key={p.handle} product={p} sizes="200px" />
                    ))}
                  </div>
                </div>
              ) : (
                <ul role="list" className="drawer__lines">
                  <AnimatePresence initial={false}>
                    {resolved.map((l) => (
                      <CartLineItem key={l.variantId} line={l} onNavigate={close} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {resolved.length > 0 && (
              <footer className="drawer__foot">
                {savings > 0 && (
                  <p className="drawer__row drawer__savings">
                    <span>You’re saving</span>
                    <span>{money(savings)}</span>
                  </p>
                )}
                <p className="drawer__row drawer__subtotal">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </p>
                <p className="drawer__note muted">Taxes and shipping calculated at checkout.</p>
                {blocked ? (
                  <Button variant="coral" size="lg" block disabled>
                    Remove sold-out items to check out
                  </Button>
                ) : (
                  <Button to="/checkout" variant="coral" size="lg" arrow block onClick={close}>
                    Checkout
                  </Button>
                )}
                <Link to="/cart" className="drawer__view link-line" onClick={close}>
                  View full cart
                </Link>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
