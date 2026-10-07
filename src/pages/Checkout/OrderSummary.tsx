import { useCart } from '../../context/CartContext';
import { SITE } from '../../data/site';
import { money, shortTitle } from '../../utils/format';
import { sized } from '../../utils/image';
import './OrderSummary.css';

export function OrderSummary({ compact }: { compact?: boolean }) {
  const { resolved, subtotal, savings, count } = useCart();
  const free = subtotal >= SITE.freeShippingThreshold;
  return (
    <div className={`osum ${compact ? 'osum--compact' : ''}`}>
      <ul role="list" className="osum__lines">
        {resolved.map((l) => (
          <li key={l.variantId}>
            <span className="osum__img plate">
              {l.product.images[0] && <img src={sized(l.product.images[0].src, 160)} alt="" className="plate__product" loading="lazy" />}
              <span className="osum__qty" aria-label={`Quantity ${l.quantity}`}>
                {l.quantity}
              </span>
            </span>
            <span className="osum__name">
              {shortTitle(l.product.title)}
              {l.variant.title && <span className="muted"> · {l.variant.title}</span>}
              {!l.variant.available && <span className="osum__out">Sold out</span>}
            </span>
            <span className="osum__price">{money(l.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="osum__totals">
        <div>
          <dt>Subtotal · {count} items</dt>
          <dd>{money(subtotal)}</dd>
        </div>
        {savings > 0 && (
          <div className="osum__save">
            <dt>You’re saving</dt>
            <dd>−{money(savings)}</dd>
          </div>
        )}
        <div>
          <dt>Shipping</dt>
          <dd>{free ? 'Free (Australia)' : 'Calculated at payment'}</dd>
        </div>
        <div className="osum__total">
          <dt>Estimated total</dt>
          <dd>
            <span className="osum__cur">AUD</span> {money(subtotal)}
          </dd>
        </div>
      </dl>
      <p className="osum__note muted">Taxes and shipping calculated at checkout. Discount codes are applied on the secure payment step.</p>
    </div>
  );
}
