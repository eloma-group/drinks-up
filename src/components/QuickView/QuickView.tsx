import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { getProduct } from '../../data';
import { useUI } from '../../context/UIContext';
import { shortTitle } from '../../utils/format';
import { BuyBox } from '../BuyBox/BuyBox';
import { ProductImage } from '../ProductCard/ProductImage';
import './QuickView.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function QuickView() {
  const { quickView, setQuickView } = useUI();
  const product = quickView ? getProduct(quickView) : undefined;
  const [img, setImg] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => setQuickView(null);

  useEffect(() => {
    setImg(0);
    if (quickView) closeRef.current?.focus();
  }, [quickView]);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} aria-hidden="true" />
          <motion.div
            className="qv"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qv-title"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.5, ease }}
            data-lenis-prevent
          >
            <button ref={closeRef} type="button" className="qv__close" onClick={close} aria-label="Close quick view">
              <X size={22} />
            </button>
            <div className="qv__media">
              <div className="qv__main plate">
                {product.images[img] && (
                  <ProductImage key={img} image={product.images[img]} alt={shortTitle(product.title)} sizes="(min-width: 900px) 40vw, 100vw" eager />
                )}
              </div>
              {product.images.length > 1 && (
                <div className="qv__thumbs" role="list">
                  {product.images.slice(0, 5).map((im, i) => (
                    <button
                      key={im.src}
                      type="button"
                      role="listitem"
                      className={`qv__thumb plate ${i === img ? 'is-active' : ''}`}
                      onClick={() => setImg(i)}
                      aria-label={`Show image ${i + 1}`}
                      aria-current={i === img}
                    >
                      <ProductImage image={im} alt="" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="qv__info">
              <p className="label muted">{product.brand ?? product.type}</p>
              <h2 id="qv-title" className="h3">
                {shortTitle(product.title)}
              </h2>
              <p className="qv__excerpt muted">{product.excerpt}…</p>
              <BuyBox key={product.handle} product={product} compact />
              <Link to={`/products/${product.handle}`} className="link-line qv__more" onClick={close}>
                Full details <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
