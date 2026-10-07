import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingBag, Zap } from 'lucide-react';
import { firstVariant } from '../../data';
import { useAddToCart } from '../../hooks/useAddToCart';
import { Price } from '../Price/Price';
import { QuantitySelector } from '../QuantitySelector/QuantitySelector';
import type { Product } from '../../types';
import './BuyBox.css';

interface Props {
  product: Product;
  /** Compact layout for quick view */
  compact?: boolean;
  onAdded?: () => void;
}

/** Variant picker + quantity + add to cart / buy now. Shared by PDP and quick view. */
export function BuyBox({ product, compact, onAdded }: Props) {
  const [variantId, setVariantId] = useState(() => firstVariant(product).id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const options = product.variants.length > 1 ? product.variants : null;

  const add = () => {
    if (!addToCart(product, variant, qty)) return false;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
    onAdded?.();
    return true;
  };

  return (
    <div className={`buybox ${compact ? 'buybox--compact' : ''}`}>
      <div className="buybox__price">
        <Price price={variant.price} compareAt={variant.compareAt} size="lg" />
        <p className={`buybox__stock ${variant.available ? 'is-in' : 'is-out'}`}>
          <span aria-hidden="true" />
          {!variant.available ? 'Sold out' : product.category === 'gift-cards' ? 'Available' : 'In stock · we aim to dispatch within 1–2 business days'}
        </p>
      </div>

      {options && (
        <fieldset className="buybox__options">
          <legend className="label">
            {product.category === 'gift-cards' ? 'Denomination' : 'Option'}: <span className="muted">{variant.title}</span>
          </legend>
          <div className="buybox__swatches">
            {options.map((v) => (
              <label key={v.id} className={`swatch ${v.id === variantId ? 'is-active' : ''} ${v.available ? '' : 'is-out'}`}>
                <input type="radio" name={`variant-${product.handle}`} value={v.id} checked={v.id === variantId} onChange={() => setVariantId(v.id)} className="sr-only" />
                {v.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="buybox__row">
        <QuantitySelector value={qty} onChange={setQty} label="Quantity" />
        <button type="button" className="buybox__add" onClick={add} disabled={!variant.available}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={added ? 'added' : 'add'}
              className="buybox__add-inner"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              exit={{ y: '-110%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              {!variant.available ? 'Sold out' : added ? 'Added to cart' : 'Add to cart'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {!compact && variant.available && (
        <button
          type="button"
          className="buybox__now"
          onClick={() => {
            if (add()) navigate('/checkout');
          }}
        >
          <Zap size={16} /> Buy it now
        </button>
      )}
    </div>
  );
}
