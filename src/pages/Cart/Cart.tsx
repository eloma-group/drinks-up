import { AnimatePresence } from 'framer-motion';
import { products, isAvailable } from '../../data';
import { useCart } from '../../context/CartContext';
import { useSeo } from '../../utils/seo';
import { SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Button } from '../../components/Button/Button';
import { CartLineItem } from '../../components/CartDrawer/CartLineItem';
import { FreeShippingMeter } from '../../components/CartDrawer/FreeShippingMeter';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import { EmptyState } from '../../components/States/States';
import { OrderSummary } from '../Checkout/OrderSummary';
import './Cart.css';

export default function Cart() {
  useSeo({ title: 'Your Cart', description: 'Review the items in your DrinksUp cart.' });
  const { resolved, count, subtotal, clear } = useCart();
  const blocked = resolved.some((l) => !l.variant.available);
  const ideas = products.filter((p) => isAvailable(p) && p.variants.length === 1 && !resolved.some((l) => l.handle === p.handle)).slice(0, 4);

  return (
    <div className="cartpage wrap">
      <header className="cartpage__head">
        <Breadcrumbs items={[{ label: 'Cart' }]} />
        <SplitHeading as="h1" className="h1" text={count ? `Your cart (${count})` : 'Your cart'} immediate key={count ? 'full' : 'empty'} />
      </header>

      {resolved.length === 0 ? (
        <EmptyState title="Your basket is empty" body="Tired of boring drinks? Let’s fix that.">
          <Button to="/collections/all" arrow>
            Continue shopping
          </Button>
          <Button to="/collections/cocktail-packs" variant="outline">
            Shop cocktail packs
          </Button>
        </EmptyState>
      ) : (
        <div className="cartpage__grid">
          <section aria-label="Cart items">
            <FreeShippingMeter subtotal={subtotal} />
            <ul role="list" className="cartpage__lines">
              <AnimatePresence initial={false}>
                {resolved.map((l) => (
                  <CartLineItem key={l.variantId} line={l} />
                ))}
              </AnimatePresence>
            </ul>
            <div className="cartpage__actions">
              <Button to="/collections/all" variant="outline">
                Continue shopping
              </Button>
              <button type="button" className="link-line cartpage__clear" onClick={clear}>
                Empty cart
              </button>
            </div>
          </section>
          <aside className="cartpage__aside" aria-label="Order summary">
            <h2 className="h3">Order summary</h2>
            <OrderSummary />
            {blocked ? (
              <Button variant="coral" size="lg" block disabled>
                Remove sold-out items to check out
              </Button>
            ) : (
              <Button to="/checkout" variant="coral" size="lg" block arrow>
                Checkout
              </Button>
            )}
          </aside>
        </div>
      )}

      {ideas.length > 0 && (
        <section className="section" aria-labelledby="cart-ideas">
          <h2 id="cart-ideas" className="h2 cartpage__ideas-title">
            Top it <span className="accent">up</span>
          </h2>
          <ProductGrid products={ideas} />
        </section>
      )}
    </div>
  );
}
