import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { gsap, useGSAP } from '../../../animations/gsap';
import { SplitHeading } from '../../../animations/Reveal';
import { CATEGORIES, categoryCount } from '../../../data';
import { useCanHover } from '../../../hooks/useMediaQuery';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';
import { sized } from '../../../utils/image';
import { Photo } from '../../../components/Photo';
import './CategoryIndex.css';

const SHOWN = CATEGORIES.filter((c) => c.key !== 'gift-cards' && c.key !== 'bar-tools');

/**
 * Editorial category index. Desktop: oversized rows with an image that
 * follows the cursor. Touch: each row carries its own photo.
 */
export function CategoryIndex() {
  const ref = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const canHover = useCanHover();
  const mover = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  useGSAP(
    () => {
      if (!floatRef.current) return;
      mover.current = {
        x: gsap.quickTo(floatRef.current, 'x', { duration: 0.6, ease: 'power3' }),
        y: gsap.quickTo(floatRef.current, 'y', { duration: 0.6, ease: 'power3' }),
      };
      if (prefersReducedMotion()) return;
      gsap.from('.catidx__row', {
        yPercent: 60,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.catidx__list', start: 'top 85%', once: true },
      });
    },
    { scope: ref, dependencies: [canHover] },
  );

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current || !mover.current) return;
    const r = ref.current.getBoundingClientRect();
    mover.current.x(e.clientX - r.left);
    mover.current.y(e.clientY - r.top);
  };

  return (
    <section className="catidx section" ref={ref} aria-labelledby="catidx-title" onMouseMove={canHover ? onMove : undefined}>
      <div className="wrap section-head">
        <div>
          <p className="label">The spirit shelf</p>
          <SplitHeading id="catidx-title" className="h2" text="Pick your pour" accent={['pour']} />
        </div>
        <Link to="/collections" className="link-line">
          All collections & brands <ArrowUpRight size={16} />
        </Link>
      </div>

      <ul className="catidx__list" role="list" onMouseLeave={() => setActive(null)}>
        {SHOWN.map((c, i) => (
          <li key={c.key} className={`catidx__row ${active === i ? 'is-active' : ''} ${active !== null && active !== i ? 'is-dim' : ''}`}>
            <Link to={`/collections/${c.key}`} className="catidx__link wrap" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}>
              <span className="catidx__num">0{i + 1}</span>
              <span className="catidx__name">{c.title}</span>
              <span className="catidx__eyebrow">{c.eyebrow}</span>
              <span className="catidx__count">
                {categoryCount(c.key)} <span className="sr-only">products</span>
              </span>
              <span className="catidx__arrow" aria-hidden="true">
                <ArrowUpRight size={28} />
              </span>
              {!canHover && (
                <span className="catidx__thumb">
                  <Photo src={c.image} alt="" sizes="40vw" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      {canHover && (
        <div className={`catidx__float ${active !== null ? 'is-on' : ''}`} ref={floatRef} aria-hidden="true">
          {SHOWN.map((c, i) => (
            <img key={c.key} src={sized(c.image, 700)} alt="" className={active === i ? 'is-current' : ''} loading="lazy" />
          ))}
        </div>
      )}
    </section>
  );
}
