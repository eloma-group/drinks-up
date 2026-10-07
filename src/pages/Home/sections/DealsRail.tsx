import { useRef } from 'react';
import { gsap, useGSAP } from '../../../animations/gsap';
import { collections, isAvailable } from '../../../data';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';
import { Button } from '../../../components/Button/Button';
import { ProductCard } from '../../../components/ProductCard/ProductCard';
import './DealsRail.css';

/**
 * “Discover the deals” — a pinned horizontal rail on desktop, a native
 * swipeable scroll-snap rail on touch / narrow screens.
 */
export function DealsRail() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const deals = (collections.get('sale')?.products ?? []).slice().sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)));
  const best = Math.max(
    ...deals.flatMap((p) => p.variants.map((v) => (v.compareAt ? Math.round((1 - v.price / v.compareAt) * 100) : 0))),
  );

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1000px) and (hover: hover)', () => {
        const track = trackRef.current!;
        const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
        gsap.to(track.querySelector('.deals__inner'), {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        gsap.to('.deals__progress span', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: () => `+=${distance()}`, scrub: true, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  if (!deals.length) return null;

  return (
    <section className="deals" ref={ref} aria-labelledby="deals-title">
      <div className="deals__track" ref={trackRef} data-lenis-prevent-touch>
        <div className="deals__inner">
          <div className="deals__intro">
            <p className="label">Limited-time prices</p>
            <h2 id="deals-title" className="display">
              Discover <span className="accent">the</span> deals
            </h2>
            <p className="lead muted">
              Save up to {best}% on rum, whiskey, tequila, cocktail packs and Giffard liqueurs — while stocks last.
            </p>
            <Button to="/collections/sale" arrow>
              View all {deals.length} deals
            </Button>
            <div className="deals__progress" aria-hidden="true">
              <span />
            </div>
          </div>
          {deals.map((p) => (
            <div className="deals__card" key={p.handle}>
              <ProductCard product={p} feature sizes="(min-width: 1000px) 26vw, 70vw" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
