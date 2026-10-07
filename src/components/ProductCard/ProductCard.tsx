import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, Plus } from 'lucide-react';
import { firstVariant, isAvailable, isOnSale, minPrice } from '../../data';
import { useAddToCart } from '../../hooks/useAddToCart';
import { useUI } from '../../context/UIContext';
import { useCanHover } from '../../hooks/useMediaQuery';
import { shortTitle } from '../../utils/format';
import { Price } from '../Price/Price';
import { ProductImage } from './ProductImage';
import type { Product } from '../../types';
import './ProductCard.css';

interface Props {
  product: Product;
  eager?: boolean;
  sizes?: string;
  /** Larger editorial treatment */
  feature?: boolean;
  className?: string;
}

function variantNote(p: Product) {
  if (p.variants.length > 1) return `${p.variants.length} options`;
  return p.specs.find((s) => s.label === 'Volume')?.value ?? null;
}

export const ProductCard = memo(function ProductCard({
  product,
  eager,
  sizes = '(min-width: 1800px) 18vw, (min-width: 1200px) 24vw, (min-width: 768px) 32vw, 48vw',
  feature,
  className = '',
}: Props) {
  const addToCart = useAddToCart();
  const { setQuickView } = useUI();
  const [added, setAdded] = useState(false);
  const canHover = useCanHover();
  const available = isAvailable(product);
  const variant = firstVariant(product);
  const multi = product.variants.length > 1;
  const sale = isOnSale(product);
  const [main, alt] = product.images;
  const href = `/products/${product.handle}`;
  const title = shortTitle(product.title);
  const note = variantNote(product);

  const onAdd = () => {
    if (multi) return setQuickView(product.handle);
    if (addToCart(product, variant)) {
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
    }
  };

  return (
    <article className={`pcard ${feature ? 'pcard--feature' : ''} ${available ? '' : 'is-soldout'} ${className}`}>
      <div className="pcard__media plate">
        <Link to={href} className="pcard__link" tabIndex={-1} aria-hidden="true">
          {main && <ProductImage image={main} alt="" sizes={sizes} eager={eager} className="pcard__img" />}
          {alt && canHover && <ProductImage image={alt} alt="" sizes={sizes} className="pcard__img pcard__img--alt" fit="cover" />}
        </Link>

        <div className="pcard__badges">
          {!available && <span className="badge badge--ink">Sold out</span>}
          {available && sale && variant.compareAt && (
            <span className="badge badge--coral">Save {Math.round((1 - variant.price / variant.compareAt) * 100)}%</span>
          )}
          {product.aperitif && <span className="badge">Aperitif</span>}
        </div>

        <div className="pcard__actions">
          <button
            type="button"
            className="pcard__add"
            onClick={onAdd}
            disabled={!available}
            aria-label={available ? (multi ? `Choose options for ${title}` : `Add ${title} to cart`) : `${title} is sold out`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'ok' : 'add'}
                className="pcard__add-icon"
                initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {added ? <Check size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
              </motion.span>
            </AnimatePresence>
            <span className="pcard__add-label">{!available ? 'Sold out' : added ? 'Added' : multi ? 'Choose' : 'Add to cart'}</span>
          </button>
          <button type="button" className="pcard__quick" onClick={() => setQuickView(product.handle)} aria-label={`Quick view ${title}`}>
            <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="pcard__info">
        <p className="pcard__meta label">
          <span>{product.brand ?? product.type ?? 'DrinksUp'}</span>
          {note && <span className="pcard__note">{note}</span>}
        </p>
        <h3 className="pcard__title">
          <Link to={href}>{title}</Link>
        </h3>
        <Price price={multi ? minPrice(product) : variant.price} compareAt={multi ? null : variant.compareAt} from={multi} size="sm" />
      </div>
    </article>
  );
});
