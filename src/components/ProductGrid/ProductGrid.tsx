import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '../../animations/gsap';
import { prefersReducedMotion } from '../../hooks/useReducedMotion';
import { ProductCard } from '../ProductCard/ProductCard';
import type { Product } from '../../types';
import './ProductGrid.css';

interface Props {
  products: Product[];
  /** Number of leading cards to load eagerly (above the fold) */
  eager?: number;
  dense?: boolean;
  label?: string;
}

/** Responsive product grid; cards rise in batches as they scroll into view. */
export function ProductGrid({ products, eager = 0, dense, label }: Props) {
  const ref = useRef<HTMLUListElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const items = ref.current.querySelectorAll<HTMLElement>('.pgrid__item:not([data-shown])');
      gsap.set(items, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(items, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) => {
          batch.forEach((el) => el.setAttribute('data-shown', ''));
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', overwrite: true });
        },
      });
    },
    { scope: ref, dependencies: [products], revertOnUpdate: false },
  );

  return (
    <ul className={`pgrid ${dense ? 'pgrid--dense' : ''}`} role="list" ref={ref} aria-label={label}>
      {products.map((p, i) => (
        <li className="pgrid__item" key={p.handle}>
          <ProductCard product={p} eager={i < eager} />
        </li>
      ))}
    </ul>
  );
}
