import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { SplitHeading, Reveal } from '../../../animations/Reveal';
import { CATEGORIES, collections, isAvailable } from '../../../data';
import { sized } from '../../../utils/image';
import { Photo } from '../../../components/Photo';
import './CategoryIndex.css';

const SHOWN = CATEGORIES.filter((c) => c.key !== 'gift-cards' && c.key !== 'bar-tools');
const ease = [0.22, 1, 0.36, 1] as const;

/**
 * “Spirit shelf” category accordion.
 * Desktop: full-width image panels — the active one expands (hover, focus or tap)
 * and reveals a glass panel with copy, live product previews and a CTA.
 * Mobile: the same panels stack vertically and expand in height.
 */
export function CategoryIndex() {
  const [active, setActive] = useState(0);

  return (
    <section className="shelf section" aria-labelledby="shelf-title">
      <div className="wrap section-head">
        <div>
          <p className="label">The spirit shelf</p>
          <SplitHeading id="shelf-title" className="h2" text="Pick your pour" accent={['pour']} />
        </div>
        <Link to="/collections" className="link-line">
          All collections & brands <ArrowUpRight size={16} />
        </Link>
      </div>

      <Reveal as="ul" className="shelf__panels wrap" stagger={0.07} y={50}>
        {SHOWN.map((c, i) => {
          const isActive = active === i;
          const list = collections.get(c.key)?.products ?? [];
          const previews = list.filter((p) => isAvailable(p) && p.images[0]).slice(0, 3);
          return (
            <li
              key={c.key}
              className={`shelf__panel on-dark ${isActive ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <div className="shelf__bg" aria-hidden="true">
                <Photo src={c.image} alt="" sizes="(min-width: 900px) 60vw, 100vw" />
              </div>

              {/* Collapsed state: vertical label */}
              <button
                type="button"
                className="shelf__rail"
                aria-expanded={isActive}
                aria-label={`${c.title}, ${list.length} products`}
                tabIndex={isActive ? -1 : 0}
                onClick={() => setActive(i)}
              >
                <span className="shelf__num">0{i + 1}</span>
                <span className="shelf__vertical">{c.title}</span>
                <span className="shelf__count">{list.length}</span>
              </button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="shelf__glass"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.25, ease } }}
                    exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
                  >
                    <p className="label shelf__eyebrow">
                      0{i + 1} · {c.eyebrow}
                    </p>
                    <h3 className="shelf__title">{c.title}</h3>
                    <p className="shelf__blurb">{c.blurb}</p>

                    {previews.length > 0 && (
                      <ul className="shelf__previews" role="list" aria-label={`Popular ${c.title.toLowerCase()}`}>
                        {previews.map((p, k) => (
                          <motion.li
                            key={p.handle}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.4 + k * 0.07, duration: 0.5, ease } }}
                          >
                            <Link to={`/products/${p.handle}`} className="shelf__thumb" title={p.title}>
                              <img src={sized(p.images[0].src, 200)} alt={p.title} loading="lazy" />
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    <Link to={`/collections/${c.key}`} className="shelf__cta">
                      Explore {c.title} · {list.length}
                      <span className="shelf__cta-icon" aria-hidden="true">
                        <ArrowUpRight size={18} />
                      </span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </Reveal>
    </section>
  );
}
