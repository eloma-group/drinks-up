import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useCart, type ResolvedLine } from '../../context/CartContext';
import { money, shortTitle } from '../../utils/format';
import { sized } from '../../utils/image';
import { QuantitySelector } from '../QuantitySelector/QuantitySelector';
import './CartLineItem.css';

export function CartLineItem({ line, onNavigate }: { line: ResolvedLine; onNavigate?: () => void }) {
  const { setQuantity, remove } = useCart();
  const { product, variant } = line;
  const title = shortTitle(product.title);
  const img = product.images[0];

  return (
    <motion.li
      layout
      className="cline"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40, height: 0, paddingBlock: 0, marginBlock: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/products/${product.handle}`} className="cline__img plate" onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        {img && <img src={sized(img.src, 240)} alt="" className="plate__product" loading="lazy" />}
      </Link>
      <div className="cline__body">
        <div className="cline__top">
          <div>
            <p className="label muted">{product.brand ?? product.type}</p>
            <Link to={`/products/${product.handle}`} className="cline__title" onClick={onNavigate}>
              {title}
            </Link>
            {variant.title && <p className="cline__variant muted">{variant.title}</p>}
          </div>
          <p className="cline__total">
            {money(line.lineTotal)}
            {variant.compareAt && <s className="muted">{money(variant.compareAt * line.quantity)}</s>}
          </p>
        </div>
        <div className="cline__bottom">
          <QuantitySelector
            size="sm"
            value={line.quantity}
            min={1}
            onChange={(n) => setQuantity(variant.id, n)}
            label={`Quantity for ${title}`}
          />
          <span className="cline__unit muted">{money(variant.price)} each</span>
          <button type="button" className="cline__remove" onClick={() => remove(variant.id)} aria-label={`Remove ${title} from cart`}>
            <Trash2 size={16} />
          </button>
        </div>
        {!variant.available && <p className="cline__warn">This item has just sold out — remove it to check out.</p>}
      </div>
    </motion.li>
  );
}
