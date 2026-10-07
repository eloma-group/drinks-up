import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, Truck, Undo2 } from 'lucide-react';
import { categoryMeta, firstVariant, getProduct, isAvailable, recipes, relatedProducts, productsForText } from '../../data';
import { SITE } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { sized } from '../../utils/image';
import { money, shortTitle } from '../../utils/format';
import { useAddToCart } from '../../hooks/useAddToCart';
import { Reveal, SplitHeading } from '../../animations/Reveal';
import { Accordion } from '../../components/Accordion/Accordion';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { BuyBox } from '../../components/BuyBox/BuyBox';
import { ProductGallery } from '../../components/ProductGallery/ProductGallery';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import { RecipeCard } from '../Recipes/RecipeCard';
import NotFound from '../NotFound/NotFound';
import type { Product as P } from '../../types';
import './Product.css';

export default function Product() {
  const { handle = '' } = useParams();
  const product = getProduct(handle);
  if (!product) return <NotFound kind="product" />;
  return <ProductView key={product.handle} product={product} />;
}

function StickyBar({ product, visible }: { product: P; visible: boolean }) {
  const addToCart = useAddToCart();
  const v = firstVariant(product);
  const multi = product.variants.length > 1;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pdp-sticky"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pdp-sticky__info">
            <span className="pdp-sticky__title">{shortTitle(product.title)}</span>
            <span className="pdp-sticky__price">{money(v.price)}</span>
          </div>
          {multi ? (
            <a href="#buy" className="pdp-sticky__btn">
              Choose option
            </a>
          ) : (
            <button type="button" className="pdp-sticky__btn" disabled={!v.available} onClick={() => addToCart(product, v)}>
              {v.available ? 'Add to cart' : 'Sold out'}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductView({ product }: { product: P }) {
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const title = shortTitle(product.title);
  const cat = categoryMeta(product.category);
  const related = useMemo(() => relatedProducts(product, 8), [product]);
  const linkedRecipes = useMemo(
    () => recipes.filter((r) => productsForText(r.title + ' ' + r.bodyHtml, 50).some((p) => p.handle === product.handle)),
    [product],
  );

  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const v = firstVariant(product);
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      image: product.images.slice(0, 4).map((i) => i.src),
      description: product.excerpt,
      sku: v.sku ?? undefined,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      category: cat.title,
      offers: product.variants.map((x) => ({
        '@type': 'Offer',
        price: x.price.toFixed(2),
        priceCurrency: 'AUD',
        availability: x.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${SITE.url}/products/${product.handle}`,
        seller: { '@type': 'Organization', name: 'DrinksUp' },
      })),
    }),
    [product, v.sku, cat.title],
  );
  useSeo({
    title: `${title} — Buy Online`,
    description: `${product.excerpt.slice(0, 140)}… ${money(v.price)} at DrinksUp.`,
    image: product.images[0] ? sized(product.images[0].src, 1200) : undefined,
    path: `/products/${product.handle}`,
    type: 'product',
    jsonLd,
  });

  const accordion = [
    {
      title: 'Description',
      content: <div className="prose" dangerouslySetInnerHTML={{ __html: product.descriptionHtml || `<p>${product.excerpt}</p>` }} />,
    },
    product.specs.length > 0 && {
      title: 'Specifications',
      content: (
        <dl className="pdp__specs">
          {product.brand && (
            <div>
              <dt>Brand</dt>
              <dd>
                <Link to={`/collections/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}>{product.brand}</Link>
              </dd>
            </div>
          )}
          {product.specs.map((s) => (
            <div key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    product.category !== 'gift-cards' && {
      title: 'Shipping & returns',
      content: (
        <div className="prose">
          <p>
            We aim to dispatch all orders within 1–2 business days. Free shipping on Australian orders over {money(SITE.freeShippingThreshold)}; other rates are
            calculated at checkout.
          </p>
          <p>For alcohol deliveries, the recipient may be required to provide proof of age.</p>
          <p>
            Read the full <Link to="/policies/shipping-policy">shipping policy</Link> and <Link to="/policies/refund-policy">return policy</Link>.
          </p>
        </div>
      ),
    },
  ].filter(Boolean) as { title: string; content: React.ReactNode }[];

  return (
    <article className="pdp">
      <div className="pdp__top wrap">
        <Breadcrumbs items={[{ label: cat.title, to: `/collections/${product.category}` }, { label: title }]} />
      </div>

      <div className="pdp__grid wrap">
        <div className="pdp__gallery">
          <ProductGallery images={product.images} title={title} />
        </div>

        <div className="pdp__info">
          <div className="pdp__head">
            <p className="label pdp__brand">
              {product.brand && <Link to={`/collections/${product.brand.toLowerCase().replace(/\s+/g, '-')}`}>{product.brand}</Link>}
              <span>{product.type ?? cat.title}</span>
            </p>
            <SplitHeading as="h1" className="h1 pdp__title" text={title} immediate />
            {product.specs.length > 0 && (
              <ul role="list" className="pdp__chips">
                {product.specs
                  .filter((s) => ['Volume', 'ABV', 'Origin'].includes(s.label))
                  .map((s) => (
                    <li key={s.label}>
                      <span className="muted">{s.label}</span> {s.value}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div ref={buyRef} id="buy">
            <BuyBox product={product} />
          </div>

          <ul role="list" className="pdp__assure">
            <li>
              <Truck size={20} aria-hidden="true" /> Free shipping over {money(SITE.freeShippingThreshold).replace('.00', '')} in Australia
            </li>
            <li>
              <ShieldCheck size={20} aria-hidden="true" /> Secure checkout · Visa, Mastercard, Amex, PayPal, Apple Pay
            </li>
            <li>
              <Undo2 size={20} aria-hidden="true" /> <Link to="/policies/refund-policy">Return policy</Link>
            </li>
          </ul>

          <Accordion items={accordion} defaultOpen={0} />
          {!isAvailable(product) && (
            <p className="pdp__soldout">
              This one’s sold out right now. <Link to={`/collections/${product.category}`}>Browse more {cat.title.toLowerCase()}</Link> or{' '}
              <Link to="/pages/contact">ask us</Link> when it’s back.
            </p>
          )}
        </div>
      </div>

      {linkedRecipes.length > 0 && (
        <section className="pdp__recipes section wrap" aria-labelledby="pdp-recipes">
          <div className="section-head">
            <div>
              <p className="label">Mix it</p>
              <SplitHeading id="pdp-recipes" className="h2" text="Recipes with this bottle" accent={['bottle']} />
            </div>
          </div>
          <Reveal as="ul" className="pdp__recipe-list" stagger={0.1}>
            {linkedRecipes.slice(0, 3).map((r) => (
              <li key={r.handle}>
                <RecipeCard recipe={r} index={recipes.indexOf(r)} />
              </li>
            ))}
          </Reveal>
        </section>
      )}

      {related.length > 0 && (
        <section className="pdp__related section on-cream" aria-labelledby="pdp-related">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="label">You might also like</p>
                <SplitHeading id="pdp-related" className="h2" text="Pairs well with" accent={['with']} />
              </div>
              <Link to={`/collections/${product.category}`} className="link-line">
                Shop all {cat.title.toLowerCase()}
              </Link>
            </div>
            <ProductGrid products={related} label="Related products" />
          </div>
        </section>
      )}

      <StickyBar product={product} visible={showSticky} />
    </article>
  );
}
