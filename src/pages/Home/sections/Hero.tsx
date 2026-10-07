import { useRef } from 'react';
import { gsap, useGSAP } from '../../../animations/gsap';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';
import { IMG, SITE } from '../../../data/site';
import { brands, products } from '../../../data';
import { money } from '../../../utils/format';
import { Button } from '../../../components/Button/Button';
import { Photo } from '../../../components/Photo';
import './Hero.css';

const LINES = [['Tired', 'of'], ['boring'], ['drinks?']];

function Badge() {
  // Brand line from the store's About page
  const text = 'Australian owned · Good times & better booze · ';
  return (
    <div className="hero__badge" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="hero__badge-ring">
        <defs>
          <path id="badge-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text>
          <textPath href="#badge-circle" textLength="486" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <img src="/brand/mark-coral.png" alt="" className="hero__badge-mark" width={512} height={511} />
    </div>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(ref);
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
      tl.from(q('.hero__word'), { yPercent: 118, rotate: 5, duration: 1.3, stagger: 0.08 })
        .from(q('.hero__photo--main'), { clipPath: 'inset(100% 0 0 0)', duration: 1.5 }, 0.15)
        .from(q('.hero__photo--main img'), { scale: 1.3, duration: 2 }, 0.15)
        .from(q('.hero__photo--side'), { clipPath: 'inset(0 0 0 100%)', duration: 1.3 }, 0.5)
        .from(q('.hero__badge'), { scale: 0, rotate: -120, duration: 1.4 }, 0.7)
        .from(q('.hero__reveal'), { y: 30, autoAlpha: 0, duration: 1, stagger: 0.08 }, 0.6);

      // Gentle scroll-out: photos drift, headline lifts
      gsap.to(q('.hero__photo--main img'), {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to(q('.hero__photo--side'), {
        yPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to(q('.hero__badge-ring'), { rotate: 360, duration: 22, repeat: -1, ease: 'none' });
    },
    { scope: ref },
  );

  return (
    <section className="hero" ref={ref} aria-labelledby="hero-title">
      <div className="hero__grid wrap">
        <h1 id="hero-title" className="hero__title" aria-label="Tired of boring drinks? Pour something better.">
          {LINES.map((line, i) => (
            <span className={`hero__line hero__line--${i}`} key={i} aria-hidden="true">
              {line.map((w) => (
                <span className="split" key={w}>
                  <span className="hero__word">{w}</span>
                </span>
              ))}
            </span>
          ))}
          <span className="hero__line hero__line--accent" aria-hidden="true">
            <span className="split">
              <span className="hero__word accent">Pour something better.</span>
            </span>
          </span>
        </h1>

        <div className="hero__media">
          <figure className="hero__photo hero__photo--main">
            <Photo
              src={IMG.beachTiki}
              alt="Giffard liqueur bottles beside a tiki cocktail on a sunny Australian beach"
              sizes="(min-width: 1000px) 38vw, 70vw"
              width={1366}
              height={2048}
              eager
            />
          </figure>
          <figure className="hero__photo hero__photo--side">
            <Photo src={IMG.cheers} alt="Two cocktails raised in a toast over the ocean" sizes="(min-width: 1000px) 20vw, 40vw" width={1080} height={1080} eager />
          </figure>
          <Badge />
        </div>

        <div className="hero__foot">
          <p className="lead hero__reveal">
            Access a carefully curated collection of your favourite spirits and cocktail essentials — hand-picked by career bartenders, delivered
            Australia-wide.
          </p>
          <div className="hero__ctas hero__reveal">
            <Button to="/collections/all" size="lg" arrow>
              Shop the shelf
            </Button>
            <Button to="/blogs/recipes" size="lg" variant="outline">
              Get recipes
            </Button>
          </div>
          <dl className="hero__stats hero__reveal">
            <div>
              <dt>Products</dt>
              <dd>{products.length}</dd>
            </div>
            <div>
              <dt>Houses</dt>
              <dd>{brands.length}</dd>
            </div>
            <div>
              <dt>Free shipping</dt>
              <dd>{money(SITE.freeShippingThreshold).replace('.00', '')}+</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
